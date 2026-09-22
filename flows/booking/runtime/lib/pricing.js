// Single price table shared by the UI (display) and the checkout handler (charged amount)
export const BASE_PRICE = 120
export const EXTRA_PRICES = { priority: 12, summary: 6, recording: 18 }
export const ALLOWED_CURRENCIES = ['EUR', 'USD']
export const DEFAULT_CURRENCY = 'EUR'

// Unknown extras are ignored
export const computeTotal = (extras = []) =>
  extras.reduce((sum, item) => sum + (EXTRA_PRICES[item] || 0), BASE_PRICE)
