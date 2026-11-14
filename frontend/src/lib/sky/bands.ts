/**
 * Official SPHEREx spectral channel definition.
 *
 * Generated from the IRSA calibration product
 * `spectral_channels_spx_cal-sch-v2-2026-229.fits` (SPECTRAL_CHANNELS table,
 * 102 rows). The mission defines 17 geometric channels per detector band; these
 * are the authoritative centres, edges, resolving powers and bandwidths, so the
 * Explorer never derives them from an even split of 0.75-5.0 um.
 *
 * The same table ships with the backend (`app/channels_data.py`), which serves
 * it from `/api/bands`; this copy keeps the UI working before that request
 * lands and when the backend is offline.
 */

export const BAND_COUNT = 102;
export const ARRAY_COUNT = 6;
export const BANDS_PER_ARRAY = 17;

export const ARRAY_COLORS: ReadonlyArray<string> = [
  '#38bdf8', // D1
  '#22d3ee',
  '#34d399',
  '#a3e635',
  '#fbbf24',
  '#fb7185', // D6
];

export const ARRAY_LABELS: ReadonlyArray<string> = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6'];

/** Nominal per-band coverage in micrometres (official channel edges). */
export const BAND_RANGES: ReadonlyArray<readonly [number, number]> = [
  [0.743, 1.116],
  [1.099, 1.651],
  [1.636, 2.44],
  [2.422, 3.827],
  [3.8144, 4.4264],
  [4.4184, 5.0094],
];

/** Backwards-compatible alias: the six detector bands. */
export const ARRAY_RANGES = BAND_RANGES;

export interface BandDefinition {
  /** 1-based global channel index, 1...102. */
  index: number;
  /** Detector array, 1...6. */
  detector: number;
  /** Channel position inside the array, 1...17. */
  subchan: number;
  /** Official channel centre in micrometres. */
  wavelength: number;
  /** Official channel bandwidth in micrometres. */
  width: number;
  wlMin: number;
  wlMax: number;
  /** Median resolving power of the channel. */
  R: number;
}

interface BandSeed {
  index: number;
  detector: number;
  subchan: number;
  wavelength: number;
  width: number;
  wlMin: number;
  wlMax: number;
  R: number;
}

