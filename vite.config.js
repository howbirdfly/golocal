import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { createAiProxyHandler } from './server/ai-proxy.js'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      vue(),
      {
        name: 'golocal-ai-proxy',
        configureServer(server) {
          server.middlewares.use('/api/generate', createAiProxyHandler(env))
        },
        configurePreviewServer(server) {
          server.middlewares.use('/api/generate', createAiProxyHandler(env))
        }
      }
    ]
  }
})