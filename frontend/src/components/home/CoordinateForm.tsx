import { useId, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crosshair, Search } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { FOV_OPTIONS } from '../../data/targets';
import {
  formatDec,
  formatDecLong,
  formatRa,
  formatRaLong,
  parseDec,
  parseRa,
  toUrlNumber,
} from '../../lib/coords';
import { readLastField, saveLastField } from '../../lib/lastField';
import { fetchRandomField } from '../../lib/api';

/** Clean default pointing: the Barnard's Star field, decimal 269.45 / +4.69. */
const DEFAULT_RA = '17h57m48.498s';
const DEFAULT_DEC = '+04d41m36.11s';
const DEFAULT_FOV = 0.5;

function isFovOption(value: number): boolean {
  return (FOV_OPTIONS as readonly number[]).includes(value);
}

export default function CoordinateForm() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Restore the last field the visitor actually searched, so a reload does not
  // throw away their coordinates.
  const saved = useMemo(readLastField, []);

  const [raInput, setRaInput] = useState(() => (saved ? formatRa(saved.ra) : DEFAULT_RA));
  const [decInput, setDecInput] = useState(() => (saved ? formatDec(saved.dec) : DEFAULT_DEC));
  const [fov, setFov] = useState<number>(() =>
    saved && isFovOption(saved.fov) ? saved.fov : DEFAULT_FOV,
  );
  const [raError, setRaError] = useState(false);
  const [decError, setDecError] = useState(false);
  const [randomising, setRandomising] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const raId = useId();
  const decId = useId();
  const fovId = useId();

  const parsed = useMemo(
    () => ({ ra: parseRa(raInput), dec: parseDec(decInput) }),
    [raInput, decInput],
  );

  function handleRandom() {
    setRandomising(true);
    // Ask the backend for a point that is actually covered by SPHEREx; fall
    // back to a local draw if the API is unreachable.
    fetchRandomField(fov)
      .then((field) => {
        setRaInput(formatRa(field.ra));
        setDecInput(formatDec(field.dec));
        setRaError(false);
        setDecError(false);
        setHint(null);
        saveLastField({ ra: field.ra, dec: field.dec, fov });
      })
      .catch(() => {
        // Never offer an unverified random field: without the archive check we
        // keep the current pointing and say why the request failed.
        setHint(t.home.randomUnverified);
      })
      .finally(() => setRandomising(false));
  }

  function handleFovChange(value: number) {
    setFov(value);
    // Keep the remembered field in step when the inputs already hold a valid
    // pointing, so a reload restores the same field size too.
    const ra = parseRa(raInput);
    const dec = parseDec(decInput);
    if (ra !== null && dec !== null) saveLastField({ ra, dec, fov: value });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ra = parseRa(raInput);
    const dec = parseDec(decInput);

    setRaError(ra === null);
    setDecError(dec === null);

    if (ra === null || dec === null) {
      setHint(ra === null ? t.home.invalidRa : t.home.invalidDec);
      return;
    }

    saveLastField({ ra, dec, fov });

    const search = new URLSearchParams({
      ra: toUrlNumber(ra),
      dec: toUrlNumber(dec),
      fov: String(fov),
    });
    navigate(`/workspace?${search.toString()}`);
  }

  return (
    <section
      id="coordinate-intake"
      aria-labelledby="coordinate-intake-title"
      className="panel scroll-mt-24"
    >
      <div className="panel-header">
        <div>
          <h2
            id="coordinate-intake-title"
            className="font-mono text-[12px] uppercase tracking-[0.18em] text-zinc-100"
          >
            {t.home.formTitle}
          </h2>
          <p className="mt-1 text-[11px] text-zinc-500">{t.home.formSubtitle}</p>
        </div>
        <Crosshair size={14} className="shrink-0 text-zinc-600" aria-hidden="true" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 p-4 sm:p-5" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor={raId} className="label-mono block">
              {t.home.raLabel}
            </label>
            <input
              id={raId}
              name="ra"
              value={raInput}
              onChange={(event) => {
                setRaInput(event.target.value);
                setRaError(false);
                setHint(null);
              }}
              spellCheck={false}
              autoComplete="off"
              aria-invalid={raError}
              aria-describedby={`${raId}-hint`}
              className={`field ${raError ? 'field-invalid' : ''}`}
              placeholder="17h57m48.5s"
            />
            <p id={`${raId}-hint`} className="text-[10px] leading-relaxed text-zinc-600">
              {t.home.raHint}
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor={decId} className="label-mono block">
              {t.home.decLabel}
            </label>
            <input
              id={decId}
              name="dec"
              value={decInput}
              onChange={(event) => {
                setDecInput(event.target.value);
                setDecError(false);
                setHint(null);
              }}
              spellCheck={false}
              autoComplete="off"
              aria-invalid={decError}
              aria-describedby={`${decId}-hint`}
              className={`field ${decError ? 'field-invalid' : ''}`}
              placeholder="+04d41m36s"
            />
            <p id={`${decId}-hint`} className="text-[10px] leading-relaxed text-zinc-600">
              {t.home.decHint}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div className="space-y-1.5">
            <label htmlFor={fovId} className="label-mono block">
              {t.home.fovLabel}
            </label>
            <select
              id={fovId}
              name="fov"
              value={fov}
              onChange={(event) => handleFovChange(Number(event.target.value))}
              className="field appearance-none"
            >
              {FOV_OPTIONS.map((option) => (
                <option key={option} value={option} className="bg-canvas">
                  {option}° {option < 0.5 ? `(${Math.round(option * 3600)}″)` : ''}
                </option>
              ))}
            </select>
            <p className="text-[10px] leading-relaxed text-zinc-600">{t.home.fovHint}</p>
          </div>

          <div className="space-y-1.5">
            <span className="label-mono block">{t.common.coordinates}</span>
            <div className="flex h-[38px] items-center gap-2 overflow-hidden border border-line bg-black/25 px-3 font-mono text-[10px] text-zinc-500">
              <span className="min-w-0 truncate">
                {parsed.ra !== null ? formatRaLong(parsed.ra) : 'RA —'}
              </span>
              <span className="shrink-0 text-zinc-700">/</span>
              <span className="min-w-0 truncate">
                {parsed.dec !== null ? formatDecLong(parsed.dec) : 'Dec —'}
              </span>
            </div>
          </div>
        </div>

        {hint && (
          <p
            role="alert"
            className="border border-warn/40 bg-warn/5 px-3 py-2 font-mono text-[10px] leading-relaxed text-warn"
          >
            {hint}
          </p>
        )}

        <div className="flex flex-col gap-2 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-end">
          <button type="button" onClick={handleRandom} className="btn-ghost" disabled={randomising} aria-busy={randomising}>
            {randomising ? t.common.loading : t.common.randomPoint}
          </button>
          <button type="submit" className="btn-primary shrink-0">
            <Search size={13} aria-hidden="true" />
            {t.home.submit}
          </button>
        </div>
      </form>
    </section>
  );
}
