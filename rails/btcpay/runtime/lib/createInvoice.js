import { btcpayRequest } from './btcpayRequest.js'
import { getStoreId, assertMoney } from './getStoreId.js'

// Plain function for server code (booking flow); HTTP callers go through invoices/create.post.js
export const createInvoice = async ({ amount, currency, orderId, buyerEmail, redirectUrl, metadata }) => {
  const money = assertMoney({ amount, currency })
  if (!orderId || typeof orderId !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'orderId is required' })
  }
  return btcpayRequest({
    method: 'POST',
    path: `stores/${getStoreId()}/invoices`,
    body: {
      ...money,
      metadata: { ...(metadata || {}), orderId, ...(buyerEmail ? { buyerEmail } : {}) },
      checkout: redirectUrl ? { redirectURL: redirectUrl } : undefined
    }
  })
}
