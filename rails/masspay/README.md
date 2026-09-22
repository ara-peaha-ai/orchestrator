# @ara-peaha-ai/masspay

Dual-mode module for the [MassPay](https://www.masspay.io) wallet rail. Listens for MassPay's incoming-funds webhooks (USDT load, ACH deposit) and automatically sweeps the full available balance to a single preconfigured beneficiary in PYG via SIPAP (Paraguay). Uses the official [`masspay-js-sdk`](https://github.com/masspayio/masspay-js-sdk).

## API routes

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/rails/masspay/balance` | Current available account balance, by currency |
| `POST` | `/api/rails/masspay/withdraw` | Manually trigger a full-balance sweep to the beneficiary (useful for sandbox testing) |
| `POST` | `/api/rails/masspay/webhook` | MassPay webhook receiver — verifies the signature and triggers the sweep on funding events |

## How the sweep works

1. MassPay POSTs a webhook on every transaction status change. This rail only reacts to `load` (status `COMPLETED`) and `balance_credit` events — both represent funds arriving in the account (USDT load or ACH deposit).
2. The signature in `X-MassPay-Signature: t=TIMESTAMP,s=HMAC_VALUE` is verified (HMAC-SHA512 over `TIMESTAMP|rawBody`) before anything is trusted.
3. `GET /payout/account/balance` is fetched to get the current balance and its `source_token`.
4. `POST /payout/{beneficiary_user_token}` creates a payout quote for the full balance, converting to PYG via the configured SIPAP `destination_token`/`attr_set_token`.
5. `PUT /payout/{beneficiary_user_token}/{payout_token}` commits the quote immediately (quotes expire after 2 minutes).

Duplicate webhook deliveries are deduped in-memory by a hash of the raw payload — see `runtime/lib/processedWebhooks.js` for the documented ceiling on that approach.

## One-time setup in MassPay (dashboard or API, not this rail)

Before this rail can pay out, you need, once:

- A beneficiary user (`UserService.createUser`) → `NUXT_MASSPAY_BENEFICIARY_USER_TOKEN`
- The SIPAP Paraguay bank-deposit service token (`CatalogService.getCountryServices('PRY')`) → `NUXT_MASSPAY_DESTINATION_TOKEN`
- That beneficiary's bank account attributes stored against the destination (`AttributeService.storeAttrs`) → `NUXT_MASSPAY_ATTR_SET_TOKEN`
- Your webhook URL and signing secret registered in the client dashboard → `NUXT_MASSPAY_WEBHOOK_SECRET`

## Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NUXT_MASSPAY_BASE_URL` | no | `https://api.masspay.io/v1.0.0` | MassPay API base URL |
| `NUXT_MASSPAY_API_KEY` | yes | — | MassPay API key, sent as `Authorization: Bearer <key>` |
| `NUXT_MASSPAY_WEBHOOK_SECRET` | yes | — | Webhook HMAC signing secret |
| `NUXT_MASSPAY_BENEFICIARY_USER_TOKEN` | yes | — | `user_token` of the payout recipient |
| `NUXT_MASSPAY_DESTINATION_TOKEN` | yes | — | SIPAP Paraguay bank-deposit destination token |
| `NUXT_MASSPAY_ATTR_SET_TOKEN` | yes | — | Beneficiary bank account attribute set for that destination |
| `NUXT_MASSPAY_SOURCE_CURRENCY` | no | `USD` | Currency to sweep from (matched against `AccountService.getAccountBalance()`) |

## Module mode (Nuxt app)

```json
// package.json
"dependencies": {
  "@ara-peaha-ai/masspay": "workspace:*"
}
```

```js
// nuxt.config.js
export default defineNuxtConfig({
  modules: ['@ara-peaha-ai/masspay'],
  peahaMasspayRail: {
    enabled: true
  }
})
```

Env vars follow the `NUXT_*` naming convention for Nuxt's runtimeConfig auto-resolution.

## Standalone mode (Nitro)

```bash
cp .env.example .env
pnpm dev
pnpm build
pnpm start
```
