import { findInvoiceByOrderId } from '@ara-peaha-ai/btcpay/findInvoiceByOrderId'

// BTCPay Settled -> paid; New/Processing -> pending; everything else passes through lowercased
const toOrderStatus = (invoiceStatus) => {
  if (invoiceStatus === 'Settled') return 'paid'
  if (invoiceStatus === 'New' || invoiceStatus === 'Processing') return 'pending'
  return String(invoiceStatus ?? 'pending').toLowerCase()
}

export default defineEventHandler(async (event) => {
  const { orderId } = getQuery(event)
  if (!orderId) throw createError({ statusCode: 400, statusMessage: 'orderId is required' })

  const invoice = await findInvoiceByOrderId(String(orderId))
  if (!invoice) throw createError({ statusCode: 404, statusMessage: 'Order not found' })

  return { orderId, status: toOrderStatus(invoice.status), amount: invoice.amount, currency: invoice.currency }
})
