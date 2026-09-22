import { defineEventHandler, readBody, createError } from 'h3'
import { descriptorFromFace } from '../../../utils/faceServer.js'

// ponytail: in-process lock only — serializes concurrent register attempts for
// the same user so the get-then-delete below can't race. A multi-instance
// deployment needs a distributed lock/CAS on the storage driver instead.
const inFlight = new Set()

export default defineEventHandler(async (event) => {
  const userId = event.context.user?.id
  if (!userId) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  if (inFlight.has(userId)) throw createError({ statusCode: 429, statusMessage: 'Verification already in progress' })
  inFlight.add(userId)

  try {
    const { code, ageVerified, face } = await readBody(event)
    const storage = useStorage('dont-trust-verify')

    // Burn the challenge on every attempt, valid or not
    const challenge = await storage.getItem(`challenge:${userId}`)
    await storage.removeItem(`challenge:${userId}`)
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
  } finally {
    inFlight.delete(userId)
  }
})
