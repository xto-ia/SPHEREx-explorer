/**
 * Bilingual dictionary for the SPHEREx Sky Explorer.
 *
 * English is the base language (source of truth for the shape of the
 * dictionary), Ukrainian is the secondary language. The `Dictionary` type is
 * derived from the English object, so TypeScript fails the build whenever a
 * Ukrainian key is missing, misspelled or duplicated.
 *
 * Usage inside components:
 *   const { t, lang, setLang } = useLanguage();
 *   <h1>{t.home.heroTitle}</h1>
 */

export type Lang = 'en' | 'uk';

export const LANGUAGES: readonly Lang[] = ['en', 'uk'];

export const LANGUAGE_STORAGE_KEY = 'spherex.lang';

/** Metadata shown inside the navbar language toggle. */
export const LANGUAGE_LABELS: Record<Lang, string> = {
  en: 'EN',
  uk: 'UA',
};

const en = {
  meta: {
    title: 'SPHEREx Sky Explorer',
    description:
      'Browser-native blink comparator, image arithmetic and 102-band spectroscopy for the NASA SPHEREx near-infrared all-sky survey.',
  },

  nav: {
    brand: 'SPHEREx',
    brandSuffix: 'EXPLORER',
    explorer: 'Explorer',
    workspace: 'Workspace',
    docs: 'Documentation',
    language: 'Language',
    github: 'GitHub repository',
    desktop: 'Desktop',
    navLabel: 'Primary navigation',
  },

  common: {
    search: 'Search Sky Data',
    openWorkspace: 'Open Workspace',
    readDocs: 'Read Documentation',
    backToExplorer: 'Back to Explorer',
    reset: 'Reset',
    close: 'Close',
    copy: 'Copy',
    copied: 'Copied',
    play: 'Play',
    pause: 'Pause',
    loading: 'Loading',
    error: 'Error',
    warning: 'Warning',
    target: 'Target',
    coordinates: 'Coordinates',
    ra: 'Right Ascension',
    dec: 'Declination',
    fov: 'Field of View',
    epoch: 'Epoch',
    epochs: 'Epochs',
    band: 'Band',
    bands: 'Bands',
    detectorArray: 'Detector Array',
    detectorArrays: 'Detector Arrays',
    spectrum: 'Spectrum',
    wavelength: 'Wavelength',
    flux: 'Flux',
    noData: 'No data yet',
    decimalDegrees: 'decimal degrees',
    sexagesimal: 'sexagesimal',
    arcmin: 'arcmin',
    microns: 'µm',
    comingOnline: 'Module scaffolded',
    inDevelopment: 'In development',
    apply: 'Apply',
    randomPoint: 'Random point',
  },

  home: {
    kicker: 'NASA SPACE APPS CHALLENGE',
    heroTitle: 'Watch the infrared sky',
    heroTitleAccent: 'change over time',
    heroSubtitle:
      'Enter a patch of sky and blink through multi-epoch SPHEREx images like a little video. Add epochs together, subtract them to expose moving objects, and pull a 102-band spectrum for anything you click — all from the real archive frames.',
    heroPrimaryCta: 'Search Sky Data',
    heroSecondaryCta: 'How it works',

    formTitle: 'Coordinate intake',
    formSubtitle: 'Point the telescope at any patch of sky — decimal degrees or sexagesimal.',
    raLabel: 'Right Ascension (RA)',
    raHint: 'Decimal degrees 0–360, or sexagesimal like 17h57m48.5s',
    decLabel: 'Declination (Dec)',
    decHint: 'Decimal degrees −90 to +90, or sexagesimal like +04d41m36s',
    fovLabel: 'Field of View',
    fovHint: 'Wider fields track faster movers, at the cost of longer data transfer.',
    submit: 'Search Sky Data',
    invalidRa: 'Enter RA as decimal degrees (0–360) or as 17h57m48.5s.',
    invalidDec: 'Enter Dec as decimal degrees (−90 to +90) or as +04d41m36s.',
    randomUnverified:
      'The archive check failed, so the random point was not changed.',

    viewerRig: 'Rig config',
    viewerCopy: 'Copy constants',
    viewerLoading: 'Loading spacecraft mesh…',
    viewerFallback: 'WebGL model unavailable — showing schematic',

    fovGuideTitle: 'Field of view guide',
    fovGuideBody:
      'Field of view sets how much sky each frame covers. The backend always reprojects onto a 480 × 480 grid, so small fields zoom into the target while large fields catch fast movers.',
    fovGuide: [
      { label: '0.1°', body: '3.6′ across — resolved binaries and parallax wobble.' },
      { label: '0.25°', body: '15′ — Epsilon Indi B’s 0.7″ pair and nearby fast stars.' },
      { label: '0.5°', body: '30′ — survey cutout: proper motion plus asteroid tracks.' },
      { label: '1–5°', body: 'Wide sweeps for fast NEOs and comets crossing the field.' },
    ],
    epochsBadge: '6 epochs · 18 months',
    capBlinkTitle: 'Blink',
    capBlinkBody: 'Epochs as a video — motion jumps out frame by frame.',
    capCoaddTitle: 'Co-add',
    capCoaddBody: 'Sum or average epochs to sharpen stationary sources.',
    capDiffTitle: 'Difference',
    capDiffBody: 'Subtract epochs and movers become cyan/rose dipoles.',
    capSpectrumTitle: 'Spectrum',
    capSpectrumBody: 'Click a source for 102 bands with molecular markers.',
    customFieldTitle: 'Anywhere else on the sky',
    customFieldBody:
      'Enter decimal degrees or sexagesimal coordinates. The same blink, co-add, difference and 102-band tools apply to any field.',
    customFieldAction: 'Enter coordinates',

    spectralKicker: 'SPECTROSCOPY',
    spectralTitle: '102 bands in a single click',
    spectralBody:
      'Every SPHEREx pixel carries a low-resolution near-infrared spectrum. Clicking a source extracts aperture photometry in all 102 bands and overlays the molecular features that drive brown-dwarf, disk and AGB classification.',
    spectralLines: [
      'H₂O 1.13 µm',
      'H₂O 1.40 µm',
      'CO 1.56 µm',
      'CH₄ 1.65 µm',
      'CO₂ 2.00 µm',
      'CO 2.30 µm',
      'H₂O ice 3.05 µm',
      'PAH 3.30 µm',
      'CO₂ 4.26 µm',
      'CO 4.60 µm',
    ],
    workflowKicker: 'WORKFLOW',
    workflowTitle: 'From coordinates to a spectrum',
    workflowBody:
      'The same four actions volunteers use on WISEView, now with SPHEREx’s spectral depth behind them.',
    workflowSteps: [
      'Type RA/Dec (or open one of the NASA targets from Documentation).',
      'Search the sky and let the image worker align the epochs.',
      'Blink, co-add or subtract epochs to isolate motion.',
      'Switch between the 6 detector arrays and the 102 individual bands.',
      'Click a source to plot its spectrum and read the contamination flags.',
    ],

    statsScientific: 'Near-infrared bands',
    statsCadence: 'All-sky survey cadence',
    statsCadenceValue: '6 months',
    statsArrays: 'Detector arrays',
    statsAccess: 'Open to everyone',

    missionKicker: 'THE MISSION',
    missionTitle: 'A spectral map of the entire sky',
    missionSubtitle:
      'Launched in March 2025, SPHEREx sweeps the sky every six months in 102 narrow near-infrared bands, turning more than a billion sources into spectra.',
    cardBandsTitle: '102 bands, 0.75–5.0 µm',
    cardBandsBody:
      'Every pixel carries a low-resolution spectrum, revealing water, carbon dioxide, carbon monoxide, methane and organic molecules.',
    cardSurveyTitle: 'Six-month all-sky survey',
    cardSurveyBody:
      'The same sky patch returns every six months, producing a natural time series for spotting motion and variability.',
    cardArraysTitle: 'Six detector arrays',
    cardArraysBody:
      'Stacking the 17 bands of each array boosts the signal-to-noise ratio by about 4×, so faint movers become visible.',
    cardDiscoveryTitle: 'Discovery for everyone',
    cardDiscoveryBody:
      'Blink, co-add and difference imaging turn raw survey frames into something any volunteer can explore from a laptop.',

    challengeKicker: 'THE CHALLENGE',
    challengeTitle: 'Built for NASA Space Apps',
    challengeBody:
      'NASA asked for a public-facing tool that shows how the sky changes between SPHEREx epochs. This explorer streams the real Level-2 products: a Python service discovers the exposures, resamples them onto a common grid and extracts spectra, while pixel math runs in Web Workers.',

    targetsHeading: 'Official test targets',
    targetsSubheading: 'Five sources chosen to stress-test motion, variability and spectral depth.',
    targetsKicker: 'TEST TARGETS',
    targetsOpen: 'Open in workspace',
    targetMotion: 'Proper motion',
    targetType: 'Type',
  },

  workspace: {
    title: 'Analysis workspace',
    subtitle: 'Blink, co-add and subtract SPHEREx epochs, then read the near-infrared spectrum.',
    sessionLabel: 'Session',
    sessionEmpty: 'No target loaded',
    pickTarget: 'Choose a target on the Explorer page to load epochs.',
    randomPointHint: 'Pick a uniformly random point on the sky and load it',
    randomUnavailable:
      'Could not verify a covered random field. Keep the current pointing or try again.',
    noCoordinatesTitle: 'No sky field loaded',
    noCoordinatesBody:
      'Enter right ascension and declination in the bar above, or generate a random point, to load SPHEREx epochs for a field.',
    coordinatesValue: 'RA {ra} · Dec {dec}',
    fovValue: 'FoV {fov}',
    epochCount: 'Epochs',
    mode: 'Mode',
    modeBlink: 'Blink',
    modeCoadd: 'Co-Add',
    modeDiff: 'Difference',
    viewportTitle: 'Blink comparator',
    viewportBody:
      'Epochs play back like a video with play/pause, frame rate, ping-pong looping and a manual scrubber.',
    arithmeticTitle: 'Image arithmetic',
    arithmeticBody:
      'Co-add epochs to sharpen stationary sources, or subtract epoch B − epoch A to turn movers into cyan/rose dipoles.',
    arithmeticBlinkHint:
      'Raw epochs in sequence. Motion between visits is obvious as soon as the frame flips.',
    arithmeticCoaddHint:
      'Sum or average every epoch to boost stationary sources and suppress read noise.',
    arithmeticDiffHint:
      'Epoch B minus epoch A cancels the static sky; every mover becomes a cyan/rose dipole.',
    bandsTitle: '102 bands & 6 detector arrays',
    bandsBody:
      'Stack the 17 bands of each detector array for maximum SNR, or scrub individual narrow bands from 0.75 to 5.0 µm.',
    overlaysTitle: 'Multi-telescope overlays',
    overlaysBody:
      'Toggle ESA Gaia DR3 proper-motion vectors, WISE/NEOWISE detections and the real CSA NEOSSat frame footprints catalogued by CADC.',
    metadataTitle: 'Metadata & contamination flags',
    metadataBody:
      'Inspect MJD timestamps and the per-pixel bitmask: cosmic ray, saturation, diffraction spike, persistence, hot pixel.',
    spectrumTitle: 'On-the-fly spectrum',
    spectrumBody:
      'Click any object in the viewport to extract and plot its 102-band near-infrared spectrum with molecular markers.',
    spectrumExtracting: 'Extracting 102 channels from the real detector planes',
    noCoverageHint:
      'This patch of sky has no SPHEREx product in the release. Try another field or the Random point button.',
    metadataSource: 'Real archive field',
    awaitingPipeline: 'Awaiting data pipeline',
    awaitingText:
      'The workspace shell is wired for URL state sync. Cutout fetching, the Web Worker image engine and the plotter ship in the upcoming milestones.',
    panelPlaceholder: 'Panel reserved for the image pipeline',
    openDocs: 'Data pipeline notes',
    epochScrubber: 'Epoch scrubber',
    epochTimeline: 'Epoch timeline',
    relativeMag: 'relative brightness (mag)',
    fps: 'FPS',
    pingPong: 'Ping-pong loop',
    pingPongShort: 'Ping-pong',
    coaddMode: 'Sum',
    coaddAverage: 'Average',
    coaddSum: 'Sum',
    coaddMethod: 'Stacking method',
    coaddGain: '√{n} noise reduction when {n} epochs are averaged.',
    diffA: 'Epoch A',
    diffB: 'Epoch B',
    diffLegend: 'Rose = new flux · Cyan = flux that disappeared.',
    molecularMarkers: 'Molecular markers',
    markersHint: 'click a marker to load its nearest band',
    stretchLabel: 'Display stretch',
    gain: 'Stretch gain',
    rendering: 'rendering',
    discovering: 'discovering archive products',
    loadingEpochs: 'loading {done}/{total} epochs',
    apiOffline:
      'The local archive service is offline. Start it with start-local.cmd or uvicorn main:app --port 8787.',
    noCoverage:
      'No SPHEREx product covers this field. Choose another coordinate or press Random point.',
    noDetectorData: 'This field has no product for the selected detector in any epoch.',
    aligningArrays: 'Aligning detector arrays',
    flagsToggle: 'Contamination',
    contaminationOverlay: 'Contamination bitmask overlay',
    clickToProfile: 'Click any source to profile its 102-band spectrum',
    pixelValue: 'Surface brightness',
    flagsShort: 'flags',
    stepBack: 'Previous epoch',
    stepForward: 'Next epoch',
    exposure: 'Exposure',
    frame: 'frame',
    keyboardHint: 'Space · ← → · D diff · C co-add',
    shortcuts: 'Shortcuts: Space play/pause · ←/→ epoch · B blink · C co-add · D difference · F flags · G grid · L labels · Esc clear',
    playbackBlinkOnly: 'Playback is available in Blink mode.',
    channelBands: '102 bands',
    channelArrays: '6 arrays',
    bandStackHint:
      'The image is the 17-channel detector stack; the slider selects the spectrum channel.',
    previousBand: 'Previous band',
    nextBand: 'Next band',
    arrayStack: '17-band stack',
    snrGain: 'SNR',
    allArrays: 'All arrays',
    allArraysHint:
      'The full 102-band stack minimises noise at the price of washing out spectral contrast. Switch to a single array to see molecular bands again.',
    backToArrays: 'Back to detector arrays',
    stackedBands: '{n} band(s) stacked in the worker',
    overlayGaia: 'ESA Gaia DR3',
    overlayGaiaDetail: '{n} stars with proper-motion vectors',
    overlayWise: 'WISE / NEOWISE',
    overlayWiseDetail: '{n} infrared detections',
    overlayNeossat: 'CSA NEOSSat',
    overlayNeossatDetail: '{n} CADC frames in this field',
    overlayNeossatEmpty: 'no NEOSSat frame covers this field',
    overlayNeossatError: 'CADC TAP unreachable',
    overlayGrid: 'Grid',
    overlayLabels: 'Labels',
    overlayTracks: 'Tracks',
    fieldNotesTitle: 'Field notes',
    fieldNotesBody:
      'A quick reference for reading the frame and for getting the most out of the blink comparator.',
    readingTips: [
      'Blink first: a point that jumps between epochs is a mover candidate.',
      'Difference mode turns motion into a cyan/rose dipole; static stars cancel.',
      'Co-add every epoch to sharpen stationary sources before measuring.',
      'Stack one detector array when you need the deepest image.',
    ],
    legendTitle: 'Legend',
    legendTarget: 'Science target',
    legendGaia: 'Gaia DR3 + PM',
    legendWise: 'WISE / NEOWISE',
    legendNeo: 'NEOSSat frame',
    legendFlags: 'Contaminated pixel',
    aboutTarget: 'About this field',
    customFieldNote:
      'Custom field: every field is rendered from real SPHEREx Level-2 detector images resampled by the backend.',
    moversTitle: 'Movers & transients',
    moversBody:
      'Image-based peaks in the cleaned epoch difference: moving sources, variables and transients, filtered against cosmic rays, saturation and hot pixels. Click a candidate to centre the aperture and extract its spectrum.',
    moversScan: 'Scan',
    moversScanning: 'Scanning',
    moversNeedDiff: 'Switch to Difference mode to scan epoch A against epoch B.',
    moversEmpty: 'No significant peaks above the current threshold.',
    moversHint: 'Run a scan in Difference mode to list movers and transients.',
    moversWaiting: 'Waiting for all real epochs to download before scanning.',
    moversThreshold: 'σ {sigma} MJy/sr · threshold {threshold} MJy/sr',
    moversUnmatched: 'unmatched transient',
    moversMover: 'mover',
    downloadFrame: 'Download frame',
    fullscreen: 'Fullscreen',
    exitFullscreen: 'Exit fullscreen',
    copyCoordinates: 'Copy coordinates',
    epochTime: 'Epoch time',
    pixelReadout: 'Pixel readout',
    hoverHint: 'hover',
    offset: 'Sky offset',
    nearest: 'Nearest source',
    noSource: 'background',
    flagsTitle: 'Contamination bitmask',
    nominalFlags: 'Nominal bits',
    noFlags: 'clean pixel',
    probeHint: 'Hover the viewport to probe a pixel; click to extract its spectrum.',
    flagged: 'Flagged',
    sourceCard: 'Source card',
    currentPosition: 'Offset E/N',
    properMotion: 'Proper motion',
    distance: 'Distance',
    sourceHint: 'Click a source in the viewport to inspect its catalogue entry.',
    spectrumClick: 'no source selected',
    spectrumEmpty: 'No spectrum extracted yet',
    spectrumHint:
      'Hover the viewport to find a source, then click it. The backend measures a 15″ aperture in all 102 channels and returns the real flux and per-channel noise.',
    spectrumModel: 'Model',
    spectrumCopyCsv: 'CSV',
    spectrumDownload: 'Download',
    spectrumSource: 'Source',
    spectrumPeak: 'Peak band',
    spectrumFlux: 'Flux',
    spectrumDetected: 'Detected',
    spectrumAperture: 'Aperture',
    spectrumFootnote:
      'Photometry is measured in a 15″ aperture; error bars combine background and detector noise. Click the plot to load a band in the main viewport.',
    spectrumClickBand: 'click to load band',
    apertureSpectrum: 'Aperture spectrum',
    backgroundAperture: 'background-dominated aperture',
    archiveTitle: 'Live archive',
    archiveBody:
      'The backend queries IRSA SIA2, Gaia DR3 TAP and CADC, parses the FITS products with astropy and serves compact float planes to the browser.',
    archiveCheck: 'Check archives',
    archiveChecked: 'Checked',
    archiveFound: '{products} SPHEREx products · {epochs} epoch windows',
    archiveNoProducts: 'No SPHEREx product listed for this field.',
    archiveStatusOk: 'ok',
    archiveStatusBlocked: 'cors',
    archiveStatusOffline: 'timeout',
    archiveStatusError: 'error',
    archiveRelay: 'CORS relay',
    archiveSave: 'Apply',
    archiveRelayHint:
      'Optional: point to the stateless relay in backend/ (uvicorn main:app) using the pattern https://host/proxy?url=%s. Stored only in this browser.',
    archiveLinks: 'Archive links',
    customField: 'Custom field',
    switchTarget: 'Switch target',
    copyLink: 'Copy link',
    dataLive: 'ARCHIVE REACHABLE · {n}',
    ra: 'RA',
    dec: 'Dec',
  },

  docs: {
    kicker: 'REFERENCE',
    title: 'Documentation',
    subtitle:
      'Everything the explorer does, where the data comes from, and how to embed it in your own pages.',
    onThisPage: 'On this page',
    sectionCapabilities: 'Capabilities & scientific tools',
    sectionSources: 'Data sources & archive pipelines',
    sectionPipeline: 'Pipeline & provenance',
    sectionWalkthrough: 'User guide & test targets',
    sectionEmbed: 'URL & iframe embed API',
    sectionShortcuts: 'Keyboard shortcuts',
    sectionLimitations: 'Limitations & roadmap',

    capabilitiesBody:
      'Five instruments in one workspace, all executed in the browser on Float32Array buffers.',
    capabilityBlinkTitle: 'Blink comparator',
    capabilityBlinkBody:
      'Time-series epochs play like a video so motion between visits is immediately obvious.',
    capabilityDiffTitle: 'Difference imaging',
    capabilityDiffBody:
      'Epoch B − epoch A cancels static stars and leaves a high-contrast dipole for every moving source.',
    capabilityArrayTitle: '6-detector co-adding',
    capabilityArrayBody:
      'Summing the 17 bands of one array divides background noise by √17, a ~4.1× SNR gain.',
    capabilitySpectrumTitle: '102-band spectroscopy',
    capabilitySpectrumBody:
      'A single click extracts a 0.75–5.0 µm spectrum with H₂O, CO₂, CO, CH₄ and PAH markers.',
    capabilityScanTitle: 'Movers & transients scan',
    capabilityScanBody:
      'A 6σ peak finder on the cleaned epoch difference lists movers and variables, rejecting cosmic rays, hot pixels and saturation; click one to profile it.',

    sourcesBody:
      'The browser never calls an archive directly: every catalogue query and FITS read is made by the local FastAPI backend, which then hands compact planes to the page.',
    sourceIrsaTitle: 'NASA/IPAC IRSA',
    sourceIrsaBody:
      'SPHEREx releases through SIA2, plus WISE/NEOWISE detections through IRSA TAP. Level-2 FITS planes are streamed from the AWS Open Data mirror with HTTP Range requests.',
    sourceGaiaTitle: 'ESA Gaia DR3',
    sourceGaiaBody:
      'Gaia TAP astrometry with proper motions, drawn as cyan markers with drift vectors over the survey window.',
    sourceNeossatTitle: 'CSA NEOSSat / CADC',
    sourceNeossatBody:
      'Real NEOSSat frames whose CADC CAOM2 footprint overlaps the field, drawn as the archive polygon with its exposure time. The pointing track is only joined for objects CADC flags as moving.',
    fallbackNote:
      'If the archive is unreachable or a field has no product, the workspace says so instead of inventing data.',

    pipelineBody:
      'The pipeline is deliberately layered, so a new SPHEREx data release or a new archive endpoint can be added in the backend without touching the UI.',
    pipelineSteps: [
      'Discover — SIA2 asks IRSA for every SPHEREx spectral image covering the requested circle (DR1 and QR3 collections).',
      'Fetch — the backend streams only the needed FITS windows from the AWS Open Data mirror over HTTP Range, about 2 MB per cutout instead of 62 MB.',
      'Align — every epoch is resampled with its real SIP/WCS onto one 480 × 480 tangent-plane grid, and the FLAGS bitmask and VARIANCE plane are decoded alongside.',
      'Render — the Web Worker stretches the real MJy/sr planes, co-adds epochs and forms differences; only RGBA buffers reach the canvas.',
      'Combine — 17-band arrays, the 102-band stack and epoch differences are computed in the worker from backend-resampled planes.',
      'Measure — a click asks the backend for the 102-channel spectrum extracted from the six WAVE-TAB calibrated detector planes.',
    ],
    provenanceNote:
      'Provenance is always visible: the workspace shows the archive collection, the epoch MJD, the detector and the pixel values in MJy/sr for every frame it renders.',
    upgradeNote:
      'Update path: add the new SIA2 collection to SIA_COLLECTIONS in backend/app/config.py, point the FITS reader at the matching AWS Open Data prefix, and the UI inherits the new epochs.',

    walkthroughBody:
      'Five targets were chosen by NASA to exercise motion, binarity, variability and spectral depth. Load any of them from the Explorer page.',
    walkthroughSteps: [
      'Enter coordinates or pick a test target on the Explorer page.',
      'Press Search Sky Data — RA, Dec and FoV travel into the URL.',
      'Blink the epochs, then switch to Co-Add or Difference to isolate motion.',
      'Switch between the 6 detector-array stack and the 102 individual bands.',
      'Click a source to plot its 102-band spectrum and inspect contamination flags.',
    ],

    embedBody:
      'The workspace is fully addressable. Pass coordinates and view state as query parameters to restore or embed an exact view.',
    embedParams: [
      'ra — right ascension in decimal degrees (0–360)',
      'dec — declination in decimal degrees (−90 to +90)',
      'fov — field of view in degrees',
      'target — test-target slug (barnard, epsilon-indi-b, wise-0855, rw-aurigae, r-draconis)',
      'mode — blink | coadd | diff',
      'band — 1–102, or 0 for the 102-band stack',
      'array — 1–6 to stack one detector array (overrides band)',
      'epoch — 0–5, the frame shown in Blink mode',
      'a, b — epoch indices for difference imaging (0–5)',
      'fps — blinking frame rate, 0.5–12',
      'stretch — asinh | linear | sqrt | log',
      'gain — stretch gain, 0.5–40',
      'flags — 1 to tint contaminated pixels',
      'ovl — comma-separated overlay list: grid, labels, gaia, wise, neossat, tracks',
    ],
    embedExampleTitle: 'Embed snippet',
    embedExample:
      '<iframe\n  src="https://your-host/workspace?ra=269.452075&dec=4.693364&fov=0.5&target=barnard&mode=diff&band=0"\n  width="100%"\n  height="720"\n  style="border:1px solid #27272a"\n  title="SPHEREx Sky Explorer"\n  loading="lazy"\n></iframe>',
    embedNote: 'The workspace needs the API: run the backend, then embed the frontend origin.',

    shortcutsBody: 'Every control is reachable from the keyboard while the workspace is focused.',
    shortcuts: [
      { keys: 'Space', action: 'Play or pause the blink loop' },
      { keys: '← / →', action: 'Step one epoch backwards or forwards' },
      { keys: 'B / C / D', action: 'Blink, co-add or difference mode' },
      { keys: 'F', action: 'Toggle the contamination overlay' },
      { keys: 'G / L', action: 'Toggle the sky grid or source labels' },
      { keys: 'Esc', action: 'Clear the selected source and spectrum' },
      { keys: 'Wheel', action: 'Scroll the workspace panels' },
    ],

    limitationsBody:
      'The explorer is honest about what public archives expose today.',
    limitations: [
      'IRSA SIA2 and TAP do not send CORS headers, so the Python backend performs all archive queries.',
      'A true spectrum needs the whole Level-2 detector plane, so the first extraction for a field takes tens of seconds; results are cached.',
      'Individual 0.75–5.0 µm bands are strips inside a detector image, so the image channel selector exposes the six detector arrays instead.',
      'Photometry comes straight from the pipeline MJy/sr planes: no extra calibration is applied.',
      'NEOSSat is a locator layer: CADC supplies the footprint polygon, exposure time and target_moving flag, not the NEOSSat pixels themselves.',
      'Coverage is uneven: RW Aurigae and R Draconis have no NEOSSat frame in CADC CAOM2, and the overlay panel says so instead of drawing one.',
      'If a field, epoch or detector has no product, the workspace reports it instead of showing an image.',
    ],
  },

  targets: {
    barnard: {
      name: "Barnard's Star",
      type: 'M4V red dwarf',
      subtitle: '10.3″/yr · largest proper motion',
      description:
        'The fastest-moving star in the sky, racing north-northwest at 10.3 arcseconds per year. A red dwarf peaking near 1.1 µm with deep H₂O and CO absorption.',
    },
    epsilonIndiB: {
      name: 'Epsilon Indi B',
      type: 'T1 + T6 brown dwarf pair',
      subtitle: '0.7″ binary · 4.7″/yr',
      description:
        'A resolved pair of brown dwarfs co-moving with Epsilon Indi. Methane and water troughs at 1.15, 1.4, 1.65, 2.2 and 3.3 µm dominate the spectrum.',
    },
    wise0855: {
      name: 'WISE 0855',
      type: 'Y4 dwarf · 250 K',
      subtitle: '8.1″/yr · coldest brown dwarf',
      description:
        'The coldest known brown dwarf, invisible shortward of 2.5 µm and brightening sharply between 3.5 and 5.0 µm across detector arrays 5 and 6.',
    },
    rwAurigae: {
      name: 'RW Aurigae',
      type: 'T Tauri variable',
      subtitle: '≈2 mag dimming events',
      description:
        'A young star whose circumstellar dust occults the star and dims it by roughly two magnitudes between epochs, leaving infrared excess and CO emission.',
    },
    rDraconis: {
      name: 'R Draconis',
      type: 'Mira-type AGB variable',
      subtitle: '245.6 d period · V 6.7–13.0',
      description:
        'A pulsating asymptotic giant branch star sweeping four magnitudes of visual brightness, with strong H₂O and CO₂ molecular bands in the near-infrared.',
    },
  },

  footer: {
    tagline: 'Blink, subtract and measure the infrared sky on real archive frames.',
    builtFor: 'Built for the NASA Space Apps Challenge',
    dataSources: 'Data: NASA/IPAC IRSA · ESA Gaia DR3 · CSA NEOSSat / CADC',
    missionNote: 'SPHEREx is a NASA Astrophysics Explorer mission.',
    rights: 'Open-source under the MIT license.',
  },

  notFound: {
    code: '404',
    title: 'Signal lost',
    body: 'That sky patch does not exist in this explorer. Return to the landing page and pick a target.',
    action: 'Back to Explorer',
  },
};

