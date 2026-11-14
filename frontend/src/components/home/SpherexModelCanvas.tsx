import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ErrorInfo,
  type MutableRefObject,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Center, useGLTF } from '@react-three/drei';
import { Check, Copy, RotateCcw, Settings2, X } from 'lucide-react';
import * as THREE from 'three';
import { useLanguage } from '../../i18n/LanguageContext';
import { APP_CONFIG } from '../../config/app.config';
import { clamp } from '../../lib/format';

/**
 * Geometry / camera rig for /models/spherex.glb.
 *
 * Rotation speeds and the initial tilt live in src/config/app.config.ts — edit
 * them there. The in-canvas dev popover (?rig=1) writes the same values back in
 * the right shape, ready to paste into that file.
 */
export const MODEL_CONFIG = {
  MODEL_PATH: '/models/spherex.glb',
  INITIAL_TILT_X: APP_CONFIG.spacecraft.initialTilt.x,
  INITIAL_TILT_Y: APP_CONFIG.spacecraft.initialTilt.y,
  INITIAL_TILT_Z: APP_CONFIG.spacecraft.initialTilt.z,
  AXIAL_SPIN_SPEED: APP_CONFIG.spacecraft.axialSpinSpeed,
  USE_OSCILLATION: false,
  OSCILLATION_ANGLE: 0.45,
  FLOAT_AMPLITUDE: APP_CONFIG.spacecraft.floatAmplitude,
  MODEL_SCALE: 1.15,
  CAMERA_POS: [0, 0.85, 6.05] as [number, number, number],
  CAMERA_FOV: 38,
  /** Cap on the backing-store pixel ratio. 3 keeps edges crisp on HiDPI panels. */
  MAX_DPR: 3,
  /** How strongly the procedural studio environment is reflected by the metal. */
  ENV_INTENSITY: 1.15,
  /** Slow turntable rotation around the model's outer (scene-vertical) axis, rad/s. */
  ORBIT_SPIN_SPEED: APP_CONFIG.spacecraft.orbitSpinSpeed,
  /** Radians of outer-axis rotation per dragged pixel. */
  ORBIT_DRAG_SENSITIVITY: APP_CONFIG.spacecraft.orbitDragSensitivity,
  /** Seconds of inactivity before the automatic turntable spin resumes. */
  ORBIT_AUTO_RESUME_DELAY: APP_CONFIG.spacecraft.orbitAutoResumeDelay,
  /**
   * Cursor proximity lean. The spacecraft tilts *against* the pointer by up to
   * POINTER_PARALLAX radians (a small counter-move, not a follow), and only
   * while the cursor is close by: full strength inside POINTER_NEAR_RADIUS,
   * faded out to nothing past POINTER_FAR_RADIUS. Both radii are measured in
   * half-stage-widths, where 1 is the edge of the square stage.
   */
  POINTER_PARALLAX: 0.07,
  POINTER_NEAR_RADIUS: 0.6,
  POINTER_FAR_RADIUS: 1.3,
  /** Approach rate (1/s) for the lean; higher snaps faster and returns faster. */
  POINTER_EASE: 4.5,
};

/** Cursor position and lean weight shared between the DOM and the render loop. */
interface PointerState {
  /** Offset from the stage centre in half-stage-widths, clamped to sane limits. */
  x: number;
  y: number;
  /** 1 while the cursor is on the spacecraft, 0 once it has moved away. */
  proximity: number;
}

/** Smooth 1 → 0 ramp between the near and far proximity radii. */
function pointerProximity(distance: number): number {
  const near = MODEL_CONFIG.POINTER_NEAR_RADIUS;
  const far = MODEL_CONFIG.POINTER_FAR_RADIUS;
  if (distance <= near) return 1;
  if (distance >= far) return 0;
  const t = (distance - near) / (far - near);
  return 1 - t * t * (3 - 2 * t);
}

/** Mutable state shared between the DOM drag handlers and the render loop. */
interface OrbitState {
  dragging: boolean;
  lastX: number;
  lastTime: number;
  pending: number;
  velocity: number;
  idle: number;
}

interface RigSettings {
  tiltX: number;
  tiltY: number;
  tiltZ: number;
  spinSpeed: number;
}

