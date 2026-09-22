import { updateInvoiceMetadata } from '@ara-peaha-ai/btcpay/updateInvoiceMetadata'
import { openPurchaseRequest } from '../lib/openPurchaseRequest.js'

// The BTCPay invoice is the order record: fulfilled is written back into its own
// metadata only after openPurchaseRequest succeeds, so a throw there leaves it
// unfulfilled and a webhook redelivery (or manual retry) tries again.
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('btcpay:invoice-settled', async ({ invoiceId, orderId, amount, currency, metadata }) => {
    if (metadata?.fulfilled) return
    await openPurchaseRequest({ orderId, amount, currency })
    await updateInvoiceMetadata(invoiceId, { fulfilled: true, fulfilledAt: new Date().toISOString() })
  })
})
