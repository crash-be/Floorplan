import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  // Root deployment
  base: "/",
  build: {
    outDir: "dist"
  },

  server: {
    host: true,
    proxy: {
      '/api/xai': {
        target: 'https://api.x.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/xai/, ''),
      },
    },
  },
});
