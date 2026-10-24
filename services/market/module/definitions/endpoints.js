export const endpointDefs = [
  { method: 'GET', route: 'currencies',                       file: 'api/currencies.get.js' },
  { method: 'GET', route: 'platforms',                        file: 'api/platforms.get.js' },
  { method: 'GET', route: 'offers/:currency/buy',             file: 'api/offers/[currency]/buy/index.get.js' },
  { method: 'GET', route: 'offers/:currency/sell',            file: 'api/offers/[currency]/sell/index.get.js' },
  { method: 'GET', route: 'offers/:currency/buy/:source',     file: 'api/offers/[currency]/[side]/[source].get.js' },
  { method: 'GET', route: 'offers/:currency/sell/:source',    file: 'api/offers/[currency]/[side]/[source].get.js' },
  { method: 'GET', route: 'financing/types',                  file: 'api/financing/types.get.js' },
  { method: 'GET', route: 'financing/platforms',              file: 'api/financing/platforms.get.js' },
  { method: 'GET', route: 'financing/:type',                  file: 'api/financing/[type]/index.get.js' },
  { method: 'GET', route: 'financing/:type/tuprestamo',       file: 'api/financing/[type]/tuprestamo.get.js' },
  { method: 'ALL', route: 'tor-proxy/**',                     file: 'api/tor-proxy/[..._].js' }
]
