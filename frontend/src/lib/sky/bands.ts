/**
 * SPHEREx spectral layout: 102 narrow near-infrared bands spread across six
 * detector arrays (17 bands per array). Values follow the published SPHEREx
 * band edges (0.75–5.0 µm); band centres are geometrically spaced inside each
 * array because SPHEREx's linear-variable filters sample wavelength
 * logarithmically.
 */

export const BAND_COUNT = 102;
export const ARRAY_COUNT = 6;
export const BANDS_PER_ARRAY = 17;

export const ARRAY_RANGES: ReadonlyArray<readonly [number, number]> = [
  [0.75, 1.11],
  [1.11, 1.64],
  [1.64, 2.42],
  [2.42, 3.58],
  [3.58, 4.29],
  [4.29, 5.0],
];

export const ARRAY_COLORS: ReadonlyArray<string> = [
  '#38bdf8', // D1 — shortest, cyan
  '#22d3ee',
  '#34d399',
  '#a3e635',
  '#fbbf24',
  '#fb7185', // D6 — longest, rose
];

export const ARRAY_LABELS: ReadonlyArray<string> = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6'];

export interface BandDefinition {
  /** 1-based band index, 1…102. */
  index: number;
  /** Detector array, 1…6. */
  array: number;
  /** Position inside the array, 0…16. */
  arrayBand: number;
  /** Band centre in micrometres. */
  wavelength: number;
  /** Band width in micrometres. */
  width: number;
  /** Short label such as "D3-07". */
  label: string;
  color: string;
}

function buildBands(): BandDefinition[] {
  const bands: BandDefinition[] = [];
  ARRAY_RANGES.forEach(([low, high], arrayIndex) => {
    const ratio = Math.pow(high / low, 1 / BANDS_PER_ARRAY);
    for (let i = 0; i < BANDS_PER_ARRAY; i += 1) {
      const lo = low * Math.pow(ratio, i);
      const hi = lo * ratio;
      const index = arrayIndex * BANDS_PER_ARRAY + i + 1;
      bands.push({
        index,
        array: arrayIndex + 1,
        arrayBand: i,
        wavelength: Math.sqrt(lo * hi),
        width: hi - lo,
        label: `${ARRAY_LABELS[arrayIndex]}-${String(i + 1).padStart(2, '0')}`,
        color: ARRAY_COLORS[arrayIndex],
      });
    }
  });
  return bands;
}

export const BANDS: ReadonlyArray<BandDefinition> = buildBands();

export function bandAt(index: number): BandDefinition {
  const clamped = Math.min(BAND_COUNT, Math.max(1, Math.round(index)));
  return BANDS[clamped - 1];
}

export function bandsForArray(array: number): BandDefinition[] {
  return BANDS.filter((band) => band.array === array);
}

export function arrayOfBand(index: number): number {
  return bandAt(index).array;
}

export function bandIndicesForArray(array: number): number[] {
  const start = (array - 1) * BANDS_PER_ARRAY;
  return Array.from({ length: BANDS_PER_ARRAY }, (_, i) => start + i + 1);
}

export function allBandIndices(): number[] {
  return Array.from({ length: BAND_COUNT }, (_, i) => i + 1);
}

/** Nearest band index to a wavelength in micrometres. */
export function nearestBand(wavelength: number): BandDefinition {
  let best = BANDS[0];
  let bestDistance = Infinity;
  for (const band of BANDS) {
    const distance = Math.abs(Math.log(band.wavelength / wavelength));
    if (distance < bestDistance) {
      bestDistance = distance;
      best = band;
    }
  }
  return best;
}

export function formatWavelength(wavelength: number, digits = 3): string {
  return `${wavelength.toFixed(digits)} µm`;
}

/** Human readable array label: "D3 · 1.64–2.42 µm". */
export function arrayLabel(array: number): string {
  const [low, high] = ARRAY_RANGES[array - 1];
  return `${ARRAY_LABELS[array - 1]} · ${low.toFixed(2)}–${high.toFixed(2)} µm`;
}

export interface MolecularMarker {
  id: string;
  label: string;
  wavelength: number;
  color: string;
  note: string;
}

/**
 * Molecular / mineral features used by the spectrum plotter and the band
 * scrubbing UI. Wavelengths are vacuum/air averages used in the literature.
 */
export const MOLECULAR_MARKERS: ReadonlyArray<MolecularMarker> = [
  {
    id: 'h2o-1.13',
    label: 'H₂O',
    wavelength: 1.13,
    color: '#38bdf8',
    note: 'Water vapour absorption — strong in M dwarfs and T dwarfs.',
  },
  {
    id: 'h2o-1.4',
    label: 'H₂O',
    wavelength: 1.4,
    color: '#38bdf8',
    note: 'Deep water band; suppresses flux in L/T transition objects.',
  },
  {
    id: 'h2o-1.9',
    label: 'H₂O',
    wavelength: 1.87,
    color: '#38bdf8',
    note: 'Water ice absorption — traces cold circumstellar material.',
  },
  {
    id: 'co-1.56',
    label: 'CO',
    wavelength: 1.56,
    color: '#f59e0b',
    note: 'First overtone of carbon monoxide — shocks and warm disks.',
  },
  {
    id: 'ch4-1.65',
    label: 'CH₄',
    wavelength: 1.65,
    color: '#a78bfa',
    note: 'Methane absorption — hallmark of T and Y brown dwarfs.',
  },
  {
    id: 'co2-2.0',
    label: 'CO₂',
    wavelength: 2.0,
    color: '#fb7185',
    note: 'Carbon dioxide combination band.',
  },
  {
    id: 'co-2.3',
    label: 'CO',
    wavelength: 2.3,
    color: '#f59e0b',
    note: 'CO bandhead — strong in young stars and AGB envelopes.',
  },
  {
    id: 'h2o-2.7',
    label: 'H₂O',
    wavelength: 2.7,
    color: '#38bdf8',
    note: 'Water stretch overtone; also affected by telluric residuals.',
  },
  {
    id: 'co2-4.26',
    label: 'CO₂',
    wavelength: 4.26,
    color: '#fb7185',
    note: 'Fundamental CO₂ band — probes warm molecular gas.',
  },
  {
    id: 'co-4.6',
    label: 'CO',
    wavelength: 4.6,
    color: '#f59e0b',
    note: 'Fundamental CO band — disk and outflow tracer.',
  },
  {
    id: 'pah-3.3',
    label: 'PAH',
    wavelength: 3.3,
    color: '#34d399',
    note: 'Polycyclic aromatic hydrocarbon emission — star-forming regions.',
  },
  {
    id: 'h2o-3.0',
    label: 'H₂O ice',
    wavelength: 3.05,
    color: '#22d3ee',
    note: 'Water-ice absorption at 3.05 µm — icy grains in disks.',
  },
];

export function markersInRange(low: number, high: number): MolecularMarker[] {
  return MOLECULAR_MARKERS.filter(
    (marker) => marker.wavelength >= low && marker.wavelength <= high,
  );
}
