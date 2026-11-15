# SPHEREx Explorer API

FastAPI service that turns public SPHEREx archives into data the browser can draw.
It is required: the browser never parses FITS files, and IRSA/TAP endpoints do not
send CORS headers.

## What it does

| Endpoint | Purpose |
| --- | --- |
| `GET /api/health` | liveness + cache statistics |
| `GET /api/coverage?ra&dec&fov` | SIA2 discovery, visits grouped into epochs |
| `GET /api/frame?ra&dec&fov&epoch&detector` | resampled plane (`SPXF` binary: image, coverage, optional flags) |
| `GET /api/epochs?ra&dec&fov&detector` | epochs that actually contain one detector |
| `GET /api/detectors?ra&dec&fov&epoch` | detectors present in one epoch |
| `GET /api/spectrum?ra&dec&fov&epoch` | real 102-channel spectrum (6 arrays × 17 channels) |
| `GET /api/overlays?ra&dec&fov&layers` | Gaia DR3, WISE and CSA NEOSSat catalogue rows; `layers` is a comma list (`gaia,wise,neossat`) so fast archives are not blocked by the slow one |
| `GET /api/random-field?fov` | a random point that is verified as covered |

Pipeline: IRSA SIA2 → AWS Open Data FITS (HTTP Range, ~2 MB per cutout) → astropy
WCS/SIP resampling onto one 480 × 480 tangent-plane grid → FLAGS/VARIANCE/WAVE-TAB
decoding → compact binary planes to the browser.

Overlays come from three archives, each queried concurrently and allowed to fail on
its own:

| Layer | Archive | Rows |
| --- | --- | --- |
| `gaia` | ESA Gaia TAP (`gaiadr3.gaia_source`) | positions, parallax, proper motions |
| `wise` | IRSA TAP (`allwise_p3as_psd`) | W1–W4 magnitudes |
| `neossat` | CADC TAP (`ivoa.ObsCore` + `caom2.Observation`) | real footprint polygon, exposure window, `target_moving` |

Every layer also returns a `meta` block (`returned`, `total`, `truncated`,
`magLimit`). Gaia is queried by the frame's bounding box (a circle over-fetches
by 2.4×, and Gaia rejects POLYGON), ordered by `phot_g_mean_mag`, and capped at
2 500 sources, so the badge reads "2 500 of 19 852 · G ≤ 17.5" rather than a
bare 400. NEOSSat is capped at 240 footprints and reports the true number of
distinct frames the same way. A layer whose archive cannot be reached answers
with `errors` ("wise: timeout") — never with a silent zero.

CADC moved its TAP service to `/argus/sync` and answers in VOTable only
(`FORMAT=json` is rejected), so every TAP query goes through `app/tap.py`, which
also raises on `QUERY_STATUS=ERROR` instead of returning zero rows. NEOSSat is a
locator layer: no NEOSSat pixels are downloaded and no track is invented — a
polyline is drawn only when CADC's `target_moving` flag is true and at least two
frames of that target fall in the field.

## Run

```bash
cd backend
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements.txt     # Windows
# source .venv/bin/activate && pip install -r requirements.txt   # macOS / Linux
uvicorn main:app --host 127.0.0.1 --port 8787
```

On Windows the repository's `start-local.cmd` starts this API together with the
Vite dev server.

## Configuration

| Variable | Default | Meaning |
| --- | --- | --- |
| `SPHEREX_CACHE_DIR` | `backend/cache` | where decoded planes are cached |
| `SPHEREX_CACHE_BYTES` | `5368709120` (5 GB) | cache budget, least-recently-used eviction |
| `SPHEREX_CORS_ORIGINS` | loopback ports 5173/4173/4183 | explicit allowed origins |
| `SPHEREX_CORS_ORIGIN_REGEX` | any loopback origin | lets Vite fall back to 5174, 5175, … |
| `SPHEREX_UPSTREAM_TIMEOUT` | `120` | seconds per archive request |

## Notes

- The first spectrum for a field reads the full detector planes (~100 MB of
  Range reads, 20–60 s); the result is cached afterwards.
- `FLAGS` is a compressed bitmask, so flag overlays are requested separately and
  cached per window.
- Native sampling is 6.15″/pixel, so small fields are upscaled rather than
  resampled from finer data.
- Fields outside the current DR1/QR3 footprint return `covered: false`; the UI
  reports that instead of drawing anything.
- Overlay latency is dominated by IRSA WISE (a full all-sky `allwise_p3as_psd`
  cone scan, 20–40 s cold); Gaia and NEOSSat answer in a few seconds. That is why
  the frontend requests `layers=gaia,neossat` and `layers=wise` separately and
  merges the replies. All three layers are cached for 6 hours.
- The NEOSSat layer is capped at 240 frames per field (`MAX_OBSERVATIONS`); a
  single square degree can hold hundreds of exposures of the same target.