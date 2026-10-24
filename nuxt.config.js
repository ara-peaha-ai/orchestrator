export default defineNuxtConfig({
  modules: [
    '@nuxt/ui',
    '@ara-peaha-ai/ip',
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

  // Every service except cors runs inside this app: in development one root .env holds their keys
  // (.env.example); in production the same NUXT_* variables are injected into the server process.
  // Without their secrets: the tor and market proxies deny every call, risk operator routes answer 401
  // (the subject's consent page stays open by design), dont-trust-verify answers 401 without a user and
  // 503 on /sanctions without the Chainalysis key. Market offer routes are public.
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