const SEEDS: ReadonlyArray<BandSeed> = [
  { index: 1, detector: 1, subchan: 1, wavelength: 0.753, width: 0.018, wlMin: 0.743, wlMax: 0.762, R: 42 },
  { index: 2, detector: 1, subchan: 2, wavelength: 0.771, width: 0.019, wlMin: 0.761, wlMax: 0.781, R: 42 },
  { index: 3, detector: 1, subchan: 3, wavelength: 0.79, width: 0.019, wlMin: 0.78, wlMax: 0.8, R: 41 },
  { index: 4, detector: 1, subchan: 4, wavelength: 0.809, width: 0.02, wlMin: 0.798, wlMax: 0.819, R: 40 },
  { index: 5, detector: 1, subchan: 5, wavelength: 0.828, width: 0.02, wlMin: 0.817, wlMax: 0.839, R: 40 },
  { index: 6, detector: 1, subchan: 6, wavelength: 0.848, width: 0.021, wlMin: 0.837, wlMax: 0.859, R: 40 },
  { index: 7, detector: 1, subchan: 7, wavelength: 0.868, width: 0.022, wlMin: 0.857, wlMax: 0.879, R: 40 },
  { index: 8, detector: 1, subchan: 8, wavelength: 0.889, width: 0.023, wlMin: 0.877, wlMax: 0.9, R: 39 },
  { index: 9, detector: 1, subchan: 9, wavelength: 0.91, width: 0.023, wlMin: 0.898, wlMax: 0.922, R: 39 },
  { index: 10, detector: 1, subchan: 10, wavelength: 0.932, width: 0.024, wlMin: 0.92, wlMax: 0.944, R: 39 },
  { index: 11, detector: 1, subchan: 11, wavelength: 0.955, width: 0.025, wlMin: 0.942, wlMax: 0.967, R: 39 },
  { index: 12, detector: 1, subchan: 12, wavelength: 0.978, width: 0.026, wlMin: 0.964, wlMax: 0.99, R: 38 },
  { index: 13, detector: 1, subchan: 13, wavelength: 1.001, width: 0.026, wlMin: 0.988, wlMax: 1.014, R: 38 },
  { index: 14, detector: 1, subchan: 14, wavelength: 1.025, width: 0.027, wlMin: 1.012, wlMax: 1.039, R: 38 },
  { index: 15, detector: 1, subchan: 15, wavelength: 1.05, width: 0.028, wlMin: 1.036, wlMax: 1.064, R: 38 },
  { index: 16, detector: 1, subchan: 16, wavelength: 1.075, width: 0.029, wlMin: 1.061, wlMax: 1.09, R: 37 },
  { index: 17, detector: 1, subchan: 17, wavelength: 1.102, width: 0.03, wlMin: 1.086, wlMax: 1.116, R: 37 },
  { index: 18, detector: 2, subchan: 1, wavelength: 1.113, width: 0.026, wlMin: 1.099, wlMax: 1.126, R: 43 },
  { index: 19, detector: 2, subchan: 2, wavelength: 1.139, width: 0.027, wlMin: 1.125, wlMax: 1.153, R: 42 },
  { index: 20, detector: 2, subchan: 3, wavelength: 1.167, width: 0.028, wlMin: 1.152, wlMax: 1.182, R: 42 },
  { index: 21, detector: 2, subchan: 4, wavelength: 1.195, width: 0.029, wlMin: 1.18, wlMax: 1.21, R: 41 },
  { index: 22, detector: 2, subchan: 5, wavelength: 1.224, width: 0.03, wlMin: 1.209, wlMax: 1.24, R: 41 },
  { index: 23, detector: 2, subchan: 6, wavelength: 1.254, width: 0.03, wlMin: 1.238, wlMax: 1.269, R: 41 },
  { index: 24, detector: 2, subchan: 7, wavelength: 1.284, width: 0.031, wlMin: 1.267, wlMax: 1.3, R: 42 },
  { index: 25, detector: 2, subchan: 8, wavelength: 1.315, width: 0.032, wlMin: 1.298, wlMax: 1.331, R: 42 },
  { index: 26, detector: 2, subchan: 9, wavelength: 1.346, width: 0.032, wlMin: 1.329, wlMax: 1.363, R: 42 },
  { index: 27, detector: 2, subchan: 10, wavelength: 1.378, width: 0.033, wlMin: 1.36, wlMax: 1.396, R: 42 },
  { index: 28, detector: 2, subchan: 11, wavelength: 1.412, width: 0.034, wlMin: 1.393, wlMax: 1.43, R: 41 },
  { index: 29, detector: 2, subchan: 12, wavelength: 1.446, width: 0.035, wlMin: 1.426, wlMax: 1.464, R: 41 },
  { index: 30, detector: 2, subchan: 13, wavelength: 1.481, width: 0.036, wlMin: 1.461, wlMax: 1.5, R: 41 },
  { index: 31, detector: 2, subchan: 14, wavelength: 1.517, width: 0.037, wlMin: 1.496, wlMax: 1.537, R: 41 },
  { index: 32, detector: 2, subchan: 15, wavelength: 1.554, width: 0.038, wlMin: 1.533, wlMax: 1.575, R: 41 },
  { index: 33, detector: 2, subchan: 16, wavelength: 1.592, width: 0.039, wlMin: 1.57, wlMax: 1.613, R: 41 },
  { index: 34, detector: 2, subchan: 17, wavelength: 1.631, width: 0.039, wlMin: 1.608, wlMax: 1.651, R: 41 },
  { index: 35, detector: 3, subchan: 1, wavelength: 1.656, width: 0.039, wlMin: 1.636, wlMax: 1.676, R: 42 },
  { index: 36, detector: 3, subchan: 2, wavelength: 1.695, width: 0.041, wlMin: 1.675, wlMax: 1.715, R: 42 },
  { index: 37, detector: 3, subchan: 3, wavelength: 1.735, width: 0.042, wlMin: 1.714, wlMax: 1.756, R: 41 },
  { index: 38, detector: 3, subchan: 4, wavelength: 1.775, width: 0.043, wlMin: 1.754, wlMax: 1.797, R: 41 },
  { index: 39, detector: 3, subchan: 5, wavelength: 1.818, width: 0.045, wlMin: 1.795, wlMax: 1.84, R: 41 },
  { index: 40, detector: 3, subchan: 6, wavelength: 1.861, width: 0.046, wlMin: 1.838, wlMax: 1.884, R: 41 },
  { index: 41, detector: 3, subchan: 7, wavelength: 1.905, width: 0.047, wlMin: 1.881, wlMax: 1.928, R: 41 },
  { index: 42, detector: 3, subchan: 8, wavelength: 1.949, width: 0.048, wlMin: 1.925, wlMax: 1.973, R: 41 },
  { index: 43, detector: 3, subchan: 9, wavelength: 1.995, width: 0.049, wlMin: 1.97, wlMax: 2.019, R: 41 },
  { index: 44, detector: 3, subchan: 10, wavelength: 2.041, width: 0.051, wlMin: 2.015, wlMax: 2.067, R: 40 },
  { index: 45, detector: 3, subchan: 11, wavelength: 2.089, width: 0.052, wlMin: 2.062, wlMax: 2.115, R: 40 },
  { index: 46, detector: 3, subchan: 12, wavelength: 2.139, width: 0.054, wlMin: 2.111, wlMax: 2.166, R: 40 },
  { index: 47, detector: 3, subchan: 13, wavelength: 2.189, width: 0.055, wlMin: 2.16, wlMax: 2.216, R: 40 },
  { index: 48, detector: 3, subchan: 14, wavelength: 2.24, width: 0.056, wlMin: 2.211, wlMax: 2.268, R: 40 },
  { index: 49, detector: 3, subchan: 15, wavelength: 2.292, width: 0.057, wlMin: 2.262, wlMax: 2.321, R: 40 },
  { index: 50, detector: 3, subchan: 16, wavelength: 2.345, width: 0.058, wlMin: 2.314, wlMax: 2.375, R: 40 },
  { index: 51, detector: 3, subchan: 17, wavelength: 2.399, width: 0.059, wlMin: 2.367, wlMax: 2.44, R: 41 },
  { index: 52, detector: 4, subchan: 1, wavelength: 2.445, width: 0.058, wlMin: 2.422, wlMax: 2.474, R: 42 },
  { index: 53, detector: 4, subchan: 2, wavelength: 2.506, width: 0.073, wlMin: 2.47, wlMax: 2.542, R: 34 },
  { index: 54, detector: 4, subchan: 3, wavelength: 2.575, width: 0.074, wlMin: 2.538, wlMax: 2.612, R: 35 },
  { index: 55, detector: 4, subchan: 4, wavelength: 2.646, width: 0.076, wlMin: 2.607, wlMax: 2.684, R: 35 },
  { index: 56, detector: 4, subchan: 5, wavelength: 2.719, width: 0.078, wlMin: 2.678, wlMax: 2.758, R: 35 },
  { index: 57, detector: 4, subchan: 6, wavelength: 2.794, width: 0.079, wlMin: 2.752, wlMax: 2.835, R: 35 },
  { index: 58, detector: 4, subchan: 7, wavelength: 2.871, width: 0.084, wlMin: 2.828, wlMax: 2.914, R: 34 },
  { index: 59, detector: 4, subchan: 8, wavelength: 2.951, width: 0.086, wlMin: 2.906, wlMax: 2.995, R: 34 },
  { index: 60, detector: 4, subchan: 9, wavelength: 3.033, width: 0.089, wlMin: 2.985, wlMax: 3.079, R: 34 },
  { index: 61, detector: 4, subchan: 10, wavelength: 3.118, width: 0.091, wlMin: 3.069, wlMax: 3.164, R: 34 },
  { index: 62, detector: 4, subchan: 11, wavelength: 3.204, width: 0.093, wlMin: 3.155, wlMax: 3.252, R: 35 },
  { index: 63, detector: 4, subchan: 12, wavelength: 3.293, width: 0.094, wlMin: 3.242, wlMax: 3.342, R: 35 },
  { index: 64, detector: 4, subchan: 13, wavelength: 3.383, width: 0.096, wlMin: 3.33, wlMax: 3.434, R: 35 },
  { index: 65, detector: 4, subchan: 14, wavelength: 3.476, width: 0.098, wlMin: 3.422, wlMax: 3.528, R: 36 },
  { index: 66, detector: 4, subchan: 15, wavelength: 3.57, width: 0.099, wlMin: 3.514, wlMax: 3.624, R: 36 },
  { index: 67, detector: 4, subchan: 16, wavelength: 3.667, width: 0.102, wlMin: 3.61, wlMax: 3.723, R: 36 },
  { index: 68, detector: 4, subchan: 17, wavelength: 3.768, width: 0.103, wlMin: 3.707, wlMax: 3.827, R: 36 },
  { index: 69, detector: 5, subchan: 1, wavelength: 3.833, width: 0.035, wlMin: 3.8144, wlMax: 3.8514, R: 109 },
  { index: 70, detector: 5, subchan: 2, wavelength: 3.867, width: 0.036, wlMin: 3.8494, wlMax: 3.8854, R: 109 },
  { index: 71, detector: 5, subchan: 3, wavelength: 3.901, width: 0.036, wlMin: 3.8824, wlMax: 3.9194, R: 109 },
  { index: 72, detector: 5, subchan: 4, wavelength: 3.935, width: 0.036, wlMin: 3.9164, wlMax: 3.9534, R: 108 },
  { index: 73, detector: 5, subchan: 5, wavelength: 3.97, width: 0.036, wlMin: 3.9504, wlMax: 3.9884, R: 109 },
  { index: 74, detector: 5, subchan: 6, wavelength: 4.005, width: 0.036, wlMin: 3.9854, wlMax: 4.0244, R: 110 },
  { index: 75, detector: 5, subchan: 7, wavelength: 4.04, width: 0.037, wlMin: 4.0204, wlMax: 4.0594, R: 110 },
  { index: 76, detector: 5, subchan: 8, wavelength: 4.076, width: 0.037, wlMin: 4.0554, wlMax: 4.0954, R: 111 },
  { index: 77, detector: 5, subchan: 9, wavelength: 4.112, width: 0.037, wlMin: 4.0914, wlMax: 4.1314, R: 112 },
  { index: 78, detector: 5, subchan: 10, wavelength: 4.148, width: 0.037, wlMin: 4.1264, wlMax: 4.1674, R: 113 },
  { index: 79, detector: 5, subchan: 11, wavelength: 4.184, width: 0.037, wlMin: 4.1624, wlMax: 4.2034, R: 113 },
  { index: 80, detector: 5, subchan: 12, wavelength: 4.22, width: 0.037, wlMin: 4.1994, wlMax: 4.2404, R: 115 },
  { index: 81, detector: 5, subchan: 13, wavelength: 4.257, width: 0.037, wlMin: 4.2354, wlMax: 4.2774, R: 114 },
  { index: 82, detector: 5, subchan: 14, wavelength: 4.294, width: 0.037, wlMin: 4.2714, wlMax: 4.3134, R: 115 },
  { index: 83, detector: 5, subchan: 15, wavelength: 4.331, width: 0.037, wlMin: 4.3084, wlMax: 4.3514, R: 116 },
  { index: 84, detector: 5, subchan: 16, wavelength: 4.368, width: 0.038, wlMin: 4.3454, wlMax: 4.3884, R: 116 },
  { index: 85, detector: 5, subchan: 17, wavelength: 4.405, width: 0.038, wlMin: 4.3824, wlMax: 4.4264, R: 117 },
  { index: 86, detector: 6, subchan: 1, wavelength: 4.435, width: 0.035, wlMin: 4.4184, wlMax: 4.4524, R: 128 },
  { index: 87, detector: 6, subchan: 2, wavelength: 4.467, width: 0.036, wlMin: 4.4504, wlMax: 4.4844, R: 125 },
  { index: 88, detector: 6, subchan: 3, wavelength: 4.5, width: 0.035, wlMin: 4.4824, wlMax: 4.5174, R: 127 },
  { index: 89, detector: 6, subchan: 4, wavelength: 4.533, width: 0.036, wlMin: 4.5154, wlMax: 4.5504, R: 126 },
  { index: 90, detector: 6, subchan: 5, wavelength: 4.566, width: 0.036, wlMin: 4.5484, wlMax: 4.5844, R: 127 },
  { index: 91, detector: 6, subchan: 6, wavelength: 4.6, width: 0.037, wlMin: 4.5824, wlMax: 4.6184, R: 125 },
  { index: 92, detector: 6, subchan: 7, wavelength: 4.635, width: 0.036, wlMin: 4.6154, wlMax: 4.6534, R: 127 },
  { index: 93, detector: 6, subchan: 8, wavelength: 4.669, width: 0.037, wlMin: 4.6494, wlMax: 4.6884, R: 126 },
  { index: 94, detector: 6, subchan: 9, wavelength: 4.704, width: 0.037, wlMin: 4.6844, wlMax: 4.7234, R: 128 },
  { index: 95, detector: 6, subchan: 10, wavelength: 4.739, width: 0.037, wlMin: 4.7194, wlMax: 4.7584, R: 130 },
  { index: 96, detector: 6, subchan: 11, wavelength: 4.773, width: 0.036, wlMin: 4.7534, wlMax: 4.7924, R: 131 },
  { index: 97, detector: 6, subchan: 12, wavelength: 4.808, width: 0.036, wlMin: 4.7884, wlMax: 4.8274, R: 132 },
  { index: 98, detector: 6, subchan: 13, wavelength: 4.843, width: 0.037, wlMin: 4.8224, wlMax: 4.8624, R: 131 },
  { index: 99, detector: 6, subchan: 14, wavelength: 4.879, width: 0.038, wlMin: 4.8574, wlMax: 4.8994, R: 130 },
  { index: 100, detector: 6, subchan: 15, wavelength: 4.915, width: 0.038, wlMin: 4.8934, wlMax: 4.9364, R: 130 },
  { index: 101, detector: 6, subchan: 16, wavelength: 4.951, width: 0.037, wlMin: 4.9304, wlMax: 4.9724, R: 132 },
  { index: 102, detector: 6, subchan: 17, wavelength: 4.988, width: 0.037, wlMin: 4.9664, wlMax: 5.0094, R: 135 },
];
export interface Band extends BandDefinition {
  /** Short label such as "D3-10". */
  label: string;
  color: string;
}

