import { defineEventHandler, getRequestHeader, setResponseStatus } from 'h3'

import { createHash, timingSafeEqual } from 'node:crypto'

const digest = (value) => createHash('sha256').update(String(value)).digest()
// constant-time compare; an unset secret never matches
const sameSecret = (provided, expected) => Boolean(expected && provided) && timingSafeEqual(digest(provided), digest(expected))

export default defineEventHandler((event) => {

  const { corsProxySecret } = useRuntimeConfig(event)
  const incomingSecretHeader = getRequestHeader(event, 'x-cors-secret')

  if (!sameSecret(incomingSecretHeader, corsProxySecret)) {
    setResponseStatus(event, 403)
    return { error: 'Forbidden' }
  }
})
