import { defineEventHandler, readBody } from 'h3'
import { requireServerSecret } from '../../lib/requireServerSecret.js'
import { btcpayRequest } from '../../lib/btcpayRequest.js'
import { getStoreId, assertMoney } from '../../lib/getStoreId.js'

export default defineEventHandler(async (event) => {
  requireServerSecret(event)
  const { amount, currency, title, email, description } = (await readBody(event)) || {}
  if (!title || typeof title !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'title is required' })
  }
  return btcpayRequest({
    method: 'POST',
    path: `stores/${getStoreId()}/payment-requests`,
    body: { ...assertMoney({ amount, currency }), title, email, description }
  })
})
