import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => ({
  plugins: [vue()],
  // GitHub project Pages is hosted under /repository-name/.
  // Keep local development and other static deployments relative.
  base: mode === 'github-pages' ? '/fps-streamer-game/' : './',
}))
