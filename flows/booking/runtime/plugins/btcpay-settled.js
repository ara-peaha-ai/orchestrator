import { orders } from '../lib/orders.js'
import { openPurchaseRequest } from '../lib/openPurchaseRequest.js'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('btcpay:invoice-settled', async ({ orderId, amount, currency }) => {
    const order = orders.get(orderId)
    if (!order || order.status === 'paid') return
    order.status = 'paid'
    await openPurchaseRequest({ orderId, amount, currency })
  })
})
