import { defineEventHandler, getRequestHeader, createError } from 'h3'
import { timingSafeEqual } from 'node:crypto'

const same = (a, b) => {
  const x = Buffer.from(String(a || ''))
  const y = Buffer.from(String(b || ''))
  return x.length === y.length && timingSafeEqual(x, y)
}

// Every route is operator/n8n only, except the consent page the subject opens.
// Fails closed: no secret configured = nothing is reachable.
export default defineEventHandler((event) => {
  const { prefix, secret } = useRuntimeConfig().risk
  // Route-scoped middleware sees the path with the prefix stripped: match on the original URL
  const path = (event.node.req.originalUrl || event.path || '').split('?')[0]
  if (path.startsWith(`${prefix}/consent/`)) return
  if (!secret || !same(getRequestHeader(event, 'x-risk-secret'), secret)) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
})
