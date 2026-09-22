import { btcpayRequest } from '../../lib/btcpayRequest.js'
import { requireAdmin } from '../../lib/requireAdmin.js'
import { pathId } from '../../lib/adminInput.js'
import { defineEventHandler } from 'h3'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const storeId = pathId(event, 'storeId')
  const currency = pathId(event, 'currency')

  return await btcpayRequest({
    path: `stores/${storeId}/rates`,
    query: { currencyPair: `BTC_${currency}` }
  })
})
