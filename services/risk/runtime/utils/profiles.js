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

export const saveRail = async (profile, rail, result) => {
  profile.rails[rail] = { ...result, at: Date.now() }
  profile.score = score(profile.rails, getUseCase(profile.useCase).rules)
  await storage().setItem(`profile:${profile.id}`, profile)
  return profile
}

export const createProfile = async (useCase) => {
  getUseCase(useCase) // validates the name
  const profile = { id: crypto.randomUUID(), useCase, createdAt: Date.now(), rails: {}, score: { risk: 0, trust: 0, hits: [] } }
  await storage().setItem(`profile:${profile.id}`, profile)
  return profile
}

export const deleteProfile = (id) => storage().removeItem(`profile:${id}`)
