const { defineConfig } = require('vite');
const solid = require('vite-plugin-solid');
const path = require('path');

module.exports = defineConfig({
  plugins: [solid()],
  publicDir: false,
  build: {
    sourcemap: true,
    emptyOutDir: false,
    outDir: path.resolve(__dirname, 'public/js/weeks'),
    rollupOptions: {
      input: path.resolve(__dirname, 'public/js/weeks/weeks.tsx'),
      output: {
        entryFileNames: 'weeks.js',
        format: 'iife',
        dir: path.resolve(__dirname, 'public/js/weeks')
      }
    }
  }
});
