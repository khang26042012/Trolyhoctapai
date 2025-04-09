import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './'
})
git add client/vite.config.js
git commit -m "Fix trắng màn hình: thêm vite.config.js"
git push
