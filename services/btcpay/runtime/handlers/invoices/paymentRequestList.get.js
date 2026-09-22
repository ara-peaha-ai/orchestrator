import { defineEventHandler } from 'h3'
import { requireServerSecret } from '../../lib/requireServerSecret.js'
import { btcpayRequest } from '../../lib/btcpayRequest.js'
import { getStoreId } from '../../lib/getStoreId.js'

export default defineEventHandler((event) => {
  requireServerSecret(event)
  return btcpayRequest({ path: `stores/${getStoreId()}/payment-requests` })
})
