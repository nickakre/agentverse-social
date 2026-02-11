import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // Use the standard plugin

export default defineConfig({
  plugins: [react()],
  base: '/agentverse-social/', 
})