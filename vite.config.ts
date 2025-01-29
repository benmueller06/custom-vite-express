import { defineConfig } from 'vite';
import { resolve } from 'path';
import resolverPlugin from './packages/vite-resolve-path/index';
import partialsPlugin from './packages/vite-html-partials/index';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        nested: 'test/index.html'
      }
    },
    watch: {
      include: [
        'src/**',
        'packages/**'
      ]
    }
  },
  server: {
    watch: {
      usePolling: true
    }
  },
  plugins: [
    partialsPlugin(resolve(import.meta.dirname, 'src/partials')),
    resolverPlugin(import.meta.dirname),
  ],
});