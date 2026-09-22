import { defineEventHandler, getRouterParam } from 'h3'
import { requireServerSecret } from '../../lib/requireServerSecret.js'
import { btcpayRequest } from '../../lib/btcpayRequest.js'
import { getStoreId } from '../../lib/getStoreId.js'

export default defineEventHandler((event) => {
  requireServerSecret(event)
  const invoiceId = encodeURIComponent(getRouterParam(event, 'invoiceId'))
  return btcpayRequest({ path: `stores/${getStoreId()}/invoices/${invoiceId}/payment-methods` })
})
