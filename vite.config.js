import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  publicDir: 'public-live',
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api/enora': {
        target: 'https://api.enora-oah.eu',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/enora/, '/api'),
      },
    },
  },
})
