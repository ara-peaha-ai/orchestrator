import { defineNuxtModule, addServerHandler, createResolver } from '@nuxt/kit'
import { middlewareDefs } from './definitions/middlewares.js'

const toBoolean = (v) => String(v || '').toLowerCase() === 'true'

export default defineNuxtModule({
  meta: {
    name: '@ara-peaha-ai/ip',
    configKey: 'ipDetection'
  },

  defaults: {
    enabled: false,
    country: false,
    currency: false,
    cloudflareSecret: undefined,
    ipinfoApiKey: undefined,
    rateLimit: 100,
    limitPaths: []
  },

  setup(options, nuxt) {
    const enabled = toBoolean(options.enabled)
    if (!enabled) return

    nuxt.options.runtimeConfig.ipDetection = {
      country: toBoolean(options.country),
      currency: toBoolean(options.currency),
      // registered even when empty, so NUXT_IP_DETECTION_CLOUDFLARE_SECRET applies at runtime
      cloudflareSecret: options.cloudflareSecret ?? '',
      rateLimit: Number(options.rateLimit) || 100,
      limitPaths: Array.isArray(options.limitPaths) ? options.limitPaths : []
    }

    // Top-level so the env var is the clean NUXT_IPINFO_API_KEY; registered even when empty so it applies
    nuxt.options.runtimeConfig.ipinfoApiKey = options.ipinfoApiKey ?? nuxt.options.runtimeConfig.ipinfoApiKey ?? ''

    const resolver = createResolver(import.meta.url)

    for (const mw of middlewareDefs) {
      addServerHandler({
        middleware: true,
        route: '/',
        handler: resolver.resolve(`../runtime/middleware/${mw.file}`)
      })
    }
  }
})
