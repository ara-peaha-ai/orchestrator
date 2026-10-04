import { orders } from '../lib/orders.js'
import { openPurchaseRequest } from '../lib/openPurchaseRequest.js'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('btcpay:invoice-settled', async ({ orderId, amount, currency }) => {
    const order = orders.get(orderId)
    if (!order || order.status !== 'pending') return
    // mark paid only after fulfillment succeeds, so a failed attempt is retried by the next settled webhook
    order.status = 'fulfilling'
    try {
      await openPurchaseRequest({ orderId, amount, currency })
      order.status = 'paid'
    } catch (e) {
      order.status = 'pending'
      throw e
    }
  })
})
