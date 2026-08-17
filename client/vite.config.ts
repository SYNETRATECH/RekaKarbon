import { defineConfig } from 'vite';
import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  base: process.env.BASE_URL || '/',
  plugins: [reactRouter(), tailwindcss()],
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router',
      'zustand',
      'lucide-react',
      'leaflet',
      'recharts',
      'chart.js',
    ],
  },
  server: {
    port: 5173,
  },
});
