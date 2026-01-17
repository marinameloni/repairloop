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
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true
      }
    }
  }
})
