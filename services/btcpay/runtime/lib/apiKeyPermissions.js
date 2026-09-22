export const apiKeyPermissions = {
  unrestricted: ['unrestricted'],
  // BPay mobile app as a POS
  pos: [
    'btcpay.store.canviewinvoices',
    'btcpay.store.canmodifystoresettings',
    'btcpay.store.canviewstoresettings',
    'btcpay.user.canviewprofile'
  ],
  // https://docs.btcpayserver.org/PrestaShop
  prestashop: [
    'btcpay.store.canmodifystoresettings',
    'btcpay.store.webhooks.canmodifywebhooks',
    'btcpay.store.canviewstoresettings',
    'btcpay.store.cancreateinvoice',
    'btcpay.store.canviewinvoices',
    'btcpay.store.canmodifyinvoices'
  ],
  'prestashop-old': [
    'btcpay.store.canviewinvoices',
    'btcpay.store.cancreateinvoice'
  ],
  // https://docs.btcpayserver.org/WooCommerce/#2-connecting-woocommerce-and-btcpay-server
  woocommerce: [
    'btcpay.store.cancreateinvoice',
    'btcpay.store.canviewinvoices',
    'btcpay.store.canmodifyinvoices',
    'btcpay.store.webhooks.canmodifywebhooks',
    'btcpay.store.canviewstoresettings',
    'btcpay.store.cancreatenonapprovedpullpayments'
  ]
}

// Only btcpay.store.* permissions accept the :storeId suffix; user-level
// permissions (e.g. btcpay.user.canviewprofile) and 'unrestricted' don't.
export const restrictToStore = (storeId, permissions) =>
  permissions.map(p => p.startsWith('btcpay.store.') ? `${p}:${storeId}` : p)
