import { btcpayRequest } from '../../lib/btcpayRequest.js'
import { requireAdmin } from '../../lib/requireAdmin.js'
import { pathId, required } from '../../lib/adminInput.js'
import { posParams } from '../../lib/posParams.js'
import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const appId = pathId(event, 'appId')
  const body = await readBody(event)
  required(body, ['name', 'currency'])

  return await btcpayRequest({
    method: 'PUT',
    path: `apps/pos/${appId}`,
    body: posParams(body.name, body.currency)
  })
})
