import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { findTargetBySlug, TEST_TARGETS, type TargetSlug } from '../data/targets';
import { clamp } from '../lib/format';
import { toUrlNumber } from '../lib/coords';

export type WorkspaceMode = 'blink' | 'coadd' | 'diff';
export type StretchMode = 'asinh' | 'linear' | 'sqrt' | 'log';
export type ChannelType = 'band' | 'array' | 'all';

export interface WorkspaceState {
  ra: number;
  dec: number;
  fov: number;
  /**
   * False when the URL carries no ra/dec/target, i.e. the visitor has not
   * chosen a field yet. The workspace then asks for coordinates instead of
   * silently loading an arbitrary default field.
   */
  hasCoordinates: boolean;
  target: TargetSlug | null;
  mode: WorkspaceMode;
  channel: { type: ChannelType; band: number; array: number };
  epoch: number;
  epochA: number;
  epochB: number;
  fps: number;
  pingPong: boolean;
  playing: boolean;
  stretch: StretchMode;
  gain: number;
  showFlags: boolean;
  overlays: {
    grid: boolean;
    labels: boolean;
    gaia: boolean;
    wise: boolean;
    neossat: boolean;
    tracks: boolean;
  };
}

export interface WorkspacePatch {
  ra?: number;
  dec?: number;
  fov?: number;
  target?: TargetSlug | null;
  mode?: WorkspaceMode;
  band?: number;
  array?: number;
  epoch?: number;
  epochA?: number;
  epochB?: number;
  fps?: number;
  pingPong?: boolean;
  playing?: boolean;
  stretch?: StretchMode;
  gain?: number;
  showFlags?: boolean;
  overlays?: Partial<WorkspaceState['overlays']>;
}

export const FOV_CHOICES = [0.1, 0.25, 0.5, 1, 2, 5] as const;
export const MAX_EPOCHS = 6;

const DEFAULT_TARGET = TEST_TARGETS[0];

function parseBoolean(value: string | null, fallback: boolean): boolean {
  if (value === null) return fallback;
  return value === '1' || value === 'true' || value === 'yes';
}

