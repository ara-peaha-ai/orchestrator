import { defineNuxtModule, addServerHandler, addImportsDir, createResolver } from '@nuxt/kit'
import { endpointDefs } from './definitions/endpoints.js'

const toBoolean = (v) => String(v || '').toLowerCase() === 'true'

export default defineNuxtModule({
  meta: {
    name: '@ara-peaha-ai/peach',
    configKey: 'paguaituPeachRail'
  },

  defaults: {
    enabled: true,
    prefix: '/api/rails/peach',
    routeBase: '/rails/peach',
    peachBaseUrl: undefined,
    peachBitcoinMnemonic: undefined,
    peachPgpPrivateKey: undefined,
    peachPgpPublicKey: undefined,
    peachPgpPassphrase: undefined,
    peachReferralCode: undefined,
    peachFeeRate: undefined,
    peachMaxPremium: undefined
  },

  setup(options, nuxt) {
    if (!toBoolean(options.enabled)) return

    const resolver = createResolver(import.meta.url)

    nuxt.options.runtimeConfig.peachBaseUrl =
      options.peachBaseUrl ?? nuxt.options.runtimeConfig.peachBaseUrl ?? 'https://api.peachbitcoin.com'
    nuxt.options.runtimeConfig.peachBitcoinMnemonic =
      options.peachBitcoinMnemonic ?? nuxt.options.runtimeConfig.peachBitcoinMnemonic ?? ''
    nuxt.options.runtimeConfig.peachPgpPrivateKey =
      options.peachPgpPrivateKey ?? nuxt.options.runtimeConfig.peachPgpPrivateKey ?? ''
    nuxt.options.runtimeConfig.peachPgpPublicKey =
      options.peachPgpPublicKey ?? nuxt.options.runtimeConfig.peachPgpPublicKey ?? ''
    nuxt.options.runtimeConfig.peachPgpPassphrase =
      options.peachPgpPassphrase ?? nuxt.options.runtimeConfig.peachPgpPassphrase ?? ''
    nuxt.options.runtimeConfig.peachReferralCode =
      options.peachReferralCode ?? nuxt.options.runtimeConfig.peachReferralCode ?? ''
    nuxt.options.runtimeConfig.peachFeeRate =
      options.peachFeeRate ?? nuxt.options.runtimeConfig.peachFeeRate ?? 'hourFee'
    nuxt.options.runtimeConfig.peachMaxPremium =
      options.peachMaxPremium ?? nuxt.options.runtimeConfig.peachMaxPremium ?? 0

    // Auto-import client-side composables
    addImportsDir(resolver.resolve('../runtime/composables'))

    // Server handlers
    const prefix = String(options.prefix || '/api/rails/peach').replace(/\/+$/, '')
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
        name: 'paguaitu-rail-peach',
        path: options.routeBase,
        file: resolver.resolve('../runtime/pages/peach.vue')
      })
    })
  }
})
