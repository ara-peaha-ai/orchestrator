import { defineEventHandler, readBody } from 'h3'
import { fetchPosts } from '../../../rails/social.js'

// Called by n8n for an Instagram DM: { platform, handle, text }. Nothing is downloaded nor stored.
// Raw result only: an IG DM carries no IP, so it is the sender's public posts and the message.
export default defineEventHandler(async (event) => {
  const { platform = 'instagram', handle, text = '' } = (await readBody(event)) || {}
  const { posts, source } = await fetchPosts(platform, handle)
  return { platform, handle, text, source, posts }
})
