import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, Copy, Crosshair, Database, Loader2, Search } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { findTargetBySlug, FOV_OPTIONS } from '../data/targets';
import { formatDec, formatRa, parseDec, parseRa } from '../lib/coords';
import { saveLastField } from '../lib/lastField';
import {
  fetchOverlays,
  fetchRandomField,
  fetchSpectrum,
  type NeossatObservation,
  type OverlayData,
  type OverlayLayer,
  type SpectrumData,
} from '../lib/api';
import { allBandIndices, arrayLabel, bandAt, bandIndicesForArray } from '../lib/sky/bands';
import type {
  BandSelection,
  CompareScale,
  MoverCandidate,
  ProbeResponse,
} from '../lib/sky/workerTypes';
import { useUrlSync, type WorkspaceMode } from '../hooks/useUrlSync';
import { useSkyEngine } from '../hooks/useSkyEngine';
import BlinkViewport from '../components/workspace/BlinkViewport';
import ImageMathControls from '../components/workspace/ImageMathControls';
import BandArraySelector from '../components/workspace/BandArraySelector';
import CatalogOverlays from '../components/workspace/CatalogOverlays';
import MetadataInspector from '../components/workspace/MetadataInspector';
import SpectrumPlotter from '../components/workspace/SpectrumPlotter';
import FieldNotes from '../components/workspace/FieldNotes';
import MoverCandidates from '../components/workspace/MoverCandidates';

function detectorForChannel(channel: { type: string; band: number; array: number }): number {
  if (channel.type === 'array') return channel.array;
  if (channel.type === 'band') return bandAt(channel.band).detector;
  return 0;
}

