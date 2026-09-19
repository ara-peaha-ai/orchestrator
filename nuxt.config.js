export default defineNuxtConfig({
  modules: [
    '@nuxt/ui',
    '@ara-peaha-ai/ip',
    '@ara-peaha-ai/template',
    '@ara-peaha-ai/peach',
    '@ara-peaha-ai/booking',
    '@ara-peaha-ai/robosats',
    '@ara-peaha-ai/masspay'
  ],

  ipDetection: {
    enabled: true,
    currency: true
  },

  css: ['~/assets/css/main.css']
})
