import { getRequestIP } from 'h3'
import { createInvoice } from '@ara-peaha-ai/btcpay/createInvoice'
import { computeTotal, ALLOWED_CURRENCIES, DEFAULT_CURRENCY, EXTRA_PRICES } from '../lib/pricing.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const bad = (message) => createError({ statusCode: 400, statusMessage: message })

// ponytail: in-memory fixed-window limiter, per process only — a multi-instance
// deployment needs a shared store (e.g. the same driver services/ip could use).
const RATE_LIMIT = 5
const RATE_WINDOW_MS = 60_000
const buckets = new Map()
const rateLimited = (ip) => {
  const now = Date.now()
  const entry = buckets.get(ip)
  if (!entry || (now - entry.start) > RATE_WINDOW_MS) {
    buckets.set(ip, { start: now, count: 1 })
    return false
  }
  entry.count += 1
  return entry.count > RATE_LIMIT
}

export default defineEventHandler(async (event) => {
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  if (rateLimited(ip)) throw createError({ statusCode: 429, statusMessage: 'Too many checkout attempts, try again later' })

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
  if (!DATE_RE.test(bookingDate)) throw bad('Invalid bookingDate')
  if (!/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(timeSlot)) throw bad('Invalid timeSlot')
  if (!ALLOWED_CURRENCIES.includes(currency)) throw bad('Unsupported currency')
  if (body.extras !== undefined && !Array.isArray(body.extras)) throw bad('Invalid extras')

  // keep known extras only, deduplicated
  const extras = [...new Set(body.extras ?? [])].filter(e => Object.hasOwn(EXTRA_PRICES, e))
  const amount = computeTotal(extras)
  const orderId = crypto.randomUUID()

  // The BTCPay invoice is the order record: bookingDate/timeSlot/extras live in its metadata,
  // status transitions (paid, etc.) are read back from the invoice itself, no separate store.
  const invoice = await createInvoice({
    amount,
    currency,
    orderId,
    buyerEmail: bookingEmail,
    redirectUrl: `${getRequestURL(event).origin}/flows/booking/thanks?orderId=${orderId}`,
    metadata: { bookingName, bookingDetails, bookingDate, timeSlot, extras }
  })

  return { orderId, invoiceId: invoice.id, checkoutLink: invoice.checkoutLink }
})
