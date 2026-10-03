import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { getProfile, saveRail } from '../../../../utils/profiles.js'
import { getUseCase } from '../../../../utils/useCases.js'
import { rails } from '../../../../rails/index.js'

// Runs one rail with its input and stores its raw result. Only rails listed in the profile's use case.
export default defineEventHandler(async (event) => {
  const profile = await getProfile(getRouterParam(event, 'id'))
  const name = getRouterParam(event, 'rail')
  if (!Object.hasOwn(rails, name) || !getUseCase(profile.useCase).rails.includes(name)) {
    throw createError({ statusCode: 400, statusMessage: `Rail not available for ${profile.useCase}: ${name}` })
  }
  const input = (await readBody(event).catch(() => null)) || {}
  let result
  try {
    result = await rails[name]({ event, profile, input })
  } catch (err) {
    if (err.statusCode === 400) throw err
    result = { status: 'error', reason: err.message }
  }
  return saveRail(profile.id, name, result)
})
