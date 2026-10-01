import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// El build va a ../web, que sirve plataforma/servidor.py. En desarrollo, /api apunta al servidor Python.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } },
  build: { outDir: '../web', emptyOutDir: true },
  server: { port: 5173, proxy: { '/api': 'http://127.0.0.1:8765' } },
})
