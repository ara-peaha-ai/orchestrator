import { btcpayRequest } from '../../lib/btcpayRequest.js'
import { requireAdmin } from '../../lib/requireAdmin.js'
import { required } from '../../lib/adminInput.js'
import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const body = await readBody(event)
  required(body, ['email', 'password'])

  return await btcpayRequest({
    method: 'POST',
    path: 'users',
    body: { email: body.email, password: body.password, isAdministrator: false }
  })
})
