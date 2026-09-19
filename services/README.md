# services

Infrastructure service modules live under `services/*`.

Each service ships in **dual mode**:

- **Standalone** — a self-contained Nitro app deployable to Docker or Cloudflare Workers, configured via `.env`
- **Module** — a Nuxt module (`services/<name>/module/`) embeddable into any app in the workspace, registering the same handlers under the host app's Nitro server

## Available services

| Package | Routes | Description |
|---------|--------|-------------|
| `@ara-peaha-ai/tor` (`services/tor`) | `GET /api/tor`, `ALL /api/tor/**` | Generic Tor reverse proxy — forwards requests to any `.onion` address via SOCKS5h. Target set per-request via `X-Tor-Target` header |
| `@ara-peaha-ai/cors` (`services/cors`) | `GET /api/cors`, `ALL /api/cors/**` | CORS reverse proxy — proxies a configured target API with secret-based auth |
| `@ara-peaha-ai/market` (`services/market`) | `GET /api/market/**` | KYC-free Bitcoin price aggregator — buy/sell offers from Bisq, RoboSats, Peach |
| `@ara-peaha-ai/dont-trust-verify` (`services/dont-trust-verify`) | `GET /api/dont-trust-verify`, `POST /challenge`, `POST /register`, `POST /match` | Local-first 18+ and face-match verification — ID stays in the browser, server keeps only a face vector computed from a face crop |

## Standalone: running locally

```bash
cd services/tor      # or cors, market
cp .env.example .env # fill in secrets
pnpm dev
```

## Module mode: embedding in an app

Add the service as a workspace dependency and enable it in `nuxt.config.js`:

```js
// nuxt.config.js
export default defineNuxtConfig({
  modules: ['@ara-peaha-ai/tor'],
  tor: {
    enabled: true,
    torProxySecret: process.env.NUXT_TOR_PROXY_SECRET
  }
})
```

## Environment variables

### `services/tor`

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NUXT_TOR_PROXY_SECRET` | yes | — | Shared secret sent in `X-Tor-Proxy-Secret` header |
| `NUXT_TOR_SOCKS_URL` | no | `socks5h://127.0.0.1:9050` | SOCKS5h URL of the local Tor daemon |

### `services/cors`

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NUXT_CORS_TARGET_URL` | yes | — | Target API base URL, e.g. `https://api.peachbitcoin.com` |
| `NUXT_CORS_PROXY_SECRET` | yes | — | Shared secret validated on every inbound request |
| `NUXT_CORS_HEALTH_PATH` | no | `/` | Path on the target used for the `/api/cors` health check |

### `services/market`

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NUXT_TOR_PROXY_SECRET` | yes | — | Auth secret for the inline `/api/market/tor-proxy` handler |
| `NUXT_ROBOSATS_COORDINATOR_ONION_URL` | no | RoboSats default onion | RoboSats coordinator onion address |
| `NUXT_TOR_SOCKS_URL` | no | `socks5h://127.0.0.1:9050` | SOCKS5h URL of the local Tor daemon |
