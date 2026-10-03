import { Verifier } from 'bip322-js'
import { createError } from 'h3'

const ADDRESS = /^(bc1[a-z0-9]{8,87}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/

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
  if (!valid) return { status: 'ok', address, valid: false }

  // Raw UTXOs (value, confirmed, block_time): age and amount are read by whoever reviews the profile
  const utxos = await $fetch(`${useRuntimeConfig().risk.mempoolUrl}/address/${address}/utxo`)
  return { status: 'ok', address, valid: true, utxos }
}
