import { btcpayRequest } from '../../lib/btcpayRequest.js'
import { requireAdmin } from '../../lib/requireAdmin.js'
import { pathId } from '../../lib/adminInput.js'
import { defineEventHandler } from 'h3'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const appId = pathId(event, 'appId')

  return await btcpayRequest({
    method: 'DELETE',
    path: `apps/${appId}`
  })
})
