import { defineEventHandler, readBody, createError } from 'h3'
import { descriptorFromFace } from '../../../utils/faceServer.js'
import { euclideanDistance } from '../../../utils/checks.js'

const MAX_FACES = 5

// One match per user at a time: each face crop is a CPU/WASM inference, so
// unbounded concurrency per user lets one caller monopolize the process.
// ponytail: per-process lock, multi-instance deploys need a shared rate limiter.
const inFlight = new Set()

// One crop per face found in the training image. Every face must match the reference:
// an image that also contains someone else is rejected.
export default defineEventHandler(async (event) => {
  const userId = event.context.user?.id
  if (!userId) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  if (inFlight.has(userId)) throw createError({ statusCode: 429, statusMessage: 'Match already in progress' })

  inFlight.add(userId)
  try {
    return await match(userId, event)
  } finally {
    inFlight.delete(userId)
  }
})

const match = async (userId, event) => {
  const { faces } = await readBody(event)
  if (!Array.isArray(faces) || !faces.length || faces.length > MAX_FACES) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid faces' })
  }

  const record = await useStorage('dont-trust-verify').getItem(`vector:${userId}`)
  if (!record) throw createError({ statusCode: 404, statusMessage: 'Not verified' })

  const { matchThreshold } = useRuntimeConfig().dontTrustVerify
  const distances = []
  for (const face of faces) {
    const vector = await descriptorFromFace(face)
    if (!vector) return { match: false, reason: 'no-face' }
    distances.push(euclideanDistance(record.vector, vector))
  }

  return { match: distances.every(d => d < matchThreshold), distances }
}
