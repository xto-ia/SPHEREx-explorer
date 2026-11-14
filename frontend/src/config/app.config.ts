/**
 * SPHEREx Sky Explorer — central configuration.
 *
 * This is the single file to edit when you want to re-skin the UI or retune the
 * 3D spacecraft rig. Everything else in the app reads from here.
 */

export interface SpacecraftConfig {
  /** Initial Euler tilt in radians (x: pitch toward the viewer, y: yaw, z: roll). */
  initialTilt: { x: number; y: number; z: number };
  /** Spin around the spacecraft's own symmetry (bore-sight) axis, rad/s. */
  axialSpinSpeed: number;
  /** Slow turntable spin around the outer, scene-vertical axis, rad/s. */
  orbitSpinSpeed: number;
  /** Outer-axis rotation applied per pixel of left-button drag, rad/px. */
  orbitDragSensitivity: number;
  /** Seconds of inactivity before the automatic turntable spin resumes. */
  orbitAutoResumeDelay: number;
  /** Vertical zero-gravity floating amplitude, world units. */
  floatAmplitude: number;
}

export interface RenderConfig {
  /**
   * False colour for the calibrated MJy/sr planes. SPHEREx Level-2 products are
   * single-band images with no intrinsic colour, so this is a pure display
   * choice: `#ffffff` renders a neutral grey/white frame. Any #rgb or #rrggbb
   * hex value is accepted.
   */
  frameColor: string;
}

export interface LayoutConfig {
  /**
   * Upward offset in pixels for the landing-page hero copy on screens ≥1024px.
   * The copy column is centred in the first screen; raising it keeps the
   * headline from sitting too low after a reload. 0 keeps it perfectly centred.
   */
  heroCopyRise: number;
}

export interface AppConfig {
  theme: {
    /** Main accent colour for the whole UI. Any #rgb or #rrggbb hex value. */
    accentColor: string;
  };
  render: RenderConfig;
  layout: LayoutConfig;
  spacecraft: SpacecraftConfig;
}

export const APP_CONFIG: AppConfig = {
  theme: {
    accentColor: "#56B6C2",
  },
  render: {
    frameColor: '#ffffff',
  },
  layout: {
    heroCopyRise: 130,
  },
  spacecraft: {
    initialTilt: { x: 0.65, y: -0.55, z: 0.15 },
    axialSpinSpeed: 0.25,
    orbitSpinSpeed: 0.14,
    orbitDragSensitivity: 0.006,
    orbitAutoResumeDelay: 2.4,
    floatAmplitude: 0.08,
  },
};
