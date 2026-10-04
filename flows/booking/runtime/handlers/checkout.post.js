// The BTCPay rail package exports only ".", so the invoice helper is imported by relative path (workspace layout)
import { createInvoice } from '../../../../rails/btcpay/runtime/lib/createInvoice.js'
import { computeTotal, ALLOWED_CURRENCIES, DEFAULT_CURRENCY, EXTRA_PRICES } from '../lib/pricing.js'
import { orders } from '../lib/orders.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const bad = (message) => createError({ statusCode: 400, statusMessage: message })

// ponytail: in-memory per-IP limit, not shared across instances; move to storage/KV if invoices are abused
const LIMIT = 5
const WINDOW_MS = 60_000
const hits = new Map()
const tooMany = (ip) => {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter(t => now - t < WINDOW_MS)
  recent.push(now)
  hits.set(ip, recent)
  return recent.length > LIMIT
}

export default defineEventHandler(async (event) => {
  if (tooMany(getRequestIP(event, { xForwardedFor: true }) ?? 'unknown')) {
    throw createError({ statusCode: 429, statusMessage: 'Too many requests' })
  }
  const body = await readBody(event) || {}

  const bookingName = String(body.bookingName ?? '').trim()
  const bookingEmail = String(body.bookingEmail ?? '').trim()
  const bookingDetails = String(body.bookingDetails ?? '').trim()
  const bookingDate = String(body.bookingDate ?? '').trim()
  const timeSlot = String(body.timeSlot ?? '').trim()
  const currency = String(body.currency ?? DEFAULT_CURRENCY).toUpperCase()

  if (!bookingName || bookingName.length > 100) throw bad('Invalid bookingName')
  if (!EMAIL_RE.test(bookingEmail) || bookingEmail.length > 254) throw bad('Invalid bookingEmail')
  if (bookingDetails.length > 2000) throw bad('Invalid bookingDetails')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(bookingDate)) throw bad('Invalid bookingDate')
  if (!/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(timeSlot)) throw bad('Invalid timeSlot')
  if (!ALLOWED_CURRENCIES.includes(currency)) throw bad('Unsupported currency')
  if (body.extras !== undefined && !Array.isArray(body.extras)) throw bad('Invalid extras')

  // keep known extras only, deduplicated
  const extras = [...new Set(body.extras ?? [])].filter(e => Object.hasOwn(EXTRA_PRICES, e))
  const amount = computeTotal(extras)
  const orderId = crypto.randomUUID()

  const invoice = await createInvoice({
    amount,
    currency,
    orderId,
    buyerEmail: bookingEmail,
    redirectUrl: `${getRequestURL(event).origin}/flows/booking/thanks?orderId=${orderId}`,
    metadata: { bookingName, bookingDetails, bookingDate, timeSlot, extras }
  })

  orders.set(orderId, { status: 'pending', invoiceId: invoice.id, amount, currency })

  return { orderId, invoiceId: invoice.id, checkoutLink: invoice.checkoutLink }
})
