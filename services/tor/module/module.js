import { defineNuxtModule, addServerHandler, createResolver } from '@nuxt/kit'
import { endpointDefs } from './definitions/endpoints.js'
import { middlewareDefs } from './definitions/middlewares.js'

const toBoolean = (v) => String(v || '').toLowerCase() === 'true'

export default defineNuxtModule({
  meta: {
    name: '@ara-peaha-ai/tor',
    configKey: 'tor'
  },

  defaults: {
    enabled: false,
    prefix: '/api/tor',
    torProxySecret: undefined,
    torSocksUrl: undefined
  },

  setup(options, nuxt) {
    const enabled = toBoolean(options.enabled)
    if (!enabled) return

    if (options.torProxySecret !== undefined) {
      nuxt.options.runtimeConfig.torProxySecret = options.torProxySecret
    }
    // register the key so NUXT_TOR_PROXY_SECRET can override it at runtime; empty = proxy denies everything
    nuxt.options.runtimeConfig.torProxySecret ??= ''
    if (options.torSocksUrl !== undefined) {
      nuxt.options.runtimeConfig.torSocksUrl = options.torSocksUrl
    }

    nuxt.options.runtimeConfig.torSocksUrl =
      nuxt.options.runtimeConfig.torSocksUrl ?? 'socks5h://127.0.0.1:9050'

    const resolver = createResolver(import.meta.url)
    const prefix = String(options.prefix).replace(/\/+$/, '')

    // Scope the secret middleware to the Tor prefix only, not the entire app
    for (const mw of middlewareDefs) {
      addServerHandler({
        middleware: true,
        route: prefix,
        handler: resolver.resolve(`../runtime/middleware/${mw.file}`)
      })
    }

    // Register specific methods before catch-all so Nitro resolves them first
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
