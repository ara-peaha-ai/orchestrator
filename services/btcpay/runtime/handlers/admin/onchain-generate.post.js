import { btcpayRequest } from '../../lib/btcpayRequest.js'
import { requireAdmin } from '../../lib/requireAdmin.js'
import { pathId } from '../../lib/adminInput.js'
import { defineEventHandler } from 'h3'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const storeId = pathId(event, 'storeId')

  return await btcpayRequest({
    method: 'POST',
    path: `stores/${storeId}/payment-methods/onchain/BTC/generate`,
    body: {
      accountNumber: 0,
      savePrivateKeys: false,
      importKeysToRPC: false,
      wordList: 'English',
      wordCount: 12,
      scriptPubKeyType: 'SegwitP2SH'
    }
  })
})
