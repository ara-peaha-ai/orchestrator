import { readBody, getQuery, getRequestHeaders, getMethod } from 'h3'
import { ofetch } from 'ofetch'

import { createHash, timingSafeEqual } from 'node:crypto'

const digest = (value) => createHash('sha256').update(String(value)).digest()
// constant-time compare; an unset secret never matches
const sameSecret = (provided, expected) => Boolean(expected && provided) && timingSafeEqual(digest(provided), digest(expected))

export default defineEventHandler(async (event) => {

  const { corsTargetUrl, corsProxySecret } = useRuntimeConfig(event)

  const apiFetch = ofetch.create({
    baseURL: `${corsTargetUrl}`,
    // force JSON parsing so you always get a JS object, not raw bytes
    responseType: 'json'
  })

  const method = getMethod(event)
  const params = event.context.params._      // e.g. "v1/system/status"
  const query = getQuery(event)

  // Start from incoming headers…
  const incomingHeaders = getRequestHeaders(event)

  if (!sameSecret(incomingHeaders['x-cors-secret'], corsProxySecret)) {
    setResponseStatus(event, 403)
    return { error: 'Forbidden' }
  }

  // …but DO NOT forward everything blindly.
  // Strip problematic ones so Node/ofetch can handle compression and
  // let Nitro set correct response headers.
  const headers = {
    ...incomingHeaders,
    host: corsTargetUrl,
    accept: 'application/json'
  }

  delete headers['accept-encoding']
  delete headers['content-length']
  delete headers['connection']
  delete headers['origin']
  delete headers['referer']

  let body
  if (method !== 'GET' && method !== 'HEAD') {
    body = await readBody(event)
  }

  const data = await apiFetch(`/${params}`, {
    method,
    headers,
    query,
    body
  })

  return data
})
