import { defineEventHandler, readBody } from 'h3'
import { requireServerSecret } from '../../lib/requireServerSecret.js'
import { btcpayRequest } from '../../lib/btcpayRequest.js'
import { getStoreId } from '../../lib/getStoreId.js'

const DEFAULT_EVENTS = ['InvoiceSettled', 'InvoiceProcessing', 'InvoiceExpired', 'InvoiceInvalid']

export default defineEventHandler(async (event) => {
  requireServerSecret(event)
  const { url, secret, events } = (await readBody(event)) || {}
  if (typeof url !== 'string' || !/^https:\/\//.test(url)) {
    throw createError({ statusCode: 400, statusMessage: 'url must be an https URL' })
  }
  const { btcpayWebhookSecret } = useRuntimeConfig()
  return btcpayRequest({
    method: 'POST',
    path: `stores/${getStoreId()}/webhooks`,
    body: {
      enabled: true,
      automaticRedelivery: true,
      url,
      secret: secret || btcpayWebhookSecret || undefined,
      authorizedEvents: { everything: false, specificEvents: Array.isArray(events) && events.length ? events : DEFAULT_EVENTS }
    }
  })
})
