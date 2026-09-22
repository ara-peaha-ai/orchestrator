# @ara-peaha-ai/tor

Generic Tor reverse proxy. Forwards HTTP requests to any `.onion` address via a local Tor daemon (SOCKS5h). Ships in dual mode: standalone Nitro app or Nuxt module.

The target onion URL is set **per request** via the `X-Tor-Target` header, so the same service instance can proxy to multiple coordinators or onion services.

## Routes

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/tor` | Health check — confirms Tor is reachable |
| `ALL` | `/api/tor/**` | Authenticated proxy — forwards to the onion URL in `X-Tor-Target` |

All proxy routes require `X-Tor-Proxy-Secret` and `X-Tor-Target` headers. Requests with a non-`.onion` target are rejected with 400.

## Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NUXT_TOR_PROXY_SECRET` | yes | — | Shared secret sent in `X-Tor-Proxy-Secret` header |
| `NUXT_TOR_SOCKS_URL` | no | `socks5h://127.0.0.1:9050` | SOCKS5h URL of the local Tor daemon |

## Standalone mode

Requires a running Tor daemon on the host (default port 9050).

```bash
cp .env.example .env
pnpm dev      # local Nitro dev server
pnpm build
pnpm start
```

## Module mode

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

Add `"@ara-peaha-ai/tor": "workspace:*"` to the app's `package.json` dependencies.

## Request format

```
GET /api/tor/api/book/?format=json
X-Tor-Proxy-Secret: <secret>
X-Tor-Target: http://<56-char-onion-address>.onion
```

The path after `/api/tor/` is appended to the target URL. Both `X-Tor-Proxy-Secret` and `X-Tor-Target` are stripped before the request reaches the onion service.
