import { middlewareDefs } from './module/definitions/middlewares.js'
import { endpointDefs } from './module/definitions/endpoints.js'

const prefix = '/api/risk'

export default defineNitroConfig({
  compatibilityDate: '2026-02-10',

  runtimeConfig: {
    nitro: { envPrefix: 'NUXT_' },
    risk: {
      prefix,
      secret: process.env.NUXT_RISK_SECRET,
      useCasesFile: process.env.NUXT_RISK_USE_CASES_FILE,
      workDir: process.env.NUXT_RISK_WORK_DIR || '/tmp/risk',
      cookiesFile: process.env.NUXT_RISK_COOKIES_FILE,
      monidFallback: process.env.NUXT_RISK_MONID_FALLBACK === 'true',
      sightengineUser: process.env.NUXT_RISK_SIGHTENGINE_USER,
      sightengineSecret: process.env.NUXT_RISK_SIGHTENGINE_SECRET,
      dontTrustVerifyUrl: process.env.NUXT_RISK_DONT_TRUST_VERIFY_URL,
      dontTrustVerifySecret: process.env.NUXT_RISK_DONT_TRUST_VERIFY_SECRET,
      mempoolUrl: process.env.NUXT_RISK_MEMPOOL_URL || 'https://mempool.space/api'
    }
  },

  handlers: [
    ...middlewareDefs.map(mw => ({
      middleware: true,
      route: prefix,
      handler: `./runtime/middleware/${mw.file}`
    })),
    ...endpointDefs.map(ep => ({
      route: `${prefix}/${ep.route}`,
      method: ep.method.toLowerCase(),
      handler: `./runtime/handlers/${ep.file}`
    }))
  ]
})
