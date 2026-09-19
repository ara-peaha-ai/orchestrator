import { defineEventHandler } from 'h3'

export default defineEventHandler(() => ({
  ok: true,
  service: 'dont-trust-verify'
}))
