import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

const isTauri = !!process.env.TAURI_ENV_PLATFORM

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Prevent Vite from obscuring Rust errors in Tauri dev
  clearScreen: false,
  server: {
    host: true,
    port: 5173,
    // Tauri expects a fixed port; fail if 5173 is taken
    strictPort: isTauri,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  // Tauri uses env vars for platform detection at build time
  envPrefix: ['VITE_', 'TAURI_ENV_'],
})
