import { defineEventHandler, createError } from 'h3'
import { generateCode } from '../../../utils/checks.js'

const TTL_MS = 10 * 60 * 1000

// Code the user writes on a sheet and holds in the photo next to the ID.
// Single-use and bound to the user: a stale or someone else's photo cannot be replayed.
export default defineEventHandler(async (event) => {
  const userId = event.context.user?.id
  if (!userId) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const code = generateCode()
  await useStorage('dont-trust-verify').setItem(`challenge:${userId}`, { code, expiresAt: Date.now() + TTL_MS })

  return { code }
})