const INITIAL_SETTINGS: RigSettings = {
  tiltX: MODEL_CONFIG.INITIAL_TILT_X,
  tiltY: MODEL_CONFIG.INITIAL_TILT_Y,
  tiltZ: MODEL_CONFIG.INITIAL_TILT_Z,
  spinSpeed: MODEL_CONFIG.AXIAL_SPIN_SPEED,
};

/**
 * Builds a tiny equirectangular "studio" map: deep-space background plus a few
 * hard-edged softboxes. Metallic surfaces then resolve sharp specular glints
 * along every facet instead of the milky flat gradients you get from lights
 * alone, which is what makes the panels read as crisp edges.
 */
function createStudioEnvironmentTexture() {
  const width = 512;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const backdrop = ctx.createLinearGradient(0, 0, 0, height);
  backdrop.addColorStop(0, '#0a1016');
  backdrop.addColorStop(0.5, '#151d26');
  backdrop.addColorStop(1, '#04060a');
  ctx.fillStyle = backdrop;
  ctx.fillRect(0, 0, width, height);

  // Hard-edged light panels (x = longitude, y = latitude).
  const panels: Array<[number, number, number, number, string]> = [
    [40, 26, 92, 96, 'rgba(255, 255, 255, 0.95)'],
    [186, 14, 54, 78, 'rgba(214, 245, 255, 0.72)'],
    [286, 58, 38, 44, 'rgba(255, 236, 200, 0.6)'],
    [396, 34, 66, 60, 'rgba(203, 213, 225, 0.45)'],
  ];
  for (const [x, y, w, h, color] of panels) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  // Narrow horizon strip keeps a clean specular line on the shield rims.
  ctx.fillStyle = 'rgba(226, 232, 240, 0.28)';
  ctx.fillRect(0, 118, width, 5);

  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function StudioEnvironment() {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);

  useEffect(() => {
    const source = createStudioEnvironmentTexture();
    if (!source) return undefined;
    const pmrem = new THREE.PMREMGenerator(gl);
    const target = pmrem.fromEquirectangular(source);
    scene.environment = target.texture;
    source.dispose();
    pmrem.dispose();
    return () => {
      scene.environment = null;
      target.dispose();
    };
  }, [gl, scene]);

  return null;
}

/** Neutral tone mapping keeps highlights white instead of the washed-out ACES grey. */
function CrispRenderer() {
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    const previousToneMapping = gl.toneMapping;
    const previousExposure = gl.toneMappingExposure;
    gl.toneMapping = THREE.NeutralToneMapping;
    gl.toneMappingExposure = 1.05;
    return () => {
      gl.toneMapping = previousToneMapping;
      gl.toneMappingExposure = previousExposure;
    };
  }, [gl]);

  return null;
}

