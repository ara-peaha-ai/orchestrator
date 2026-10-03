import { Verifier } from 'bip322-js'
import { createError } from 'h3'

const ADDRESS = /^(bc1[a-z0-9]{8,87}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/
const MONTH = 30 * 86_400

// input: { address, message, signature }. BIP-322 (segwit/taproot) and legacy BIP-137 signatures.
// The message must contain the profile id, so a signature made for someone else cannot be replayed.
export default async ({ profile, input }) => {
  const { address, message, signature } = input
  if (!ADDRESS.test(String(address))) throw createError({ statusCode: 400, statusMessage: 'Invalid address' })
  if (!String(message || '').includes(profile.id)) {
    throw createError({ statusCode: 400, statusMessage: 'The signed message must contain the profile id' })
  }

  let valid = false
  try {
    valid = Verifier.verifySignature(address, message, String(signature || ''))
  } catch {}
  if (!valid) return { status: 'ok', signals: { valid: false } }

  const utxos = await $fetch(`${useRuntimeConfig().risk.mempoolUrl}/address/${address}/utxo`)
  const now = Date.now() / 1000
  const confirmed = utxos.filter(u => u.status?.confirmed)
  // Coins received in the last 30 days may be borrowed for the occasion: counted apart
  const balanceSat = confirmed.reduce((sum, u) => sum + u.value, 0)
  const balanceSat30d = confirmed.filter(u => now - u.status.block_time > MONTH).reduce((sum, u) => sum + u.value, 0)
  return { status: 'ok', signals: { valid: true, balanceSat, balanceSat30d } }
}
