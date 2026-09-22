import { defineEventHandler, getQuery } from 'h3'
import { requireServerSecret } from '../../lib/requireServerSecret.js'
import { btcpayRequest } from '../../lib/btcpayRequest.js'
import { getStoreId } from '../../lib/getStoreId.js'

const FILTERS = ['status', 'take', 'skip', 'orderId', 'startDate', 'endDate', 'textSearch']

export default defineEventHandler((event) => {
  requireServerSecret(event)
  const input = getQuery(event)
  const query = {}
  for (const key of FILTERS) {
    if (input[key] !== undefined && input[key] !== '') query[key] = input[key]
  }
  // legacy behaviour: "new" also returns processing invoices
  const statuses = [].concat(query.status ?? [])
  if (statuses.some(s => String(s).toLowerCase() === 'new') && !statuses.some(s => String(s).toLowerCase() === 'processing')) {
    query.status = [...statuses, 'Processing']
  }
  return btcpayRequest({ path: `stores/${getStoreId()}/invoices`, query })
})
