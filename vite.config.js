import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),  tailwindcss()],
  server: { 
    proxy: 
    // Django's own admin pages only. The trailing slash matters: '/admin' would
    // also capture the app's /admins page and break it in dev and preview.
    { '/admin/': 'http://localhost:8000' } 
  }
})