export default function WorkspacePage() {
  const { t, lang } = useLanguage();
  const { state, update } = useUrlSync();

  const detector = detectorForChannel(state.channel);
  const bandSelection = useMemo<BandSelection>(() => {
    if (detector === 0) {
      return {
        bandIndices: allBandIndices(),
        bandLabel: lang === 'en' ? 'QUICK LOOK · 6 detectors' : 'QUICK LOOK · 6 матриць',
        bandKey: 'all',
        detector: 0,
        channel: null,
        quickLook: true,
      };
    }
    return {
      bandIndices: bandIndicesForArray(detector),
      // The label stays per-detector so that selecting a channel never reloads
      // the frames; the channel suffix is added by the worker per display.
      bandLabel: arrayLabel(detector),
      bandKey: `a${detector}`,
      detector,
      channel: state.channel.type === 'band' ? bandAt(state.channel.band).subchan : null,
      quickLook: false,
    };
  }, [detector, state.channel.band, state.channel.type, lang]);

  const [nativeSampling, setNativeSampling] = useState(false);
  // SPHEREx samples the sky at 6.15"/pixel. Asking for that grid instead of a
  // fixed 480x480 avoids interpolating (and correlating) the data twice when
  // the field is small.
  const nativeShape = Math.max(
    64,
    Math.min(1024, Math.round((state.fov * 3600) / 6.15)),
  );
  const engine = useSkyEngine({
    ra: state.ra,
    dec: state.dec,
    fov: state.fov,
    detector,
    shape: nativeSampling ? nativeShape : undefined,
    band: bandSelection,
  });
  const { frame, epochs, coverage, ready, rendering, loadedCount, status: rawStatus, error: rawError, size: frameSize } = engine;
  const engineStatus = useMemo(() => {
    if (!rawStatus) return null;
    if (rawStatus === 'discovering archive products') return t.workspace.discovering;
    const match = rawStatus.match(/^loading (\d+)\/(\d+) epochs$/);
    if (match) {
      return t.workspace.loadingEpochs
        .replace('{done}', match[1])
        .replace('{total}', match[2]);
    }
    return rawStatus;
  }, [rawStatus, t]);
  const engineError = useMemo(() => {
    if (!rawError) return null;
    if (rawError === 'OFFLINE' || /failed to fetch/i.test(rawError)) return t.workspace.apiOffline;
    if (rawError === 'NO COVERAGE') return t.workspace.noCoverage;
    if (/no detector data/i.test(rawError)) return t.workspace.noDetectorData;
    if (/frame unavailable|HTTP 404/i.test(rawError)) return t.workspace.noDetectorData;
    if (/epochs? not loaded/i.test(rawError)) return null;
    return rawError;
  }, [rawError, t]);
  const renderFrameRequest = engine.render;
  const probePixel = engine.probe;
  const findCandidates = engine.findCandidates;

  const [coaddMethod, setCoaddMethod] = useState<'sum' | 'mean'>('mean');
  const [compareScale, setCompareScale] = useState<CompareScale>('shared');
  const [probe, setProbe] = useState<ProbeResponse | null>(null);
  const [selection, setSelection] = useState<{ x: number; y: number } | null>(null);
  const [spectrum, setSpectrum] = useState<SpectrumData | null>(null);
  const [spectrumLoading, setSpectrumLoading] = useState(false);
  const [spectrumError, setSpectrumError] = useState<string | null>(null);
  const [spectrumOpen, setSpectrumOpen] = useState(true);
  const [linkCopied, setLinkCopied] = useState(false);
  const [randomLoading, setRandomLoading] = useState(false);
  const [randomError, setRandomError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<MoverCandidate[]>([]);
  const [candidateThreshold, setCandidateThreshold] = useState(0);
  const [candidateSigma, setCandidateSigma] = useState(0);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [candidateFocus, setCandidateFocus] = useState<number | null>(null);
  const [overlayData, setOverlayData] = useState<OverlayData | null>(null);
  const candidateTokenRef = useRef(0);
  const spectrumTokenRef = useRef(0);
  const playbackDirRef = useRef<1 | -1>(1);

  const [raInput, setRaInput] = useState(() => (state.hasCoordinates ? formatRa(state.ra) : ''));
  const [decInput, setDecInput] = useState(() => (state.hasCoordinates ? formatDec(state.dec) : ''));
  const [raInvalid, setRaInvalid] = useState(false);
  const [decInvalid, setDecInvalid] = useState(false);

  useEffect(() => {
    setRaInput(state.hasCoordinates ? formatRa(state.ra) : '');
    setDecInput(state.hasCoordinates ? formatDec(state.dec) : '');
    setRaInvalid(false);
    setDecInvalid(false);
  }, [state.ra, state.dec, state.hasCoordinates]);

  const availableEpochs = epochs.map((item) => item.index);
  const dataReady = epochs.length > 0 && loadedCount >= epochs.length;
  // `state.epoch` is a real SPHEREx epoch index (the URL's `epoch`), while the
  // timeline is a filtered list, so positions and indices can differ.
  const epochIndex = availableEpochs.includes(state.epoch) ? state.epoch : availableEpochs[0] ?? 0;
  const epochA = availableEpochs.includes(state.epochA) ? state.epochA : availableEpochs[0] ?? 0;
  const epochB = availableEpochs.includes(state.epochB)
    ? state.epochB
    : availableEpochs[availableEpochs.length - 1] ?? 0;

  /* ---------------------------------------------------------- rendering */
  useEffect(() => {
    if (!state.hasCoordinates || !ready) return;
    renderFrameRequest({
      mode: state.mode === 'blink' ? 'raw' : state.mode,
      epochIndex,
      epochA,
      epochB,
      coaddMethod,
      compareScale,
      channel: state.channel.type === 'band' ? bandAt(state.channel.band).subchan : null,
      maskFlags: state.maskFlags,
      stretch: {
        stretch: state.stretch,
        gain: state.gain,
        palette: state.mode === 'diff' ? 'signed' : 'array',
        showFlags: state.showFlags,
      },
    });
  }, [
    renderFrameRequest,
    state.hasCoordinates,
    ready,
    state.mode,
    epochIndex,
    epochA,
    epochB,
    state.stretch,
    state.gain,
    state.showFlags,
    state.maskFlags,
    state.channel.band,
    state.channel.type,
    coaddMethod,
    compareScale,
    bandSelection.bandKey,
  ]);

  /* ---------------------------------------------------------- overlays */
  // Gaia + NEOSSat answer in seconds, WISE is a slow all-sky TAP scan, so the
  // two groups are requested separately and merged as they land.
  useEffect(() => {
    if (!state.hasCoordinates) return undefined;
    let cancelled = false;

    const merge = (incoming: OverlayData) => {
      setOverlayData((previous) => {
        if (!previous) return incoming;
        const failed = new Set(incoming.errors.map((entry) => entry.split(':')[0]));
        return {
          radius: incoming.radius,
          gaia: incoming.gaia ?? previous.gaia,
          wise: incoming.wise ?? previous.wise,
          neossat: incoming.neossat ?? previous.neossat,
          counts: { ...previous.counts, ...incoming.counts },
          errors: [
            ...previous.errors.filter((entry) => !failed.has(entry.split(':')[0])),
            ...incoming.errors,
          ],
        };
      });
    };

    const load = async (layers: OverlayLayer[]) => {
      try {
        const data = await fetchOverlays(state.ra, state.dec, state.fov, layers);
        if (!cancelled) merge(data);
      } catch {
        // A dead archive leaves the other layers untouched; the panel shows it.
      }
    };

    // Never keep rows from the previous field: a layer that fails here must not
    // inherit the counts or markers of the sky area the user just left.
    setOverlayData(null);
    void load(['gaia', 'neossat']);
    void load(['wise']);

    return () => {
      cancelled = true;
    };
  }, [state.ra, state.dec, state.fov, state.hasCoordinates]);

  /* ------------------------------------------------------------ field reset */
  useEffect(() => {
    setProbe(null);
    setSelection(null);
    setSpectrum(null);
    setCandidates([]);
    setCandidateFocus(null);
  }, [state.ra, state.dec, state.fov]);

  const overlaySources = useMemo(
    () => [...(overlayData?.gaia ?? []), ...(overlayData?.wise ?? [])],
    [overlayData],
  );

  const neossatFrames = useMemo<NeossatObservation[]>(
    () => overlayData?.neossat ?? [],
    [overlayData],
  );

  const counts = useMemo(
    () => ({
      gaia: overlayData?.counts.gaia ?? 0,
      wise: overlayData?.counts.wise ?? 0,
      neossat: overlayData?.counts.neossat ?? 0,
    }),
    [overlayData],
  );

  const neossatError = useMemo(
    () => overlayData?.errors.find((entry) => entry.startsWith('neossat')) ?? null,
    [overlayData],
  );

  /* ------------------------------------------------------------ playback */
  useEffect(() => {
    if (!state.playing || state.mode !== 'blink' || epochs.length < 2) return undefined;
    const interval = 1000 / Math.max(state.fps, 0.25);
    const timer = window.setInterval(() => {
      const count = epochs.length;
      const current = Math.max(
        epochs.findIndex((item) => item.index === epochIndex),
        0,
      );
      if (!state.pingPong) {
        playbackDirRef.current = 1;
        update({ epoch: epochs[(current + 1) % count].index });
        return;
      }
      let next = current + playbackDirRef.current;
      if (next >= count) {
        playbackDirRef.current = -1;
        next = count - 2;
      } else if (next < 0) {
        playbackDirRef.current = 1;
        next = Math.min(1, count - 1);
      }
      update({ epoch: epochs[next].index });
    }, interval);
    return () => window.clearInterval(timer);
  }, [
    state.playing,
    state.fps,
    state.mode,
    state.pingPong,
    epochIndex,
    epochs,
    update,
  ]);

  const togglePlay = useCallback(() => {
    if (state.mode !== 'blink' || epochs.length < 2) return;
    update({ playing: !state.playing });
  }, [state.mode, state.playing, epochs.length, update]);

  /**
   * Difference and compare both need two distinct visits: switching into them
   * with A === B would only show the same frame twice, so B falls back to the
   * last available epoch.
   */
  const changeMode = useCallback(
    (mode: WorkspaceMode) => {
      update({
        mode,
        playing: false,
        epochA,
        epochB:
          (mode === 'diff' || mode === 'compare') && epochB === epochA
            ? availableEpochs[availableEpochs.length - 1] ?? epochA
            : epochB,
      });
    },
    [update, epochA, epochB, availableEpochs],
  );

  const stepEpoch = useCallback(
    (direction: number) => {
      if (epochs.length === 0) return;
      const position = Math.max(
        epochs.findIndex((item) => item.index === epochIndex),
        0,
      );
      const next = (position + direction + epochs.length) % epochs.length;
      update({ epoch: epochs[next].index });
    },
    [epochIndex, epochs, update],
  );

  /* -------------------------------------------------------------- probes */
  const handleProbe = useCallback(
    async (x: number, y: number, epoch: number) => {
      if (!ready) return;
      try {
        const result = await probePixel(epoch, x, y);
        setProbe(result);
      } catch {
        // transient worker errors are non-fatal
      }
    },
    [probePixel, ready],
  );

  const handleSelect = useCallback(
    async (x: number, y: number, epoch: number) => {
      if (!ready) return;
      setSelection({ x, y });
      // Tangent-plane pixel -> sky, identical to the worker's `skyFromPixel`.
      const scaleArcsec = (state.fov * 3600) / frameSize;
      const centre = (frameSize - 1) / 2;
      const xArcsec = -(x - centre) * scaleArcsec;
      const yArcsec = -(y - centre) * scaleArcsec;
      let targetDec = state.dec + yArcsec / 3600;
      let targetRa =
        (state.ra +
          xArcsec / (3600 * Math.max(Math.cos((state.dec * Math.PI) / 180), 0.05)) +
          360) %
        360;
      try {
        const result = await probePixel(epoch, x, y);
        setProbe(result);
        if (Number.isFinite(result.ra) && Number.isFinite(result.dec)) {
          targetRa = result.ra;
          targetDec = result.dec;
        }
      } catch {
        // The worker may not hold this epoch yet; the pixel fallback above is
        // already the same projection, so the spectrum still follows the click.
      }
      const token = ++spectrumTokenRef.current;
      setSpectrumLoading(true);
      setSpectrumError(null);
      try {
        // One measurement per visit across every channel the survey recorded
        // here: this is a real spectrum, not a column scan of one exposure.
        const data = await fetchSpectrum(targetRa, targetDec, state.fov, {
          maxProducts: 96,
        });
        if (token !== spectrumTokenRef.current) return;
        setSpectrum(data);
        setSpectrumOpen(true);
      } catch (cause) {
        if (token !== spectrumTokenRef.current) return;
        setSpectrum(null);
        setSpectrumError(cause instanceof Error ? cause.message : 'spectrum unavailable');
      } finally {
        if (token === spectrumTokenRef.current) setSpectrumLoading(false);
      }
    },
    [probePixel, ready, state.ra, state.dec, state.fov, frameSize],
  );

  const handleCandidateSelect = useCallback(
    (candidate: MoverCandidate, index: number) => {
      setCandidateFocus(index);
      const epoch = candidate.sign > 0 ? epochB : epochA;
      update({ epoch });
      void handleSelect(candidate.x, candidate.y, epoch);
    },
    [handleSelect, epochA, epochB, update],
  );

  const scanCandidates = useCallback(async () => {
    const token = ++candidateTokenRef.current;
    setCandidatesLoading(true);
    try {
      const result = await findCandidates(epochA, epochB, 8);
      if (token !== candidateTokenRef.current) return;
      setCandidates(result.candidates);
      setCandidateThreshold(result.threshold);
      setCandidateSigma(result.sigma);
      setCandidateFocus(null);
    } catch {
      if (token === candidateTokenRef.current) setCandidates([]);
    } finally {
      if (token === candidateTokenRef.current) setCandidatesLoading(false);
    }
  }, [findCandidates, epochA, epochB]);

  useEffect(() => {
    if (!dataReady || state.mode !== 'diff') return undefined;
    const timer = window.setTimeout(() => {
      void scanCandidates();
    }, 260);
    return () => window.clearTimeout(timer);
  }, [dataReady, state.mode, epochA, epochB, bandSelection.bandKey, scanCandidates]);

  /* ------------------------------------------------------------ keyboard */
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      switch (event.key) {
        case ' ':
          event.preventDefault();
          togglePlay();
          break;
        case 'ArrowRight':
          // In compare mode the arrows nudge the before/after divider; the
          // slider owns that gesture, so the timeline stays where it is.
          if (state.mode === 'compare') return;
          event.preventDefault();
          stepEpoch(1);
          break;
        case 'ArrowLeft':
          if (state.mode === 'compare') return;
          event.preventDefault();
          stepEpoch(-1);
          break;
        case 'b':
          changeMode('blink');
          break;
        case 'c':
          changeMode('coadd');
          break;
        case 'd':
          changeMode('diff');
          break;
        case 'v':
          changeMode(state.mode === 'compare' ? 'blink' : 'compare');
          break;
        case 'g':
          update({ overlays: { grid: !state.overlays.grid } });
          break;
        case 'l':
          update({ overlays: { labels: !state.overlays.labels } });
          break;
        case 'f':
          update({ showFlags: !state.showFlags });
          break;
        case 'Escape':
          setSelection(null);
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [
    togglePlay,
    stepEpoch,
    changeMode,
    update,
    state.mode,
    state.overlays.grid,
    state.overlays.labels,
    state.showFlags,
  ]);

  /* -------------------------------------------------------------- actions */
  const applyCoordinates = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const ra = parseRa(raInput);
      const dec = parseDec(decInput);
      setRaInvalid(ra === null);
      setDecInvalid(dec === null);
      if (ra === null || dec === null) return;
      saveLastField({ ra, dec, fov: state.fov });
      update({ ra, dec, fov: state.fov, target: null, epoch: 0, epochA: 0 });
    },
    [raInput, decInput, state.fov, update],
  );

  const generateRandomField = useCallback(() => {
    if (randomLoading) return;
    const applyField = (ra: number, dec: number) => {
      setRandomError(null);
      setRaInput(formatRa(ra));
      setDecInput(formatDec(dec));
      setRaInvalid(false);
      setDecInvalid(false);
      saveLastField({ ra, dec, fov: state.fov });
      update({ ra, dec, fov: state.fov, target: null, epoch: 0, epochA: 0 });
    };

    // Ask the backend for a point the archive actually covers; an uncovered
    // random draw would only produce "NO COVERAGE".
    setRandomLoading(true);
    fetchRandomField(state.fov)
      .then((field) => applyField(field.ra, field.dec))
      .catch(() => {
        // The archive check is mandatory: do not fabricate a sky point.
        setRandomError(t.workspace.randomUnavailable);
      })
      .finally(() => setRandomLoading(false));
  }, [randomLoading, state.fov, update, t.workspace.randomUnavailable]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 1800);
    } catch {
      setLinkCopied(false);
    }
  };

  const modeLabel =
    state.mode === 'blink'
      ? t.workspace.modeBlink
      : state.mode === 'coadd'
        ? t.workspace.modeCoadd
        : state.mode === 'diff'
          ? t.workspace.modeDiff
          : t.workspace.modeCompare;

  const epoch = epochs.find((item) => item.index === epochIndex) ?? epochs[0] ?? null;
  // The metadata panel must describe the plane on screen: in compare mode that
  // is the A/B pair, not whatever epoch the blink timeline happens to hold.
  const epochAMeta = epochs.find((item) => item.index === epochA) ?? null;
  const epochBMeta = epochs.find((item) => item.index === epochB) ?? null;
  const metadataEpoch = state.mode === 'compare' ? epochAMeta : epoch;
  const metadataEpochB = state.mode === 'compare' ? epochBMeta : null;
  const selectedBandIndex =
    state.channel.type === 'band' ? state.channel.band : detector > 0 ? (detector - 1) * 17 + 8 : 45;

  const activeTarget = findTargetBySlug(state.target);
  const targetName = activeTarget ? t.targets[activeTarget.i18nKey].name : t.workspace.customField;

  return (
    <div className="mx-auto w-full max-w-[1700px] px-4 py-6 sm:px-6">
      {/* --------------------------------------------------------- header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
        <div>
          <p className="kicker">{t.nav.workspace}</p>
          <h1 className="mt-2 text-2xl sm:text-3xl">{t.workspace.title}</h1>
          <p className="mt-1 max-w-2xl text-[13px] text-zinc-500">{t.workspace.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/" className="btn-ghost">
            <ArrowLeft size={13} aria-hidden="true" />
            {t.common.backToExplorer}
          </Link>
          <button type="button" onClick={copyLink} className="btn-ghost">
            {linkCopied ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
            {linkCopied ? t.common.copied : t.workspace.copyLink}
          </button>
        </div>
      </div>

      {/* -------------------------------------------------- coordinate bar */}
      <section
        aria-label={t.workspace.sessionLabel}
        className="mt-4 border border-line bg-surface backdrop-blur-md"
      >
        <form
          onSubmit={applyCoordinates}
          className="flex flex-wrap items-end gap-x-3 gap-y-2 px-4 py-2.5"
          noValidate
        >
          <label className="space-y-1">
            <span className="label-mono block">{t.workspace.ra}</span>
            <input
              name="ra"
              value={raInput}
              onChange={(event) => {
                setRaInput(event.target.value);
                setRaInvalid(false);
              }}
              spellCheck={false}
              autoComplete="off"
              aria-invalid={raInvalid}
              aria-label={t.home.raLabel}
              placeholder="17h57m48.5s"
              className={`field w-[152px] !px-2 !py-1 !text-[11px] ${raInvalid ? 'field-invalid' : ''}`}
            />
          </label>

          <label className="space-y-1">
            <span className="label-mono block">{t.workspace.dec}</span>
            <input
              name="dec"
              value={decInput}
              onChange={(event) => {
                setDecInput(event.target.value);
                setDecInvalid(false);
              }}
              spellCheck={false}
              autoComplete="off"
              aria-invalid={decInvalid}
              aria-label={t.home.decLabel}
              placeholder="+04d41m36s"
              className={`field w-[152px] !px-2 !py-1 !text-[11px] ${decInvalid ? 'field-invalid' : ''}`}
            />
          </label>

          <label className="space-y-1">
            <span className="label-mono block">{t.common.fov}</span>
            <select
              value={FOV_OPTIONS.includes(state.fov as (typeof FOV_OPTIONS)[number]) ? state.fov : ''}
              onChange={(event) => update({ fov: Number(event.target.value) })}
              className="field w-[88px] appearance-none !px-2 !py-1 !text-[11px]"
            >
              {!FOV_OPTIONS.includes(state.fov as (typeof FOV_OPTIONS)[number]) && (
                <option value="">{state.fov}°</option>
              )}
              {FOV_OPTIONS.map((option) => (
                <option key={option} value={option} className="bg-canvas">
                  {option}°
                </option>
              ))}
            </select>
          </label>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={generateRandomField}
              disabled={randomLoading}
              className="btn-ghost w-full !px-3 !py-1.5 !text-[10px] disabled:opacity-60 sm:w-auto"
              title={t.workspace.randomPointHint}
            >
              {randomLoading && <Loader2 size={11} className="animate-spin" aria-hidden="true" />}
              {t.common.randomPoint}
            </button>

            <button type="submit" className="btn-primary w-full !px-3 !py-1.5 !text-[10px] sm:w-auto">
              <Search size={11} aria-hidden="true" />
              {t.common.apply}
            </button>
          </div>
          {randomError && (
            <p role="alert" className="mt-2 font-mono text-[9px] leading-relaxed text-warn">
              {randomError}
            </p>
          )}

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <span className="chip">
              {t.workspace.mode} · {modeLabel}
            </span>
            <span className="chip normal-case tracking-[0.06em]">{bandSelection.bandLabel}</span>
            {/*
              The archive badge is mounted from the first paint and keeps a
              fixed footprint: adding it after the TAP answer used to wrap the
              chip cluster onto one more line on phones, dropping the whole
              viewport down by ~30 px right after the image appeared.
            */}
            <span
              className={`inline-flex min-w-[11rem] items-center justify-center gap-1.5 border border-accent/50 bg-accent/5 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-accent ${
                coverage?.covered ? '' : 'invisible'
              }`}
              title={coverage?.covered ? coverage.collection ?? undefined : undefined}
            >
              <Database size={9} aria-hidden="true" />
              {t.workspace.dataLive.replace('{n}', String(coverage?.productCount ?? 0))}
            </span>
          </div>
        </form>
      </section>

      {/* ----------------------------------------------------- main content */}
      {state.hasCoordinates ? (
        <>
          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
            <div className="min-w-0">
              <div className="border border-line bg-canvas/90">
                <BlinkViewport
                  frame={frame}
                  epochs={epochs}
                  size={frameSize}
                  ra={state.ra}
                  dec={state.dec}
                  fov={state.fov}
                  ready={ready}
                  rendering={rendering}
                  status={engineStatus}
                  error={engineError}
                  channelNotice={
                    state.channel.type === 'band' &&
                    engine.availableChannels.length > 0 &&
                    !engine.availableChannels.includes(bandAt(state.channel.band).subchan)
                      ? `${bandAt(state.channel.band).label} · ${bandAt(state.channel.band).wavelength.toFixed(3)} µm — ${t.workspace.channelOutsideCutoutHint}`
                      : null
                  }
                  mode={state.mode}
                  epochIndex={epochIndex}
                  epochA={epochA}
                  epochB={epochB}
                  bandLabel={bandSelection.bandLabel}
                  targetName={targetName}
                  overlays={state.overlays}
                  overlaySources={overlaySources}
                  neossat={neossatFrames}
                  selection={selection}
                  probe={probe}
                  playing={state.playing}
                  fps={state.fps}
                  pingPong={state.pingPong}
                  candidates={candidates}
                  focusMarker={candidateFocus !== null ? candidates[candidateFocus] ?? null : null}
                  showFlags={state.showFlags}
                  onProbe={handleProbe}
                  onSelect={handleSelect}
                  onTogglePlay={togglePlay}
                  onStep={stepEpoch}
                  onEpochChange={(value) => update({ epoch: value })}
                  onFpsChange={(value) => update({ fps: value })}
                  onPingPongChange={(value) => update({ pingPong: value })}
                  onToggleFlags={() => update({ showFlags: !state.showFlags })}
                />

                <div className="border-t border-line px-4 py-2">
                  <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-zinc-700">
                    {t.workspace.shortcuts}
                  </p>
                </div>

                <div className="border-t border-line">
                  <CatalogOverlays
                    overlays={state.overlays}
                    counts={counts}
                    neossatError={neossatError}
                    onToggle={(key, value) => update({ overlays: { [key]: value } })}
                  />
                </div>

                <div className="border-t border-line">
                  <MoverCandidates
                    candidates={candidates}
                    loading={candidatesLoading}
                    dataReady={dataReady}
                    threshold={candidateThreshold}
                    sigma={candidateSigma}
                    mode={state.mode}
                    epochA={epochA}
                    epochB={epochB}
                    onScan={() => void scanCandidates()}
                    onSelect={handleCandidateSelect}
                  />
                </div>
              </div>
            </div>

            <aside className="min-w-0 space-y-px border border-line bg-line">
              <BandArraySelector
                channel={state.channel}
                availableChannels={engine.availableChannels}
                onSelectBand={(band) => update({ band })}
                onSelectArray={(array) => update({ array, band: undefined })}
                onSelectAll={() => update({ band: 0 })}
                onWidenField={() => update({ fov: 3.6 })}
              />

              <ImageMathControls
                mode={state.mode}
                coaddMethod={coaddMethod}
                compareScale={compareScale}
                epochA={epochA}
                epochB={epochB}
                epochs={epochs}
                stretch={state.stretch}
                gain={state.gain}
                showFlags={state.showFlags}
                maskFlags={state.maskFlags}
                nativeSampling={nativeSampling}
                onModeChange={changeMode}
                onCoaddMethodChange={setCoaddMethod}
                onCompareScaleChange={setCompareScale}
                onEpochAChange={(value) => update({ epochA: value })}
                onEpochBChange={(value) => update({ epochB: value })}
                onSwapEpochs={() => update({ epochA: epochB, epochB: epochA })}
                onStretchChange={(stretch) => update({ stretch })}
                onGainChange={(gain) => update({ gain })}
                onShowFlagsChange={(showFlags) => update({ showFlags })}
                onMaskFlagsChange={(maskFlags) => update({ maskFlags })}
                onNativeSamplingChange={setNativeSampling}
              />

              <MetadataInspector
                probe={probe}
                frame={frame}
                epoch={metadataEpoch}
                epochB={metadataEpochB}
                bandLabel={bandSelection.bandLabel}
                fieldRa={state.ra}
                fieldDec={state.dec}
                detector={detector}
              />

              <FieldNotes
                target={state.target}
                targetName={targetName}
                raLabel={formatRa(state.ra)}
                decLabel={formatDec(state.dec)}
              />
            </aside>
          </div>

          <div className="mt-4">
            <SpectrumPlotter
              spectrum={spectrum}
              loading={spectrumLoading}
              error={spectrumError}
              open={spectrumOpen}
              selectedBand={Math.max(1, Math.min(102, selectedBandIndex))}
              onToggle={() => setSpectrumOpen(!spectrumOpen)}
              onClose={() => {
                setSpectrum(null);
                setSelection(null);
              }}
              onSelectBand={(band) => update({ band })}
            />
          </div>
        </>
      ) : (
        <section
          aria-labelledby="no-field-title"
          className="mt-4 grid place-items-center border border-line bg-surface px-6 py-16 backdrop-blur-md"
        >
          <div className="max-w-md text-center">
            <Crosshair size={24} strokeWidth={1.3} className="mx-auto text-accent/70" aria-hidden="true" />
            <h2
              id="no-field-title"
              className="mt-3 font-mono text-[12px] uppercase tracking-[0.18em] text-zinc-100"
            >
              {t.workspace.noCoordinatesTitle}
            </h2>
            <p className="mt-2 text-[12px] leading-relaxed text-zinc-500">
              {t.workspace.noCoordinatesBody}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={generateRandomField}
                disabled={randomLoading}
                className="btn-primary !px-4 !py-2 !text-[10px] disabled:opacity-60"
              >
                {randomLoading && <Loader2 size={11} className="animate-spin" aria-hidden="true" />}
                {t.common.randomPoint}
              </button>
              <Link to="/" className="btn-ghost !px-4 !py-2 !text-[10px]">
                <ArrowLeft size={11} aria-hidden="true" />
                {t.common.backToExplorer}
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

