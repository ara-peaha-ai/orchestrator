import { defineEventHandler, getRouterParam, createError } from 'h3'
import { fetchBisqBuy, fetchBisqSell } from '../../../../../utils/fetchBisq.js'
import { fetchRoboSatsBuy, fetchRoboSatsSell } from '../../../../../utils/fetchRobosats.js'
import { fetchPeachBuy, fetchPeachSell } from '../../../../../utils/fetchPeach.js'

// /offers/:currency/{buy,sell}/:source -> one source's offers; null prototypes so only these keys resolve.
// The side is a static route segment (the router does not backtrack past the static buy/sell index routes).
const sources = Object.assign(Object.create(null), {
  buy: Object.assign(Object.create(null), { bisq: fetchBisqBuy, robosats: fetchRoboSatsBuy, peach: fetchPeachBuy }),
  sell: Object.assign(Object.create(null), { bisq: fetchBisqSell, robosats: fetchRoboSatsSell, peach: fetchPeachSell })
})

export default defineEventHandler((event) => {
  const side = event.path.split('?')[0].split('/').at(-2)
  const fetchOffers = sources[side]?.[getRouterParam(event, 'source')]
  if (!fetchOffers) throw createError({ statusCode: 404 })
  return fetchOffers(getRouterParam(event, 'currency'))
})
