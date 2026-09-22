import { createHash, timingSafeEqual } from 'node:crypto'
import { getRequestHeader } from 'h3'

const digest = (value) => createHash('sha256').update(String(value)).digest()

// Guards routes that use the server API key; denies when the secret is not configured
export const requireServerSecret = (event) => {
  const { btcpayAdminSecret } = useRuntimeConfig()
  const provided = getRequestHeader(event, 'x-btcpay-admin-secret')
  if (!btcpayAdminSecret || !provided || !timingSafeEqual(digest(provided), digest(btcpayAdminSecret))) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
}
