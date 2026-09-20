import { defineEventHandler, readBody } from 'h3'
import { requireServerSecret } from '../../lib/requireServerSecret.js'
import { createInvoice } from '../../lib/createInvoice.js'

export default defineEventHandler(async (event) => {
  requireServerSecret(event)
  const { amount, currency, orderId, buyerEmail, redirectUrl, metadata } = (await readBody(event)) || {}
  return createInvoice({ amount, currency, orderId, buyerEmail, redirectUrl, metadata })
})
