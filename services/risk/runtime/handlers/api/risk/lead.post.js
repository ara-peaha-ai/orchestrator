import { defineEventHandler, readBody } from 'h3'
import { fetchPosts, postSignals } from '../../../rails/social.js'
import { score } from '../../../utils/score.js'
import { getUseCase } from '../../../utils/useCases.js'

// Called by n8n for an Instagram DM: { platform, handle, text }. Nothing is downloaded nor stored.
// An IG DM carries no IP, so the signals are the sender's public profile and the message.
export default defineEventHandler(async (event) => {
  const { platform = 'instagram', handle, text = '' } = (await readBody(event)) || {}
  const { posts, source } = await fetchPosts(platform, handle)
  const signals = { ...postSignals(posts), links: (String(text).match(/https?:\/\//g) || []).length, source }
  return { signals, score: score({ lead: { status: 'ok', signals } }, getUseCase('lead').rules) }
})
