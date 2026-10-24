import {
  defineEventHandler,
  getQuery,
  getRequestHeaders,
  getMethod,
  readBody,
  setResponseStatus,
  setResponseHeaders
} from 'h3'
import got from 'got'
import { SocksProxyAgent } from 'socks-proxy-agent'

import { createHash, timingSafeEqual } from 'node:crypto'

const digest = (value) => createHash('sha256').update(String(value)).digest()
// constant-time compare; an unset secret never matches
const sameSecret = (provided, expected) => Boolean(expected && provided) && timingSafeEqual(digest(provided), digest(expected))

const HOP_BY_HOP = new Set([
  'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
  'te', 'trailer', 'transfer-encoding', 'upgrade'
])

const STRIP_RESPONSE_HEADERS = new Set([
  ...HOP_BY_HOP, 'set-cookie', 'content-encoding', 'content-length'
])

const joinUrl = (base, path) => {
  const b = base.replace(/\/+$/, '')
  const p = path.startsWith('/') ? path : '/' + path
  return b + p
}

const sanitizeOutgoingHeaders = (incoming) => {
  const headers = { ...incoming }
  for (const k of Object.keys(headers)) {
    if (HOP_BY_HOP.has(k.toLowerCase())) delete headers[k]
  }
  delete headers.host
  delete headers['content-length']
  delete headers['accept-encoding']
  delete headers.origin
  delete headers.referer
  delete headers['x-tor-proxy-secret']
  return headers
}

const sanitizeResponseHeaders = (inHeaders) => {
  const headers = {}
  for (const [k, v] of Object.entries(inHeaders || {})) {
    const key = String(k).toLowerCase()
    if (!STRIP_RESPONSE_HEADERS.has(key)) headers[key] = v
  }
  return headers
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const { torProxySecret, robosatsCoordinatorOnionUrl, torSocksUrl } = config

  if (!torProxySecret || !robosatsCoordinatorOnionUrl) {
    setResponseStatus(event, 500)
    return { error: 'Proxy misconfigured' }
  }

  const incomingHeaders = getRequestHeaders(event)

  if (!sameSecret(incomingHeaders['x-tor-proxy-secret'], torProxySecret)) {
    setResponseStatus(event, 403)
    return { error: 'Forbidden' }
  }

  const method = getMethod(event)
  const params = event.context.params._ || ''
  const query = getQuery(event)
  const targetUrl = joinUrl(robosatsCoordinatorOnionUrl, `/${params}`)

  let body
  if (method !== 'GET' && method !== 'HEAD') {
    body = await readBody(event)
  }

  const agent = new SocksProxyAgent(torSocksUrl || 'socks5h://127.0.0.1:9050')

  const resp = await got(targetUrl, {
    method,
    headers: sanitizeOutgoingHeaders(incomingHeaders),
    searchParams: query,
    json: body,
    responseType: 'buffer',
    timeout: { request: 30000 },
    retry: { limit: 0 },
    throwHttpErrors: false,
    agent: { http: agent, https: agent }
  })

  setResponseStatus(event, resp.statusCode)
  setResponseHeaders(event, sanitizeResponseHeaders(resp.headers))

  return resp.body
})
