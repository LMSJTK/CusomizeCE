import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
        react(), 
        tailwindcss(),
        cssInjectedByJsPlugin()
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
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
