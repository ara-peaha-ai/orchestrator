import { middlewareDefs } from './module/definitions/middlewares.js'
import { endpointDefs } from './module/definitions/endpoints.js'
import { assetDefs } from './module/definitions/assets.js'

const prefix = '/api/dont-trust-verify'

export default defineNitroConfig({
  compatibilityDate: '2026-02-10',

  runtimeConfig: {
    nitro: { envPrefix: 'NUXT_' },
    dontTrustVerify: {
      prefix,
      minAge: Number(process.env.NUXT_DONT_TRUST_VERIFY_MIN_AGE) || 18,
      matchThreshold: Number(process.env.NUXT_DONT_TRUST_VERIFY_MATCH_THRESHOLD) || 0.6,
      proxySecret: process.env.NUXT_DONT_TRUST_VERIFY_PROXY_SECRET
    }
  },

  publicAssets: assetDefs(prefix),

  handlers: [
    ...middlewareDefs.map(mw => ({
      middleware: true,
      route: prefix,
      handler: `./runtime/middleware/${mw.file}`
    })),
    ...endpointDefs.map(ep => ({
      route: ep.route ? `${prefix}/${ep.route}` : prefix,
      method: ep.method.toLowerCase(),
      handler: `./runtime/handlers/${ep.file}`
    }))
  ]
})
