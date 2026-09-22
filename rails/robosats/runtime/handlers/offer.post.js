import { getRobosatsCurrency } from '../lib/getRobosatsCurrency.js'
import { robosatsRequest } from '../lib/robosatsRequest.js'
import { defineEventHandler, getRequestHeader, readBody, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const authorization = getRequestHeader(event, 'x-robosats-authorization')
  const { amount, currency, paymentMethods, type = 0, premium = 5 } = await readBody(event)

  if (!authorization) throw createError({ statusCode: 401, statusMessage: 'Missing X-Robosats-Authorization' })
  if (!(Number(amount) > 0)) throw createError({ statusCode: 400, statusMessage: 'Invalid amount' })

  // type: 0 = buy BTC (payer pays fiat), 1 = sell BTC
  return await robosatsRequest({
    authorization,
    method: 'POST',
    path: '/api/make/',
    body: {
      type,
      currency: getRobosatsCurrency(currency),
      amount: Number(amount),
      has_range: false,
      payment_method: paymentMethods,
      is_explicit: false,
      premium,
      public_duration: 86400,
      escrow_duration: 28800,
      bond_size: 3
    }
  })
})
