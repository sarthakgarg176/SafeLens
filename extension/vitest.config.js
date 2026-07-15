import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: [resolve(__dirname, 'tests/setup.js')],
    globals: true,
  },
});
