import { defineNuxtModule, addServerHandler, createResolver } from '@nuxt/kit'
import { endpointDefs } from './definitions/endpoints.js'
import { middlewareDefs } from './definitions/middlewares.js'

const toBoolean = (v) => String(v || '').toLowerCase() === 'true'

export default defineNuxtModule({
  meta: {
    name: '@ara-peaha-ai/cors',
    configKey: 'corsProxy'
  },

  defaults: {
    enabled: false,
    prefix: '/api/cors',
    corsProxySecret: undefined,
    corsTargetUrl: undefined,
    corsHealthPath: '/'
  },

  setup(options, nuxt) {
    const enabled = toBoolean(options.enabled)
    if (!enabled) return

    // Map module options -> runtimeConfig (server-only)
    nuxt.options.runtimeConfig.corsProxySecret = options.corsProxySecret
    nuxt.options.runtimeConfig.corsTargetUrl = options.corsTargetUrl
    nuxt.options.runtimeConfig.corsHealthPath = options.corsHealthPath || '/'

    const resolver = createResolver(import.meta.url)
    const prefix = String(options.prefix || '/api/cors').replace(/\/+$/, '')

    // Middleware
    for (const mw of middlewareDefs) {
      addServerHandler({
        middleware: true,
        route: '/',
        handler: resolver.resolve(`../runtime/middleware/${mw.file}`)
      })
    }

    // Endpoints: allow GET and ALL on same route (any order)
    const specific = endpointDefs.filter(e => String(e.method).toUpperCase() !== 'ALL')
    const all = endpointDefs.filter(e => String(e.method).toUpperCase() === 'ALL')

    const seen = new Set()

    for (const ep of [...specific, ...all]) {
      const method = String(ep.method).toUpperCase()
      const routeRel = String(ep.route || '').replace(/^\/+/, '').replace(/\/+$/, '')
      const route = routeRel ? `${prefix}/${routeRel}` : `${prefix}`

      // Key: allow GET+ALL same route (different keys)
      const key = `${method} ${route}`
      if (seen.has(key)) {
        throw new Error(`[@ara-peaha-ai/cors] Duplicate endpoint: ${key}`)
      }
      seen.add(key)

      const def = {
        route,
        handler: resolver.resolve(`../runtime/handlers/${ep.file}`)
      }

      // ALL = no method constraint
      if (method !== 'ALL') def.method = method

      addServerHandler(def)
    }
  }
})
