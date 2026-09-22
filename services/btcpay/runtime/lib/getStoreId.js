export const getStoreId = () => {
  const { btcpayStoreId } = useRuntimeConfig()
  if (!btcpayStoreId) throw createError({ statusCode: 500, statusMessage: 'BTCPay store not configured' })
  return btcpayStoreId
}

export const assertMoney = ({ amount, currency }) => {
  const value = typeof amount === 'string' && amount.trim() !== '' ? Number(amount) : amount
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'amount must be a number greater than 0' })
  }
  if (typeof currency !== 'string' || !/^[A-Z]{3,5}$/.test(currency)) {
    throw createError({ statusCode: 400, statusMessage: 'currency must be 3-5 uppercase letters' })
  }
  return { amount: String(value), currency }
}
