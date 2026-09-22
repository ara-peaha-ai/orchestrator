import { btcpayRequest } from '../../lib/btcpayRequest.js'
import { requireAdmin } from '../../lib/requireAdmin.js'
import { pathId, required } from '../../lib/adminInput.js'
import { posParams } from '../../lib/posParams.js'
import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const storeId = pathId(event, 'storeId')
  const body = await readBody(event)
  required(body, ['name', 'currency'])

  return await btcpayRequest({
    method: 'POST',
    path: `stores/${storeId}/apps/pos`,
    body: posParams(body.name, body.currency)
  })
})
