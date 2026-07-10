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
    // We treat popup.html as a standard web entry point. It is built in ES module format.
    console.log('\n--- Building Popup React App ---');
    await build({
      root: extDir,
      plugins: [react()],
      publicDir: false, // Handle copying of static files manually
      build: {
        outDir: distDir,
        emptyOutDir: false,
        minify: 'esbuild',
        sourcemap: false, // Disable sourcemaps to comply with Extension store policies
        rollupOptions: {
          input: {
            popup: resolve(publicDir, 'popup.html'),
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
    // Built in ES mode, but as a single library bundle to avoid chunk splitting.
    console.log('\n--- Building Background Service Worker ---');
    await build({
      root: extDir,
      publicDir: false,
      build: {
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
          external: [], // Force rollup to bundle all npm dependencies for Chrome Extensions compatibility
          output: {
            entryFileNames: 'background/serviceWorker.js',
          },
        },
      },
    });

    // 4. Build Content Script
    // Must be built as a self-contained IIFE. This is critical for Chrome injection compatibility
    // to prevent code-splitting from creating import statements.
    console.log('\n--- Building Content Script ---');
    await build({
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
          external: [], // Force rollup to bundle all dependencies inside the IIFE wrapper
          output: {
            entryFileNames: 'content/contentScript.js',
            extend: true,
          },
        },
      },
    });

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
