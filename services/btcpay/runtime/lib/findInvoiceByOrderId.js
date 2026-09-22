import { btcpayRequest } from './btcpayRequest.js'
import { getStoreId } from './getStoreId.js'

// Plain function for server code (booking flow) — the BTCPay invoice is the order record,
// there is no separate orders store. orderId lives in the invoice metadata set by createInvoice().
export const findInvoiceByOrderId = async (orderId) => {
  const invoices = await btcpayRequest({ path: `stores/${getStoreId()}/invoices`, query: { orderId } })
  return invoices?.[0] ?? null
}
