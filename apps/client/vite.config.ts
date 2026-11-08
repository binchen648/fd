import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { isBuiltin } from 'node:module'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'reject-node-imports-in-browser-bundle',
      apply: 'build',
      generateBundle(_, bundle) {
        for (const output of Object.values(bundle)) {
          if (output.type !== 'chunk') continue
          const builtin = [...output.imports, ...output.dynamicImports].find(isBuiltin)
          if (builtin) this.error(`${output.fileName} imports Node builtin ${builtin}, which cannot run in a browser`)
        }
      },
    },
  ],
  server: {
    port: 3000
  },
  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV !== 'production',
    rollupOptions: {
      external: ['node:fs', 'node:path', 'node:fs/promises'],
      output: {
        // Let Rollup follow the client's browser-safe entry points. Forcing the
        // workspace package roots here pulls in their Node-only tooling.
        manualChunks: {
          vendor: ['react', 'react-dom']
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
