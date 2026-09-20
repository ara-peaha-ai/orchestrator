import { endpointDefs } from './module/definitions/endpoints.js'

const prefix = '/api/rails/btcpay'

export default defineNitroConfig({
  compatibilityDate: '2026-04-04',

  runtimeConfig: {
    btcpayUrl: process.env.NUXT_BTCPAY_URL || '',
    btcpayApiKey: process.env.NUXT_BTCPAY_API_KEY || '',
    btcpayStoreId: process.env.NUXT_BTCPAY_STORE_ID || '',
    btcpayWebhookSecret: process.env.NUXT_BTCPAY_WEBHOOK_SECRET || '',
    btcpayAdminSecret: process.env.NUXT_BTCPAY_ADMIN_SECRET || '',
    btcpayPosCssUrl: process.env.NUXT_BTCPAY_POS_CSS_URL || ''
  },

  handlers: endpointDefs.map(ep => {
    const routeRel = String(ep.route).replace(/^\/+/, '').replace(/\/+$/, '')
    const def = { route: routeRel ? `${prefix}/${routeRel}` : prefix, handler: `./runtime/handlers/${ep.file}` }
    if (ep.method !== 'ALL') def.method = ep.method
    return def
  })
})
