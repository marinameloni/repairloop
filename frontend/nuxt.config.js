export default defineNuxtConfig({
  modules: [],
  css: ['~/assets/app.css'],
  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE || 'http://localhost:3001'
    }
  }
})
