import { defineNuxtModule, addServerHandler, addImportsDir, createResolver, installModule } from '@nuxt/kit'
import { endpointDefs } from './definitions/endpoints.js'

const toBoolean = (v) => String(v || '').toLowerCase() === 'true'

export default defineNuxtModule({
  meta: {
    name: '@ara-peaha-ai/robosats',
    configKey: 'paguaituRobosatsRail'
  },

  defaults: {
    enabled: true,
    prefix: '/api/rails/robosats',
    routeBase: '/rails/robosats',
    torPrefix: '/api/tor',
    torProxySecret: undefined,
    torSocksUrl: undefined,
    robosatsCoordinatorUrl: undefined
  },

  async setup(options, nuxt) {
    if (!toBoolean(options.enabled)) return

    const resolver = createResolver(import.meta.url)

    nuxt.options.runtimeConfig.robosatsCoordinatorUrl =
      options.robosatsCoordinatorUrl ??
      nuxt.options.runtimeConfig.robosatsCoordinatorUrl ??
      'http://otmoonrndnrddqdlhu6b36heunmbyw3cgvadqo2oqeau3656wfv7fwad.onion'

    nuxt.options.runtimeConfig.torProxyPrefix =
      options.torPrefix ??
      nuxt.options.runtimeConfig.torProxyPrefix ??
      '/api/tor'

    // Install services/tor as a Nuxt module
    await installModule('@ara-peaha-ai/tor', {
      enabled: true,
      prefix: options.torPrefix || '/api/tor',
      torProxySecret: options.torProxySecret,
      torSocksUrl: options.torSocksUrl
    })

    // Auto-import client-side composables
    addImportsDir(resolver.resolve('../runtime/composables'))

    // Server handlers
    const prefix = String(options.prefix || '/api/rails/robosats').replace(/\/+$/, '')
    const specific = endpointDefs.filter(e => e.method !== 'ALL')
    const catchAll = endpointDefs.filter(e => e.method === 'ALL')

    for (const ep of [...specific, ...catchAll]) {
      const method = String(ep.method).toUpperCase()
      const routeRel = String(ep.route).replace(/^\/+/, '').replace(/\/+$/, '')
      const route = routeRel ? `${prefix}/${routeRel}` : prefix
      const def = { route, handler: resolver.resolve(`../runtime/handlers/${ep.file}`) }
      if (method !== 'ALL') def.method = method
      addServerHandler(def)
    }

    // Page
    nuxt.hook('pages:extend', (pages) => {
      pages.push({
        name: 'paguaitu-rail-robosats',
        path: options.routeBase,
        file: resolver.resolve('../runtime/pages/robosats.vue')
      })
    })
  }
})
