# SPHEREx Sky Explorer — Agent Instructions (NASA Space Apps Challenge)

## 1. Architecture: Real Archive Data Only (CRITICAL)

This project works exclusively with real SPHEREx data. There is no synthetic scene,
no preview engine and no generated fallback imagery anywhere in the codebase.

- **Backend (`backend/`, FastAPI + astropy + numpy)** — mandatory. It
  - discovers products through IRSA SIA2 (`spherex_dr1`, `spherex_qr3`, …),
  - reads Level-2 FITS planes lazily over HTTP Range requests (62 MB products, ~2 MB per cutout),
  - resamples every epoch onto a common SIP-aware sky grid,
  - decodes the FLAGS bitmask, the VARIANCE plane and the `WAVE-TAB` wavelength table,
  - carries the **official** per-pixel channel index from the IRSA `spectral_channels`
    calibration product (0–18) and the authoritative 102-channel table
    (centre, edges, R, bandwidth) — never an even split of a band,
  - builds real spectra by **multi-visit aperture photometry**: one spectral image per
    visit, 2×FWHM aperture, local annulus background, VARIANCE-based errors, flux in µJy,
    and queries Gaia TAP, IRSA TAP (WISE) and CADC TAP (NEOSSat),
  - keeps a **5 GB disk cache** (`backend/cache/`) with least-recently-used eviction.
  Current deployment target: the user's own PC (`uvicorn main:app --port 8787`).
- **Frontend (`frontend/`)** — receives compact float planes from the backend and keeps
  only the interactive math in `imageMath.worker.ts` (stretch, co-add, difference,
  flag overlay, channel masking, peak finding, pixel probes). No archival parsing in the browser.
- **Honesty rule:** when a field, epoch or detector has no product, or the archive is
  unreachable, the UI says so ("NO COVERAGE", "EPOCHS NOT LOADED"). It must never draw
  invented pixels.
- Random fields are checked against the archive before they are offered
  (`/api/random-field` returns only covered points).

## 2. Application Structure (3 Pages + Global Header)

- Global Header (Navbar.tsx):
  - Present on all pages.
  - Navigation links: Explorer (/), Workspace (/workspace), Documentation (/docs).
  - Language Switcher ([ EN | UA ]): Default language is English (en), secondary is Ukrainian (uk). Persist selection in localStorage. All UI labels, tooltips, mission descriptions, and documentation must support both languages via translations.ts.
- Page 1: Landing Page (/):
  - Left Column: Coordinate input (Right Ascension & Declination in HMS/DMS or decimal degrees), Field of View (FoV) selector, and a "Random point" button that only offers points verified as covered by the archive. Clicking "Search Sky Data" navigates to /workspace?ra=...&dec=...&fov=...
  - Right Column: Interactive 3D satellite viewer (SpherexModelCanvas.tsx) rendering /models/spherex.glb over a cosmic starfield. Must use top-of-file configuration constants (MODEL_CONFIG) for initial tilt angles and slow axial rotation around the spacecraft's central symmetry axis.
  - Bottom Section: Overview of the SPHEREx mission (102 near-IR bands, 6-month all-sky survey) and NASA Space Apps Challenge context.
- Page 2: Analysis Workspace (/workspace):
  - Two UI modes over the same real data (`?ui=simple|advanced`, simple by default, remembered in localStorage). Simple hides the instrument controls (channel isolation, mask/native toggles, molecular markers, percentile stats) and asks before starting a spectrum scan; Advanced exposes the full instrument view. Both share the same worker math, overlays, movers scan and multi-visit spectrum.
  - Blink Comparator Viewport: Plays the real available epochs (Play/Pause, FPS slider, Ping-Pong loop, manual epoch scrubber).
  - Image Arithmetic (Worker): Blink (raw epochs), Co-Add (sum/average), Difference (Epoch B − Epoch A) and Before/After compare (draggable divider between any two epochs) on backend-resampled real frames.
    In compare mode both halves share one p1/p99 brightness scale by default (so a real flux change stays visible across the seam); the panel can switch to per-frame normalization. The divider position is view state only and stays out of the URL.
  - Detector Arrays & Channels: D1–D6 with the official band edges (0.743–1.116, 1.099–1.651, 1.636–2.440, 2.422–3.827, 3.814–4.426, 4.418–5.009 µm). A Level-2 frame is a *spectral image* (one wavelength per pixel), so the "Channels" tab isolates one of the 17 official channels of the active detector by masking every pixel the mission assigns elsewhere; the "Arrays" tab shows the whole spectral image. Channels that do not fall inside the current cutout are flagged, with a button that widens the field to 3.6°.
  - Quick look: an explicitly labelled mean of the six detector planes (it mixes wavelengths) kept as a navigation aid, never presented as a measurement.
  - On-the-Fly Spectrum: a click runs multi-visit aperture photometry — one spectral image per visit, 2×FWHM aperture, local annulus background, VARIANCE-based errors — and plots flux (µJy) against the channel wavelength, with the selected channel marked by a vertical guide and its value.
  - Overlays: real Gaia DR3 (proper-motion vectors), WISE detections and CSA NEOSSat frame footprints (CADC `s_region` polygons, exposure windows, `target_moving` flag) queried by the backend. NEOSSat is a locator layer: no pixel data, no invented tracks — a path is drawn only for objects CADC flags as moving.
  - Metadata: real MJD, exposure, detector, pixel value in MJy/sr with σ from VARIANCE, the per-pixel channel and wavelength, and the FLAGS bitmask.
  - URL State Sync: Sync ra, dec, fov, target, mode, band/array, mask and the rest with URL query parameters for easy embedding.
- Page 3: Documentation (/docs):
  - Full bilingual (EN/UA) interactive documentation covering:
    1. Capabilities & Scientific Tools (Blink, Difference Imaging, official channel isolation, multi-visit spectroscopy).
    2. Two workspace modes (Simple vs Advanced): what each shows, what it hides, who it is for, and a feature-availability table.
    3. Data Sources & Archive Pipelines (NASA/IPAC IRSA, WISE/NEOWISE, ESA Gaia DR3, CSA CADC NEOSSat).
    4. User Guide & Walkthroughs for the 5 test targets (Barnard's Star, Epsilon Indi B, WISE 0855, RW Aurigae, R Draconis).
    5. URL Query & Iframe Embed API Documentation with copyable code snippets.

## 3. UI Style

Follow .opencode/skills/opencode-ui/SKILL.md strictly (OpenCode website aesthetic: dark carbon #09090b, 1px #27272a borders, monospace typography, sharp corners, space background).

Brand assets live in `frontend/public/brand/` (`spherex-explorer-logo.svg`,
`spherex-explorer-logo-mono.svg`, `spherex-explorer-logo-1024.png`); `frontend/public/favicon.svg`
is the small-size variant of the same mark. The mark is drawn **without** a surrounding
square frame — in the header it sits directly on the canvas next to the SPHEREx wordmark.

## 4. Git & GitHub Workflow (MANDATORY)

Remote repository: https://github.com/xto-ia/SPHEREx-explorer.git

1. Ensure remote origin is set to https://github.com/xto-ia/SPHEREx-explorer.git.
2. After completing each milestone, verify npm run build passes with zero TypeScript errors.
3. Stage, commit, and push every milestone immediately:
   - git add .
   - git commit -m "feat(module): description"
   - git push -u origin main

- Refer to `CHALLENGE.md` in the project root for the verbatim NASA Space Apps problem statement, target coordinates, and partner resource descriptions.
