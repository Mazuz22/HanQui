import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Relative asset paths, so the built app runs from any static host or subfolder.
  base: './',
  plugins: [react()],
  server: {
    host: true,
  },
})
