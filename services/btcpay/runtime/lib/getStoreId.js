export const getStoreId = () => {
  const { btcpayStoreId } = useRuntimeConfig()
  if (!btcpayStoreId) throw createError({ statusCode: 500, statusMessage: 'BTCPay store not configured' })
  return btcpayStoreId
}
