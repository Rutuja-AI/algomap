import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Load .env variables properly (VITE_*)
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': { target: 'http://127.0.0.1:5000', changeOrigin: true, secure: false },
      },
    },
    build: {
      outDir: 'dist',
    },
    base: '/',
    define: {
      // 👇 Make sure process.env and import.meta.env both include your env vars
      'process.env': env,
      'import.meta.env.VITE_API_BASE': JSON.stringify(env.VITE_API_BASE),
    },
  }
})
