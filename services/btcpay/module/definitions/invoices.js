// Invoices, payment requests, webhooks (with signature verification)
// Everything except webhooks/btcpay is guarded by x-btcpay-admin-secret; the receiver is guarded by HMAC.
export const invoiceEndpointDefs = [
  { method: 'POST', route: 'invoices', file: 'invoices/create.post.js' },
  { method: 'GET', route: 'invoices', file: 'invoices/list.get.js' },
  { method: 'GET', route: 'invoices/:invoiceId', file: 'invoices/get.get.js' },
  { method: 'POST', route: 'invoices/:invoiceId/status', file: 'invoices/status.post.js' },
  { method: 'GET', route: 'invoices/:invoiceId/payment-methods', file: 'invoices/paymentMethods.get.js' },
  { method: 'POST', route: 'payment-requests', file: 'invoices/paymentRequestCreate.post.js' },
  { method: 'GET', route: 'payment-requests', file: 'invoices/paymentRequestList.get.js' },
  { method: 'GET', route: 'payment-requests/:id', file: 'invoices/paymentRequestGet.get.js' },
  { method: 'GET', route: 'webhooks', file: 'invoices/webhookList.get.js' },
  { method: 'POST', route: 'webhooks', file: 'invoices/webhookCreate.post.js' },
  { method: 'POST', route: 'webhooks/btcpay', file: 'invoices/webhookReceive.post.js' }
]
