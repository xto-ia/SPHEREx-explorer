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
      'Browser-native blink comparator, image arithmetic and multi-visit spectroscopy for the NASA SPHEREx near-infrared all-sky survey.',
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
      'Enter a patch of sky and blink through multi-epoch SPHEREx images like a little video. Add epochs together, subtract them to expose moving objects, and build a real spectrum from every visit that covers the source — all from the real archive frames.',
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

    intakeDocHint: 'Coordinate formats, field-of-view sizes and the workflow live in the documentation.',
    intakeDocLink: 'Read the guide',

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
      'Public archive data lets anyone contribute to science — no observatory required.',

    challengeKicker: 'THE CHALLENGE',
    challengeTitle: 'Built for NASA Space Apps',
    challengeBody:
      'The NASA Space Apps Challenge is the world’s largest hackathon: teams everywhere build open projects on NASA and partner data in a 48-hour sprint. This explorer answers the 2026 Planet X & SPHEREx challenge.',
    challengePrimaryCta: 'Space Apps website',
    challengeSecondaryCta: 'Planet X & SPHEREx challenge',

    targetsHeading: 'Official test targets',
    targetsSubheading: 'Five sources chosen to stress-test motion, variability and spectral depth.',
    targetsKicker: 'TEST TARGETS',
    targetsOpen: 'Open in workspace',
    targetMotion: 'Proper motion',
    targetType: 'Type',
  },

  workspace: {
    title: 'Analysis workspace',
    subtitle:
      'Blink, wipe, co-add and subtract SPHEREx epochs, then read the near-infrared spectrum.',
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
    modeCompare: 'Before / After',
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
    arithmeticCompareHint:
      'Wipe one visit over another: drag the divider to sweep the seam across the same sky grid.',
    bandsTitle: 'Channels & detector arrays',
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
      'Click any object in the viewport to measure it across every visit that covers it and plot flux against wavelength with molecular markers.',
    spectrumExtracting: 'Scanning every visit that covers this position (first build takes 1–3 minutes, then it is cached)',
    spectrumSelected: 'Selected channel',
    spectrumNoSignal: 'no signal in this channel',
    spectrumVisits: 'visits',
    spectrumChannels: 'channels',
    spectrumProducts: 'exposures',
    spectrumOutside: 'outside the nominal 102 channels',
    spectrumRecentred: 're-centred',
    spectrumMethod: 'Method',
    spectrumError: 'error bars',
    spectrumApertureNote: 'aperture 2×FWHM · local annulus · VARIANCE-based errors',
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
    compareBefore: 'Before (A)',
    compareAfter: 'After (B)',
    compareSameEpoch: 'Same epoch on both sides — pick another visit',
    compareDragHint:
      'Drag the line to wipe · drag the grip along the line to uncover a source · ←/→ nudge 1% · ↑/↓ slide the grip · double-click resets · V exits',
    splitPosition: 'Divider position',
    gripPosition: 'grip',
    swapEpochs: 'Swap A / B',
    compareScaleLabel: 'Brightness scale',
    compareSharedStretch: 'Shared',
    comparePerFrameStretch: 'Per frame',
    compareScaleHint:
      'Shared: one p1/p99 for both halves, so a real flux change stays visible across the seam.',
    compareMissingSide: 'No archive plane for epoch B — pick another visit',
    molecularMarkers: 'Molecular markers',
    markersHint: 'click a marker to load its nearest band',
    stretchLabel: 'Display stretch',
    gain: 'Stretch gain',
    rendering: 'rendering',
    discovering: 'discovering archive products',
    loadingEpochs: 'loading {done}/{total} epochs',
    apiOffline:
      'The archive service is not responding. Check your connection and try again in a minute.',
    noCoverage:
      'No SPHEREx product covers this field. Choose another coordinate or press Random point.',
    archiveUnreachable:
      'The archive did not answer (IRSA timeout or 502). This is an upstream outage, not an empty field — retry in a minute.',
    noDetectorData: 'This field has no product for the selected detector in any epoch.',
    aligningArrays: 'Aligning detector arrays',
    flagsToggle: 'Contamination',
    contaminationOverlay: 'Contamination bitmask overlay',
    clickToProfile: 'Click a source to build its multi-visit spectrum',
    pixelValue: 'Surface brightness',
    flagsShort: 'flags',
    stepBack: 'Previous epoch',
    stepForward: 'Next epoch',
    exposure: 'Exposure',
    frame: 'frame',
    keyboardHint: 'Space · ← → · D diff · C co-add',
    shortcuts:
      'Shortcuts: Space play/pause · ←/→ epoch · B blink · C co-add · D difference · V before/after · F flags · G grid · L labels · Esc clear',
    playbackBlinkOnly: 'Playback is available in Blink mode.',
    channelBands: 'Channels',
    channelArrays: 'Arrays',
    channelShort: 'channel',
    channelOutside: 'outside the 102 channels',
    maskFlags: 'Mask flagged',
    maskFlagsHint:
      'Hide pixels whose FLAGS carry a contamination bit instead of tinting them.',
    nativeSampling: 'Native sampling',
    nativeSamplingHint:
      'Use the detector\'s own 6.15" pixels instead of the 480² display grid, so the viewport is not oversampled.',
    bandStackHint:
      'A Level-2 frame is a spectral image: every row carries its own wavelength. Pick a channel to show only the pixels the mission assigns to it.',
    spectralImage: 'spectral image',
    spectralImageShort: '17 ch',
    seventeenChannels: '17 channels · spectral image',
    activeArray: 'active',
    quickLook: 'Quick look · 6 detectors',
    quickLookHint:
      'Quick look: the mean of all six detector planes of one visit. It mixes different wavelengths, so it is a navigation aid, never a measurement.',
    showWholeArray: 'Show the whole detector',
    channelOutsideCutout: 'not in this cutout',
    channelOutsideCutoutHint:
      'This channel is not inside the current cutout (0.5 deg covers ~2.5 channels). Widen the field to see the whole detector.',
    widenToDetector: 'Widen the field to 3.6°',
    previousBand: 'Previous channel',
    nextBand: 'Next channel',
    arrayStack: 'whole spectral image',
    snrGain: 'SNR',
    allArrays: 'All arrays',
    allArraysHint:
      'Quick look only: the six detector planes cover different wavelength ranges and a spectral image carries one wavelength per row, so this mean is not a photometric measurement.',
    backToArrays: 'Back to detector arrays',
    stackedBands: '{n} channel(s) in view',
    uiMode: 'Workspace mode',
    uiSimple: 'Simple',
    uiAdvanced: 'Advanced',
    simpleArraysTitle: 'Detector arrays',
    simpleArraysBody:
      'One real image per detector. Each frame holds all 17 channels of its band at once — every row has its own wavelength — so nothing is invented or averaged away.',
    simpleArraysActive: 'active detector',
    quickLookShort: 'Whole-field overview',
    quickLookTag: 'quick look',
    spectrumPending: 'Source selected. The spectrum is measured in every archive visit that covers it.',
    spectrumBuild: 'Build spectrum',
    spectrumBuildHint: 'First build: 1–3 minutes · then cached',
    spectrumSimpleNote:
      'Each dot is one real SPHEREx measurement at that wavelength; the bars are its uncertainty.',
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
    legendTitle: 'Legend',
    legendTarget: 'Science target',
    legendGaia: 'Gaia DR3 + PM',
    legendWise: 'WISE / NEOWISE',
    legendNeo: 'NEOSSat frame',
    legendFlags: 'Contaminated pixel',
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
      'Click a source. The backend measures it in every visit that covers it, at the wavelength of the channel that visit samples, and returns flux with variance-based errors.',
    spectrumModel: 'Model',
    spectrumCopyCsv: 'CSV',
    spectrumDownload: 'Download',
    spectrumSource: 'Source',
    spectrumPeak: 'Peak band',
    spectrumFlux: 'Flux',
    spectrumDetected: 'Detected',
    spectrumAperture: 'Aperture',
    spectrumFootnote:
      'Multi-visit aperture photometry (2×FWHM aperture, local annulus, VARIANCE errors). One point = one real exposure at the channel wavelength that covers the source.',
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
    sectionIntake: 'Coordinates, field of view & workflow',
    sectionModes: 'Two workspace modes',
    sectionSources: 'Data sources & archive pipelines',
    sectionPipeline: 'Pipeline & provenance',
    sectionWalkthrough: 'Test targets & what to look for',
    sectionEmbed: 'URL & iframe embed API',
    sectionShortcuts: 'Keyboard shortcuts',
    sectionLimitations: 'Limitations & roadmap',

    capabilitiesBody:
      'Six instruments in one workspace, all executed in the browser on Float32Array buffers.',

    intakeBody:
      'The Explorer asks for one pointing: right ascension, declination and a field of view. Those three values travel into the workspace URL, so any view can be bookmarked, shared or embedded later.',
    intakeCoordinatesTitle: 'Right ascension & declination',
    intakeCoordinatesPoints: [
      'RA accepts decimal degrees (0–360) or sexagesimal hours: 17h57m48.5s, 17:57:48.5 and 17 57 48.5 all parse the same way.',
      'Dec accepts decimal degrees (−90 to +90) or sexagesimal degrees: +04d41m36s, +04:41:36, +04 41 36 and +04°41′36″ are equivalent.',
      'A bare number is read as decimal degrees; unit letters, colons, spaces and °/′/″ separators are optional, and RA wraps into 0–360.',
      'Minutes and seconds must stay below 60, and Dec outside ±90 is rejected: the field is marked invalid and no search runs.',
      'The Coordinates readout echoes the parsed pointing as decimal degrees plus sexagesimal, so the sign can be checked before searching.',
      'The last field you searched is stored in this browser and restored on your next visit.',
    ],
    intakeExamplesTitle: 'Accepted formats',
    intakeExamples: [
      { label: 'RA · decimal', value: '269.452075' },
      { label: 'RA · sexagesimal', value: '17h57m48.5s' },
      { label: 'Dec · decimal', value: '+4.693364' },
      { label: 'Dec · sexagesimal', value: '+04°41′36.1″' },
    ],
    intakeFovTitle: 'Field of view',
    intakeFovBody:
      'FoV sets how much sky one frame covers. The backend always resamples onto a 480 × 480 display grid, so a small field magnifies the target while a wide field catches fast movers — at the cost of coarser sampling and a larger cutout to transfer.',
    intakeFovGuide: [
      { label: '0.1°', body: '6′ across — resolved binaries and parallax wobble.' },
      { label: '0.25°', body: '15′ — Epsilon Indi B’s 0.7″ pair and nearby fast stars.' },
      { label: '0.5°', body: '30′ — survey cutout: proper motion plus asteroid tracks.' },
      { label: '1–2°', body: 'Wider sweeps: more sky per frame, coarser sampling of each source.' },
      { label: '5°', body: 'NEOs and comets crossing the field within a single visit.' },
    ],
    intakeFovNote:
      'At 0.5° only about 2.5 of the 17 channels of a detector fall inside the cutout; the Channels tab flags this and offers a one-click widen to 3.6°.',
    intakeRandomTitle: 'Random point',
    intakeRandomBody:
      'Random point asks the backend for a coordinate that a SPHEREx product actually covers before filling the form, so it never offers an empty field. If the archive check fails, the current pointing is kept and a warning explains why.',
    intakeWorkflowTitle: 'From coordinates to a spectrum',
    intakeWorkflowBody:
      'Five steps cover the whole workspace. Simple and Advanced mode share the same real epochs and the same worker math; Advanced only adds instrument-level controls.',
    intakeWorkflowSteps: [
      'Enter RA/Dec, or open one of the NASA test targets, and pick a field of view.',
      'Press Search Sky Data — RA, Dec and FoV travel into the URL while the backend discovers the products.',
      'Blink the epochs, then switch to Co-Add or Difference to isolate motion.',
      'Pick a detector array, then a channel inside it: the viewport keeps only the pixels the mission assigns to that channel.',
      'Click a source to build its multi-visit spectrum; the pixel probe shows wavelength, σ, channel and the FLAGS bitmask.',
    ],
    readingTipsTitle: 'Reading the frames',
    readingTips: [
      'Blink first: a point that jumps between epochs is a mover candidate, and a difference image isolates it as a cyan/rose dipole.',
      'In difference mode static stars cancel: rose is new flux, cyan is flux that disappeared.',
      'Co-add the epochs to sharpen stationary sources; the spectrum itself is still measured visit by visit.',
      'A detector array is not a stack of channels: it is one spectral image with one wavelength per row. Switch to Advanced to isolate a single official channel.',
    ],
    overlaysLegendTitle: 'Overlay legend',
    legendTarget: 'Science target',
    legendGaia: 'Gaia DR3 + proper motion',
    legendWise: 'WISE / NEOWISE',
    legendNeo: 'NEOSSat frame',
    legendFlags: 'Contaminated pixel',

    modesBody:
      'The workspace has two surfaces over the same real data. Simple mode hides controls, not information: every pixel it shows is a real calibrated SPHEREx plane, and its spectrum is the same multi-visit measurement as in advanced mode.',
    modeSimpleTitle: 'Simple',
    modeSimpleFor:
      'First-time visitors, students, and anyone who wants a working image without instrument jargon.',
    modeSimplePoints: [
      'One real detector plane at a time: pick D1–D6 and blink through the epochs.',
      'The frame is the full spectral image of that band — all 17 channels at once, one wavelength per row.',
      'Blink, co-add, difference and before/after work exactly as in advanced mode.',
      'Clicking a source only selects it; the spectrum is built when you press "Build spectrum", because the first build scans the archive for 1–3 minutes.',
      'Movers & transients scan, the contamination overlay, the pixel value and the flags are all available.',
    ],
    modeAdvancedTitle: 'Advanced',
    modeAdvancedFor:
      'Astronomers and students who need the official channel definition, uncertainties and instrument-level detail.',
    modeAdvancedPoints: [
      'Official channel isolation: pick one of the 17 channels of a detector and the viewport keeps only the pixels the mission assigns to it (IRSA spectral_channels map).',
      'Per-pixel physics in the probe: surface brightness, σ from VARIANCE, S/N, channel index and WAVE-TAB wavelength.',
      'Mask flagged pixels instead of tinting them, and use native 6.15″ sampling instead of the 480² display grid.',
      'Full spectrum readout: per-point flags, recentring offsets and a CSV with 13 columns.',
      'Molecular markers, channel availability inside the current cutout, and the "widen the field to 3.6°" helper.',
    ],
    modeFeaturesTitle: 'What is available where',
    modeFeatureName: 'Feature',
    modeFeatureSimple: 'Simple',
    modeFeatureAdvanced: 'Advanced',
    modeFeatureNote: 'Notes',
    modeFeatures: [
      {
        name: 'Blink, co-add, difference, before/after',
        simple: true,
        advanced: true,
        note: 'Same real epochs and the same worker math in both modes.',
      },
      {
        name: 'Detector arrays D1–D6',
        simple: true,
        advanced: true,
        note: 'One real spectral image per detector, all 17 channels at once.',
      },
      {
        name: 'Whole-field overview (quick look)',
        simple: true,
        advanced: true,
        note: 'Mean of the six detectors; it mixes wavelengths, so it is a navigation aid only.',
      },
      {
        name: 'Official channel isolation (17 per array)',
        simple: false,
        advanced: true,
        note: 'Masks every pixel the mission assigns to another channel.',
      },
      {
        name: 'Pixel probe (value, σ, S/N, λ, channel)',
        simple: true,
        advanced: true,
        note: 'Simple mode shows the value and flags; advanced adds σ, S/N, wavelength and channel.',
      },
      {
        name: 'Multi-visit spectrum',
        simple: true,
        advanced: true,
        note: 'The same measurement; simple mode asks before starting the scan.',
      },
      {
        name: 'Movers & transients scan',
        simple: true,
        advanced: true,
        note: '6σ peaks in the cleaned epoch difference.',
      },
      {
        name: 'Contamination overlay',
        simple: true,
        advanced: true,
        note: 'Tints pixels carrying a contamination bit.',
      },
      {
        name: 'Mask flagged pixels',
        simple: false,
        advanced: true,
        note: 'Hides contaminated pixels entirely instead of tinting them.',
      },
      {
        name: 'Native 6.15″ sampling',
        simple: false,
        advanced: true,
        note: 'Avoids oversampling the detector on a fixed 480² grid.',
      },
      {
        name: 'URL state & iframe embed',
        simple: true,
        advanced: true,
        note: 'The mode itself travels as ?ui=simple or ?ui=advanced.',
      },
    ],
    capabilityCompareTitle: 'Before / after wipe',
    capabilityCompareBody:
      'Any two visits of the same field are stacked on one resampled grid: drag the divider to sweep the seam across the sky, with a shared brightness scale so real flux changes stay visible.',
    capabilityBlinkTitle: 'Blink comparator',
    capabilityBlinkBody:
      'Time-series epochs play like a video so motion between visits is immediately obvious.',
    capabilityDiffTitle: 'Difference imaging',
    capabilityDiffBody:
      'Epoch B − epoch A cancels static stars and leaves a high-contrast dipole for every moving source.',
    capabilityArrayTitle: 'Official channel isolation',
    capabilityArrayBody:
      'A Level-2 plane is a spectral image: its rows span the 17 channels of that band. Selecting a channel keeps only the pixels the mission assigns to it, so you see one monochromatic slice instead of a wavelength-mixed average.',
    capabilitySpectrumTitle: 'Multi-visit spectroscopy',
    capabilitySpectrumBody:
      'A click measures the source in every visit that covers it and plots flux against the wavelength of the channel that visit samples — forced photometry in uJy with VARIANCE-based error bars and molecular markers.',
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
      'Align — every epoch is resampled with its real SIP/WCS onto one tangent-plane grid, and the FLAGS bitmask and VARIANCE plane are decoded alongside.',
      'Calibrate — the official spectral_channels product supplies the per-pixel channel index (0–18) and the authoritative 102-channel table (centre, edges, R, bandwidth); WAVE-TAB supplies a per-pixel wavelength grid.',
      'Render — the Web Worker stretches the real MJy/sr planes, co-adds epochs, forms differences and masks everything outside the selected channel; only RGBA buffers reach the canvas.',
      'Combine — the six-detector mean is a quick look (it mixes wavelengths); channel isolation always uses the official channel map, never an even split of the band.',
      'Measure — a click runs multi-visit aperture photometry: one spectral image per visit, 2×FWHM aperture, local annulus background, VARIANCE errors, flux in uJy.',
    ],
    provenanceNote:
      'Provenance is always visible: the workspace shows the archive collection, the epoch MJD, the detector and the pixel values in MJy/sr for every frame it renders.',
    upgradeNote:
      'Update path: add the new SIA2 collection to SIA_COLLECTIONS in backend/app/config.py, point the FITS reader at the matching AWS Open Data prefix, and the UI inherits the new epochs.',

    walkthroughBody:
      'These five sources were chosen by NASA to exercise motion, binarity, variability and spectral depth. Each card opens the workspace on the target with its recommended field of view.',

    embedBody:
      'The workspace is fully addressable. Pass coordinates and view state as query parameters to restore or embed an exact view.',
    embedParams: [
      'ra — right ascension in decimal degrees (0–360)',
      'dec — declination in decimal degrees (−90 to +90)',
      'fov — field of view in degrees',
      'target — test-target slug (barnard, epsilon-indi-b, wise-0855, rw-aurigae, r-draconis)',
      'mode — blink | coadd | diff | compare',
      'ui — simple | advanced workspace surface (simple by default)',
      'band — 1–102: isolate one official spectral channel',
      'array — 1–6: show the whole spectral image of one detector array',
      'band=0 (or array=0) — quick look: mean of the six detectors, not a measurement',
      'epoch — 0–5, the frame shown in Blink mode',
      'a, b — epoch indices for difference imaging and the before/after pair (0–5)',
      'fps — blinking frame rate, 0.5–12',
      'stretch — asinh | linear | sqrt | log',
      'gain — stretch gain, 0.5–40',
      'flags — 1 to tint contaminated pixels',
      'mask — 1 to hide contaminated pixels instead of tinting them',
      'ovl — comma-separated overlay list: grid, labels, gaia, wise, neossat, tracks',
    ],
    embedExampleTitle: 'Embed snippet',
    embedExample:
      '<iframe\n  src="https://your-host/workspace?ra=269.452075&dec=4.693364&fov=0.5&target=barnard&mode=diff&band=0"\n  width="100%"\n  height="720"\n  style="border:1px solid #27272a"\n  title="SPHEREx Sky Explorer"\n  loading="lazy"\n></iframe>',
    embedNote: 'The workspace needs the API: run the backend, then embed the frontend origin.',

    shortcutsBody: 'Every control is reachable from the keyboard while the workspace is focused.',
    shortcuts: [
      { keys: 'Space', action: 'Play or pause the blink loop' },
      { keys: '← / →', action: 'Step one epoch, or nudge the divider in compare mode' },
      { keys: 'B / C / D', action: 'Blink, co-add or difference mode' },
      { keys: 'V', action: 'Toggle the before / after compare' },
      { keys: 'F', action: 'Toggle the contamination overlay' },
      { keys: 'G / L', action: 'Toggle the sky grid or source labels' },
      { keys: 'Esc', action: 'Clear the selected source and spectrum' },
      { keys: 'Wheel', action: 'Scroll the workspace panels' },
    ],

    limitationsBody:
      'The explorer is honest about what public archives expose today.',
    limitations: [
      'IRSA SIA2 and TAP do not send CORS headers, so the Python backend performs all archive queries.',
      'A Level-2 file is a spectral image: every pixel carries one wavelength, so a single exposure measures each position in exactly one channel. A spectrum is assembled from many visits, and the first build for a target scans ~100 archive products (1–3 minutes) before it is cached.',
      'A channel cutout is a strip of the detector, not a full field: at 0.5° only ~2.5 channels fall inside the frame, so widen the field to see the whole detector.',
      'Photometry is aperture-based. In crowded fields blending and the undersampled PSF (FWHM ≈ 7″ ≈ 1.2 pixel) limit the accuracy; no PSF fitting or aperture correction is applied.',
      'The quick look averages the six detector planes, which mix different wavelengths: it is a navigation aid, never a photometric measurement.',
      'WAVE-TAB is the visualisation-grade wavelength model; the science-grade CWAVE/CBAND calibration product is not used yet.',
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
    tagline: 'Exploring the infrared sky on real archive frames.',
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
      'Введіть ділянку неба та переглядайте зображення SPHEREx за кілька епох як коротке відео. Додавайте епохи, віднімайте їх, щоб побачити рухомі об’єкти, і будуйте справжній спектр із кожного візиту, що покриває джерело — усе з реальних архівних кадрів.',
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
      'Перевірка архіву не вдалася, тож випадкову точку не змінено.',

    viewerRig: 'Налаштування рига',
    viewerCopy: 'Копіювати константи',
    viewerLoading: 'Завантаження моделі апарата…',
    viewerFallback: 'WebGL-модель недоступна — показано схему',

    intakeDocHint: 'Формати координат, розміри поля зору та робочий процес — у документації.',
    intakeDocLink: 'Читати посібник',

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
      'Публічні архівні дані дозволяють кожному долучитися до науки — без власної обсерваторії.',

    challengeKicker: 'ЗАВДАННЯ',
    challengeTitle: 'Створено для NASA Space Apps',
    challengeBody:
      'NASA Space Apps Challenge — найбільший у світі хакатон: команди з усього світу за 48 годин створюють відкриті проєкти на даних NASA та партнерів. Цей огляд відповідає на завдання Planet X & SPHEREx 2026 року.',
    challengePrimaryCta: 'Сайт хакатону',
    challengeSecondaryCta: 'Завдання Planet X & SPHEREx',

    targetsHeading: 'Офіційні тестові об’єкти',
    targetsSubheading: 'П’ять джерел, підібраних для перевірки руху, змінності та спектральної глибини.',
    targetsKicker: 'ТЕСТОВІ ОБ’ЄКТИ',
    targetsOpen: 'Відкрити в робочому полі',
    targetMotion: 'Власний рух',
    targetType: 'Тип',
  },

  workspace: {
    title: 'Робоче поле аналізу',
    subtitle:
      'Миготіння, шторка «до/після», додавання та віднімання епох SPHEREx, далі — інфрачервоний спектр.',
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
    modeCompare: 'До / Після',
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
    arithmeticCompareHint:
      'Накладіть один візит на інший: тягніть розділювач, і шов іде по тій самій сітці неба.',
    bandsTitle: 'Канали та матриці детекторів',
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
      'Клацніть будь-який об’єкт у вікні, щоб виміряти його в кожному візиті, що його покриває, і побудувати потік проти довжини хвилі з молекулярними маркерами.',
    spectrumExtracting: 'Скануємо всі візити, що покривають цю позицію (перша побудова — 1–3 хвилини, далі з кешу)',
    spectrumSelected: 'Вибраний канал',
    spectrumNoSignal: 'у цьому каналі немає сигналу',
    spectrumVisits: 'візитів',
    spectrumChannels: 'каналів',
    spectrumProducts: 'експозицій',
    spectrumOutside: 'поза номінальними 102 каналами',
    spectrumRecentred: 'перецентровано',
    spectrumMethod: 'Метод',
    spectrumError: 'похибки',
    spectrumApertureNote: 'апертура 2×FWHM · локальне кільце · похибки з VARIANCE',
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
    compareBefore: 'До (A)',
    compareAfter: 'Після (B)',
    compareSameEpoch: 'З обох боків та сама епоха — оберіть інший візит',
    compareDragHint:
      'Тягніть лінію, щоб зсунути шов · тягніть ручку вздовж лінії, щоб відкрити джерело · ←/→ зсув на 1 % · ↑/↓ ручка · подвійний клік скидає · V вихід',
    splitPosition: 'Позиція розділювача',
    gripPosition: 'ручка',
    swapEpochs: 'Поміняти A / B',
    compareScaleLabel: 'Шкала яскравості',
    compareSharedStretch: 'Спільна',
    comparePerFrameStretch: 'Для кожного',
    compareScaleHint:
      'Спільна: один p1/p99 для обох половин, тож справжня зміна потоку лишається видимою на шві.',
    compareMissingSide: 'Немає архівної площини для епохи B — оберіть інший візит',
    molecularMarkers: 'Молекулярні маркери',
    markersHint: 'клацніть маркер, щоб завантажити найближчий канал',
    stretchLabel: 'Розтяг зображення',
    gain: 'Підсилення розтягу',
    rendering: 'рендеринг',
    discovering: 'пошук архівних продуктів',
    loadingEpochs: 'завантаження епох {done}/{total}',
    apiOffline:
      'Архівний сервіс не відповідає. Перевірте з’єднання й спробуйте ще раз за хвилину.',
    noCoverage:
      'Жоден продукт SPHEREx не покриває це поле. Виберіть інші координати або натисніть «Випадкова точка».',
    archiveUnreachable:
      'Архів не відповів (таймаут IRSA або 502). Це збій на боці архіву, а не порожнє поле — повторіть за хвилину.',
    noDetectorData: 'Для цього поля немає продукту вибраної матриці в жодній епосі.',
    aligningArrays: 'Вирівнювання матриць детекторів',
    flagsToggle: 'Забруднення',
    contaminationOverlay: 'Накладання маски забруднення',
    clickToProfile: 'Клацніть джерело, щоб побудувати мультивізитний спектр',
    pixelValue: 'Поверхнева яскравість',
    flagsShort: 'прапорці',
    stepBack: 'Попередня епоха',
    stepForward: 'Наступна епоха',
    exposure: 'Експозиція',
    frame: 'кадр',
    keyboardHint: 'Space · ← → · D різниця · C додавання',
    shortcuts:
      'Клавіші: Space — відтворення/пауза · ←/→ — епоха · B — миготіння · C — додавання · D — різниця · V — до/після · F — прапорці · G — сітка · L — підписи · Esc — очистити',
    playbackBlinkOnly: 'Відтворення доступне в режимі миготіння.',
    channelBands: 'Канали',
    channelArrays: 'Матриці',
    channelShort: 'канал',
    channelOutside: 'поза 102 каналами',
    maskFlags: 'Маскувати прапорці',
    maskFlagsHint:
      'Приховувати пікселі, у FLAGS яких стоїть біт забруднення, замість підсвічування.',
    nativeSampling: 'Нативна вибірка',
    nativeSamplingHint:
      'Використовувати власні пікселі детектора 6.15″ замість сітки 480², щоб не передискретизувати зображення.',
    bandStackHint:
      'Кадр рівня 2 — це спектральне зображення: кожен рядок має власну довжину хвилі. Виберіть канал, щоб показати лише ті пікселі, які місія віднесла до нього.',
    spectralImage: 'спектральне зображення',
    spectralImageShort: '17 кан.',
    seventeenChannels: '17 каналів · спектральне зображення',
    activeArray: 'активна',
    quickLook: 'Швидкий перегляд · 6 матриць',
    quickLookHint:
      'Швидкий перегляд: середнє шести площин детекторів одного візиту. Воно змішує різні довжини хвиль, тому це лише навігаційний режим, а не вимірювання.',
    showWholeArray: 'Показати всю матрицю',
    channelOutsideCutout: 'немає в цьому кадрі',
    channelOutsideCutoutHint:
      'Цей канал не потрапляє в поточний кадр (0.5° вміщає ~2.5 канали). Розширте поле, щоб побачити всю матрицю.',
    widenToDetector: 'Розширити поле до 3.6°',
    previousBand: 'Попередній канал',
    nextBand: 'Наступний канал',
    arrayStack: 'повне спектральне зображення',
    snrGain: 'SNR',
    allArrays: 'Усі матриці',
    allArraysHint:
      'Лише швидкий перегляд: шість площин детекторів покривають різні діапазони, а спектральне зображення має одну довжину хвилі на рядок, тому це середнє не є фотометричним вимірюванням.',
    backToArrays: 'Назад до матриць детекторів',
    stackedBands: 'каналів у кадрі: {n}',
    uiMode: 'Режим робочого поля',
    uiSimple: 'Простий',
    uiAdvanced: 'Розширений',
    simpleArraysTitle: 'Матриці детекторів',
    simpleArraysBody:
      'Одне реальне зображення на детектор. Кожен кадр містить усі 17 каналів своєї смуги одночасно — кожен рядок має власну довжину хвилі — тож нічого не вигадано й не усереднено.',
    simpleArraysActive: 'активна матриця',
    quickLookShort: 'Огляд усього поля',
    quickLookTag: 'швидкий перегляд',
    spectrumPending: 'Джерело вибрано. Спектр вимірюється в кожному архівному візиті, що його покриває.',
    spectrumBuild: 'Побудувати спектр',
    spectrumBuildHint: 'Перша побудова: 1–3 хвилини · далі з кешу',
    spectrumSimpleNote:
      'Кожна точка — одне реальне вимірювання SPHEREx на цій довжині хвилі; риски — його похибка.',
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
    legendTitle: 'Легенда',
    legendTarget: 'Науковий об’єкт',
    legendGaia: 'Gaia DR3 + власний рух',
    legendWise: 'WISE / NEOWISE',
    legendNeo: 'Кадр NEOSSat',
    legendFlags: 'Забруднений піксель',
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
      'Клацніть джерело. Бекенд вимірює його в кожному візиті, що його покриває, на довжині хвилі каналу цього візиту, і повертає потік із похибками з VARIANCE.',
    spectrumModel: 'Модель',
    spectrumCopyCsv: 'CSV',
    spectrumDownload: 'Завантажити',
    spectrumSource: 'Джерело',
    spectrumPeak: 'Піковий канал',
    spectrumFlux: 'Потік',
    spectrumDetected: 'Виявлено',
    spectrumAperture: 'Апертура',
    spectrumFootnote:
      'Мультивізитна апертурна фотометрія (апертура 2×FWHM, локальне кільце, похибки з VARIANCE). Одна точка — одна реальна експозиція на довжині хвилі каналу, що покриває джерело.',
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
    sectionIntake: 'Координати, поле зору та робочий процес',
    sectionModes: 'Два режими робочого поля',
    sectionSources: 'Джерела даних і архівні конвеєри',
    sectionPipeline: 'Конвеєр і походження даних',
    sectionWalkthrough: 'Тестові об’єкти та на що дивитися',
    sectionEmbed: 'API URL та вбудовування через iframe',
    sectionShortcuts: 'Клавіатурні скорочення',
    sectionLimitations: 'Обмеження та план розвитку',

    capabilitiesBody:
      'Шість інструментів в одному робочому полі — усі виконуються в браузері на буферах Float32Array.',

    intakeBody:
      'Сторінка огляду запитує одне наведення: пряме піднесення, схилення та поле зору. Ці три значення потрапляють в URL робочого поля, тож будь-який вигляд можна зберегти в закладках, надіслати або вбудувати.',
    intakeCoordinatesTitle: 'Пряме піднесення та схилення',
    intakeCoordinatesPoints: [
      'RA приймає десяткові градуси (0–360) або години-хвилини-секунди: 17h57m48.5s, 17:57:48.5 і 17 57 48.5 читаються однаково.',
      'Dec приймає десяткові градуси (−90…+90) або градуси-хвилини-секунди: +04d41m36s, +04:41:36, +04 41 36 і +04°41′36″ рівноцінні.',
      'Саме число завжди читається як десяткові градуси; літери одиниць, двокрапки, пробіли та символи °/′/″ необов’язкові, а RA загортається в 0–360.',
      'Хвилини й секунди мають бути менші за 60, а Dec поза ±90 відхиляється: поле позначається як некоректне, і пошук не запускається.',
      'Блок «Координати» показує розібране наведення в десяткових градусах і в годинах-хвилинах-секундах, тож знак можна перевірити до пошуку.',
      'Останнє поле, яке ви шукали, зберігається в цьому браузері й відновлюється під час наступного візиту.',
    ],
    intakeExamplesTitle: 'Прийняті формати',
    intakeExamples: [
      { label: 'RA · десяткові', value: '269.452075' },
      { label: 'RA · години', value: '17h57m48.5s' },
      { label: 'Dec · десяткові', value: '+4.693364' },
      { label: 'Dec · градуси', value: '+04°41′36.1″' },
    ],
    intakeFovTitle: 'Поле зору',
    intakeFovBody:
      'Поле зору визначає, яку ділянку неба охоплює один кадр. Бекенд завжди перепроєктує на сітку 480 × 480, тож мале поле наближає об’єкт, а широке ловить швидкі рухомі джерела — ціною грубшої дискретизації та більшого вирізу для передачі.',
    intakeFovGuide: [
      { label: '0.1°', body: '6′ — розділені подвійні та паралаксне хитання.' },
      { label: '0.25°', body: '15′ — пара Epsilon Indi B з розділенням 0,7″ і швидкі зорі.' },
      { label: '0.5°', body: '30′ — типовий кадр огляду: власний рух і треки астероїдів.' },
      { label: '1–2°', body: 'Ширші смуги: більше неба в кадрі, грубша дискретизація кожного джерела.' },
      { label: '5°', body: 'NEO та комети, що перетинають поле протягом одного візиту.' },
    ],
    intakeFovNote:
      'При 0.5° у кадр потрапляє лише близько 2,5 з 17 каналів детектора; вкладка «Канали» позначає це й пропонує розширити поле до 3.6° одним натисканням.',
    intakeRandomTitle: 'Випадкова точка',
    intakeRandomBody:
      '«Випадкова точка» питає бекенд про координату, яку реально покриває продукт SPHEREx, і лише тоді заповнює форму, тож порожнє поле не пропонується. Якщо перевірка архіву не вдалася, поточне наведення лишається, а попередження пояснює причину.',
    intakeWorkflowTitle: 'Від координат до спектра',
    intakeWorkflowBody:
      'П’ять кроків охоплюють усе робоче поле. Простий і розширений режими використовують ті самі реальні епохи й ту саму математику; розширений додає лише приладові елементи керування.',
    intakeWorkflowSteps: [
      'Введіть RA/Dec або відкрийте тестовий об’єкт NASA і виберіть поле зору.',
      'Натисніть «Шукати дані неба» — RA, Dec і FoV потрапляють в URL, а бекенд знаходить продукти.',
      'Перегляньте епохи в режимі миготіння, потім перемкніть на додавання або різницю, щоб виділити рух.',
      'Виберіть матрицю детектора, а потім канал у ній: вікно лишить тільки ті пікселі, які місія віднесла до цього каналу.',
      'Клацніть джерело, щоб побудувати мультивізитний спектр; проба пікселя показує довжину хвилі, σ, канал і бітмаску FLAGS.',
    ],
    readingTipsTitle: 'Як читати кадри',
    readingTips: [
      'Спершу миготіння: точка, що стрибає між епохами, — кандидат у рухомі об’єкти, а різницеве зображення перетворює її на бірюзово-рожевий диполь.',
      'У режимі різниці нерухомі зорі гасяться: рожевий — новий потік, бірюзовий — потік, що зник.',
      'Додайте епохи, щоб підсилити нерухомі джерела; сам спектр при цьому все одно вимірюється візит за візитом.',
      'Матриця детектора — не стек каналів: це одне спектральне зображення, де кожен рядок має власну довжину хвилі. Перемкніться на «Розширений», щоб ізолювати один офіційний канал.',
    ],
    overlaysLegendTitle: 'Легенда накладань',
    legendTarget: 'Науковий об’єкт',
    legendGaia: 'Gaia DR3 + власний рух',
    legendWise: 'WISE / NEOWISE',
    legendNeo: 'Кадр NEOSSat',
    legendFlags: 'Забруднений піксель',

    modesBody:
      'Робоче поле має дві поверхні над тими самими реальними даними. Простий режим ховає елементи керування, а не інформацію: кожен піксель, який він показує, — це реальна калібрована площина SPHEREx, а його спектр — те саме мультивізитне вимірювання, що й у розширеному режимі.',
    modeSimpleTitle: 'Простий',
    modeSimpleFor:
      'Для новачків, студентів і всіх, кому потрібне робоче зображення без приладового жаргону.',
    modeSimplePoints: [
      'Одна реальна площина детектора за раз: виберіть D1–D6 і переглядайте епохи в режимі миготіння.',
      'Кадр — повне спектральне зображення цієї смуги: усі 17 каналів одночасно, по одній довжині хвилі на рядок.',
      'Миготіння, додавання, різниця та «до/після» працюють точно так само, як у розширеному режимі.',
      'Клацання лише вибирає джерело; спектр будується після натискання «Побудувати спектр», бо перша побудова сканує архів 1–3 хвилини.',
      'Скан рухомих об’єктів, накладання забруднення, значення пікселя та прапорці — доступні.',
    ],
    modeAdvancedTitle: 'Розширений',
    modeAdvancedFor:
      'Для астрономів і студентів, яким потрібні офіційне визначення каналів, похибки та приладова деталізація.',
    modeAdvancedPoints: [
      'Ізоляція офіційного каналу: виберіть один із 17 каналів детектора, і вікно лишить тільки ті пікселі, які місія віднесла до нього (карта IRSA spectral_channels).',
      'Фізика на рівні пікселя в пробі: поверхнева яскравість, σ з VARIANCE, S/N, індекс каналу та довжина хвилі WAVE-TAB.',
      'Маскування пікселів із прапорцями замість підсвічування та нативна вибірка 6.15″ замість сітки 480².',
      'Повний вивід спектра: прапорці кожної точки, зсуви перецентрування та CSV із 13 колонок.',
      'Молекулярні маркери, доступність каналів у поточному кадрі та помічник «розширити поле до 3.6°».',
    ],
    modeFeaturesTitle: 'Що доступно де',
    modeFeatureName: 'Можливість',
    modeFeatureSimple: 'Простий',
    modeFeatureAdvanced: 'Розширений',
    modeFeatureNote: 'Примітки',
    modeFeatures: [
      {
        name: 'Миготіння, додавання, різниця, до/після',
        simple: true,
        advanced: true,
        note: 'Ті самі реальні епохи й та сама математика воркера в обох режимах.',
      },
      {
        name: 'Матриці детекторів D1–D6',
        simple: true,
        advanced: true,
        note: 'Одне реальне спектральне зображення на детектор, усі 17 каналів одночасно.',
      },
      {
        name: 'Огляд усього поля (швидкий перегляд)',
        simple: true,
        advanced: true,
        note: 'Середнє шести детекторів; змішує довжини хвиль, тому це лише навігаційний режим.',
      },
      {
        name: 'Ізоляція офіційного каналу (17 на матрицю)',
        simple: false,
        advanced: true,
        note: 'Маскує всі пікселі, які місія віднесла до іншого каналу.',
      },
      {
        name: 'Проба пікселя (значення, σ, S/N, λ, канал)',
        simple: true,
        advanced: true,
        note: 'Простий режим показує значення й прапорці; розширений додає σ, S/N, λ і канал.',
      },
      {
        name: 'Мультивізитний спектр',
        simple: true,
        advanced: true,
        note: 'Те саме вимірювання; простий режим питає перед запуском скану.',
      },
      {
        name: 'Скан рухомих об’єктів і транзієнтів',
        simple: true,
        advanced: true,
        note: 'Піки 6σ у очищеній різниці епох.',
      },
      {
        name: 'Накладання забруднення',
        simple: true,
        advanced: true,
        note: 'Підсвічує пікселі з бітом забруднення.',
      },
      {
        name: 'Маскувати прапорці',
        simple: false,
        advanced: true,
        note: 'Повністю приховує забруднені пікселі замість підсвічування.',
      },
      {
        name: 'Нативна вибірка 6.15″',
        simple: false,
        advanced: true,
        note: 'Не передискретизує детектор на фіксованій сітці 480².',
      },
      {
        name: 'Стан URL та вбудовування iframe',
        simple: true,
        advanced: true,
        note: 'Сам режим передається як ?ui=simple або ?ui=advanced.',
      },
    ],
    capabilityCompareTitle: 'Шторка «до/після»',
    capabilityCompareBody:
      'Будь-які два візити того самого поля лягають на одну перепроєктовану сітку: тягніть розділювач, і шов іде по небу, а спільна шкала яскравості зберігає видимою справжню зміну потоку.',
    capabilityBlinkTitle: 'Компаратор миготіння',
    capabilityBlinkBody:
      'Епохи часового ряду відтворюються як відео, тож рух між відвідинами видно одразу.',
    capabilityDiffTitle: 'Різницеве зображення',
    capabilityDiffBody:
      'Епоха B − епоха A гасить нерухомі зорі й лишає контрастний диполь для кожного рухомого джерела.',
    capabilityArrayTitle: 'Ізоляція офіційного каналу',
    capabilityArrayBody:
      'Площина рівня 2 — це спектральне зображення: її рядки покривають 17 каналів цієї смуги. Вибір каналу лишає тільки ті пікселі, які місія віднесла до нього, тож ви бачите монохроматичний зріз, а не усереднення різних довжин хвиль.',
    capabilitySpectrumTitle: 'Мультивізитна спектроскопія',
    capabilitySpectrumBody:
      'Клацання вимірює джерело в кожному візиті, що його покриває, і будує потік проти довжини хвилі каналу цього візиту — форсована фотометрія в мкЯн із похибками з VARIANCE та молекулярними маркерами.',
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
      'Вирівнювання — кожна епоха перепроєктується за своїм реальним SIP/WCS на спільну сітку, паралельно декодуються маска FLAGS і площина VARIANCE.',
      'Калібрування — офіційний продукт spectral_channels дає індекс каналу на піксель (0–18) і авторитетну таблицю 102 каналів (центр, межі, R, смуга); WAVE-TAB дає сітку довжин хвиль.',
      'Рендеринг — Web Worker розтягує справжні площини MJy/sr, додає епохи, будує різниці й маскує все поза вибраним каналом; на полотно потрапляють лише RGBA-буфери.',
      'Комбінування — середнє шести детекторів це лише швидкий перегляд (воно змішує довжини хвиль); ізоляція каналу завжди йде за офіційною картою каналів.',
      'Вимірювання — клацання запускає мультивізитну апертурну фотометрію: одне спектральне зображення на візит, апертура 2×FWHM, локальне кільце, похибки з VARIANCE, потік у мкЯн.',
    ],
    provenanceNote:
      'Походження даних завжди видиме: робоче поле показує колекцію архіву, MJD епохи, детектор і значення пікселів у MJy/sr для кожного кадру.',
    upgradeNote:
      'Шлях оновлення: додайте нову колекцію SIA2 у SIA_COLLECTIONS у backend/app/config.py, спрямуйте FITS-читач на відповідний префікс AWS Open Data — і інтерфейс отримає нові епохи.',

    walkthroughBody:
      'Ці п’ять джерел NASA обрала, щоб перевірити рух, подвійність, змінність і спектральну глибину. Кожна картка відкриває робоче поле на об’єкті з рекомендованим полем зору.',

    embedBody:
      'Робоче поле повністю адресується. Передавайте координати й стан перегляду як параметри запиту, щоб відтворити або вставити точний вигляд.',
    embedParams: [
      'ra — пряме піднесення в десяткових градусах (0–360)',
      'dec — схилення в десяткових градусах (−90…+90)',
      'fov — поле зору в градусах',
      'target — ідентифікатор об’єкта (barnard, epsilon-indi-b, wise-0855, rw-aurigae, r-draconis)',
      'mode — blink | coadd | diff | compare',
      'ui — simple | advanced: поверхня робочого поля (типово simple)',
      'band — 1–102: ізолювати один офіційний спектральний канал',
      'array — 1–6: показати повне спектральне зображення однієї матриці',
      'band=0 (або array=0) — швидкий перегляд: середнє шести детекторів, не вимірювання',
      'epoch — 0–5, кадр у режимі миготіння',
      'a, b — індекси епох для різницевого зображення та пари «до/після» (0–5)',
      'fps — частота миготіння, 0,5–12',
      'stretch — asinh | linear | sqrt | log',
      'gain — підсилення розтягу, 0,5–40',
      'flags — 1, щоб підсвітити забруднені пікселі',
      'mask — 1, щоб приховати забруднені пікселі замість підсвічування',
      'ovl — список накладань через кому: grid, labels, gaia, wise, neossat, tracks',
    ],
    embedExampleTitle: 'Фрагмент для вбудовування',
    embedExample:
      '<iframe\n  src="https://your-host/workspace?ra=269.452075&dec=4.693364&fov=0.5&target=barnard&mode=diff&band=0"\n  width="100%"\n  height="720"\n  style="border:1px solid #27272a"\n  title="SPHEREx Sky Explorer"\n  loading="lazy"\n></iframe>',
    embedNote: 'Робочому полю потрібен бекенд: запустіть API, а потім вбудовуйте адресу фронтенду.',

    shortcutsBody: 'Усі елементи керування доступні з клавіатури, коли робоче поле у фокусі.',
    shortcuts: [
      { keys: 'Space', action: 'Відтворити або зупинити миготіння' },
      { keys: '← / →', action: 'Перейти на одну епоху або зсунути розділювач у режимі порівняння' },
      { keys: 'B / C / D', action: 'Режим миготіння, додавання або різниці' },
      { keys: 'V', action: 'Увімкнути або вимкнути порівняння «до/після»' },
      { keys: 'F', action: 'Перемкнути накладання забруднення' },
      { keys: 'G / L', action: 'Перемкнути сітку неба або підписи джерел' },
      { keys: 'Esc', action: 'Очистити вибране джерело та спектр' },
      { keys: 'Колесо', action: 'Прокручувати панелі робочого поля' },
    ],

    limitationsBody:
      'Огляд чесно показує, що сьогодні віддають публічні архіви.',
    limitations: [
      'IRSA SIA2 і TAP не надсилають заголовків CORS, тож усі архівні запити виконує бекенд на Python.',
      'Файл рівня 2 — це спектральне зображення: кожен піксель має одну довжину хвилі, тому одна експозиція вимірює кожну позицію лише в одному каналі. Спектр збирається з багатьох візитів, і перша побудова для об’єкта сканує ~100 архівних продуктів (1–3 хвилини), після чого кешується.',
      'Виріз каналу — це смуга детектора, а не повне поле: при 0,5° у кадр потрапляє лише ~2,5 канали, тож розширте поле, щоб побачити всю матрицю.',
      'Фотометрія апертурна. У щільних полях блендінг і недодискретизована PSF (FWHM ≈ 7″ ≈ 1,2 пікселя) обмежують точність; PSF-фітинг і поправка на апертуру не застосовуються.',
      'Швидкий перегляд усереднює шість площин детекторів, які змішують різні довжини хвиль: це навігаційний режим, а не фотометричне вимірювання.',
      'WAVE-TAB — модель довжин хвиль рівня візуалізації; науковий продукт CWAVE/CBAND поки не використовується.',
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
    tagline: 'Дослідження інфрачервоного неба на реальних архівних кадрах.',
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
