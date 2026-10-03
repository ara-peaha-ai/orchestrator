import { defineEventHandler, readBody, getRequestURL } from 'h3'
import { createProfile } from '../../../utils/profiles.js'

// body: { useCase: 'buyer.prestige' }. Send consentUrl to the subject (e.g. in the Instagram DM).
export default defineEventHandler(async (event) => {
  const { useCase } = (await readBody(event)) || {}
  const profile = await createProfile(useCase)
  const { prefix } = useRuntimeConfig().risk
  return { ...profile, consentUrl: `${getRequestURL(event).origin}${prefix}/consent/${profile.id}` }
})
