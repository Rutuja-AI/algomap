import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': { target: 'http://127.0.0.1:5000', changeOrigin: true, secure: false },
    },
  },
  // 👇 These lines are essential for SPA routing on Vercel
  build: {
    outDir: 'dist',
  },
  base: '/', // ensures React Router routes resolve correctly
})
