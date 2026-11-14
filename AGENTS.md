# SPHEREx Sky Explorer — Agent Instructions (NASA Space Apps Challenge)

## 1. Architecture: Real Archive Data Only (CRITICAL)

This project works exclusively with real SPHEREx data. There is no synthetic scene,
no preview engine and no generated fallback imagery anywhere in the codebase.

- **Backend (`backend/`, FastAPI + astropy + numpy)** — mandatory. It
  - discovers products through IRSA SIA2 (`spherex_dr1`, `spherex_qr3`, …),
  - reads Level-2 FITS planes lazily over HTTP Range requests (62 MB products, ~2 MB per cutout),
  - resamples every epoch onto a common SIP-aware sky grid,
  - decodes the FLAGS bitmask, the VARIANCE plane and the `WAVE-TAB` wavelength table,
  - extracts the real 102-channel spectrum (6 detectors × 17 channels) and queries Gaia TAP, IRSA TAP (WISE) and CADC TAP (NEOSSat),
  - keeps a **5 GB disk cache** (`backend/cache/`) with least-recently-used eviction.
  Current deployment target: the user's own PC (`uvicorn main:app --port 8787`).
- **Frontend (`frontend/`)** — receives compact float planes from the backend and keeps
  only the interactive math in `imageMath.worker.ts` (stretch, co-add, difference,
  flag overlay, peak finding, pixel probes). No archival parsing in the browser.
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
  - Blink Comparator Viewport: Plays the real available epochs (Play/Pause, FPS slider, Ping-Pong loop, manual epoch scrubber).
  - Image Arithmetic (Worker): Blink (raw epochs), Co-Add (sum/average), Difference (Epoch B − Epoch A) and Before/After compare (draggable divider between any two epochs) on backend-resampled real frames.
    In compare mode both halves share one p1/p99 brightness scale by default (so a real flux change stays visible across the seam); the panel can switch to per-frame normalization. The divider position is view state only and stays out of the URL.
  - 6 Detector Arrays: D1–D6 (0.75–5.0 µm) plus an "all arrays" stack; the band slider drives the 102-channel spectrum selection.
  - On-the-Fly Spectrum: clicking the sky extracts the real 102-channel spectrum from the six WAVE-TAB calibrated detector planes.
  - Overlays: real Gaia DR3 (proper-motion vectors), WISE detections and CSA NEOSSat frame footprints (CADC `s_region` polygons, exposure windows, `target_moving` flag) queried by the backend. NEOSSat is a locator layer: no pixel data, no invented tracks — a path is drawn only for objects CADC flags as moving.
  - Metadata: real MJD, exposure, detector, pixel value in MJy/sr and the FLAGS bitmask.
  - URL State Sync: Sync ra, dec, fov, target, mode, and band with URL query parameters for easy embedding.
- Page 3: Documentation (/docs):
  - Full bilingual (EN/UA) interactive documentation covering:
    1. Capabilities & Scientific Tools (Blink, Difference Imaging, 6-Detector Co-adding, 102-Band Spectroscopy).
    2. Data Sources & Archive Pipelines (NASA/IPAC IRSA, WISE/NEOWISE, ESA Gaia DR3, CSA CADC NEOSSat).
    3. User Guide & Walkthroughs for the 5 test targets (Barnard's Star, Epsilon Indi B, WISE 0855, RW Aurigae, R Draconis).
    4. URL Query & Iframe Embed API Documentation with copyable code snippets.

## 3. UI Style

Follow .opencode/skills/opencode-ui/SKILL.md strictly (OpenCode website aesthetic: dark carbon #09090b, 1px #27272a borders, monospace typography, sharp corners, space background).

## 4. Git & GitHub Workflow (MANDATORY)

Remote repository: https://github.com/xto-ia/SPHEREx-explorer.git

1. Ensure remote origin is set to https://github.com/xto-ia/SPHEREx-explorer.git.
2. After completing each milestone, verify npm run build passes with zero TypeScript errors.
3. Stage, commit, and push every milestone immediately:
   - git add .
   - git commit -m "feat(module): description"
   - git push -u origin main

- Refer to `CHALLENGE.md` in the project root for the verbatim NASA Space Apps problem statement, target coordinates, and partner resource descriptions.
