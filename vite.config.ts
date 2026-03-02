import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

export default defineConfig(({mode}) => {
  return {
    plugins: [
        react(), 
        tailwindcss(),
        cssInjectedByJsPlugin()
    ],
    define: {
      // Add this line to fix the "process is not defined" error in the browser
      'process.env.NODE_ENV': JSON.stringify(mode === 'development' ? 'development' : 'production'),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      lib: {
        entry: path.resolve(__dirname, 'src/CustomizeCE.ts'),
        name: 'CustomizeCE',
        fileName: 'customize-ce',
        formats: ['umd']
      },
      rollupOptions: {
        // We do NOT externalize React here, because we want React bundled 
        // inside the tool so the parent PHP app doesn't need to load React.
      }
    }
  };
});
