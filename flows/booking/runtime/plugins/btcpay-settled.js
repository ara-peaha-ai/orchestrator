import { updateInvoiceMetadata } from '@ara-peaha-ai/btcpay/updateInvoiceMetadata'
import { openPurchaseRequest } from '../lib/openPurchaseRequest.js'

// btcpay is a shared service: this hook fires for every settled invoice in the
// store, not just booking's, so only act on invoices booking itself created.
// fulfilled is written back into the invoice's own metadata only after
// openPurchaseRequest actually completes (not just queues) — openPurchaseRequest
// is still a stub, so this never marks fulfilled until it's implemented for real;
// a throw or a still-stubbed purchase leaves it unfulfilled and a webhook
// redelivery (or manual retry) tries again.
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('btcpay:invoice-settled', async ({ invoiceId, orderId, amount, currency, metadata }) => {
    if (metadata?.flow !== 'booking' || !orderId) return
    if (metadata?.fulfilled) return

    const result = await openPurchaseRequest({ orderId, amount, currency })
    if (result?.status !== 'completed') return

    await updateInvoiceMetadata(invoiceId, { fulfilled: true, fulfilledAt: new Date().toISOString() })
  })
})
