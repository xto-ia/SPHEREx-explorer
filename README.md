# SPHEREx Sky Explorer

A public-facing explorer for NASA's **SPHEREx** near-infrared all-sky survey.
Point it at any patch of sky, blink through the real multi-epoch archive frames,
co-add or subtract them to expose moving objects and variables, stack the six
detector arrays, and extract the real 102-channel spectrum of anything you click.

Built for the **NASA Space Apps Challenge**.

![stack](https://img.shields.io/badge/React-18-09090b?style=flat-square)
![stack](https://img.shields.io/badge/TypeScript-5-09090b?style=flat-square)
![stack](https://img.shields.io/badge/FastAPI-astropy-09090b?style=flat-square)
![stack](https://img.shields.io/badge/Three.js-WebGL-09090b?style=flat-square)

---

## Architecture: real archive data only

There is **no synthetic scene and no generated fallback imagery**.

- **Backend (`backend/`, FastAPI + astropy + numpy)** — required. It
  - discovers products through IRSA SIA2 (`spherex_dr1`, `spherex_qr3`, …),
  - reads Level-2 FITS planes lazily over HTTP Range requests (62 MB products,
    ~2 MB per cutout),
  - resamples every epoch onto a common SIP-aware 480 × 480 sky grid,
  - decodes the `FLAGS` bitmask, the `VARIANCE` plane and the `WAVE-TAB`
    wavelength table,
  - extracts the real 102-channel spectrum (6 detectors × 17 channels) and
    queries Gaia TAP, IRSA TAP (WISE) and CADC TAP (NEOSSat),
  - keeps a **5 GB disk cache** (`backend/cache/`) with LRU eviction.
  Current deployment target: the user's own PC
  (`uvicorn main:app --port 8787`).
- **Frontend (`frontend/`, React + Vite + TypeScript)** — receives compact float
  planes from the backend and keeps only the interactive math in
  `imageMath.worker.ts` (stretch, co-add, difference, flag overlay, peak
  finding, pixel probes). No archival parsing in the browser.
- **Honesty rule:** if a field, epoch or detector has no product — or the
  archive is unreachable — the UI says so (`NO COVERAGE`, `EPOCHS NOT LOADED`,
  “local archive service is offline”). It never draws invented pixels.
- Random fields are checked against the archive before they are offered;
  `/api/random-field` returns only covered points.

## Why

Since May 2025, SPHEREx has been mapping the entire sky every six months in 102
narrow near-infrared bands. Objects reveal themselves by moving between visits —
but nobody can sift through a billion sources by hand. This explorer turns a sky
patch into something any volunteer can read from a laptop.

Five official NASA test targets ship pre-loaded:

| Target | RA (J2000) | Dec (J2000) | What it exercises |
| --- | --- | --- | --- |
| Barnard's Star | 17h57m48.498s | +04°41′36.11″ | Fast proper motion (10.3″/yr) |
| Epsilon Indi B | 22h04m10.50s | −56°46′58.0″ | Resolved brown-dwarf binary |
| WISE 0855 | 08h55m10.831s | −07°14′42.53″ | Extremely cold Y dwarf, far-IR only |
| RW Aurigae | 05h07m49.56s | +30°24′05.1″ | Dust occultation variability |
| R Draconis | 16h32m40.23s | +66°45′17.9″ | Mira pulsation, H₂O / CO₂ bands |

## Features

- **Blink comparator** — play/pause, 0.5–10 FPS, ping-pong loop, real epoch
  scrubber and timeline; only epochs that actually contain the active detector
  are offered.
- **Image arithmetic** — sum/average co-add of the real epochs, or epoch B −
  epoch A after background subtraction, smoothing and static-source masking, so
  movers and variables stand out from PSF-sampling residuals.
- **6 detector arrays / 102 bands** — the image shows the 17-channel stack of
  the active detector; the 102-channel slider selects the spectrum channel.
  “All arrays” stacks every available detector of the epoch.
- **Movers & transients scan** — a 6σ peak finder on the cleaned difference,
  with cosmic-ray, saturation and hot-pixel rejection; click a candidate to
  centre the aperture and fetch its spectrum.
- **On-the-fly spectra** — a click extracts the real 102-channel spectrum from
  the six WAVE-TAB calibrated detector planes, with per-channel pixel counts,
  CSV export and aperture/MJD metadata.
- **Overlays** — real Gaia DR3 proper motions, WISE/NEOWISE detections and CSA
  NEOSSat frame footprints from CADC (`s_region` polygons, exposure windows,
  moving-object flag). NEOSSat is a locator layer: no NEOSSat pixels are shown
  and no track is invented.
- **Metadata** — real MJD, exposure, detector, surface brightness in MJy/sr and
  the decoded `FLAGS` bitmask (transient, overflow, non-functional, dichroic,
  persistence, crosstalk, ghost, streak, bloom, halo, source/nominal bits, …).
- **URL / iframe API** — coordinates, FoV, mode, band, epoch, stretch, overlays
  and more are addressable; see `/docs`.
- **Bilingual EN / UA** — persisted in `localStorage`, default English.
- **3D spacecraft** — GLB rig with tunable Euler angles, axial spin, pointer
  parallax and a copyable `MODEL_CONFIG` (dev rig via `?rig=1`).

## API

| Endpoint | Purpose |
| --- | --- |
| `GET /api/health` | liveness + cache statistics |
| `GET /api/coverage?ra&dec&fov` | SIA2 discovery, visits grouped into epochs |
| `GET /api/frame?ra&dec&fov&epoch&detector&shape&flags` | resampled `SPXF` plane (image, coverage, optional flags) |
| `GET /api/epochs?ra&dec&fov&detector` | epochs containing that detector |
| `GET /api/detectors?ra&dec&fov&epoch` | detectors present in one epoch |
| `GET /api/spectrum?ra&dec&fov&epoch` | real 102-channel spectrum |
| `GET /api/overlays?ra&dec&fov&layers` | Gaia, WISE, NEOSSat rows |
| `GET /api/random-field?fov` | random point verified as covered |

Pipeline: IRSA SIA2 → AWS Open Data FITS (HTTP Range) → astropy WCS/SIP
resampling → FLAGS/VARIANCE/WAVE-TAB decoding → compact binary planes to the
browser. Every frame is a real archival product; the collection, MJD, detector
and pixel values are shown in the workspace.

## Run

The repository ships a Windows launcher that starts both halves:

```bat
start-local.cmd
```

It starts the API on `http://127.0.0.1:8787` and Vite on
`http://127.0.0.1:5173`, opening the browser. Useful flags:
`--no-open`, `--backend-only`, `--frontend-only`, `--install`,
`--api-port N`, `--port N`.

Manual start:

```bash
cd backend
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements.txt     # Windows
# source .venv/bin/activate && pip install -r requirements.txt   # macOS/Linux
uvicorn main:app --host 127.0.0.1 --port 8787
```

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production bundle
```

Set `VITE_API_BASE` (frontend `.env`) if the API runs on another port; the
backend already accepts any loopback origin for CORS.

## Notes and limitations

- SIA2 is partial-sky; a field without a product honestly reports no coverage.
- The difference is computed on real, independently sampled epochs. Smoothing
  and static-source masking suppress most PSF-sampling residuals, but this is
  not a full PSF-matched difference; very bright stars can still leave halos.
- The 15″ aperture spectrum is aperture photometry from the WAVE-TAB planes, not
  a Tractor PSF fit; crowded fields therefore show blended flux.
- `FLAGS` bit 12 (`FULLSAMPLE`) and bit 21 (`SOURCE`) are nominal and are not
  counted as contamination.
- The cache is local; clear `backend/cache/` to reclaim space.

## Licence

MIT. SPHEREx is a NASA Astrophysics Explorer mission. Data acknowledgements:
NASA/IPAC IRSA, CDS, ESA Gaia, CSA NEOSSat/CADC.
