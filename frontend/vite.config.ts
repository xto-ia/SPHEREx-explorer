import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Static / free-tier deployment: everything ships as plain assets, no server runtime.
export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    port: 5173,
    host: true,
  },
  worker: {
    format: 'es',
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1600,
  },
});
