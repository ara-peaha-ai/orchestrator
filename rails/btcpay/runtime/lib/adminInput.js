import { createError, getRouterParam } from 'h3'

// Path params only: restrict charset so ids cannot alter the Greenfield path
export const pathId = (event, name) => {
  const value = getRouterParam(event, name, { decode: true })
  if (!value || !/^[A-Za-z0-9._@+-]{1,128}$/.test(value)) {
    throw createError({ statusCode: 400, statusMessage: `Invalid ${name}` })
  }
  return encodeURIComponent(value)
}

export const required = (body, fields) => {
  const missing = fields.filter(f => body?.[f] === undefined || body?.[f] === null || body?.[f] === '')
  if (missing.length) {
    throw createError({ statusCode: 400, statusMessage: `Missing fields: ${missing.join(', ')}` })
  }
  return body
}

export const badRequest = (message) => createError({ statusCode: 400, statusMessage: message })
