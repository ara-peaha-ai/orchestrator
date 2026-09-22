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
      cloudflareSecret: options.cloudflareSecret,
      rateLimit: Number(options.rateLimit) || 100,
      limitPaths: Array.isArray(options.limitPaths) ? options.limitPaths : []
    }

    // Top-level so the env var is the clean NUXT_IPINFO_API_KEY
    if (options.ipinfoApiKey !== undefined) {
      nuxt.options.runtimeConfig.ipinfoApiKey = options.ipinfoApiKey
    }

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
