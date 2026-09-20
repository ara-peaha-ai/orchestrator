import { orders } from '../lib/orders.js'

export default defineEventHandler((event) => {
  const { orderId } = getQuery(event)
  const order = orders.get(String(orderId ?? ''))
  if (!order) throw createError({ statusCode: 404, statusMessage: 'Order not found' })
  return { orderId, status: order.status, amount: order.amount, currency: order.currency }
})
