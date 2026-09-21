import { defineNuxtModule, addServerHandler, addImports, createResolver } from '@nuxt/kit'
import { endpointDefs } from './definitions/endpoints.js'
import { middlewareDefs } from './definitions/middlewares.js'
import { assetDefs } from './definitions/assets.js'

const toBoolean = (v) => String(v || '').toLowerCase() === 'true'

export default defineNuxtModule({
  meta: {
    name: '@paga-peaha-ai/dont-trust-verify',
    configKey: 'dontTrustVerify'
  },

  defaults: {
    enabled: false,
    prefix: '/api/dont-trust-verify',
    minAge: 18,
    matchThreshold: 0.6,
    proxySecret: undefined
  },

  setup(options, nuxt) {
    const enabled = toBoolean(options.enabled)
    if (!enabled) return

    const prefix = String(options.prefix).replace(/\/+$/, '')

    nuxt.options.runtimeConfig.dontTrustVerify = {
      prefix,
      minAge: Number(options.minAge) || 18,
      matchThreshold: Number(options.matchThreshold) || 0.6,
      proxySecret: options.proxySecret
    }
    // Client needs the same values to run the local checks
    nuxt.options.runtimeConfig.public.dontTrustVerify = {
      prefix,
      minAge: Number(options.minAge) || 18,
      matchThreshold: Number(options.matchThreshold) || 0.6
    }

    const resolver = createResolver(import.meta.url)

    addImports({
      name: 'useDontTrustVerify',
      from: resolver.resolve('../runtime/composables/useDontTrustVerify.js')
    })

    nuxt.options.nitro.publicAssets = [
      ...(nuxt.options.nitro.publicAssets || []),
      ...assetDefs(prefix)
    ]

    for (const mw of middlewareDefs) {
      addServerHandler({
        middleware: true,
        route: prefix,
        handler: resolver.resolve(`../runtime/middleware/${mw.file}`)
      })
    }

    for (const ep of endpointDefs) {
      const routeRel = String(ep.route).replace(/^\/+|\/+$/g, '')
      addServerHandler({
        route: routeRel ? `${prefix}/${routeRel}` : prefix,
        method: String(ep.method).toLowerCase(),
        handler: resolver.resolve(`../runtime/handlers/${ep.file}`)
      })
    }
  }
})
