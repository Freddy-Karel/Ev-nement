import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true, // Écoute sur toutes les interfaces réseau (0.0.0.0)
    port: 3000,
    // Proxy vers le backend Spring Boot pour éviter les CORS en dev
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Sépare les grosses libs en chunks distincts (chargés en parallèle)
          'react-vendor':  ['react', 'react-dom', 'react-router-dom'],
          'pdf-renderer':  ['@react-pdf/renderer'],
          'qrcode':        ['qrcode.react'],
          'date-fns':      ['date-fns'],
        },
      },
    },
  },
})
