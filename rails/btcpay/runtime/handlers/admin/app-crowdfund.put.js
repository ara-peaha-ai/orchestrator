import { btcpayRequest } from '../../lib/btcpayRequest.js'
import { requireAdmin } from '../../lib/requireAdmin.js'
import { pathId, required, badRequest } from '../../lib/adminInput.js'
import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const appId = pathId(event, 'appId')
  const body = await readBody(event)
  const cssUrl = useRuntimeConfig().btcpayPosCssUrl || ''
  required(body, ['name', 'currency', 'amount', 'startDate', 'endDate'])
  if (!(Number(body.amount) > 0)) throw badRequest('Invalid amount')

  return await btcpayRequest({
    method: 'PUT',
    path: `apps/crowdfund/${appId}`,
    body: {
      appName: body.name,
      title: body.name,
      description: body.name,
      enabled: true,
      enforceTargetAmount: false,
      startDate: body.startDate,
      endDate: body.endDate,
      targetCurrency: body.currency,
      targetAmount: Number(body.amount),
      customCSSLink: cssUrl,
      mainImageUrl: null,
      embeddedCSS: null,
      disqusShortname: null,
      soundsEnabled: false,
      animationsEnabled: false,
      resetEveryAmount: 1,
      resetEvery: 'Never',
      displayPerksValue: false,
      sortPerksByPopularity: false,
      sounds: [],
      animationColors: ['#FF0000', '#00FF00', '#0000FF']
    }
  })
})
