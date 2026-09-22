import { btcpayRequest } from '../../lib/btcpayRequest.js'
import { requireAdmin } from '../../lib/requireAdmin.js'
import { pathId, required, badRequest } from '../../lib/adminInput.js'
import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const storeId = pathId(event, 'storeId')
  const body = await readBody(event)
  required(body, ['connectionString'])
  if (typeof body.enabled !== 'boolean') throw badRequest('enabled must be a boolean')

  return await btcpayRequest({
    method: 'PUT',
    path: `stores/${storeId}/payment-methods/LightningNetwork/BTC`,
    body: { connectionString: body.connectionString, enabled: body.enabled }
  })
})
