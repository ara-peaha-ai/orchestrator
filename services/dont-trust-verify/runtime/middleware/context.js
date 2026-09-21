import { defineEventHandler, getRequestHeader } from 'h3'

// Standalone mode: trust x-user-id only when the shared secret matches.
// Module mode: the host app's own auth already sets event.context.user.
export default defineEventHandler((event) => {
  const { proxySecret } = useRuntimeConfig().dontTrustVerify
  if (!proxySecret || event.context.user?.id) return
  if (getRequestHeader(event, 'x-dont-trust-verify-secret') !== proxySecret) return

  const id = getRequestHeader(event, 'x-user-id')
  if (id) event.context.user = { id }
})
