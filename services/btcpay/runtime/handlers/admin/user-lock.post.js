import { btcpayRequest } from '../../lib/btcpayRequest.js'
import { requireAdmin } from '../../lib/requireAdmin.js'
import { pathId, badRequest } from '../../lib/adminInput.js'
import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const userId = pathId(event, 'userId')
  const body = await readBody(event)
  if (typeof body?.locked !== 'boolean') throw badRequest('locked must be a boolean')

  return await btcpayRequest({
    method: 'POST',
    path: `users/${userId}/lock`,
    body: { locked: body.locked }
  })
})
