import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  // sockjs-client still references the Node.js `global` identifier. In the
  // browser, globalThis is the standards-based equivalent and avoids pulling
  // a full Node polyfill into the client bundle.
  define: {
    global: 'globalThis',
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
      '/ws': { target: 'http://localhost:8080', ws: true, changeOrigin: true },
      '/oauth2': { target: 'http://localhost:8080', changeOrigin: true },
    },
  },
})
