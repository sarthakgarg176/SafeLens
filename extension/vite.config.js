import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

/**
 * Vite Config for Local Development & HMR
 * 
 * Responsibility:
 * - Provides a fast development server on port 3000.
 * - Supports Hot Module Replacement (HMR) for designing the Popup React UI.
 * 
 * Usage:
 * - Run `npm run dev` to launch the dev server in the browser.
 */
export default defineConfig({
  plugins: [react()],
  publicDir: false,
  server: {
    port: 3000,
    open: '/public/popup.html',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
