# @ara-peaha-ai/cors

CORS reverse proxy service. Proxies a configured target API, adding CORS headers and validating requests with a shared secret. Ships in dual mode: standalone Nitro app (Cloudflare Workers) or Nuxt module.

## Routes

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/cors` | Health check — proxies a GET to `NUXT_CORS_HEALTH_PATH` on the target |
| `ALL` | `/api/cors/**` | Authenticated proxy — forwards all methods to the target URL |

All routes validate the `X-Cors-Proxy-Secret` request header.

## Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NUXT_CORS_TARGET_URL` | yes | — | Target API base URL, e.g. `https://api.peachbitcoin.com` |
| `NUXT_CORS_PROXY_SECRET` | yes | — | Shared secret sent in `X-Cors-Proxy-Secret` header |
| `NUXT_CORS_HEALTH_PATH` | no | `/` | Path on the target used by the health endpoint |

## Standalone mode

```bash
cp .env.example .env
pnpm dev      # local Nitro dev server
pnpm build
pnpm deploy   # Cloudflare Workers via wrangler
```

## Module mode

```js
// nuxt.config.js
export default defineNuxtConfig({
  modules: ['@ara-peaha-ai/cors'],
  corsProxy: {
    enabled: true,
    corsTargetUrl: 'https://api.peachbitcoin.com',
    corsProxySecret: process.env.NUXT_CORS_PROXY_SECRET
  }
})
```

Add `"@ara-peaha-ai/cors": "workspace:*"` to the app's `package.json` dependencies.
