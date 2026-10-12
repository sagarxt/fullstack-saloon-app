import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,      // Exposes the server to your local Wi-Fi network
    strictPort: true // Prevents Vite from switching to 5174 if 5173 is busy
  }
})