export const BANDS: ReadonlyArray<Band> = SEEDS.map((seed) => ({
  ...seed,
  label: `${ARRAY_LABELS[seed.detector - 1]}-${String(seed.subchan).padStart(2, '0')}`,
  color: ARRAY_COLORS[seed.detector - 1],
}));

export function bandAt(index: number): Band {
  const clamped = Math.min(BAND_COUNT, Math.max(1, Math.round(index)));
  return BANDS[clamped - 1];
}

export function bandsForArray(detector: number): Band[] {
  return BANDS.filter((band) => band.detector === detector);
}

export function arrayOfBand(index: number): number {
  return bandAt(index).detector;
}

export function bandIndicesForArray(detector: number): number[] {
  const start = (detector - 1) * BANDS_PER_ARRAY;
  return Array.from({ length: BANDS_PER_ARRAY }, (_, position) => start + position + 1);
}

export function allBandIndices(): number[] {
  return Array.from({ length: BAND_COUNT }, (_, position) => position + 1);
}

/** Global channel index for a (detector, subchan) pair. */
export function bandIndex(detector: number, subchan: number): number {
  return (detector - 1) * BANDS_PER_ARRAY + subchan;
}

/** Nearest channel to a wavelength in micrometres (logarithmic distance). */
export function nearestBand(wavelength: number): Band {
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

/** Human readable band label: "D3 · 1.636–2.440 µm". */
export function arrayLabel(detector: number): string {
  const [low, high] = BAND_RANGES[detector - 1];
  return `${ARRAY_LABELS[detector - 1]} · ${low.toFixed(3)}–${high.toFixed(3)} µm`;
}

export interface MolecularMarker {
  id: string;
  label: string;
  wavelength: number;
  color: string;
  note: string;
}

/**
 * Molecular / mineral features used by the band scrubbing UI.
 * Wavelengths are vacuum/air averages used in the literature.
 */
export const MOLECULAR_MARKERS: ReadonlyArray<MolecularMarker> = [
  { id: 'h2o-1.13', label: 'H₂O', wavelength: 1.13, color: '#38bdf8', note: 'Water vapour absorption — strong in M dwarfs and T dwarfs.' },
  { id: 'h2o-1.4', label: 'H₂O', wavelength: 1.4, color: '#38bdf8', note: 'Deep water band; suppresses flux in L/T transition objects.' },
  { id: 'h2o-1.9', label: 'H₂O', wavelength: 1.87, color: '#38bdf8', note: 'Water ice absorption — traces cold circumstellar material.' },
  { id: 'co-1.56', label: 'CO', wavelength: 1.56, color: '#f59e0b', note: 'First overtone of carbon monoxide — shocks and warm disks.' },
  { id: 'ch4-1.65', label: 'CH₄', wavelength: 1.65, color: '#a78bfa', note: 'Methane absorption — hallmark of T and Y brown dwarfs.' },
  { id: 'co2-2.0', label: 'CO₂', wavelength: 2.0, color: '#fb7185', note: 'Carbon dioxide combination band.' },
  { id: 'co-2.3', label: 'CO', wavelength: 2.3, color: '#f59e0b', note: 'CO bandhead — strong in young stars and AGB envelopes.' },
  { id: 'h2o-2.7', label: 'H₂O', wavelength: 2.7, color: '#38bdf8', note: 'Water stretch overtone; also affected by telluric residuals.' },
  { id: 'co2-4.26', label: 'CO₂', wavelength: 4.26, color: '#fb7185', note: 'Fundamental CO₂ band — probes warm molecular gas.' },
  { id: 'co-4.6', label: 'CO', wavelength: 4.6, color: '#f59e0b', note: 'Fundamental CO band — disk and outflow tracer.' },
  { id: 'pah-3.3', label: 'PAH', wavelength: 3.3, color: '#34d399', note: 'Polycyclic aromatic hydrocarbon emission — star-forming regions.' },
  { id: 'h2o-3.0', label: 'H₂O ice', wavelength: 3.05, color: '#22d3ee', note: 'Water-ice absorption at 3.05 µm — icy grains in disks.' },
];

export function markersInRange(low: number, high: number): MolecularMarker[] {
  return MOLECULAR_MARKERS.filter(
    (marker) => marker.wavelength >= low && marker.wavelength <= high,
  );
}