/** Shape every language must implement. Derived from the English base dictionary. */
export type Dictionary = typeof en;

const uk: Dictionary = {
  meta: {
    title: 'SPHEREx Sky Explorer',
    description:
      'Клієнтський компаратор миготіння, арифметика зображень і 102-спектральна спектроскопія для інфрачервоного огляду неба NASA SPHEREx.',
  },

  nav: {
    brand: 'SPHEREx',
    brandSuffix: 'EXPLORER',
    explorer: 'Огляд',
    workspace: 'Робоче поле',
    docs: 'Документація',
    language: 'Мова',
    github: 'Репозиторій GitHub',
    desktop: 'Клієнтський режим',
    navLabel: 'Основна навігація',
  },

  common: {
    search: 'Шукати дані неба',
    openWorkspace: 'Відкрити робоче поле',
    readDocs: 'Читати документацію',
    backToExplorer: 'Назад до огляду',
    reset: 'Скинути',
    close: 'Закрити',
    copy: 'Копіювати',
    copied: 'Скопійовано',
    play: 'Відтворити',
    pause: 'Пауза',
    loading: 'Завантаження',
    error: 'Помилка',
    warning: 'Попередження',
    target: 'Об’єкт',
    coordinates: 'Координати',
    ra: 'Пряме піднесення',
    dec: 'Схилення',
    fov: 'Поле зору',
    epoch: 'Епоха',
    epochs: 'Епохи',
    band: 'Канал',
    bands: 'Канали',
    detectorArray: 'Матриця детектора',
    detectorArrays: 'Матриці детекторів',
    spectrum: 'Спектр',
    wavelength: 'Довжина хвилі',
    flux: 'Потік',
    noData: 'Даних ще немає',
    decimalDegrees: 'десяткові градуси',
    sexagesimal: 'години-хвилини-секунди',
    arcmin: 'кутові мінути',
    microns: 'мкм',
    comingOnline: 'Модуль підготовлено',
    inDevelopment: 'У розробці',
    apply: 'Застосувати',
    randomPoint: 'Випадкова точка',
  },

  home: {
    kicker: 'NASA SPACE APPS CHALLENGE',
    heroTitle: 'Спостерігайте, як інфрачервоне небо',
    heroTitleAccent: 'змінюється в часі',
    heroSubtitle:
      'Введіть ділянку неба та переглядайте зображення SPHEREx за кілька епох як коротке відео. Додавайте епохи, віднімайте їх, щоб побачити рухомі об’єкти, і отримуйте 102-канальний спектр будь-якого об’єкта — усе з реальних архівних кадрів.',
    heroPrimaryCta: 'Шукати дані неба',
    heroSecondaryCta: 'Як це працює',

    formTitle: 'Введення координат',
    formSubtitle: 'Наведіть телескоп на будь-яку ділянку неба — десяткові градуси або години-хвилини-секунди.',
    raLabel: 'Пряме піднесення (RA)',
    raHint: 'Десяткові градуси 0–360 або 17h57m48.5s',
    decLabel: 'Схилення (Dec)',
    decHint: 'Десяткові градуси від −90 до +90 або +04d41m36s',
    fovLabel: 'Поле зору',
    fovHint: 'Ширше поле охоплює швидші об’єкти, але потребує більше даних.',
    submit: 'Шукати дані неба',
    invalidRa: 'Введіть RA у десяткових градусах (0–360) або у форматі 17h57m48.5s.',
    invalidDec: 'Введіть Dec у десяткових градусах (−90…+90) або у форматі +04d41m36s.',
    randomUnverified:
      'Перевірка архіву недоступна — ця випадкова точка може бути поза покриттям SPHEREx.',

    viewerRig: 'Налаштування рига',
    viewerCopy: 'Копіювати константи',
    viewerLoading: 'Завантаження моделі апарата…',
    viewerFallback: 'WebGL-модель недоступна — показано схему',

    fovGuideTitle: 'Путівник полем зору',
    fovGuideBody:
      'Поле зору визначає, яку ділянку неба охоплює кадр. Бекенд завжди перепроєктує на сітку 480 × 480, тож малі поля наближають об’єкт, а великі ловлять швидкі рухомі джерела.',
    fovGuide: [
      { label: '0.1°', body: '3,6′ — розділені подвійні та паралаксне хитання.' },
      { label: '0.25°', body: '15′ — пара Epsilon Indi B з розділенням 0,7″ і швидкі зорі.' },
      { label: '0.5°', body: '30′ — типовий кадр огляду: власний рух і треки астероїдів.' },
      { label: '1–5°', body: 'Широкі смуги для швидких NEO та комет, що перетинають поле.' },
    ],
    epochsBadge: '6 епох · 18 місяців',
    capBlinkTitle: 'Миготіння',
    capBlinkBody: 'Епохи як відео — рух видно кадр за кадром.',
    capCoaddTitle: 'Додавання',
    capCoaddBody: 'Сума або середнє епох підсилює нерухомі джерела.',
    capDiffTitle: 'Різниця',
    capDiffBody: 'Віднімання епох перетворює рухомі об’єкти на диполі.',
    capSpectrumTitle: 'Спектр',
    capSpectrumBody: 'Клацніть джерело — 102 канали з молекулярними маркерами.',
    customFieldTitle: 'Будь-де на небі',
    customFieldBody:
      'Введіть координати в десяткових градусах або годинах-хвилинах-секундах. Ті самі інструменти миготіння, додавання, різниці та 102 каналів працюють для будь-якого поля.',
    customFieldAction: 'Ввести координати',

    spectralKicker: 'СПЕКТРОСКОПІЯ',
    spectralTitle: '102 канали одним клацанням',
    spectralBody:
      'Кожен піксель SPHEREx містить спектр низької роздільної здатності. Клацання джерела вимірює апертурну фотометрію в усіх 102 каналах і накладає молекулярні смуги, за якими класифікують коричневі карлики, диски та AGB-зорі.',
    spectralLines: [
      'H₂O 1,13 мкм',
      'H₂O 1,40 мкм',
      'CO 1,56 мкм',
      'CH₄ 1,65 мкм',
      'CO₂ 2,00 мкм',
      'CO 2,30 мкм',
      'Лід H₂O 3,05 мкм',
      'ПАУ 3,30 мкм',
      'CO₂ 4,26 мкм',
      'CO 4,60 мкм',
    ],
    workflowKicker: 'РОБОЧИЙ ПРОЦЕС',
    workflowTitle: 'Від координат до спектра',
    workflowBody:
      'Ті самі чотири дії, які волонтери виконують у WISEView, але тепер із спектральною глибиною SPHEREx.',
    workflowSteps: [
      'Введіть RA/Dec (або відкрийте тестовий об’єкт NASA зі сторінки документації).',
      'Натисніть «Шукати дані неба» і дозвольте рушію вирівняти епохи.',
      'Миготіть, додавайте або віднімайте епохи, щоб виділити рух.',
      'Перемикайтеся між 6 матрицями детекторів і 102 окремими каналами.',
      'Клацніть джерело, щоб побудувати спектр і прочитати прапорці забруднення.',
    ],

    statsScientific: 'Інфрачервоні канали',
    statsCadence: 'Цикл огляду всього неба',
    statsCadenceValue: '6 місяців',
    statsArrays: 'Матриці детекторів',
    statsAccess: 'Відкрито для всіх',

    missionKicker: 'МІСІЯ',
    missionTitle: 'Спектральна карта всього неба',
    missionSubtitle:
      'Запущений у березні 2025 року, SPHEREx сканує небо кожні шість місяців у 102 вузьких інфрачервоних каналах, перетворюючи понад мільярд джерел на спектри.',
    cardBandsTitle: '102 канали, 0,75–5,0 мкм',
    cardBandsBody:
      'Кожен піксель містить спектр низької роздільної здатності: вода, вуглекислий газ, чадний газ, метан та органічні молекули.',
    cardSurveyTitle: 'Огляд усього неба за шість місяців',
    cardSurveyBody:
      'Та сама ділянка неба повертається кожні півроку, утворюючи природний часовий ряд для пошуку руху та змінності.',
    cardArraysTitle: 'Шість матриць детекторів',
    cardArraysBody:
      'Сума 17 каналів кожної матриці підвищує співвідношення сигнал/шум приблизно вчетверо, і слабкі об’єкти стають видимими.',
    cardDiscoveryTitle: 'Відкриття для кожного',
    cardDiscoveryBody:
      'Миготіння, додавання та віднімання зображень перетворюють сирі кадри огляду на матеріал, який досліджує будь-хто з ноутбука.',

    challengeKicker: 'ЗАВДАННЯ',
    challengeTitle: 'Створено для NASA Space Apps',
    challengeBody:
      'NASA запропонувала публічний інструмент, який показує, як небо змінюється між епохами SPHEREx. Цей огляд читає справжні продукти рівня 2: сервіс на Python знаходить експозиції, перепроєктує їх на спільну сітку та витягує спектри, а піксельна математика виконується у Web Workers.',

    targetsHeading: 'Офіційні тестові об’єкти',
    targetsSubheading: 'П’ять джерел, підібраних для перевірки руху, змінності та спектральної глибини.',
    targetsKicker: 'ТЕСТОВІ ОБ’ЄКТИ',
    targetsOpen: 'Відкрити в робочому полі',
    targetMotion: 'Власний рух',
    targetType: 'Тип',
  },

  workspace: {
    title: 'Робоче поле аналізу',
    subtitle: 'Миготіння, додавання та віднімання епох SPHEREx, далі — інфрачервоний спектр.',
    sessionLabel: 'Сесія',
    sessionEmpty: 'Об’єкт не вибрано',
    pickTarget: 'Виберіть об’єкт на сторінці огляду, щоб завантажити епохи.',
    randomPointHint: 'Вибрати випадкову точку неба та завантажити її',
    randomUnavailable: 'Не вдалося перевірити покриття випадкового поля. Залиште поточне наведення або спробуйте ще раз.',
    noCoordinatesTitle: 'Ділянку неба не вибрано',
    noCoordinatesBody:
      'Введіть пряме піднесення і схилення в панелі вище або згенеруйте випадкову точку, щоб завантажити епохи SPHEREx для цієї ділянки.',
    coordinatesValue: 'RA {ra} · Dec {dec}',
    fovValue: 'Поле зору {fov}',
    epochCount: 'Епохи',
    mode: 'Режим',
    modeBlink: 'Миготіння',
    modeCoadd: 'Додавання',
    modeDiff: 'Різниця',
    viewportTitle: 'Компаратор миготіння',
    viewportBody:
      'Епохи відтворюються як відео: відтворення/пауза, частота кадрів, маятниковий цикл і ручний скраббер.',
    arithmeticTitle: 'Арифметика зображень',
    arithmeticBody:
      'Додавання епох підсилює нерухомі джерела, а віднімання епоха B − епоха A перетворює рухомі об’єкти на бірюзово-рожеві диполі.',
    arithmeticBlinkHint:
      'Сирі епохи послідовно. Рух між відвідинами стає очевидним уже на першому перемиканні.',
    arithmeticCoaddHint:
      'Сума або середнє всіх епох підсилює нерухомі джерела та пригнічує шум зчитування.',
    arithmeticDiffHint:
      'Епоха B мінус епоха A гасить нерухоме небо; кожен рухомий об’єкт стає бірюзово-рожевим диполем.',
    bandsTitle: '102 канали та 6 матриць',
    bandsBody:
      'Сума 17 каналів кожної матриці дає максимальний SNR, або переглядайте окремі вузькі канали від 0,75 до 5,0 мкм.',
    overlaysTitle: 'Накладання інших телескопів',
    overlaysBody:
      'Вмикайте вектори власного руху Gaia DR3, детекції WISE/NEOWISE та реальні полігони кадрів CSA NEOSSat із каталогу CADC.',
    metadataTitle: 'Метадані та прапорці забруднення',
    metadataBody:
      'Переглядайте мітки часу MJD та бітову маску пікселя: космічний промінь, насичення, дифракційний сплеск, інерція, гарячий піксель.',
    spectrumTitle: 'Спектр на льоту',
    spectrumBody:
      'Клацніть будь-який об’єкт у вікні, щоб отримати 102-канальний інфрачервоний спектр із молекулярними маркерами.',
    spectrumExtracting: 'Витягуємо 102 канали з реальних площин детектора',
    noCoverageHint:
      'Для цієї ділянки неба немає продукту SPHEREx у релізі. Спробуйте інше поле або кнопку «Випадкова точка».',
    metadataSource: 'Реальне архівне поле',
    awaitingPipeline: 'Очікування конвеєра даних',
    awaitingText:
      'Каркас робочого поля готовий до синхронізації з URL. Завантаження кадрів, рушій зображень у Web Worker і графік з’являться в наступних етапах.',
    panelPlaceholder: 'Панель для конвеєра зображень',
    openDocs: 'Нотатки про конвеєр даних',
    epochScrubber: 'Скраббер епох',
    epochTimeline: 'Хронологія епох',
    relativeMag: 'відносний блиск (зор. вел.)',
    fps: 'кадр/с',
    pingPong: 'Маятниковий цикл',
    pingPongShort: 'Маятник',
    coaddMode: 'Сума',
    coaddAverage: 'Середнє',
    coaddSum: 'Сума',
    coaddMethod: 'Метод додавання',
    coaddGain: 'Зменшення шуму в √{n} разів під час усереднення {n} епох.',
    diffA: 'Епоха A',
    diffB: 'Епоха B',
    diffLegend: 'Рожевий — новий потік · Бірюзовий — потік, що зник.',
    molecularMarkers: 'Молекулярні маркери',
    markersHint: 'клацніть маркер, щоб завантажити найближчий канал',
    stretchLabel: 'Розтяг зображення',
    gain: 'Підсилення розтягу',
    rendering: 'рендеринг',
    discovering: 'пошук архівних продуктів',
    loadingEpochs: 'завантаження епох {done}/{total}',
    apiOffline:
      'Локальний архівний сервіс недоступний. Запустіть start-local.cmd або uvicorn main:app --port 8787.',
    noCoverage:
      'Жоден продукт SPHEREx не покриває це поле. Виберіть інші координати або натисніть «Випадкова точка».',
    noDetectorData: 'Для цього поля немає продукту вибраної матриці в жодній епосі.',
    aligningArrays: 'Вирівнювання матриць детекторів',
    flagsToggle: 'Забруднення',
    contaminationOverlay: 'Накладання маски забруднення',
    clickToProfile: 'Клацніть джерело, щоб отримати його 102-канальний спектр',
    pixelValue: 'Поверхнева яскравість',
    flagsShort: 'прапорці',
    stepBack: 'Попередня епоха',
    stepForward: 'Наступна епоха',
    exposure: 'Експозиція',
    frame: 'кадр',
    keyboardHint: 'Space · ← → · D різниця · C додавання',
    shortcuts:
      'Клавіші: Space — відтворення/пауза · ←/→ — епоха · B — миготіння · C — додавання · D — різниця · F — прапорці · G — сітка · L — підписи · Esc — очистити',
    playbackBlinkOnly: 'Відтворення доступне в режимі миготіння.',
    channelBands: '102 канали',
    channelArrays: '6 матриць',
    bandStackHint:
      'Зображення — це стек із 17 каналів матриці; повзунок вибирає канал для спектра.',
    previousBand: 'Попередній канал',
    nextBand: 'Наступний канал',
    arrayStack: 'стек із 17 каналів',
    snrGain: 'SNR',
    allArrays: 'Усі матриці',
    allArraysHint:
      'Повний стек із 102 каналів мінімізує шум, але розмиває спектральний контраст. Перемкніться на одну матрицю, щоб знову побачити молекулярні смуги.',
    backToArrays: 'Назад до матриць детекторів',
    stackedBands: 'каналів у стеку: {n}',
    overlayGaia: 'ESA Gaia DR3',
    overlayGaiaDetail: '{n} зір із векторами власного руху',
    overlayWise: 'WISE / NEOWISE',
    overlayWiseDetail: '{n} інфрачервоних детекцій',
    overlayNeossat: 'CSA NEOSSat',
    overlayNeossatDetail: 'кадрів CADC у цьому полі: {n}',
    overlayNeossatEmpty: 'жоден кадр NEOSSat не покриває це поле',
    overlayNeossatError: 'TAP CADC недоступний',
    overlayGrid: 'Сітка',
    overlayLabels: 'Підписи',
    overlayTracks: 'Треки',
    fieldNotesTitle: 'Польові нотатки',
    fieldNotesBody:
      'Коротка довідка для читання кадру та максимальної користі від компаратора миготіння.',
    readingTips: [
      'Спершу миготіння: точка, що стрибає між епохами, є кандидатом у рухомі об’єкти.',
      'Режим різниці перетворює рух на бірюзово-рожевий диполь; нерухомі зорі гасяться.',
      'Додайте всі епохи, щоб підсилити нерухомі джерела перед вимірюванням.',
      'Складіть одну матрицю детекторів, коли потрібне найглибше зображення.',
    ],
    legendTitle: 'Легенда',
    legendTarget: 'Науковий об’єкт',
    legendGaia: 'Gaia DR3 + власний рух',
    legendWise: 'WISE / NEOWISE',
    legendNeo: 'Кадр NEOSSat',
    legendFlags: 'Забруднений піксель',
    aboutTarget: 'Про це поле',
    customFieldNote:
      'Довільне поле: кожне поле рендериться з реальних зображень детекторів SPHEREx рівня 2, перепроєктованих бекендом.',
    moversTitle: 'Рухомі об’єкти й транзієнти',
    moversBody:
      'Піки в очищеній різниці епох: рухомі джерела, змінні та транзієнти після відсіювання космічних променів, насичення й гарячих пікселів. Клацніть кандидата, щоб відцентрувати апертуру й отримати спектр.',
    moversScan: 'Сканувати',
    moversScanning: 'Сканування',
    moversNeedDiff: 'Перемкніться в режим різниці, щоб порівняти епоху A з епохою B.',
    moversEmpty: 'Немає значущих піків вище поточного порогу.',
    moversHint: 'Запустіть сканування в режимі різниці, щоб отримати список рухомих об’єктів і транзієнтів.',
    moversWaiting: 'Очікуємо завантаження всіх реальних епох перед скануванням.',
    moversThreshold: 'σ {sigma} MJy/sr · поріг {threshold} MJy/sr',
    moversUnmatched: 'невідомий транзієнт',
    moversMover: 'рухомий',
    downloadFrame: 'Завантажити кадр',
    fullscreen: 'На весь екран',
    exitFullscreen: 'Вийти з повного екрана',
    copyCoordinates: 'Копіювати координати',
    epochTime: 'Час епохи',
    pixelReadout: 'Зчитування пікселя',
    hoverHint: 'наведіть',
    offset: 'Зсув на небі',
    nearest: 'Найближче джерело',
    noSource: 'фон',
    flagsTitle: 'Бітова маска забруднення',
    nominalFlags: 'Номінальні біти',
    noFlags: 'чистий піксель',
    probeHint: 'Наведіть на вікно, щоб зчитати піксель; клацніть, щоб отримати спектр.',
    flagged: 'Забруднено',
    sourceCard: 'Картка джерела',
    currentPosition: 'Зсув E/N',
    properMotion: 'Власний рух',
    distance: 'Відстань',
    sourceHint: 'Клацніть джерело у вікні, щоб переглянути його каталожний запис.',
    spectrumClick: 'джерело не вибрано',
    spectrumEmpty: 'Спектр ще не отримано',
    spectrumHint:
      'Наведіть на вікно, щоб знайти джерело, і клацніть його. Бекенд вимірює апертуру 15″ в усіх 102 каналах і повертає реальний потік та шум кожного каналу.',
    spectrumModel: 'Модель',
    spectrumCopyCsv: 'CSV',
    spectrumDownload: 'Завантажити',
    spectrumSource: 'Джерело',
    spectrumPeak: 'Піковий канал',
    spectrumFlux: 'Потік',
    spectrumDetected: 'Виявлено',
    spectrumAperture: 'Апертура',
    spectrumFootnote:
      'Фотометрія вимірюється в апертурі 15″; похибки поєднують фоновий шум і шум детектора. Клацніть графік, щоб завантажити канал у головному вікні.',
    spectrumClickBand: 'клацніть, щоб завантажити канал',
    apertureSpectrum: 'Апертурний спектр',
    backgroundAperture: 'апертура з переважанням фону',
    archiveTitle: 'Живий архів',
    archiveBody:
      'Бекенд звертається до IRSA SIA2, Gaia DR3 TAP і CADC, розбирає FITS-продукти через astropy і віддає браузеру компактні float-площини.',
    archiveCheck: 'Перевірити архіви',
    archiveChecked: 'Перевірено',
    archiveFound: 'Продуктів SPHEREx: {products} · вікон епох: {epochs}',
    archiveNoProducts: 'Для цього поля продуктів SPHEREx не знайдено.',
    archiveStatusOk: 'ок',
    archiveStatusBlocked: 'cors',
    archiveStatusOffline: 'тайм-аут',
    archiveStatusError: 'помилка',
    archiveRelay: 'CORS-релей',
    archiveSave: 'Застосувати',
    archiveRelayHint:
      'Необов’язково: вкажіть безстанний релей із backend/ (uvicorn main:app) за шаблоном https://host/proxy?url=%s. Зберігається лише в цьому браузері.',
    archiveLinks: 'Посилання на архіви',
    customField: 'Довільне поле',
    switchTarget: 'Змінити об’єкт',
    copyLink: 'Копіювати посилання',
    dataLive: 'АРХІВ ДОСТУПНИЙ · {n}',
    ra: 'RA',
    dec: 'Dec',
  },

  docs: {
    kicker: 'ДОВІДНИК',
    title: 'Документація',
    subtitle:
      'Усе, що вміє огляд, звідки беруться дані та як вставити його на власні сторінки.',
    onThisPage: 'На цій сторінці',
    sectionCapabilities: 'Можливості та наукові інструменти',
    sectionSources: 'Джерела даних і архівні конвеєри',
    sectionPipeline: 'Конвеєр і походження даних',
    sectionWalkthrough: 'Посібник користувача та тестові об’єкти',
    sectionEmbed: 'API URL та вбудовування через iframe',
    sectionShortcuts: 'Клавіатурні скорочення',
    sectionLimitations: 'Обмеження та план розвитку',

    capabilitiesBody:
      'П’ять інструментів в одному робочому полі — усі виконуються в браузері на буферах Float32Array.',
    capabilityBlinkTitle: 'Компаратор миготіння',
    capabilityBlinkBody:
      'Епохи часового ряду відтворюються як відео, тож рух між відвідинами видно одразу.',
    capabilityDiffTitle: 'Різницеве зображення',
    capabilityDiffBody:
      'Епоха B − епоха A гасить нерухомі зорі й лишає контрастний диполь для кожного рухомого джерела.',
    capabilityArrayTitle: 'Додавання 6 матриць',
    capabilityArrayBody:
      'Сума 17 каналів однієї матриці зменшує фоновий шум у √17 разів — виграш SNR близько 4,1×.',
    capabilitySpectrumTitle: '102-канальна спектроскопія',
    capabilitySpectrumBody:
      'Одне клацання дає спектр 0,75–5,0 мкм із маркерами H₂O, CO₂, CO, CH₄ і ПАУ.',
    capabilityScanTitle: 'Пошук рухомих об’єктів і транзієнтів',
    capabilityScanBody:
      'Пошук піків на 6σ у очищеній різниці епох дає список рухомих і змінних джерел із відсіюванням космічних променів, гарячих пікселів і насичення; клацніть кандидата, щоб отримати спектр.',

    sourcesBody:
      'Браузер ніколи не звертається до архіву напряму: усі запити каталогів і читання FITS виконує локальний бекенд на FastAPI, а сторінка отримує вже компактні площини.',
    sourceIrsaTitle: 'NASA/IPAC IRSA',
    sourceIrsaBody:
      'Релізи SPHEREx через SIA2 і детекції WISE/NEOWISE через IRSA TAP. FITS-площини рівня 2 читаються з дзеркала AWS Open Data запитами HTTP Range.',
    sourceGaiaTitle: 'ESA Gaia DR3',
    sourceGaiaBody:
      'Астрометрія Gaia TAP із власними рухами — бірюзові маркери з векторами дрейфу за час огляду.',
    sourceNeossatTitle: 'CSA NEOSSat / CADC',
    sourceNeossatBody:
      'Реальні кадри NEOSSat, чий полігон покриття з CADC CAOM2 перетинає поле: малюються як архівний полігон із часом експозиції. Лінія треку з’єднується лише для об’єктів, які CADC позначає як рухомі.',
    fallbackNote:
      'Якщо архів недоступний або для поля немає продукту, робоче поле прямо про це повідомляє, а не малює вигадані дані.',

    pipelineBody:
      'Конвеєр свідомо розділений: новий реліз SPHEREx або новий архівний ендпоінт додається в бекенд, не змінюючи інтерфейс.',
    pipelineSteps: [
      'Пошук — SIA2 питає IRSA про всі спектральні зображення SPHEREx, що покривають задане коло (колекції DR1 і QR3).',
      'Читання — бекенд вичитує з дзеркала AWS Open Data лише потрібні вікна FITS через HTTP Range: близько 2 МБ на виріз замість 62 МБ.',
      'Вирівнювання — кожна епоха перепроєктується за своїм реальним SIP/WCS на спільну сітку 480 × 480, паралельно декодуються маска FLAGS і площина VARIANCE.',
      'Рендеринг — Web Worker розтягує справжні площини MJy/sr, додає епохи й будує різниці; на полотно потрапляють лише RGBA-буфери.',
      'Комбінування — стеки з 17 і 102 каналів та різниці епох обчислюються у воркері з даних, вирівняних бекендом.',
      'Вимірювання — клацання запитує в бекенда 102-канальний спектр, витягнутий із шести каліброваних площин WAVE-TAB.',
    ],
    provenanceNote:
      'Походження даних завжди видиме: робоче поле показує колекцію архіву, MJD епохи, детектор і значення пікселів у MJy/sr для кожного кадру.',
    upgradeNote:
      'Шлях оновлення: додайте нову колекцію SIA2 у SIA_COLLECTIONS у backend/app/config.py, спрямуйте FITS-читач на відповідний префікс AWS Open Data — і інтерфейс отримає нові епохи.',

    walkthroughBody:
      'NASA обрала п’ять об’єктів, щоб перевірити рух, подвійність, змінність і спектральну глибину. Завантажте будь-який із них на сторінці огляду.',
    walkthroughSteps: [
      'Введіть координати або виберіть тестовий об’єкт на сторінці огляду.',
      'Натисніть «Шукати дані неба» — RA, Dec і FoV потраплять в URL.',
      'Перегляньте епохи в режимі миготіння, потім перемкніть на додавання або різницю.',
      'Перемикайтеся між стеком із 6 матриць і 102 окремими каналами.',
      'Клацніть джерело, щоб побудувати 102-канальний спектр і перевірити прапорці забруднення.',
    ],

    embedBody:
      'Робоче поле повністю адресується. Передавайте координати й стан перегляду як параметри запиту, щоб відтворити або вставити точний вигляд.',
    embedParams: [
      'ra — пряме піднесення в десяткових градусах (0–360)',
      'dec — схилення в десяткових градусах (−90…+90)',
      'fov — поле зору в градусах',
      'target — ідентифікатор об’єкта (barnard, epsilon-indi-b, wise-0855, rw-aurigae, r-draconis)',
      'mode — blink | coadd | diff',
      'band — 1–102, або 0 для стеку зі 102 каналів',
      'array — 1–6 для стеку однієї матриці (перекриває band)',
      'epoch — 0–5, кадр у режимі миготіння',
      'a, b — індекси епох для різницевого зображення (0–5)',
      'fps — частота миготіння, 0,5–12',
      'stretch — asinh | linear | sqrt | log',
      'gain — підсилення розтягу, 0,5–40',
      'flags — 1, щоб підсвітити забруднені пікселі',
      'ovl — список накладань через кому: grid, labels, gaia, wise, neossat, tracks',
    ],
    embedExampleTitle: 'Фрагмент для вбудовування',
    embedExample:
      '<iframe\n  src="https://your-host/workspace?ra=269.452075&dec=4.693364&fov=0.5&target=barnard&mode=diff&band=0"\n  width="100%"\n  height="720"\n  style="border:1px solid #27272a"\n  title="SPHEREx Sky Explorer"\n  loading="lazy"\n></iframe>',
    embedNote: 'Робочому полю потрібен бекенд: запустіть API, а потім вбудовуйте адресу фронтенду.',

    shortcutsBody: 'Усі елементи керування доступні з клавіатури, коли робоче поле у фокусі.',
    shortcuts: [
      { keys: 'Space', action: 'Відтворити або зупинити миготіння' },
      { keys: '← / →', action: 'Перейти на одну епоху назад або вперед' },
      { keys: 'B / C / D', action: 'Режим миготіння, додавання або різниці' },
      { keys: 'F', action: 'Перемкнути накладання забруднення' },
      { keys: 'G / L', action: 'Перемкнути сітку неба або підписи джерел' },
      { keys: 'Esc', action: 'Очистити вибране джерело та спектр' },
      { keys: 'Колесо', action: 'Прокручувати панелі робочого поля' },
    ],

    limitationsBody:
      'Огляд чесно показує, що сьогодні віддають публічні архіви.',
    limitations: [
      'IRSA SIA2 і TAP не надсилають заголовків CORS, тож усі архівні запити виконує бекенд на Python.',
      'Справжній спектр потребує всієї площини рівня 2, тому перше витягання для поля триває десятки секунд; далі результат кешується.',
      'Окремі канали 0,75–5,0 мкм — це смуги всередині кадру детектора, тому селектор зображення показує шість матриць, а не 102 кадри.',
      'Фотометрія вимірюється в апертурі 15″; похибки поєднують фоновий шум і шум детектора. Клацніть графік, щоб завантажити канал у головному вікні.',
      'NEOSSat — це шар-локатор: CADC дає полігон покриття, час експозиції та прапорець target_moving, а не самі пікселі NEOSSat.',
      'Покриття нерівномірне: для RW Aurigae і R Draconis у CADC CAOM2 немає жодного кадру NEOSSat, і панель прямо це показує.',
      'Якщо для поля, епохи або детектора немає продукту, робоче поле повідомляє про це замість зображення.',
    ],
  },

  targets: {
    barnard: {
      name: 'Зоря Барнарда',
      type: 'Червоний карлик M4V',
      subtitle: '10,3″/рік · найбільший власний рух',
      description:
        'Найшвидша зоря неба, що рухається на північ-північний захід зі швидкістю 10,3 кутової секунди на рік. Червоний карлик з максимумом близько 1,1 мкм і глибокими смугами H₂O та CO.',
    },
    epsilonIndiB: {
      name: 'Епсилон Інді B',
      type: 'Пара коричневих карликів T1 + T6',
      subtitle: 'Подвійна 0,7″ · 4,7″/рік',
      description:
        'Розділена пара коричневих карликів, що рухається разом з Епсилон Інді. У спектрі домінують смуги метану та води на 1,15, 1,4, 1,65, 2,2 і 3,3 мкм.',
    },
    wise0855: {
      name: 'WISE 0855',
      type: 'Карлик Y4 · 250 K',
      subtitle: '8,1″/рік · найхолодніший коричневий карлик',
      description:
        'Найхолодніший відомий коричневий карлик: невидимий до 2,5 мкм і різко яскравішає між 3,5 і 5,0 мкм у матрицях 5 і 6.',
    },
    rwAurigae: {
      name: 'RW Візничого',
      type: 'Змінна типу T Tauri',
      subtitle: 'Затемнення ≈2 зор. вел.',
      description:
        'Молода зоря, чий навколозоряний пил затемнює її приблизно на дві зоряні величини між епохами, лишаючи інфрачервоний надлишок і емісію CO.',
    },
    rDraconis: {
      name: 'R Дракона',
      type: 'Змінна типу Міри (AGB)',
      subtitle: 'Період 245,6 діб · V 6,7–13,0',
      description:
        'Пульсуюча зоря асимптотичної вітки гігантів, що змінює блиск на чотири зоряні величини, з сильними смугами H₂O і CO₂ в ближньому інфрачервоному діапазоні.',
    },
  },

  footer: {
    tagline: 'Миготіння, віднімання та вимірювання інфрачервоного неба на реальних архівних кадрах.',
    builtFor: 'Створено для NASA Space Apps Challenge',
    dataSources: 'Дані: NASA/IPAC IRSA · ESA Gaia DR3 · CSA NEOSSat / CADC',
    missionNote: 'SPHEREx — місія NASA за програмою Astrophysics Explorer.',
    rights: 'Відкритий код за ліцензією MIT.',
  },

  notFound: {
    code: '404',
    title: 'Сигнал втрачено',
    body: 'Такої ділянки неба в цьому огляді немає. Поверніться на головну та виберіть об’єкт.',
    action: 'Назад до огляду',
  },
};

export const translations: Record<Lang, Dictionary> = { en, uk };

export default translations;
