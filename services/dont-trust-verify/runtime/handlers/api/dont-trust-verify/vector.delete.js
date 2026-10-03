import { defineEventHandler, createError } from 'h3'

// Deletes the caller's reference vector (the biometric template). Idempotent.
export default defineEventHandler(async (event) => {
  const userId = event.context.user?.id
  if (!userId) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  await useStorage('dont-trust-verify').removeItem(`vector:${userId}`)
  return { ok: true }
})
