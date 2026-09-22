import { defineNuxtModule, addServerHandler, createResolver } from '@nuxt/kit'
import { endpointDefs } from './definitions/endpoints.js'

const toBoolean = (v) => String(v || '').toLowerCase() === 'true'

export default defineNuxtModule({
  meta: {
    name: '@ara-peaha-ai/masspay',
    configKey: 'paguaituMasspayRail'
  },

  defaults: {
    enabled: true,
    prefix: '/api/rails/masspay',
    routeBase: '/rails/masspay',
    masspayBaseUrl: undefined,
    masspayApiKey: undefined,
    masspayWebhookSecret: undefined,
    masspayBeneficiaryUserToken: undefined,
    masspayDestinationToken: undefined,
    masspayAttrSetToken: undefined,
    masspaySourceCurrency: undefined
  },

  setup(options, nuxt) {
    if (!toBoolean(options.enabled)) return

    const resolver = createResolver(import.meta.url)

    nuxt.options.runtimeConfig.masspayBaseUrl =
      options.masspayBaseUrl ?? nuxt.options.runtimeConfig.masspayBaseUrl ?? 'https://api.masspay.io/v1.0.0'
    nuxt.options.runtimeConfig.masspayApiKey =
      options.masspayApiKey ?? nuxt.options.runtimeConfig.masspayApiKey ?? ''
    nuxt.options.runtimeConfig.masspayWebhookSecret =
      options.masspayWebhookSecret ?? nuxt.options.runtimeConfig.masspayWebhookSecret ?? ''
    nuxt.options.runtimeConfig.masspayBeneficiaryUserToken =
      options.masspayBeneficiaryUserToken ?? nuxt.options.runtimeConfig.masspayBeneficiaryUserToken ?? ''
    nuxt.options.runtimeConfig.masspayDestinationToken =
      options.masspayDestinationToken ?? nuxt.options.runtimeConfig.masspayDestinationToken ?? ''
    nuxt.options.runtimeConfig.masspayAttrSetToken =
      options.masspayAttrSetToken ?? nuxt.options.runtimeConfig.masspayAttrSetToken ?? ''
    nuxt.options.runtimeConfig.masspaySourceCurrency =
      options.masspaySourceCurrency ?? nuxt.options.runtimeConfig.masspaySourceCurrency ?? 'USD'

    // Server handlers
    const prefix = String(options.prefix || '/api/rails/masspay').replace(/\/+$/, '')
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
        name: 'paguaitu-rail-masspay',
        path: options.routeBase,
        file: resolver.resolve('../runtime/pages/masspay.vue')
      })
    })
  }
})
