import { btcpayRequest } from '../../lib/btcpayRequest.js'
import { requireAdmin } from '../../lib/requireAdmin.js'
import { pathId, badRequest } from '../../lib/adminInput.js'
import { apiKeyPermissions, restrictToStore } from '../../lib/apiKeyPermissions.js'
import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const userId = pathId(event, 'userId')
  const body = await readBody(event)
  const { label, preset, storeId, permissions } = body || {}
  let list = permissions
  if (preset) {
    if (!Object.hasOwn(apiKeyPermissions, preset)) throw badRequest('Unknown preset')
    if (storeId && !/^[A-Za-z0-9_-]{1,128}$/.test(storeId)) throw badRequest('Invalid storeId')
    list = storeId ? restrictToStore(storeId, apiKeyPermissions[preset]) : apiKeyPermissions[preset]
  }
  if (!Array.isArray(list) || !list.length || !list.every(p => typeof p === 'string')) throw badRequest('permissions or preset required')

  return await btcpayRequest({
    method: 'POST',
    path: `users/${userId}/api-keys`,
    body: { label, permissions: list }
  })
})
