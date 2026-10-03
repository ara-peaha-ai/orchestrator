# risk

Consent-based risk and trust profiles for Nuxt/Nitro. It does not compute anything itself: each **rail** calls one signal source, and the scores come from rules in a private use-case file.

Dual mode: standalone Nitro app or Nuxt module (`configKey: risk`). Node only (Docker/VPS): it runs `gallery-dl`, `yt-dlp`, `monid` and `sharp`, none of which run on Cloudflare Workers.

## Rails

| Rail | Source | Input | Signals |
|---|---|---|---|
| `ip` | `services/ip` (Cloudflare + IPinfo deduction) | none, runs on the consent page | `vpn`, `tor`, `deduction`, `country` |
| `social` | `gallery-dl` (Instagram), `yt-dlp` (TikTok covers), Monid if blocked | `{ platform, handle }` | `posts`, `oldestPostDays`, `images`, `source` |
| `face` | `services/dont-trust-verify` `/match` | `{ images: [1-4 names] }` | `checked`, `matches` |
| `genai` | Sightengine `genai` model | `{ images? }` | `checked`, `max`, `mean` |
| `btc` | BIP-322 / BIP-137 signature + mempool.space UTXOs | `{ address, message, signature }` | `valid`, `balanceSat`, `balanceSat30d` |
| `pep` | not connected yet | — | — |
| `bank` | not connected yet | — | — |

Every rail returns `{ status: 'ok' | 'skipped' | 'error', signals, ... }`. A rail that did not run never adds risk nor trust.

## Use cases

`NUXT_RISK_USE_CASES_FILE` points to a private JSON file, shaped like `use-cases.example.json`:

- `rails`: the rails a profile of that use case may run;
- `rules`: `{ rail, signal, op, value, risk?, trust? }`, summed and clamped to 0-100;
- `consentNext`: optional URL the consent button goes to;
- `lead`: the rules for `POST /lead`.

`risk` and `trust` are separate: a fully verified buyer (high trust) can still be high risk, e.g. a PEP hit.

## Flow

1. `POST /api/risk/profile` `{ useCase }` → `{ id, consentUrl }`. Send `consentUrl` to the subject.
2. The subject opens it: placeholder consent page (nothing recorded yet), the `ip` rail runs from their connection.
3. `POST /api/risk/profile/:id/social` `{ platform, handle }` downloads up to 10 images.
4. The operator picks 3-4 images: `POST /api/risk/profile/:id/face` `{ images }`. The subject must have completed `dont-trust-verify` with user id = profile id.
5. `POST /api/risk/profile/:id/genai`, `/btc`, ...: every call rescores.
6. `GET /api/risk/profile/:id` → rails, score, image names. `DELETE` closes it and deletes the images.

`POST /api/risk/lead` `{ platform, handle, text }` scores an inbound lead (e.g. an Instagram DM forwarded by n8n) without storing anything.

Every route except `/consent/:id` requires the `x-risk-secret` header.

## Storage

Profiles go to `useStorage('risk')`, memory by default. On the VPS mount Postgres in the host app (unstorage `db0` driver), so the profiles are part of the VPS backups.

## Host requirements

- `gallery-dl`, `yt-dlp` with `curl-cffi` (TikTok user pages need impersonation): `pip install "yt-dlp[default,curl-cffi]" gallery-dl`
- a Netscape `cookies.txt` of the dedicated logged-in account in `NUXT_RISK_COOKIES_FILE`
- `monid` logged in, only with `NUXT_RISK_MONID_FALLBACK=true`

```bash
cp .env.example .env
pnpm dev
pnpm check   # scoring checks
```

## License

MIT.
