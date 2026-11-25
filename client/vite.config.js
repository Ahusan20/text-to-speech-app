import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.GITHUB_ACTIONS === 'true' ? '/text-to-speech-app/' : '/',
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
      '/audio': 'http://localhost:5000',
    },
  },
})
