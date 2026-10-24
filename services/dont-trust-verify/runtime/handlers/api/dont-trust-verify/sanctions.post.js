import { defineEventHandler, readBody, createError } from 'h3'

// Sanctions screening of a crypto address before the user deposits with a regulated provider.
// Chainalysis free public API: a non-empty `identifications` list means the address is sanctioned.
// https://www.chainalysis.com/free-cryptocurrency-sanctions-screening-tools/
const ADDRESS_RE = /^[A-Za-z0-9:_-]{20,128}$/
const EVM_RE = /^0x[0-9a-f]{40}$/i

// The API lookup is case-sensitive and its EVM entries are lowercase: a checksummed
// (mixed-case) 0x address would come back clean. Other formats stay as written.
const canonical = (address) => (EVM_RE.test(address) ? `0x${address.slice(2).toLowerCase()}` : address)

// One lookup per user at a time, like /match and /register.
// ponytail: per-process lock, the 5000 requests / 5 min key quota needs a shared limiter on multi-instance deploys
const inFlight = new Set()

export default defineEventHandler(async (event) => {
  const userId = event.context.user?.id
  if (!userId) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const { chainalysisApiKey } = useRuntimeConfig(event).dontTrustVerify
  if (!chainalysisApiKey) throw createError({ statusCode: 503, statusMessage: 'Sanctions check not configured' })

  const { address } = (await readBody(event)) || {}
  if (typeof address !== 'string' || !ADDRESS_RE.test(address.trim())) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid address' })
  }
  if (inFlight.has(userId)) throw createError({ statusCode: 429, statusMessage: 'Sanctions check already in progress' })

  const queried = canonical(address.trim())
  inFlight.add(userId)
  let data
  try {
    data = await $fetch(`https://public.chainalysis.com/api/v1/address/${encodeURIComponent(queried)}`, {
      headers: { 'X-API-Key': chainalysisApiKey, Accept: 'application/json' },
      timeout: 10_000
    })
  } catch (error) {
    // The key and the provider's error body stay server-side
    const status = error?.response?.status
    if (status === 400) throw createError({ statusCode: 400, statusMessage: 'Address rejected by the sanctions provider' })
    if (status === 403 || status === 429) throw createError({ statusCode: 429, statusMessage: 'Sanctions provider quota reached or key rejected' })
    throw createError({ statusCode: 502, statusMessage: 'Sanctions provider unavailable' })
  } finally {
    inFlight.delete(userId)
  }

  // A clean answer must be an explicit empty list: any other shape is an error, never "not sanctioned"
  if (!Array.isArray(data?.identifications)) throw createError({ statusCode: 502, statusMessage: 'Unexpected sanctions provider response' })
  return { address: queried, sanctioned: data.identifications.length > 0, identifications: data.identifications }
})
