# SPHEREx Sky Explorer

A public-facing explorer for NASA's **SPHEREx** near-infrared all-sky survey.
Point it at any patch of sky, blink through the real multi-epoch archive frames,
co-add or subtract them to expose moving objects and variables, and extract the
real near-infrared spectrum of anything you click.

Built for the **NASA Space Apps Challenge**.

![stack](https://img.shields.io/badge/React-18-09090b?style=flat-square)
![stack](https://img.shields.io/badge/TypeScript-5-09090b?style=flat-square)
![stack](https://img.shields.io/badge/FastAPI-astropy-09090b?style=flat-square)
![stack](https://img.shields.io/badge/Three.js-WebGL-09090b?style=flat-square)

---

## Real archive data only

There is **no synthetic scene and no generated fallback imagery**.

- **Backend (`backend/`, FastAPI + astropy + numpy)** — required. It
  - discovers products through IRSA SIA2 (`spherex_dr1`, `spherex_qr3`, deep fields),
  - reads Level-2 FITS planes lazily over HTTP Range requests (62 MB products,
    ~2 MB per cutout),
  - resamples every epoch onto a common SIP-aware 480 × 480 sky grid,
  - decodes the `FLAGS` bitmask, the `VARIANCE` plane and the `WAVE-TAB`
    wavelength table,
  - carries the **official per-pixel channel index** from the IRSA
    `spectral_channels` calibration product and the authoritative 102-channel
    table (centres, edges, resolving power, bandwidth),
  - builds spectra by **multi-visit aperture photometry** (one spectral image per
    visit, 2×FWHM aperture, local annulus background, VARIANCE-based errors,
    flux in µJy),
  - queries Gaia DR3 TAP, IRSA TAP (WISE) and CADC TAP (NEOSSat),
  - keeps a **5 GB disk cache** (`backend/cache/`) with LRU eviction.
- **Frontend (`frontend/`, React + Vite + TypeScript)** — receives compact float
  planes and keeps only interactive math in `imageMath.worker.ts` (stretch,
  co-add, difference, channel masking, flags, peak finding, probes). No
  archival parsing in the browser.
- **Honesty rule:** a field, epoch, detector or channel without a product is
  reported as such (`NO COVERAGE`, `EPOCHS NOT LOADED`, “local archive service is
  offline”). Invented pixels are never drawn.
- Random fields are checked against the archive before they are offered;
  `/api/random-field` returns only covered points.

## Workspace modes

The workspace has two surfaces over the **same real data and the same worker
math**, selected with `?ui=simple|advanced` and remembered in `localStorage`:

- **Simple** (default) — arrays, blink/co-add/difference/before-after, overlays,
  movers scan and spectra. It hides channel isolation, mask/native toggles,
  molecular markers and percentile statistics, and asks before starting the
  expensive multi-visit spectrum build.
- **Advanced** — everything above plus the official 17 channels per detector,
  channel masking, native-resolution/mask controls, molecular markers and full
  per-pixel metadata (σ from VARIANCE, channel, wavelength, flags).

## Features

- **Blink comparator** — real available epochs, play/pause, 0.5–10 FPS,
  ping-pong, scrubber and timeline.
- **Image arithmetic** — sum/average co-add, epoch B − A difference, and a
  draggable **Before / After** wipe with a shared or per-frame brightness scale.
- **Detector arrays & channels** — D1–D6 with official edges; a Level-2 frame is
  a spectral image, so the Channels tab isolates one official channel by masking
  every pixel assigned elsewhere. The Arrays tab shows the full spectral image.
  A **Quick look** explicitly labels the mean of the six detector planes as a
  navigation aid, never a measurement.
- **Movers & transients scan** — 6σ peak finder on the cleaned difference with
  cosmic-ray / saturation / hot-pixel rejection.
- **Multi-visit spectra** — click the sky, then build the real spectrum from all
  visits covering the position; CSV export included.
- **Overlays** — real Gaia proper motions, WISE detections and CSA NEOSSat
  footprints from CADC (`s_region`, exposure windows, `target_moving`).
- **Metadata** — MJD, exposure, detector, MJy/sr, σ, channel, wavelength and the
  decoded FLAGS bitmask.
- **Bilingual EN / UA**, URL/iframe state, 3D spacecraft viewer.

## API

| Endpoint | Purpose |
| --- | --- |
| `GET /api/health` | liveness + cache statistics |
| `GET /api/coverage?ra&dec&fov` | SIA2 discovery, visits grouped into epochs |
| `GET /api/frame?ra&dec&fov&epoch&detector&shape&flags&variance` | resampled `SPXF` planes |
| `GET /api/bands` | authoritative 102-channel table |
| `GET /api/epochs?ra&dec&fov&detector` | epochs containing one detector |
| `GET /api/detectors?ra&dec&fov&epoch` | detectors present in one epoch |
| `GET /api/spectrum?ra&dec&fov&max_products` | multi-visit spectrum |
| `GET /api/overlays?ra&dec&fov&layers` | Gaia, WISE, NEOSSat rows |
| `GET /api/random-field?fov` | random point verified as covered |

Pipeline: IRSA SIA2 → AWS Open Data FITS (HTTP Range) → astropy WCS/SIP
resampling → FLAGS/VARIANCE/WAVE-TAB decoding → compact binary planes to the
browser.

## Run

```bat
start-local.cmd
```

starts the API at `http://127.0.0.1:8787` and Vite at
`http://127.0.0.1:5173` (flags: `--no-open`, `--backend-only`,
`--frontend-only`, `--install`, `--api-port N`, `--port N`).

Manual:

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
npm run build
```

Set `VITE_API_BASE` in `frontend/.env` when the API uses another port.

## Notes and limitations

- SIA2 is partial-sky; fields without a product say so.
- Difference imaging is not a full PSF-matched subtraction; smoothing and
  static-source masking suppress most sampling residuals, but bright stars can
  leave halos.
- A spectrum is aperture photometry, not a Tractor PSF fit; crowded fields show
  blended flux, and a complete 102-channel spectrum needs visits that cover
  every channel.
- `FLAGS` bits 12 (`FULLSAMPLE`) and 21 (`SOURCE`) are nominal, not
  contamination.
- The cache is local; clear `backend/cache/` to reclaim space.

## Licence

MIT. SPHEREx is a NASA Astrophysics Explorer mission. Data acknowledgements:
NASA/IPAC IRSA, CDS, ESA Gaia, CSA NEOSSat/CADC.
