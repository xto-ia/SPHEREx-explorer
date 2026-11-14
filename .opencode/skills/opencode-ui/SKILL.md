---
name: opencode-ui
description: OpenCode visual design system, 3D SPHEREx model axial rotation configuration, EN/UA localization, and 3-page layout rules.
---

# OpenCode UI, 3D Satellite & Localization Skill

## 1. Visual Tokens (OpenCode Aesthetic + Space Theme)
- Backgrounds:
  - Primary Canvas: #09090b with subtle procedural WebGL/Canvas starfield and deep-space nebula gradient (radial-gradient(circle at 50% 30%, rgba(16, 185, 129, 0.06), rgba(9, 9, 11, 0.98) 70%)).
  - Surface / Panels: rgba(18, 18, 22, 0.85) with backdrop-filter: blur(12px).
  - Borders: 1px solid #27272a (hover state: #3f3f46, active state: #10b981).
- Typography:
  - Load JetBrains Mono and Inter from Google Fonts.
  - Use font-mono for all headings, navigation links, buttons, coordinate inputs, wavelengths, and telemetry badges.
- Accents:
  - Primary Accent: #10b981 (Emerald) or #38bdf8 (Cyan) for active controls and spectral lines.
  - Warning / Contamination Flag: #f59e0b (Amber).
  - Moving Dipole Highlight: #f43f5e (Rose/Red) for positive flux difference, #38bdf8 (Cyan) for negative flux difference.
- Geometry: Crisp 0px or 2px border radius (rounded-none or rounded-sm). Expose structural 1px grid hairlines between panels.

## 2. 3D SPHEREx Model Configuration (SpherexModelCanvas.tsx)
The user's Blender model (/models/spherex.glb) has its concentric conical shields opening along Blender's +Z axis, which exports to Three.js as the local +Y axis.
To achieve the exact angled top-front view from the user's reference while spinning the spacecraft around its own central symmetry axis, you MUST:
1. Declare these tunable constants at the very top of src/components/home/SpherexModelCanvas.tsx:

export const MODEL_CONFIG = {
  MODEL_PATH: '/models/spherex.glb',
  INITIAL_TILT_X: 0.65,      // radians (~37 deg tilt toward viewer)
  INITIAL_TILT_Y: -0.55,     // radians (~-31 deg yaw to show solar panel on the right)
  INITIAL_TILT_Z: 0.15,      // radians (~8 deg roll)
  AXIAL_SPIN_SPEED: 0.25,    // rad/sec continuous slow spin around local bore-sight axis
  USE_OSCILLATION: false,    // set true to gently rock back-and-forth instead of full 360 axial spin
  OSCILLATION_ANGLE: 0.45,   // max swing angle in radians if USE_OSCILLATION is true
  FLOAT_AMPLITUDE: 0.08,     // vertical zero-gravity floating amplitude
  MODEL_SCALE: 1.4,
  CAMERA_POS: [0, 0.5, 4.5] as [number, number, number],
};

2. Use a Two-Group Hierarchy:
   - Outer Group (tiltGroupRef): Applies INITIAL_TILT_X, INITIAL_TILT_Y, INITIAL_TILT_Z plus subtle mouse parallax (mouse.x * 0.08, mouse.y * 0.08) and vertical floating (Math.sin(t * 0.8) * FLOAT_AMPLITUDE).
   - Inner Group (spinGroupRef): Centers the loaded .glb bounding box (<Center>) and rotates strictly around its own longitudinal axis (spinGroupRef.current.rotation.y += delta * MODEL_CONFIG.AXIAL_SPIN_SPEED).
3. Include a small collapsible [Camera / Rig Config] debug popover in the bottom-right corner of the 3D canvas with sliders for TILT_X, TILT_Y, TILT_Z, and SPIN_SPEED + a [Copy Constants] button so the user can visually fine-tune the angle in real time and paste the numbers into MODEL_CONFIG.

## 3. Bilingual Localization (EN Base + UA)
- Create src/i18n/translations.ts containing complete dictionaries for en (default) and uk (Ukrainian).
- Every component must use the useLanguage() hook (const { t, lang, setLang } = useLanguage()).
- In Navbar.tsx, place a terminal-style toggle [ EN | UA ] in the top right corner.
