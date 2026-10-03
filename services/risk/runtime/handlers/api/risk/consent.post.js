import { defineEventHandler, getRouterParam, setResponseHeader, sendRedirect } from 'h3'
import { getProfile, saveRail } from '../../../utils/profiles.js'
import { getUseCase } from '../../../utils/useCases.js'
import ip from '../../../rails/ip.js'

// The click is the only request from the subject's own connection, so the ip rail runs here.
export default defineEventHandler(async (event) => {
  const profile = await getProfile(getRouterParam(event, 'id'))
  await saveRail(profile.id, 'ip', await ip({ event }))
  const next = getUseCase(profile.useCase).consentNext
  if (next) return sendRedirect(event, next, 303)
  setResponseHeader(event, 'content-type', 'text/html; charset=utf-8')
  return '<!doctype html><html><head><meta charset="utf-8"><title>Thank you</title></head><body style="font-family:sans-serif;max-width:32rem;margin:3rem auto;padding:0 1rem"><p>Thank you, you can close this page.</p></body></html>'
})
