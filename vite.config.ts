import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ✔ WordPress hosting fix
// Gebruik altijd dezelfde absolute URL als waar de build terechtkomt
// Bij jou: /wp-content/uploads/floorplan/dist/
export default defineConfig(({ mode }) => ({
  plugins: [react()],

  base: './', // relative paths

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
}));
