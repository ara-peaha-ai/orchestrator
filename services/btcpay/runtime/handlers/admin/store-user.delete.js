import { btcpayRequest } from '../../lib/btcpayRequest.js'
import { requireAdmin } from '../../lib/requireAdmin.js'
import { pathId } from '../../lib/adminInput.js'
import { defineEventHandler } from 'h3'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const storeId = pathId(event, 'storeId')
  const userId = pathId(event, 'userId')

  return await btcpayRequest({
    method: 'DELETE',
    path: `stores/${storeId}/users/${userId}`
  })
})
