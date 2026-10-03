# risk

Consent-based risk and trust profiles for Nuxt/Nitro. It does not compute anything itself: each **rail** calls one signal source, and the scores come from rules in a private use-case file.

Dual mode: standalone Nitro app or Nuxt module (`configKey: risk`). Node only (Docker/VPS): it runs `gallery-dl`, `yt-dlp`, `monid` and `sharp`, none of which run on Cloudflare Workers.

## Rails

| Rail | Source | Input | Signals |
|---|---|---|---|
| `ip` | `services/ip` (Cloudflare + IPinfo deduction) | none, runs on the consent page | `vpn`, `tor`, `deduction`, `country` |
| `social` | `gallery-dl` (Instagram), `yt-dlp` (TikTok covers), Monid if blocked | `{ platform, handle }` | `posts`, `oldestPostDays`, `images`, `source` |
| `face` | `services/dont-trust-verify` `/match` | `{ images: [1-4 names] }` | `checked`, `matches` |
| `genai` | Sightengine `genai` model, 5 ops per image | `{ images? }`: max 5; without it the whole folder, only if it holds 5 or fewer | `checked`, `max`, `mean` |
| `btc` | BIP-322 / BIP-137 signature + mempool.space UTXOs | `{ address, message, signature }` | `valid`, `balanceSat`, `balanceSat30d` |
| `pep` | not connected yet | — | — |
| `bank` | not connected yet | — | — |

Every rail returns `{ status: 'ok' | 'skipped' | 'error', signals, ... }`. A rail that did not run never adds risk nor trust: rails listed in the use case that did not run go to `score.missing` and `score.complete` is `false`.

## Use cases

`NUXT_RISK_USE_CASES_FILE` points to a private JSON file, shaped like `use-cases.example.json` (its weights are placeholders, the real ones stay in the private file):

- `rails`: the rails a profile of that use case may run;
- `rules`: `{ rail, signal, op, value, risk?, trust? }`, summed and clamped to 0-100;
- `consentNext`: optional URL the consent button goes to;
- `lead`: the rules for `POST /lead`.

`risk` and `trust` are separate: a fully verified buyer (high trust) can still be high risk, e.g. a PEP hit.

## Flow

1. `POST /api/risk/profile` `{ useCase }` → `{ id, consentUrl }`. Send `consentUrl` to the subject.
2. The subject opens it: placeholder consent page (nothing recorded yet). Opening the link records nothing (link previews); the Continue click runs the `ip` rail from their connection.
3. `POST /api/risk/profile/:id/social` `{ platform, handle }` downloads up to 10 images.
4. The operator opens the profile folder (`dir` in `GET /api/risk/profile/:id`), picks 3-4 images by hand (images added to the folder by hand count too) and sends their file names: `POST /api/risk/profile/:id/face` `{ images }`. The subject must have completed `dont-trust-verify` with user id = profile id.
5. `POST /api/risk/profile/:id/genai`, `/btc`, ...: every call rescores.
6. `GET /api/risk/profile/:id` → rails, score, image names. `DELETE` closes it: images and the profile record are deleted, nothing is kept.

`POST /api/risk/lead` `{ platform, handle, text }` scores an inbound lead (e.g. an Instagram DM forwarded by n8n) without storing anything.

Every route except `/consent/:id` requires the `x-risk-secret` header.

## Storage

Three separate stores:

| What | Where | Default |
|---|---|---|
| Profile records | `useStorage('risk')` | memory: on the VPS mount Postgres (unstorage `db0` driver), part of the backups |
| Downloaded images | `NUXT_RISK_WORK_DIR` | `/tmp/risk`: keep it outside VPS backups and snapshots |
| Face reference vectors | `dont-trust-verify` storage | memory, no delete endpoint yet |

`cookies.txt` stays outside backups too. Deleting a profile does not erase snapshots taken while it was open.

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
