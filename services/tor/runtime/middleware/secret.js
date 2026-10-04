import { defineEventHandler, getRequestHeader, setResponseStatus } from 'h3'

export default defineEventHandler((event) => {

  const { torProxySecret } = useRuntimeConfig()
  const incomingSecretHeader = getRequestHeader(event, 'x-tor-proxy-secret')

  // fail closed: an unset/empty secret must never match an absent/empty header
  if (!torProxySecret || incomingSecretHeader !== torProxySecret) {
    setResponseStatus(event, 403)
    return { error: 'Forbidden' }
  }
})
