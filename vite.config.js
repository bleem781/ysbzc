import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/ysbzc/' : '/',
  server: {
    port: 3000,
    open: '/index.html',
    host: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        calculator: resolve(__dirname, 'main.html'),
        reset: resolve(__dirname, 'reset_users.html')
      },
      output: {
        manualChunks: {
          vendor: ['xlsx']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['xlsx']
  }
})
