import { btcpayRequest } from './btcpayRequest.js'
import { getStoreId } from './getStoreId.js'

// Plain function for server code (booking flow) — merges into the invoice's existing
// metadata so the invoice itself stays the single record of order + fulfillment state.
export const updateInvoiceMetadata = async (invoiceId, patch) => {
  const storeId = getStoreId()
  const invoice = await btcpayRequest({ path: `stores/${storeId}/invoices/${invoiceId}` })
  return btcpayRequest({
    method: 'PUT',
    path: `stores/${storeId}/invoices/${invoiceId}`,
    body: { metadata: { ...(invoice.metadata || {}), ...patch } }
  })
}