function parseNumber(value: string | null, fallback: number): number {
  if (value === null || value.trim() === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseEnum<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

/** Reads the full workspace state from the URL, filling in safe defaults. */
export function readWorkspaceState(params: URLSearchParams): WorkspaceState {
  const targetFromUrl = findTargetBySlug(params.get('target'));
  const fallback = targetFromUrl ?? DEFAULT_TARGET;
  const hasCoordinates =
    (params.get('ra')?.trim() ?? '') !== '' ||
    (params.get('dec')?.trim() ?? '') !== '' ||
    targetFromUrl !== undefined;

  const ra = parseNumber(params.get('ra'), fallback.ra);
  const dec = parseNumber(params.get('dec'), fallback.dec);
  const fov = clamp(parseNumber(params.get('fov'), fallback.recommendedFov), 0.02, 12);

  const mode = parseEnum<WorkspaceMode>(params.get('mode'), ['blink', 'coadd', 'diff'], 'blink');
  const bandParam = params.get('band');
  const arrayParam = params.get('array');
  const band = Math.round(clamp(parseNumber(bandParam, 0), 0, 102));
  // WISE 0855 is a 250 K Y-dwarf: it only emits measurably in the long
  // wavelength channels, so an untouched link to it opens on Array 6 (4.29–5.00 µm).
  // Everything else defaults to D3 (1.63–2.42 µm): one real detector per epoch
  // loads quickly, and the "all arrays" stack stays an explicit choice.
  const defaultArray =
    bandParam === null && arrayParam === null
      ? targetFromUrl?.slug === 'wise-0855'
        ? 6
        : 3
      : 0;
  const array = Math.round(clamp(parseNumber(arrayParam, defaultArray), 0, 6));
  const channelType: ChannelType = array > 0 ? 'array' : band > 0 ? 'band' : 'all';

  const overlayParam = params.get('ovl');
  const overlaySet = overlayParam
    ? new Set(overlayParam.split(',').map((item) => item.trim().toLowerCase()))
    : null;

  const overlay = (key: string, fallbackValue: boolean) =>
    overlaySet ? overlaySet.has(key) : fallbackValue;

  return {
    ra,
    dec,
    fov,
    hasCoordinates,
    target: targetFromUrl?.slug ?? null,
    mode,
    channel: {
      type: channelType,
      band: band > 0 ? band : 44,
      array: array > 0 ? array : 3,
    },
    epoch: Math.round(clamp(parseNumber(params.get('epoch'), 0), 0, MAX_EPOCHS - 1)),
    epochA: Math.round(clamp(parseNumber(params.get('a'), 0), 0, MAX_EPOCHS - 1)),
    epochB: Math.round(clamp(parseNumber(params.get('b'), MAX_EPOCHS - 1), 0, MAX_EPOCHS - 1)),
    fps: clamp(parseNumber(params.get('fps'), 2), 0.5, 12),
    pingPong: parseBoolean(params.get('pp'), true),
    playing: parseBoolean(params.get('play'), false),
    stretch: parseEnum<StretchMode>(params.get('stretch'), ['asinh', 'linear', 'sqrt', 'log'], 'asinh'),
    gain: clamp(parseNumber(params.get('gain'), 3), 0.5, 40),
    showFlags: parseBoolean(params.get('flags'), false),
    overlays: {
      grid: overlay('grid', true),
      labels: overlay('labels', false),
      gaia: overlay('gaia', false),
      wise: overlay('wise', false),
      neossat: overlay('neossat', false),
      tracks: overlay('tracks', true),
    },
  };
}

function serializeOverlays(overlays: WorkspaceState['overlays']): string {
  const enabled: string[] = [];
  if (overlays.grid) enabled.push('grid');
  if (overlays.labels) enabled.push('labels');
  if (overlays.gaia) enabled.push('gaia');
  if (overlays.wise) enabled.push('wise');
  if (overlays.neossat) enabled.push('neossat');
  if (overlays.tracks) enabled.push('tracks');
  return enabled.join(',');
}

export function useUrlSync() {
  const [searchParams, setSearchParams] = useSearchParams();
  const state = useMemo(() => readWorkspaceState(searchParams), [searchParams]);

  const update = useCallback(
    (patch: WorkspacePatch) => {
      const current = readWorkspaceState(searchParams);
      const next = new URLSearchParams(searchParams);

      const set = (key: string, value: string | number | null | undefined) => {
        if (value === null || value === undefined || value === '') {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      };

      // Never synthesise coordinates the visitor has not chosen: an empty
      // workspace should stay empty (and keep asking for a field) until RA/Dec
      // arrive from the form, a random draw or a deep link.
      const writesCoordinates =
        current.hasCoordinates || patch.ra !== undefined || patch.dec !== undefined || patch.target != null;
      if (writesCoordinates) {
        set('ra', toUrlNumber(patch.ra ?? current.ra));
        set('dec', toUrlNumber(patch.dec ?? current.dec));
      }
      set('fov', toUrlNumber(patch.fov ?? current.fov, 3));

      const target = patch.target !== undefined ? patch.target : current.target;
      set('target', target ?? null);

      set('mode', patch.mode ?? current.mode);
      set('epoch', patch.epoch ?? current.epoch);
      set('a', (patch.epochA ?? current.epochA) === 0 ? null : patch.epochA ?? current.epochA);
      set('b', patch.epochB ?? current.epochB);
      set('fps', (patch.fps ?? current.fps).toFixed(1).replace(/\.0$/, ''));
      set('pp', (patch.pingPong ?? current.pingPong) ? 1 : 0);
      set('play', (patch.playing ?? current.playing) ? 1 : 0);
      set('stretch', patch.stretch ?? current.stretch);
      set('gain', (patch.gain ?? current.gain).toFixed(1).replace(/\.0$/, ''));
      set('flags', (patch.showFlags ?? current.showFlags) ? 1 : 0);

      let band = current.channel.type === 'all' ? 0 : current.channel.band;
      let array = current.channel.type === 'array' ? current.channel.array : 0;

      if (patch.band !== undefined) {
        band = Math.round(clamp(patch.band, 1, 102));
        array = 0;
      }
      if (patch.array !== undefined) {
        array = Math.round(clamp(patch.array, 0, 6));
        if (array > 0) band = 0;
      }
      if (patch.band === 0) {
        // "All arrays" must clear any array selection, otherwise the channel
        // reader keeps reporting `type: 'array'` (array = current one).
        band = 0;
        array = 0;
      }
      set('band', band);
      set('array', array > 0 ? array : null);

      const overlays = { ...current.overlays, ...patch.overlays };
      set('ovl', serializeOverlays(overlays));

      setSearchParams(next, { replace: true, preventScrollReset: true });
    },
    [searchParams, setSearchParams],
  );

  return { state, update };
}

export function channelLabel(
  channel: WorkspaceState['channel'],
  labels: { all: string; array: string; band: string },
): string {
  if (channel.type === 'all') return labels.all;
  if (channel.type === 'array') return `${labels.array} ${channel.array}`;
  return `${labels.band} ${channel.band}`;
}

export { findTargetBySlug, TEST_TARGETS };
export type { TargetSlug };
