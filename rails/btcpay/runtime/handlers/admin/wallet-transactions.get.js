import { btcpayRequest } from '../../lib/btcpayRequest.js'
import { requireAdmin } from '../../lib/requireAdmin.js'
import { pathId, badRequest } from '../../lib/adminInput.js'
import { defineEventHandler, getQuery } from 'h3'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const storeId = pathId(event, 'storeId')
  const { limit, skip, labelFilter } = getQuery(event)
  if ([limit, skip].some(v => v !== undefined && !/^\d+$/.test(String(v)))) throw badRequest('limit and skip must be integers')

  return await btcpayRequest({
    path: `stores/${storeId}/payment-methods/onchain/BTC/wallet/transactions`,
    query: { limit, skip, labelFilter }
  })
})
