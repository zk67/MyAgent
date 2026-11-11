import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    passWithNoTests: true,
    environment: 'jsdom',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
