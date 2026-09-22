# @ara-peaha-ai/peach

## This rail is not currently maintained. 

Dual-mode module for the [Peach](https://peachbitcoin.com) P2P Bitcoin rail. Handles offer creation, trade requests, contract management, and payment confirmation using BIP32 key derivation and PGP signing.

## API routes

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/rails/peach/me` | Fetch the authenticated Peach account |
| `POST` | `/api/rails/peach/offer` | Create a sell offer |
| `GET` | `/api/rails/peach/trade-requests` | List incoming trade requests |
| `POST` | `/api/rails/peach/trade-request/accept` | Accept a trade request |
| `GET` | `/api/rails/peach/contract` | Get the active contract |
| `POST` | `/api/rails/peach/contract/confirm-payment` | Confirm payment received |

## Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NUXT_PEACH_BASE_URL` | no | `https://api.peachbitcoin.com` | Peach API base URL |
| `NUXT_PEACH_BITCOIN_MNEMONIC` | yes | — | BIP39 mnemonic for wallet key derivation |
| `NUXT_PEACH_PGP_PRIVATE_KEY` | yes | — | Armored PGP private key |
| `NUXT_PEACH_PGP_PUBLIC_KEY` | yes | — | Armored PGP public key |
| `NUXT_PEACH_PGP_PASSPHRASE` | yes | — | PGP key passphrase |
| `NUXT_PEACH_REFERRAL_CODE` | no | — | Peach referral code |
| `NUXT_PEACH_FEE_RATE` | no | `hourFee` | Bitcoin fee rate strategy |
| `NUXT_PEACH_MAX_PREMIUM` | no | `0` | Maximum accepted offer premium |

## Module mode (Nuxt app)

```json
// package.json
"dependencies": {
  "@ara-peaha-ai/peach": "workspace:*"
}
```

```js
// nuxt.config.js
export default defineNuxtConfig({
  modules: ['@ara-peaha-ai/peach'],
  peahaPeachRail: {
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
