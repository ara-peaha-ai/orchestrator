import { btcpayRequest } from '../../lib/btcpayRequest.js'
import { requireAdmin } from '../../lib/requireAdmin.js'
import { pathId, required } from '../../lib/adminInput.js'
import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const storeId = pathId(event, 'storeId')
  const body = await readBody(event)
  required(body, ['source'])

  return await btcpayRequest({
    method: 'PUT',
    path: `stores/${storeId}/rates/configuration`,
    body: { spread: String(body.spread ?? '0'), isCustomScript: false, effectiveScript: null, preferredSource: body.source }
  })
})
