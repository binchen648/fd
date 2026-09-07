import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  },
  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV !== 'production',
    rollupOptions: {
      external: ['node:fs', 'node:path', 'node:fs/promises'],
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          rules: ['@fd/rules'],
          content: ['@fd/content']
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  base: './'
})