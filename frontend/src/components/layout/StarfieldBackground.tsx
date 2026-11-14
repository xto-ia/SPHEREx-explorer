import { useEffect, useRef } from 'react';

/** Deterministic PRNG so the starfield is identical on every render. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STAR_TINTS = ['#ffffff', '#d4d4d8', '#a5f3fc', '#bae6fd', '#fde68a', '#fbcfe8'];

/**
 * Fixed, non-interactive deep-space backdrop: nebula gradient + deterministic
 * starfield canvas. Purely decorative, so it is hidden from assistive tech.
 */
export default function StarfieldBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    let rafId = 0;

    const render = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const random = mulberry32(20250501);
      const count = Math.round((width * height) / 5200);

      for (let i = 0; i < count; i += 1) {
        const x = random() * width;
        const y = random() * height;
        const radius = random() < 0.94 ? random() * 0.85 + 0.25 : random() * 1.4 + 0.9;
        const alpha = random() * 0.55 + 0.12;
        const tint = STAR_TINTS[Math.floor(random() * STAR_TINTS.length)];
        ctx.globalAlpha = alpha;
        ctx.fillStyle = tint;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // A handful of bright anchor stars with a soft diffraction halo.
      const glowCount = 14;
      for (let i = 0; i < glowCount; i += 1) {
        const x = random() * width;
        const y = random() * height;
        const radius = random() * 1.6 + 1.1;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 6);
        gradient.addColorStop(0, 'rgba(236, 240, 245, 0.85)');
        gradient.addColorStop(0.35, 'rgba(226, 232, 240, 0.16)');
        gradient.addColorStop(1, 'rgba(9, 9, 11, 0)');
        ctx.globalAlpha = 1;
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius * 6, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
    };

    const onResize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(render);
    };

    render();
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-canvas">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full opacity-80" />
      {/* Hairline survey grid for the OpenCode aesthetic. */}
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #27272a 1px, transparent 1px), linear-gradient(to bottom, #27272a 1px, transparent 1px)',
          backgroundSize: '96px 96px',
          maskImage: 'radial-gradient(circle at 50% 40%, black, transparent 78%)',
          WebkitMaskImage: 'radial-gradient(circle at 50% 40%, black, transparent 78%)',
        }}
      />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-canvas via-canvas/70 to-transparent" />
    </div>
  );
}
