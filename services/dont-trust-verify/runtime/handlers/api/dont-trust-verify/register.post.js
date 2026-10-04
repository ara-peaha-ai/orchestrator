import { defineEventHandler, readBody, createError } from 'h3'
import { descriptorFromFace } from '../../../utils/faceServer.js'

// ponytail: in-process guard, a multi-instance deploy needs a storage driver with atomic delete
const inflight = new Set()

export default defineEventHandler(async (event) => {
  const userId = event.context.user?.id
  if (!userId) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const { code, ageVerified, face } = await readBody(event)
  const storage = useStorage('dont-trust-verify')

  // Only one attempt per user may read and burn the challenge at a time
  if (inflight.has(userId)) throw createError({ statusCode: 429, statusMessage: 'Attempt in progress' })
  inflight.add(userId)
  let challenge
  try {
    // Burn the challenge on every attempt, valid or not
    challenge = await storage.getItem(`challenge:${userId}`)
    await storage.removeItem(`challenge:${userId}`)
  } finally {
    inflight.delete(userId)
  }
  if (!challenge || challenge.expiresAt < Date.now() || challenge.code !== code) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid or expired challenge' })
  }

  if (ageVerified !== true) {
    throw createError({ statusCode: 400, statusMessage: 'Age requirement not met' })
  }

  // The reference vector is computed here from the face crop, so it cannot be an invented number.
  // The crop itself is discarded right after.
  const vector = await descriptorFromFace(face)
  if (!vector) throw createError({ statusCode: 400, statusMessage: 'No face found' })

  // Default storage is memory: mount a persistent driver on 'dont-trust-verify' in the host app
  await storage.setItem(`vector:${userId}`, { vector, verifiedAt: Date.now() })

  return { ok: true }
})
