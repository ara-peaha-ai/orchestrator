import { defineNuxtModule, addServerHandler, createResolver } from '@nuxt/kit'
import { endpointDefs } from './definitions/endpoints.js'
import { middlewareDefs } from './definitions/middlewares.js'

const toBoolean = (v) => String(v || '').toLowerCase() === 'true'

export default defineNuxtModule({
  meta: {
    name: '@ara-peaha-ai/market',
    configKey: 'market'
  },

  defaults: {
    enabled: false,
    prefix: '/api/market',
    torProxySecret: undefined,
    robosatsCoordinatorOnionUrl: undefined,
    torSocksUrl: undefined
  },

  setup(options, nuxt) {
    const enabled = toBoolean(options.enabled)
    if (!enabled) return

    if (options.torProxySecret !== undefined) {
      nuxt.options.runtimeConfig.torProxySecret = options.torProxySecret
    }
    if (options.robosatsCoordinatorOnionUrl !== undefined) {
      nuxt.options.runtimeConfig.robosatsCoordinatorOnionUrl = options.robosatsCoordinatorOnionUrl
    }

    nuxt.options.runtimeConfig.torSocksUrl =
      options.torSocksUrl ?? nuxt.options.runtimeConfig.torSocksUrl ?? 'socks5h://127.0.0.1:9050'

    const resolver = createResolver(import.meta.url)
    const prefix = String(options.prefix || '/api/market').replace(/\/+$/, '')

    // Scope the CORS middleware to the market prefix only, not the entire app
    for (const mw of middlewareDefs) {
      addServerHandler({
        middleware: true,
        route: prefix,
        handler: resolver.resolve(`../runtime/middleware/${mw.file}`)
      })
    }

    const specific = endpointDefs.filter(e => e.method !== 'ALL')
    const catchAll = endpointDefs.filter(e => e.method === 'ALL')

    for (const ep of [...specific, ...catchAll]) {
      const method = String(ep.method).toUpperCase()
      const routeRel = String(ep.route).replace(/^\/+/, '').replace(/\/+$/, '')
      const route = routeRel ? `${prefix}/${routeRel}` : prefix

      const def = {
        route,
        handler: resolver.resolve(`../runtime/handlers/${ep.file}`)
      }

      if (method !== 'ALL') def.method = method

      addServerHandler(def)
    }
  }
})
