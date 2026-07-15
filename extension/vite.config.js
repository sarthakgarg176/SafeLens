import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      external: ['/opencv.js'], // Vite isse touch nahi karega
      input: {
        popup: resolve(__dirname, 'public/popup.html'),
        offscreen: resolve(__dirname, 'src/background/offscreen.js'),
        sandbox: resolve(__dirname, 'public/sandbox.html'),
      },
      output: {
        // Yahan `false` set karna zaruri hai
        inlineDynamicImports: false, 
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
      },
    },
  },
});