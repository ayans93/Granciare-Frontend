import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Proxy /api/* to the Vercel dev server (port 3000).
    // Run `vercel dev` in this folder — it starts BOTH the React dev
    // server and the serverless functions on port 3000.
    // If you only run `npm run dev` without the API server, form
    // submissions will fall back to the mock handler below.
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', () => {
            // swallow proxy errors silently — the form's own
            // error state will show the user a helpful message
          });
        },
      },
    },
  },
})
