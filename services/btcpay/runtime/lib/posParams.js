// Default POS app settings: Light view, no custom amount, discount on, tips off
export const posParams = (name, currency) => ({
  appName: name,
  title: name,
  description: name,
  defaultView: 'Light',
  currency,
  showCustomAmount: false,
  showDiscount: true,
  enableTips: false,
  customCSSLink: useRuntimeConfig().btcpayPosCssUrl || ''
})
