---
name: astro-engine
description: Real archive access for SPHEREx Explorer (IRSA SIA2/TAP, Gaia DR3 TAP, CADC CAOM2, AWS Open Data FITS) and the browser-side WebWorker image math.
---

# Astronomical Data Engine

This project has **no synthetic generator and no browser-side archive access**. Every
pixel and every catalogue row comes from a public archive through the local FastAPI
backend (`backend/`). The browser only receives compact float planes and RGBA buffers.

## 1. Real archive endpoints

| Source | Endpoint | Used for |
| --- | --- | --- |
| IRSA SIA2 | `https://irsa.ipac.caltech.edu/SIA` | SPHEREx product discovery (`spherex_dr1`, `spherex_qr3`, …) |
| IRSA TAP | `https://irsa.ipac.caltech.edu/TAP/sync` | WISE / AllWISE detections (`allwise_p3as_psd`) |
| Gaia TAP | `https://gea.esac.esa.int/tap-server/tap/sync` | `gaiadr3.gaia_source` astrometry + proper motions |
| CADC TAP | `https://ws.cadc-ccda.hia-iha.nrc-cnrc.gc.ca/argus/sync` | NEOSSat frames (`ivoa.ObsCore`, `caom2.Observation`) |
| AWS Open Data | SPHEREx Level-2 FITS mirrors | HTTP Range reads of ~2 MB windows |

All TAP calls go through `backend/app/tap.py`, which requests **VOTable** and raises on
`QUERY_STATUS != OK`. Never treat an archive error as "zero rows".

### Archive quirks that cost debugging time

1. **CADC moved to `/argus`** and rejects `FORMAT=json` (`400 unknown format: json`).
   The legacy `/tap` and `www…/tap` hosts return 404. CADC also returns HTTP 200 with
   `<INFO name="QUERY_STATUS" value="ERROR">` for bad ADQL.
2. **IRSA returns VOTable wrapped in a JSON envelope** when `FORMAT=json` is used, and
   astropy prefers the positional `ID="col_N"` over the real column name. `tap.py`
   renames columns back to the `FIELD name=` values.
3. **Joining `ivoa.ObsCore` to `caom2.Observation` in one CADC query hangs** (>120 s).
   Query footprints first, then fetch `target_moving` with `observationID IN (...)`.
4. **IRSA WISE is slow**: a `TOP 400` AllWISE cone scan takes 20–40 s cold. Adding a
   bbox filter made it slower. The frontend therefore requests `layers=gaia,neossat`
   and `layers=wise` separately and merges the replies.
5. **NEOSSat `s_region` is a real 4-vertex STC-S polygon** per exposure; `s_fov` is
   ≈0.643°. Hundreds of exposures per square degree are normal, so
   `backend/app/neossat.py` caps at 240 rows and the canvas collapses duplicates.

## 2. NEOSSat honesty rules

- Draw the archive polygon; never invent a footprint.
- Draw a motion path only when CADC's `target_moving` is `true` **and** at least two
  frames of that target fall in the field.
- A field with no frame must say so ("no NEOSSat frame covers this field"), not fall
  back to another layer's markers.
- Known coverage: Barnard's Star 572 frames, Epsilon Indi B 24, WISE 0855 1,
  RW Aurigae 0, R Draconis 0.

## 3. Test targets (real coordinates)

1. Barnard's Star — RA 17h57m48.498s (269.452075°), Dec +04°41′36.11″ (+4.693364°)
2. Epsilon Indi B — RA 22h04m10.50s (331.043750°), Dec −56°46′58.0″ (−56.782778°)
3. WISE 0855 — RA 08h55m10.831s (133.795129°), Dec −07°14′42.53″ (−7.245147°)
4. RW Aurigae — RA 05h07m49.56s (76.956500°), Dec +30°24′05.1″ (+30.401417°)
5. R Draconis — RA 16h32m40.23s (248.167625°), Dec +66°45′17.9″ (+66.754972°)

## 4. Browser image math (`imageMath.worker.ts`)

Only interactive arithmetic runs in the browser, on the backend-resampled planes:

1. **Six detector arrays** (17 bands each): D1 0.75–1.11 µm, D2 1.11–1.64,
   D3 1.64–2.42, D4 2.42–3.58, D5 3.58–4.29, D6 4.29–5.00 µm. Stacking 17 bands
   divides background noise by √17 (≈4.1× SNR).
2. **Temporal co-add**: pixel-wise mean across epochs; stationary sources sharpen.
3. **Difference**: `epoch B − epoch A`; static stars cancel, movers become a
   cyan/rose dipole.
4. **Flags overlay**: the real FLAGS bitmask decoded by the backend; the worker only
   tints flagged pixels.
5. **Peak finding / pixel probes**: computed from the resampled planes, never from a
   generated scene.