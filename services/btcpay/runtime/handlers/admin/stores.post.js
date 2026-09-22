import { btcpayRequest } from '../../lib/btcpayRequest.js'
import { requireAdmin } from '../../lib/requireAdmin.js'
import { required, badRequest } from '../../lib/adminInput.js'
import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const body = await readBody(event)
  const cssUrl = useRuntimeConfig().btcpayPosCssUrl || ''
  required(body, ['name', 'locale'])
  if (!/^[a-z]{2}$/i.test(body.locale)) throw badRequest('locale must be a 2-letter code')

  return await btcpayRequest({
    method: 'POST',
    path: 'stores',
    body: {
      name: body.name,
      website: '',
      supportUrl: '',
      defaultCurrency: body.currency || 'EUR',
      invoiceExpiration: 900,
      displayExpirationTimer: 300,
      monitoringExpiration: 3600,
      speedPolicy: 'HighSpeed',
      lightningDescriptionTemplate: '{StoreName}',
      paymentTolerance: 0,
      anyoneCanCreateInvoice: false,
      requiresRefundEmail: false,
      checkoutType: 'V1',
      receipt: { enabled: true, showQR: true, showPayments: true },
      lightningAmountInSatoshi: false,
      lightningPrivateRouteHints: false,
      onChainWithLnInvoiceFallback: false,
      redirectAutomatically: false,
      showRecommendedFee: true,
      recommendedFeeBlockTarget: 1,
      defaultLang: `${body.locale.toLowerCase()}-${body.locale.toUpperCase()}`,
      customLogo: body.logoUrl || '',
      customCSS: body.cssUrl || '',
      htmlTitle: '',
      networkFeeMode: 'MultiplePaymentsOnly',
      payJoinEnabled: false,
      lazyPaymentMethods: false,
      defaultPaymentMethod: 'BTC',
      paymentMethodCriteria: []
    }
  })
})
