export default defineNuxtConfig({
  modules: [],
  css: ['~/assets/app.css'],
  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE || 'http://localhost:3001'
    }
  },
  ssr: true,
  nitro: {
    prerender: {
      crawlLinks: false
    },
    proxy: {
      '/api': {
        target: process.env.BACKEND_URL || 'http://localhost:3001',
        changeOrigin: true
      },
      '/socket.io': {
        target: process.env.BACKEND_URL || 'http://localhost:3001',
        ws: true
      }
    }
  },
  build: {
    transpile: ['socket.io-client']
  }
})
