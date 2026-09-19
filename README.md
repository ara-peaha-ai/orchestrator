[![AI generated doc](https://deepwiki.com/badge.svg)](https://deepwiki.com/peaha/pay-orchestrator)

# @ara-peaha-ai/pay ##todo @ai #master true #pri 1

## Stage

Most of the repos/modules in this monorepo are ready to be tested in projects not in production stage.  

The core orchestrator will be devolped once that the first integrations are enough to define a standard of comunicnations required.  

None of the modules are meant to be used in production unless clearly mentioned in the related repo's README.md  

The reason it is public today is to find contributors and not as a mean to distribute it to be used in anything serious.

## Discalimer

We don't have affiliation with any of the services listed here and we don't mean to rapresent any of them. 

All the integration are based on public avaialble API or MCP meant to be publiccly used, with or without a registration and authentication.

## Structure

```
/
├── nuxt.config.js      root Nuxt app — loads all workspace modules
├── app.vue
├── pages/
├── server/
├── rails/              payment rail modules
├── flows/              business flow modules
├── services/           infrastructure service modules
└── utils/              shared utilities
```

## Description

Orchestrator repo for PE'AHA ecosystem. 

It assembles **PAY** & **AI** funcionalities. 

Most of the repos are in dual mode as a module to import in a Nuxt project or standalone as a server.
  
The Payment and the AI integrations are ment to be run isolated eachother on two web apps with one of the two channels enabled.  

## What exists today

### PAY

Payment rails, business flows, and support services and models/api/mcp/cmd integrations into a single Nuxt-based workspace.

P2P market aggregated order book, on web or tor.

Robosats and Peach autnetication and all the needed endpints to run the flow.

They both come with tradeoff:

Robosats requires a Bond on LN. When completed it is meant to be used for returning clients with the bond approved and paid by the merchant.

While Peach requires to import and existing keypairs of an account with trading history to have all the needed functionalties.

Nostr in the next coming, in high priority, that in thoery solves both previous issues, but previous issues where news during the development.

Bisq has not been yet even evaluated and it is mentioned here as a note.

#### Rails  

Payment rail modules. Each injects pages, composables, and server handlers into the host app, and can also run standalone as a Nitro server.

| Package | Page | API |
|---------|------|-----|
| `@ara-peaha-ai/template` (`rails/template`) | `/rails/template` | `/api/rails/template` |
| `@ara-peaha-ai/peach` (`rails/peach`) | `/rails/peach` | `/api/rails/peach/*` |
| `@ara-peaha-ai/robosats` (`rails/robosats`) | `/rails/robosats` | `/api/rails/robosats/*` |

#### Flows

Higher-level feature modules with pages and UI components.

| Package | Pages |
|---------|-------|
| `@ara-peaha-ai/booking` (`flows/booking`) | `/flows/booking`, `/flows/booking/embed` |

#### Services

Infrastructure modules that run as both a standalone Nitro app and an embeddable Nuxt module.

| Package | Routes | Notes |
|---------|--------|-------|
| `@ara-peaha-ai/ip` (`services/ip`) | — | Rate limiting + IP geolocation (country, currency), disabled by default |
| `@ara-peaha-ai/tor` (`services/tor`) | `/api/tor`, `/api/tor/**` | Tor reverse proxy, disabled by default |
| `@ara-peaha-ai/market` (`services/market`) | `/api/market/**` | KYC-free offer aggregator (Bisq, RoboSats, Peach), disabled by default |

### AI

##todo @giovanni

## Local development

```bash
pnpm install
pnpm dev
pnpm build
pnpm preview
```

## Module loading

The root Nuxt app (`nuxt.config.js`) lists workspace modules in the `modules` array. Each module auto-registers its pages, composables, and server handlers when the app starts. Adding a module requires two changes:

1. Add `"@ara-peaha-ai/<name>": "workspace:*"` to root `package.json` dependencies
2. Add `'@ara-peaha-ai/<name>'` to the `modules` array in `nuxt.config.js`

`flows/booking` requires `@nuxt/ui`. It must be present in `nuxt.config.js` before or alongside the booking module.

## Environment variables

### `services/tor`

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NUXT_TOR_PROXY_SECRET` | yes | — | Shared secret sent in `X-Tor-Proxy-Secret` header |
| `NUXT_TOR_SOCKS_URL` | no | `socks5h://127.0.0.1:9050` | SOCKS5h URL of the local Tor daemon |

### `rails/robosats`

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NUXT_ROBOSATS_COORDINATOR_URL` | no | RoboSats default onion | Coordinator onion base URL |
| `NUXT_TOR_PROXY_SECRET` | yes | — | Shared secret for the embedded `@ara-peaha-ai/tor` proxy |
| `NUXT_TOR_SOCKS_URL` | no | `socks5h://127.0.0.1:9050` | SOCKS5h URL of the local Tor daemon |

### `rails/peach`

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

### `services/ip`

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NUXT_IP_DETECTION_CURRENCY` | no | `false` | Expose currency derived from Cloudflare `cf-ipcountry` header in `event.context.ipDetection` |
| `NUXT_IP_DETECTION_COUNTRY` | no | `false` | Expose country code in `event.context.ipDetection` |
| `NUXT_IP_DETECTION_CLOUDFLARE_SECRET` | no | — | Shared secret to verify requests come through Cloudflare. Set the same value as the `x-cf-origin-token` header in a Cloudflare Transform Rule. Without this, CF headers are trusted automatically. |
| `NUXT_IPINFO_API_KEY` | no | — | IPinfo API key. Enables `countryIPinfo` and `currencyIPinfo` as additional properties. Free lifetime key available at [ipinfo.io](https://ipinfo.io). |
| `NUXT_IP_DETECTION_RATE_LIMIT` | no | `100` | Max requests per IP per minute |
| `NUXT_IP_DETECTION_LIMIT_PATHS` | no | — | Comma-separated list of API paths to rate-limit. If empty, all `/api/*` paths are limited. |

### `services/market`

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NUXT_TOR_PROXY_SECRET` | yes | — | Auth secret for the inline Tor proxy handler |
| `NUXT_ROBOSATS_COORDINATOR_ONION_URL` | no | RoboSats default onion | RoboSats coordinator onion address |
| `NUXT_TOR_SOCKS_URL` | no | `socks5h://127.0.0.1:9050` | SOCKS5h URL of the local Tor daemon |

## Known issues

- `@nuxt/kit` version mismatch: `rails/peach`, `rails/robosats`, and `services/tor` declare `@nuxt/kit ^3.13.0` while the root app and `rails/template`, `flows/booking` use `^4.0.0`. The modules work in module mode via Nuxt's own kit instance, but full standalone migration to `^4.0.0` is pending.
