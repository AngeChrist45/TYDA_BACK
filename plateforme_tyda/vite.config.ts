import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,   // ✅ permet d'exposer le serveur sur ton réseau local
    port: 5173    // optionnel, tu peux laisser 5173 ou changer
  }
})
