/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#09090b',
        surface: 'rgba(18, 18, 22, 0.85)',
        line: {
          DEFAULT: '#27272a',
          hover: '#3f3f46',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          bright: 'rgb(var(--accent-bright) / <alpha-value>)',
          cyan: '#38bdf8',
        },
        warn: '#f59e0b',
        dipole: {
          pos: '#f43f5e',
          neg: '#38bdf8',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        none: '0px',
        sm: '2px',
      },
      letterSpacing: {
        widest2: '0.22em',
      },
      boxShadow: {
        glow: '0 0 32px rgb(var(--accent) / 0.12)',
      },
      transitionDuration: {
        250: '250ms',
      },
    },
  },
  plugins: [],
};
