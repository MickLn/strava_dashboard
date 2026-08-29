import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Assure des chemins relatifs parfaits pour GitHub Pages
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true
  }
});
