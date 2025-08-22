import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import type { PluginOption } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react() as PluginOption],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path: string) => path.replace(/^\/api/, '')
      },
      '/media': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false
      }
    }
  }
})