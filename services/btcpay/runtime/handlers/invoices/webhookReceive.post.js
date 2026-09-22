import { defineEventHandler, getRequestHeader, readRawBody } from 'h3'
import { verifyBtcpaySig } from '../../lib/verifyBtcpaySig.js'
import { btcpayRequest } from '../../lib/btcpayRequest.js'

const HOOKS = {
  InvoiceSettled: 'btcpay:invoice-settled',
  InvoiceProcessing: 'btcpay:invoice-processing',
  InvoiceExpired: 'btcpay:invoice-expired',
  InvoiceInvalid: 'btcpay:invoice-invalid'
}

// ponytail: in-memory dedupe, lost on restart and not shared across instances; cap 5000 ids (oldest evicted).
// Upgrade path: persist handled invoiceIds in storage (useStorage / KV / DB unique key) once running multi-instance.
const handled = new Set()
const HANDLED_MAX = 5000
const remember = (id) => {
  handled.add(id)
  if (handled.size > HANDLED_MAX) handled.delete(handled.values().next().value)
}

export default defineEventHandler(async (event) => {
  const { btcpayWebhookSecret, btcpayStoreId } = useRuntimeConfig()
  const rawBody = await readRawBody(event, false)
  if (!verifyBtcpaySig({ rawBody, header: getRequestHeader(event, 'btcpay-sig'), secret: btcpayWebhookSecret })) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid signature' })
  }

  let payload
  try {
    payload = JSON.parse(rawBody.toString('utf8'))
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid JSON' })
  }

  const { type, invoiceId, storeId } = payload || {}
  const hook = HOOKS[type]
  if (!hook || !invoiceId) return { ok: true, ignored: true }
  if (storeId && btcpayStoreId && storeId !== btcpayStoreId) return { ok: true, ignored: true }
  if (type === 'InvoiceSettled' && handled.has(invoiceId)) return { ok: true, duplicate: true }
  if (type === 'InvoiceSettled') remember(invoiceId)

  try {
    // authoritative values come from BTCPay, never from the webhook body
    const invoice = await btcpayRequest({ path: `stores/${btcpayStoreId}/invoices/${encodeURIComponent(invoiceId)}` })
    if (type === 'InvoiceSettled' && invoice.status !== 'Settled') {
      handled.delete(invoiceId)
      return { ok: true, ignored: true }
    }
    await useNitroApp().hooks.callHook(hook, {
      invoiceId,
      storeId: btcpayStoreId,
      orderId: invoice.metadata?.orderId,
      amount: invoice.amount,
      currency: invoice.currency,
      metadata: invoice.metadata
    })
  } catch (error) {
    // let BTCPay redeliver
    if (type === 'InvoiceSettled') handled.delete(invoiceId)
    throw error
  }
  return { ok: true }
})
