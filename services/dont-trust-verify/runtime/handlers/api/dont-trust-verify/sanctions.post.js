import { defineEventHandler, readBody, createError } from 'h3'

// Sanctions screening of a crypto address before the user deposits with a regulated provider.
// Chainalysis free public API: a non-empty `identifications` list means the address is sanctioned.
// https://www.chainalysis.com/free-cryptocurrency-sanctions-screening-tools/
const ADDRESS_RE = /^[A-Za-z0-9:_-]{20,128}$/

export default defineEventHandler(async (event) => {
  const userId = event.context.user?.id
  if (!userId) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const { chainalysisApiKey } = useRuntimeConfig(event).dontTrustVerify
  if (!chainalysisApiKey) throw createError({ statusCode: 503, statusMessage: 'Sanctions check not configured' })

  const { address } = (await readBody(event)) || {}
  if (typeof address !== 'string' || !ADDRESS_RE.test(address.trim())) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid address' })
  }

  const clean = address.trim()
  try {
    const { identifications = [] } = await $fetch(`https://public.chainalysis.com/api/v1/address/${encodeURIComponent(clean)}`, {
      headers: { 'X-API-Key': chainalysisApiKey, Accept: 'application/json' },
      timeout: 10_000
    })
    return { address: clean, sanctioned: identifications.length > 0, identifications }
  } catch {
    // The key and the provider's error body stay server-side
    throw createError({ statusCode: 502, statusMessage: 'Sanctions provider unavailable' })
  }
})
