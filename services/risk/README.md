# risk

Consent-based risk and trust profiles for Nuxt/Nitro. Each **rail** calls one signal source and stores its **raw** result in the profile. There is no scoring here: classification is done by whoever reads the profile (operator, or a private config later). The only analysis is `services/ip`'s Cloudflare vs IPinfo deduction (e.g. Proton Smart Routing).

Dual mode: standalone Nitro app or Nuxt module (`configKey: risk`). Node only (Docker/VPS): it runs `gallery-dl`, `yt-dlp`, `monid` and `sharp`, none of which run on Cloudflare Workers.

## Rails

| Rail | Source | Input | Raw result |
|---|---|---|---|
| `ip` | `services/ip` | none, runs on the consent click | the `services/ip` output, including `deduction` |
| `social` | `gallery-dl` (Instagram), `yt-dlp` (TikTok covers), Monid if blocked | `{ platform, handle }` | `source`, `posts` (`url`, `date`), `images` (saved file names) |
| `face` | `services/dont-trust-verify` `/match` | `{ images: [1-4 names] }` | per image: `match`, `reason`, `distances` |
| `genai` | Sightengine `genai` model, 5 ops per image | `{ images? }`: max 5; without it the whole folder, only if it holds 5 or fewer | per image: Sightengine `type` |
| `btc` | BIP-322 / BIP-137 signature + mempool.space | `{ address, message, signature }` | `valid`, `utxos` |
| `pep` | not connected yet | — | — |
| `bank` | not connected yet | — | — |

Every rail returns `{ status: 'ok' | 'skipped' | 'error', ... }`; `skipped` and `error` carry a `reason`.

## Use cases

`NUXT_RISK_USE_CASES_FILE` points to a private JSON file, shaped like `use-cases.example.json`:

- `rails`: the rails a profile of that use case may run;
- `consentNext`: optional URL the consent button goes to.

### Classification (planned, not built)

Thresholds, weights and the risk/trust classification are not in this service. Each user will set them for their own use case in a config file they write (probably YAML), read on top of the raw rail results. Until then the operator reads the raw results directly.

## Flow

1. `POST /api/risk/profile` `{ useCase }` → `{ id, consentUrl }`. Send `consentUrl` to the subject.
2. The subject opens it: placeholder consent page (nothing recorded yet). Opening the link records nothing (link previews); the Continue click runs the `ip` rail from their connection.
3. `POST /api/risk/profile/:id/social` `{ platform, handle }` downloads up to 10 images.
4. The operator opens the profile folder (`dir` in `GET /api/risk/profile/:id`), picks 3-4 images by hand (images added to the folder by hand count too) and sends their file names: `POST /api/risk/profile/:id/face` `{ images }`. The subject must have completed `dont-trust-verify` with user id = profile id.
5. `POST /api/risk/profile/:id/genai`, `/btc`, ...: each call stores that rail's raw result.
6. `GET /api/risk/profile/:id` → raw rail results and image names. `DELETE` closes it: face vector, images and the profile record are deleted, nothing is kept.

`POST /api/risk/lead` `{ platform, handle, text }` returns the sender's raw public posts for an inbound lead (e.g. an Instagram DM forwarded by n8n) without storing anything.

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
```

## License

MIT.
