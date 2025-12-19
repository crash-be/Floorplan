import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: "/",
  build: {
    outDir: "dist"
  },
  server: {
    host: true,
    proxy: {
      // Dit zorgt ervoor dat je lokaal (npm run dev) 
      // verbinding maakt met je server.js op poort 10000
      '/api': 'http://localhost:10000',
    },
  },
});