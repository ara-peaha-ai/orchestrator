// core: this is where the RoboSats/Peach offer is opened with the exact amount and currency of the settled invoice
export const openPurchaseRequest = async ({ orderId, amount, currency }) => {
  console.log(`[booking] openPurchaseRequest stub: order=${orderId} amount=${amount} ${currency}`)
  return { status: 'queued' }
}
