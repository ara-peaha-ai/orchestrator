// The BTCPay rail package exports only ".", so the invoice helper is imported by relative path (workspace layout)
import { createInvoice } from '../../../../rails/btcpay/runtime/lib/createInvoice.js'
import { computeTotal, ALLOWED_CURRENCIES, DEFAULT_CURRENCY, EXTRA_PRICES } from '../lib/pricing.js'
import { orders } from '../lib/orders.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const bad = (message) => createError({ statusCode: 400, statusMessage: message })

export default defineEventHandler(async (event) => {
  const body = await readBody(event) || {}

  const bookingName = String(body.bookingName ?? '').trim()
  const bookingEmail = String(body.bookingEmail ?? '').trim()
  const bookingDetails = String(body.bookingDetails ?? '').trim()
  const timeSlot = String(body.timeSlot ?? '').trim()
  const currency = String(body.currency ?? DEFAULT_CURRENCY).toUpperCase()

  if (!bookingName || bookingName.length > 100) throw bad('Invalid bookingName')
  if (!EMAIL_RE.test(bookingEmail) || bookingEmail.length > 254) throw bad('Invalid bookingEmail')
  if (bookingDetails.length > 2000) throw bad('Invalid bookingDetails')
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
    metadata: { bookingName, bookingDetails, timeSlot, extras }
  })

  orders.set(orderId, { status: 'pending', invoiceId: invoice.id, amount, currency })

  return { orderId, invoiceId: invoice.id, checkoutLink: invoice.checkoutLink }
})
