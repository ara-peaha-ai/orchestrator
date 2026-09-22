import { btcpayRequest } from '../../lib/btcpayRequest.js'
import { requireAdmin } from '../../lib/requireAdmin.js'
import { pathId, required } from '../../lib/adminInput.js'
import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const storeId = pathId(event, 'storeId')
  const body = await readBody(event)
  required(body, ['userId', 'role'])

  return await btcpayRequest({
    method: 'POST',
    path: `stores/${storeId}/users`,
    body: { userId: body.userId, role: body.role }
  })
})
