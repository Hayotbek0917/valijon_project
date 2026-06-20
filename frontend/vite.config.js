import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  css: {
    devSourcemap: false,
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_TARGET || 'http://localhost:8000',
        changeOrigin: true,
      },
      '/auth': {
        target: process.env.VITE_PROXY_TARGET || 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 3000,
    host: true,
    allowedHosts: ['corepos.up.railway.app'],
    proxy: {
      '/api': {
        target: 'https://corepos-api.up.railway.app',
        changeOrigin: true,
        secure: false,
      },
      '/auth': {
        target: 'https://corepos-api.up.railway.app',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})