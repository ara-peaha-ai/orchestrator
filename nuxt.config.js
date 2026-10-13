export default defineNuxtConfig({
  modules: [
    '@nuxt/ui',
    '@ara-peaha-ai/ip',
    '@ara-peaha-ai/template',
    '@ara-peaha-ai/peach',
    '@ara-peaha-ai/booking',
    '@ara-peaha-ai/robosats',
    '@ara-peaha-ai/btcpay',
    '@ara-peaha-ai/masspay',
    '@ara-peaha-ai/tor',
    '@ara-peaha-ai/market',
    '@ara-peaha-ai/dont-trust-verify',
    '@ara-peaha-ai/risk'
  ],

  // Every service runs inside this app, so one root .env holds all their keys (.env.example).
  // Each one fails closed without its secret: tor and market deny every proxy call, risk answers nothing,
  // dont-trust-verify answers 401 without a user and 503 on /sanctions without the Chainalysis key.
  ipDetection: {
    enabled: true,
    currency: true
  },
  tor: { enabled: true },
  market: { enabled: true },
  dontTrustVerify: { enabled: true },
  risk: { enabled: true },

  css: ['~/assets/css/main.css']
})
