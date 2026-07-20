import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/locations': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/weather': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