function SatelliteRig({
  settings,
  orbit,
  pointer,
}: {
  settings: RigSettings;
  orbit: MutableRefObject<OrbitState>;
  pointer: MutableRefObject<PointerState>;
}) {
  const yawGroup = useRef<THREE.Group | null>(null);
  const tiltGroup = useRef<THREE.Group | null>(null);
  const spinGroup = useRef<THREE.Group | null>(null);
  const { scene } = useGLTF(MODEL_CONFIG.MODEL_PATH);

  // Give every exported material a shared environment reflection strength, and
  // lift the near-black "matte" surfaces a touch so their facet edges stay
  // readable against the deep-space background.
  useEffect(() => {
    scene.traverse((object) => {
      const mesh = object as THREE.Mesh;
      const materials = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
      for (const material of materials) {
        const standard = material as THREE.MeshStandardMaterial;
        if ('envMapIntensity' in standard) {
          standard.envMapIntensity = MODEL_CONFIG.ENV_INTENSITY;
        }
        if (standard.name.startsWith('SPX_Matte_Black')) {
          standard.color.setRGB(0.022, 0.026, 0.03);
          standard.roughness = 0.62;
        }
        standard.needsUpdate = true;
      }
    });
  }, [scene]);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    const step = Math.min(delta, 0.05);
    const orbitState = orbit.current;

    // Outer axis: turntable spin around the scene-vertical axis. Dragging the
    // model with the left mouse button feeds `pending` (and `velocity` for the
    // release glide); the slow automatic spin resumes after a short idle.
    const yaw = yawGroup.current;
    if (yaw) {
      if (orbitState.pending !== 0) {
        yaw.rotation.y += orbitState.pending;
        orbitState.pending = 0;
      }
      if (orbitState.dragging) {
        orbitState.idle = 0;
      } else if (Math.abs(orbitState.velocity) > 0.002) {
        yaw.rotation.y += orbitState.velocity * step;
        orbitState.velocity *= Math.pow(0.04, step);
      } else {
        orbitState.velocity = 0;
        orbitState.idle += step;
        if (orbitState.idle > MODEL_CONFIG.ORBIT_AUTO_RESUME_DELAY) {
          yaw.rotation.y += step * MODEL_CONFIG.ORBIT_SPIN_SPEED;
        }
      }
    }

    const spin = spinGroup.current;
    if (spin) {
      if (MODEL_CONFIG.USE_OSCILLATION) {
        spin.rotation.y = Math.sin(time * settings.spinSpeed) * MODEL_CONFIG.OSCILLATION_ANGLE;
      } else {
        spin.rotation.y += step * settings.spinSpeed;
      }
    }
    const tilt = tiltGroup.current;
    if (tilt) {
      // Counter-move: the tilt leans *against* the cursor, and the lean fades
      // with proximity, so the base tilt returns as soon as the pointer leaves
      // the spacecraft.
      const lean = MODEL_CONFIG.POINTER_PARALLAX * pointer.current.proximity;
      const targetX = settings.tiltX - pointer.current.y * lean;
      const targetY = settings.tiltY - pointer.current.x * lean;
      const ease = 1 - Math.exp(-MODEL_CONFIG.POINTER_EASE * step);
      tilt.rotation.x += (targetX - tilt.rotation.x) * ease;
      tilt.rotation.y += (targetY - tilt.rotation.y) * ease;
      tilt.rotation.z += (settings.tiltZ - tilt.rotation.z) * ease;
      tilt.position.y = Math.sin(time * 0.8) * MODEL_CONFIG.FLOAT_AMPLITUDE;
    }
  });

  return (
    <group ref={yawGroup}>
      <group ref={tiltGroup} rotation={[settings.tiltX, settings.tiltY, settings.tiltZ]}>
        <group ref={spinGroup}>
          <Center>
            <primitive object={scene} scale={MODEL_CONFIG.MODEL_SCALE} />
          </Center>
        </group>
      </group>
    </group>
  );
}

function RigFallback() {
  return (
    <svg viewBox="0 0 120 120" className="mx-auto h-24 w-24" aria-hidden="true">
      <circle cx="60" cy="60" r="44" fill="none" stroke="#27272a" />
      <path d="M60 26 L88 74 L60 62 L32 74 Z" fill="rgb(var(--accent))" fillOpacity="0.12" stroke="rgb(var(--accent))" strokeOpacity="0.5" />
      <circle cx="60" cy="60" r="8" fill="none" stroke="rgb(var(--accent-bright))" strokeOpacity="0.7" />
    </svg>
  );
}

class ModelErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Keep the page usable if the asset is missing or WebGL is unavailable.
    console.warn('SPHEREx model could not be rendered:', error.message, info.componentStack);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function RigEditor({
  settings,
  onChange,
  onClose,
}: {
  settings: RigSettings;
  onChange: (settings: RigSettings) => void;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const copyConstants = useCallback(async () => {
    const snippet = `// Paste into frontend/src/config/app.config.ts
spacecraft: {
  initialTilt: { x: ${settings.tiltX.toFixed(3)}, y: ${settings.tiltY.toFixed(3)}, z: ${settings.tiltZ.toFixed(3)} },
  axialSpinSpeed: ${settings.spinSpeed.toFixed(3)},
  orbitSpinSpeed: ${MODEL_CONFIG.ORBIT_SPIN_SPEED},
  orbitDragSensitivity: ${MODEL_CONFIG.ORBIT_DRAG_SENSITIVITY},
  orbitAutoResumeDelay: ${MODEL_CONFIG.ORBIT_AUTO_RESUME_DELAY},
  floatAmplitude: ${MODEL_CONFIG.FLOAT_AMPLITUDE},
},`;
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }, [settings]);

  const sliders: Array<{ key: keyof RigSettings; label: string; min: number; max: number; step: number }> = [
    { key: 'tiltX', label: 'TILT_X', min: -Math.PI, max: Math.PI, step: 0.01 },
    { key: 'tiltY', label: 'TILT_Y', min: -Math.PI, max: Math.PI, step: 0.01 },
    { key: 'tiltZ', label: 'TILT_Z', min: -Math.PI, max: Math.PI, step: 0.01 },
    { key: 'spinSpeed', label: 'AXIAL_SPIN_SPEED', min: -1, max: 1, step: 0.01 },
  ];

  return (
    <div className="absolute bottom-3 right-3 z-20 w-[13.5rem] border border-line bg-canvas/95 p-2 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-zinc-400">
          {t.home.viewerRig}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-zinc-600 transition-colors hover:text-zinc-200"
          aria-label={t.common.close}
        >
          <X size={11} aria-hidden="true" />
        </button>
      </div>
      <div className="mt-2 space-y-1.5">
        {sliders.map((slider) => (
          <label key={slider.key} className="block">
            <span className="flex items-center justify-between font-mono text-[8px] uppercase tracking-[0.08em] text-zinc-600">
              {slider.label}
              <span className="text-zinc-400">{settings[slider.key].toFixed(2)}</span>
            </span>
            <input
              type="range"
              min={slider.min}
              max={slider.max}
              step={slider.step}
              value={settings[slider.key]}
              onChange={(event) => onChange({ ...settings, [slider.key]: Number(event.target.value) })}
              className="w-full"
            />
          </label>
        ))}
      </div>
      <div className="mt-2 flex gap-1">
        <button
          type="button"
          onClick={copyConstants}
          className="flex flex-1 items-center justify-center gap-1 border border-line px-1.5 py-1 font-mono text-[8px] uppercase tracking-[0.1em] text-zinc-400 transition-colors hover:border-accent/60 hover:text-accent"
        >
          {copied ? <Check size={9} aria-hidden="true" /> : <Copy size={9} aria-hidden="true" />}
          {copied ? t.common.copied : t.home.viewerCopy}
        </button>
        <button
          type="button"
          onClick={() => onChange(INITIAL_SETTINGS)}
          className="grid h-6 w-6 place-items-center border border-line text-zinc-600 transition-colors hover:border-line-hover hover:text-zinc-200"
          aria-label={t.common.reset}
        >
          <RotateCcw size={9} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export default function SpherexModelCanvas({ className = '' }: { className?: string }) {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<RigSettings>(INITIAL_SETTINGS);
  const [rigOpen, setRigOpen] = useState(false);
  const [dragging, setDragging] = useState(false);

  const orbit = useRef<OrbitState>({
    dragging: false,
    lastX: 0,
    lastTime: 0,
    pending: 0,
    velocity: 0,
    idle: MODEL_CONFIG.ORBIT_AUTO_RESUME_DELAY,
  });
  const stageRef = useRef<HTMLDivElement | null>(null);
  const pointer = useRef<PointerState>({ x: 0, y: 0, proximity: 0 });

  // Proximity parallax: convert the cursor's distance from the stage centre
  // into a 0–1 lean weight. The listener lives on the window so the model keeps
  // tracking the cursor across the transparent canvas edges, while the weight
  // itself drops to zero once the cursor has left the spacecraft's vicinity.
  useEffect(() => {
    const last = { x: 0, y: 0, seen: false };

    const sync = () => {
      const stage = stageRef.current;
      if (!stage || !last.seen) {
        pointer.current.proximity = 0;
        return;
      }
      const rect = stage.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) {
        pointer.current.proximity = 0;
        return;
      }
      const halfWidth = rect.width / 2;
      const halfHeight = rect.height / 2;
      const dx = (last.x - (rect.left + halfWidth)) / halfWidth;
      const dy = (last.y - (rect.top + halfHeight)) / halfHeight;
      pointer.current.x = clamp(dx, -1.4, 1.4);
      pointer.current.y = clamp(dy, -1.4, 1.4);
      // The stage is square, so a circular proximity test reads naturally.
      pointer.current.proximity = pointerProximity(Math.hypot(dx, dy));
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      last.x = event.clientX;
      last.y = event.clientY;
      last.seen = true;
      sync();
    };

    // Cursor left the window: let the spacecraft settle back to its base tilt.
    const release = () => {
      last.seen = false;
      pointer.current.proximity = 0;
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    window.addEventListener('blur', release);
    document.documentElement.addEventListener('pointerleave', release);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('scroll', sync);
      window.removeEventListener('resize', sync);
      window.removeEventListener('blur', release);
      document.documentElement.removeEventListener('pointerleave', release);
    };
  }, []);

  const canvasStyle = useMemo(() => ({ touchAction: 'auto' as const }), []);
  const stageStyle = useMemo(() => ({ touchAction: 'pan-y' as const }), []);
  const rigVisible =
    import.meta.env.DEV &&
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).has('rig');

  // Left-button drag rotates the spacecraft around its outer (vertical) axis.
  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    const target = event.target as HTMLElement;
    if (target.closest('button, input, select, textarea, a, [data-no-rotate]')) return;
    orbit.current.dragging = true;
    orbit.current.lastX = event.clientX;
    orbit.current.lastTime = event.timeStamp;
    orbit.current.velocity = 0;
    orbit.current.idle = 0;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const state = orbit.current;
    if (!state.dragging) return;
    const dx = event.clientX - state.lastX;
    const dt = Math.max((event.timeStamp - state.lastTime) / 1000, 0.008);
    state.lastX = event.clientX;
    state.lastTime = event.timeStamp;
    state.pending += dx * MODEL_CONFIG.ORBIT_DRAG_SENSITIVITY;
    state.velocity = (dx * MODEL_CONFIG.ORBIT_DRAG_SENSITIVITY) / dt;
    state.idle = 0;
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!orbit.current.dragging) return;
    orbit.current.dragging = false;
    orbit.current.idle = 0;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div
      ref={stageRef}
      className={[
        'relative aspect-square w-full select-none',
        dragging ? 'cursor-grabbing' : 'cursor-grab',
        className,
      ].join(' ')}
      style={stageStyle}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {/* No backdrop tint: the spacecraft sits straight on the page starfield. */}

      <ModelErrorBoundary
        fallback={
          <div className="absolute inset-0 grid place-items-center">
            <div className="max-w-[16rem] space-y-2 px-6 text-center">
              <RigFallback />
              <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-zinc-500">
                {t.home.viewerFallback}
              </p>
            </div>
          </div>
        }
      >
        <Suspense
          fallback={
            <div className="absolute inset-0 grid place-items-center">
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-500">
                {t.home.viewerLoading}
              </p>
            </div>
          }
        >
          <Canvas
            dpr={[2, MODEL_CONFIG.MAX_DPR]}
            camera={{ position: MODEL_CONFIG.CAMERA_POS, fov: MODEL_CONFIG.CAMERA_FOV }}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: 'high-performance',
              stencil: false,
            }}
            style={canvasStyle}
            className="!absolute inset-0"
          >
            <CrispRenderer />
            <StudioEnvironment />
            <ambientLight intensity={0.55} />
            <hemisphereLight args={['#dbeafe', '#0f172a', 0.4]} />
            <directionalLight position={[4, 6, 5]} intensity={2.6} color="#f1f5f9" />
            <directionalLight position={[-5, 2, -4]} intensity={1.1} color="#38bdf8" />
            <directionalLight position={[2.5, 0, 6]} intensity={1.3} color="#e2e8f0" />
            <directionalLight position={[-3, -1, 5]} intensity={0.55} color="#7dd3fc" />
            <directionalLight position={[0, -3, 2]} intensity={0.6} color="#f59e0b" />
            <SatelliteRig settings={settings} orbit={orbit} pointer={pointer} />
          </Canvas>
        </Suspense>
      </ModelErrorBoundary>

      {/* Debug rig stays available for authoring, but it is never part of the
          public UI: it only mounts with ?rig=1 in a local dev session. */}
      {rigVisible && (
        <button
          type="button"
          onClick={() => setRigOpen(!rigOpen)}
          aria-expanded={rigOpen}
          className="absolute bottom-1 right-1 z-10 flex items-center gap-1 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.12em] text-zinc-600 transition-colors hover:text-accent"
        >
          <Settings2 size={9} aria-hidden="true" />
          {t.home.viewerRig}
        </button>
      )}

      {rigVisible && rigOpen && (
        <RigEditor settings={settings} onChange={setSettings} onClose={() => setRigOpen(false)} />
      )}
    </div>
  );
}

useGLTF.preload(MODEL_CONFIG.MODEL_PATH);
