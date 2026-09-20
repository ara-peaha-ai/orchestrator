import { defineEventHandler, getRouterParam, readBody } from 'h3'
import { requireServerSecret } from '../../lib/requireServerSecret.js'
import { btcpayRequest } from '../../lib/btcpayRequest.js'
import { getStoreId } from '../../lib/getStoreId.js'

export default defineEventHandler(async (event) => {
  requireServerSecret(event)
  const { status } = (await readBody(event)) || {}
  if (!['Settled', 'Invalid'].includes(status)) {
    throw createError({ statusCode: 400, statusMessage: 'status must be Settled or Invalid' })
  }
  const invoiceId = encodeURIComponent(getRouterParam(event, 'invoiceId'))
  return btcpayRequest({ method: 'POST', path: `stores/${getStoreId()}/invoices/${invoiceId}/status`, body: { status } })
})
