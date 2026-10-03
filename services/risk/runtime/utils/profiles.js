import { createError } from 'h3'
import { score } from './score.js'
import { getUseCase } from './useCases.js'

// Default storage is memory: mount a persistent driver on 'risk' in the host app (Postgres on the VPS)
const storage = () => useStorage('risk')

export const getProfile = async (id) => {
  const profile = await storage().getItem(`profile:${id}`)
  if (!profile) throw createError({ statusCode: 404, statusMessage: 'Profile not found' })
  return profile
}

// ponytail: in-process queue per profile, a multi-instance deploy needs a DB transaction instead
const queues = new Map()
const serialized = (id, fn) => {
  const run = (queues.get(id) || Promise.resolve()).then(fn)
  const tail = run.catch(() => {})
  queues.set(id, tail)
  tail.then(() => queues.get(id) === tail && queues.delete(id))
  return run
}

// Re-reads the latest record before merging, so two rails finishing together never drop each other
export const saveRail = (id, rail, result) => serialized(id, async () => {
  const profile = await getProfile(id)
  profile.rails[rail] = { ...result, at: Date.now() }
  const { rules, rails } = getUseCase(profile.useCase)
  profile.score = score(profile.rails, rules, rails)
  await storage().setItem(`profile:${id}`, profile)
  return profile
})

export const createProfile = async (useCase) => {
  const { rules, rails } = getUseCase(useCase) // also validates the name
  const profile = { id: crypto.randomUUID(), useCase, createdAt: Date.now(), rails: {}, score: score({}, rules, rails) }
  await storage().setItem(`profile:${profile.id}`, profile)
  return profile
}

export const deleteProfile = (id) => storage().removeItem(`profile:${id}`)
