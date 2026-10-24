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

    // registered even when empty, so NUXT_TOR_PROXY_SECRET / NUXT_ROBOSATS_COORDINATOR_ONION_URL apply at runtime;
    // an empty secret makes the tor-proxy route deny every call
    nuxt.options.runtimeConfig.torProxySecret = options.torProxySecret ?? nuxt.options.runtimeConfig.torProxySecret ?? ''
    nuxt.options.runtimeConfig.robosatsCoordinatorOnionUrl = options.robosatsCoordinatorOnionUrl ??
      nuxt.options.runtimeConfig.robosatsCoordinatorOnionUrl ?? 'http://otmoonrndnrddqdlhu6b36heunmbyw3cgvadqo2oqeau3656wfv7fwad.onion'

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
