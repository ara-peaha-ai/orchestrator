import { defineNuxtModule, addServerHandler, createResolver } from '@nuxt/kit'
import { endpointDefs } from './definitions/endpoints.js'

const toBoolean = (v) => String(v || '').toLowerCase() === 'true'

export default defineNuxtModule({
  meta: {
    name: '@ara-peaha-ai/btcpay',
    configKey: 'peahaBtcpayRail'
  },

  defaults: {
    enabled: true,
    prefix: '/api/rails/btcpay',
    btcpayUrl: undefined,
    btcpayApiKey: undefined,
    btcpayStoreId: undefined,
    btcpayWebhookSecret: undefined,
    btcpayAdminSecret: undefined,
    btcpayPosCssUrl: undefined
  },

  setup(options, nuxt) {
    if (!toBoolean(options.enabled)) return

    const resolver = createResolver(import.meta.url)

    // keys are registered (even empty) so NUXT_BTCPAY_* env vars can override them at runtime
    const rc = nuxt.options.runtimeConfig
    rc.btcpayUrl = options.btcpayUrl ?? rc.btcpayUrl ?? ''
    rc.btcpayApiKey = options.btcpayApiKey ?? rc.btcpayApiKey ?? ''
    rc.btcpayStoreId = options.btcpayStoreId ?? rc.btcpayStoreId ?? ''
    rc.btcpayWebhookSecret = options.btcpayWebhookSecret ?? rc.btcpayWebhookSecret ?? ''
    rc.btcpayAdminSecret = options.btcpayAdminSecret ?? rc.btcpayAdminSecret ?? ''
    rc.btcpayPosCssUrl = options.btcpayPosCssUrl ?? rc.btcpayPosCssUrl ?? ''

    const prefix = String(options.prefix || '/api/rails/btcpay').replace(/\/+$/, '')
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
  }
})
