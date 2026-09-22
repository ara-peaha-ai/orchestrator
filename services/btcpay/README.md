# @ara-peaha-ai/btcpay

BTCPay Server service (Greenfield API) — the core invoicing/payment-tracking engine other flows (e.g. `flows/booking`) depend on directly, not a swappable payment rail. One handler per method, no catch-all proxy, the API key stays on the server.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NUXT_BTCPAY_URL` | yes | BTCPay base URL |
| `NUXT_BTCPAY_API_KEY` | yes | Server-side API key |
| `NUXT_BTCPAY_STORE_ID` | yes | Default store |
| `NUXT_BTCPAY_WEBHOOK_SECRET` | yes | Webhook HMAC secret |
| `NUXT_BTCPAY_ADMIN_SECRET` | yes (admin routes) | Value expected in header `x-btcpay-admin-secret`; empty denies all `/admin` routes |
| `NUXT_BTCPAY_POS_CSS_URL` | no | CSS URL applied to POS apps (default empty) |

## API routes

Filled in by `module/definitions/admin.js` and `module/definitions/invoices.js`.

## Invoice routes

All routes under the module prefix. Except `POST webhooks/btcpay`, every route requires header `x-btcpay-admin-secret` (`NUXT_BTCPAY_ADMIN_SECRET`; denied when empty).

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `invoices` | Create invoice (`amount`, `currency`, `orderId`, `buyerEmail?`, `redirectUrl?`, `metadata?`) |
| GET | `invoices` | List (`status`, `take`, `skip`, `orderId`, `startDate`, `endDate`, `textSearch`) |
| GET | `invoices/:invoiceId` | Get invoice |
| POST | `invoices/:invoiceId/status` | Mark `Settled` or `Invalid` |
| GET | `invoices/:invoiceId/payment-methods` | Payment methods |
| POST/GET | `payment-requests`, `payment-requests/:id` | Payment requests |
| GET/POST | `webhooks` | List / create store webhooks |
| POST | `webhooks/btcpay` | Receiver, verified via `BTCPay-Sig` HMAC-SHA256 |

Server code creates invoices with `createInvoice()` from `runtime/lib/createInvoice.js`. The receiver re-fetches the invoice and calls Nitro hooks `btcpay:invoice-settled` (idempotent), `btcpay:invoice-processing`, `btcpay:invoice-expired`, `btcpay:invoice-invalid` with `{ invoiceId, storeId, orderId, amount, currency, metadata }`. Check: `node checks/webhook.check.mjs`.

## Admin API routes

All require header `x-btcpay-admin-secret`. Ids are path params only.

| Method | Route | Handler |
|--------|-------|---------|
| GET | `/api/btcpay/admin/server/info` | `admin/server-info.get.js` |
| POST | `/api/btcpay/admin/users` | `admin/users.post.js` |
| GET | `/api/btcpay/admin/users` | `admin/users.get.js` |
| GET | `/api/btcpay/admin/users/:userId` | `admin/user.get.js` |
| POST | `/api/btcpay/admin/users/:userId/lock` | `admin/user-lock.post.js` |
| DELETE | `/api/btcpay/admin/users/:userId` | `admin/user.delete.js` |
| POST | `/api/btcpay/admin/users/:userId/api-keys` | `admin/user-api-keys.post.js` |
| GET | `/api/btcpay/admin/stores` | `admin/stores.get.js` |
| POST | `/api/btcpay/admin/stores` | `admin/stores.post.js` |
| GET | `/api/btcpay/admin/stores/:storeId` | `admin/store.get.js` |
| PUT | `/api/btcpay/admin/stores/:storeId` | `admin/store.put.js` |
| DELETE | `/api/btcpay/admin/stores/:storeId` | `admin/store.delete.js` |
| GET | `/api/btcpay/admin/stores/:storeId/users` | `admin/store-users.get.js` |
| POST | `/api/btcpay/admin/stores/:storeId/users` | `admin/store-users.post.js` |
| DELETE | `/api/btcpay/admin/stores/:storeId/users/:userId` | `admin/store-user.delete.js` |
| GET | `/api/btcpay/admin/stores/:storeId/apps` | `admin/store-apps.get.js` |
| GET | `/api/btcpay/admin/apps` | `admin/apps.get.js` |
| GET | `/api/btcpay/admin/apps/:appId` | `admin/app.get.js` |
| DELETE | `/api/btcpay/admin/apps/:appId` | `admin/app.delete.js` |
| POST | `/api/btcpay/admin/stores/:storeId/apps/pos` | `admin/app-pos.post.js` |
| PUT | `/api/btcpay/admin/apps/pos/:appId` | `admin/app-pos.put.js` |
| GET | `/api/btcpay/admin/apps/pos/:appId` | `admin/app-pos.get.js` |
| GET | `/api/btcpay/admin/apps/crowdfund/:appId` | `admin/app-crowdfund.get.js` |
| PUT | `/api/btcpay/admin/apps/crowdfund/:appId` | `admin/app-crowdfund.put.js` |
| GET | `/api/btcpay/admin/stores/:storeId/payment-methods/lightning` | `admin/ln.get.js` |
| PUT | `/api/btcpay/admin/stores/:storeId/payment-methods/lightning` | `admin/ln.put.js` |
| DELETE | `/api/btcpay/admin/stores/:storeId/payment-methods/lightning` | `admin/ln.delete.js` |
| GET | `/api/btcpay/admin/stores/:storeId/payment-methods/onchain` | `admin/onchain.get.js` |
| GET | `/api/btcpay/admin/stores/:storeId/payment-methods/onchain/btc` | `admin/onchain-btc.get.js` |
| PUT | `/api/btcpay/admin/stores/:storeId/payment-methods/onchain/btc` | `admin/onchain-btc.put.js` |
| DELETE | `/api/btcpay/admin/stores/:storeId/payment-methods/onchain/btc` | `admin/onchain-btc.delete.js` |
| POST | `/api/btcpay/admin/stores/:storeId/payment-methods/onchain/btc/preview` | `admin/onchain-preview.post.js` |
| POST | `/api/btcpay/admin/stores/:storeId/payment-methods/onchain/btc/generate` | `admin/onchain-generate.post.js` |
| GET | `/api/btcpay/admin/stores/:storeId/wallet` | `admin/wallet.get.js` |
| GET | `/api/btcpay/admin/stores/:storeId/wallet/utxos` | `admin/wallet-utxos.get.js` |
| GET | `/api/btcpay/admin/stores/:storeId/wallet/objects` | `admin/wallet-objects.get.js` |
| GET | `/api/btcpay/admin/stores/:storeId/wallet/transactions` | `admin/wallet-transactions.get.js` |
| GET | `/api/btcpay/admin/stores/:storeId/payment-methods` | `admin/store-payment-methods.get.js` |
| GET | `/api/btcpay/admin/rate-sources` | `admin/rate-sources.get.js` |
| GET | `/api/btcpay/admin/stores/:storeId/rates/configuration` | `admin/rate-source.get.js` |
| PUT | `/api/btcpay/admin/stores/:storeId/rates/configuration` | `admin/rate-source.put.js` |
| GET | `/api/btcpay/admin/stores/:storeId/rates` | `admin/rates.get.js` |
| GET | `/api/btcpay/admin/stores/:storeId/rates/currency/:currency` | `admin/rate-preview.get.js` |
| POST | `/api/btcpay/admin/stores/:storeId/email/send` | `admin/email.post.js` |
