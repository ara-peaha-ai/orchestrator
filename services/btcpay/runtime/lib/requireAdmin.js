import { timingSafeEqual, createHash } from 'node:crypto'
import { createError, getRequestHeader } from 'h3'

const digest = (value) => createHash('sha256').update(String(value)).digest()

// Guards every /admin route: the server API key must never be reachable without the admin secret
export const requireAdmin = (event) => {
  const { btcpayAdminSecret } = useRuntimeConfig()
  const provided = getRequestHeader(event, 'x-btcpay-admin-secret')

  if (!btcpayAdminSecret || !provided || !timingSafeEqual(digest(provided), digest(btcpayAdminSecret))) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
}
