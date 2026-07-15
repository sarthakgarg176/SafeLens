import { build } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const extDir = resolve(__dirname, '..');
const distDir = resolve(extDir, 'dist');
const publicDir = resolve(extDir, 'public');

async function runBuild() {
  console.log('Starting SafeLens Extension Build Pipeline...');

  // 1. Clean dist/ directory
  if (fs.existsSync(distDir)) {
    console.log('Cleaning existing dist/ directory...');
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  fs.mkdirSync(distDir, { recursive: true });

  try {
    // 2. Build Popup React App
    console.log('\n--- Building Popup React App ---');
    await build({
      configFile: false, // 🚀 FIX: Prevent vite.config.js interference
      root: extDir,
      plugins: [react()],
      publicDir: false,
      build: {
        outDir: distDir,
        emptyOutDir: false,
        minify: 'esbuild',
        sourcemap: false,
        rollupOptions: {
          input: {
            popup: resolve(publicDir, 'popup.html'),
            offscreen: resolve(publicDir, 'offscreen.html'),
            sandbox: resolve(publicDir, 'sandbox.html'),
          },
          output: {
            entryFileNames: 'assets/[name]-[hash].js',
            chunkFileNames: 'assets/[name]-[hash].js',
            assetFileNames: 'assets/[name]-[hash].[ext]',
          },
        },
      },
    });

    // 3. Build Background Service Worker
    console.log('\n--- Building Background Service Worker ---');
    await build({
      configFile: false, // 🚀 FIX: Prevent vite.config.js interference
      root: extDir,
      publicDir: false,
      build: {
        target: 'esnext',
        outDir: distDir,
        emptyOutDir: false,
        minify: 'esbuild',
        sourcemap: false,
        lib: {
          entry: resolve(extDir, 'src/background/serviceWorker.js'),
          formats: ['es'],
          fileName: () => 'background/serviceWorker.js',
        },
        rollupOptions: {
          external: [], 
          output: {
            entryFileNames: 'background/serviceWorker.js',
            inlineDynamicImports: false,
          },
        },
      },
    });

    // 4. Build Content Script
    console.log('\n--- Building Content Script ---');
    await build({
      configFile: false, // 🚀 FIX: Prevent vite.config.js interference
      root: extDir,
      publicDir: false,
      build: {
        outDir: distDir,
        emptyOutDir: false,
        minify: 'esbuild',
        sourcemap: false,
        lib: {
          entry: resolve(extDir, 'src/content/contentScript.js'),
          formats: ['iife'],
          name: 'SafeLensContentScript',
          fileName: () => 'content/contentScript.js',
        },
        rollupOptions: {
          external: [], 
          output: {
            entryFileNames: 'content/contentScript.js',
            extend: true,
            inlineDynamicImports: true, // 🚀 FIX: Moved here to properly force IIFE bundling
          },
        },
      },
    });

    // 4.5 Copy Dashboard Bridge content script
    console.log('\n--- Copying Dashboard Bridge Content Script ---');
    const bridgeSrc = resolve(extDir, 'src/content/dashboardBridge.js');
    const bridgeDest = resolve(distDir, 'content/dashboardBridge.js');
    if (fs.existsSync(bridgeSrc)) {
      fs.copyFileSync(bridgeSrc, bridgeDest);
      console.log('Successfully copied dashboardBridge.js to dist/content/');
    } else {
      console.warn('dashboardBridge.js not found in src/content/');
    }

    // 5. Copy manifest.json & icons/
    console.log('\n--- Copying Manifest and Asset Icons ---');
    const manifestSrc = resolve(publicDir, 'manifest.json');
    const manifestDest = resolve(distDir, 'manifest.json');
    if (fs.existsSync(manifestSrc)) {
      fs.copyFileSync(manifestSrc, manifestDest);
      console.log('Successfully copied manifest.json to dist/');
    }

    const iconsSrc = resolve(publicDir, 'icons');
    const iconsDest = resolve(distDir, 'icons');
    if (fs.existsSync(iconsSrc)) {
      fs.mkdirSync(iconsDest, { recursive: true });
      const files = fs.readdirSync(iconsSrc);
      for (const file of files) {
        fs.copyFileSync(resolve(iconsSrc, file), resolve(iconsDest, file));
      }
      console.log(`Successfully copied ${files.length} icon files to dist/icons/`);
    }

    const opencvSrc = resolve(publicDir, 'opencv.js');
    const opencvDest = resolve(distDir, 'opencv.js');
    if (fs.existsSync(opencvSrc)) {
      console.log('Copying opencv.js to dist/... (this may take a moment)');
      fs.copyFileSync(opencvSrc, opencvDest);
      console.log('Successfully copied opencv.js to dist/');
    }

    const tesseractSrc = resolve(publicDir, 'tesseract');
    const tesseractDest = resolve(distDir, 'tesseract');
    if (fs.existsSync(tesseractSrc)) {
      console.log('Copying tesseract files to dist/...');
      fs.mkdirSync(tesseractDest, { recursive: true });
      const files = fs.readdirSync(tesseractSrc);
      for (const file of files) {
        fs.copyFileSync(resolve(tesseractSrc, file), resolve(tesseractDest, file));
      }
      console.log(`Successfully copied ${files.length} tesseract files to dist/tesseract/`);
    }

    console.log('\nSafeLens Extension build completed successfully!');
  } catch (error) {
    console.error('SafeLens Extension build failed:', error);
    process.exit(1);
  }
}

runBuild();