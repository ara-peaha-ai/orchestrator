import { createHmac, timingSafeEqual } from 'node:crypto'

// BTCPay-Sig header format: sha256=<hex hmac of raw body>
export const verifyBtcpaySig = ({ rawBody, header, secret }) => {
  if (!secret || !rawBody || typeof header !== 'string') return false
  const match = /^sha256=([0-9a-fA-F]{64})$/.exec(header.trim())
  if (!match) return false
  const expected = createHmac('sha256', secret).update(rawBody).digest()
  return timingSafeEqual(expected, Buffer.from(match[1], 'hex'))
}
