# dont-trust-verify

Local-first, KYC-free age verification (18+) and deepfake protection for Nuxt/Nitro. The ID never leaves the browser: OCR and face matching run client-side, the server only receives `{ code, ageVerified, face }`, where `face` is a crop of the person's face.

Keywords: KYC-free, age verification, deepfake prevention, face match, client-side, offline, privacy, Nuxt module, Nitro.

Dual mode: standalone Nitro app or Nuxt module (`configKey: dontTrustVerify`).

## Flow

1. **Load (client):** `init()` downloads models and OCR assets once, then `ready` turns `true`: show "you can disconnect now and start the verification". Everything below works offline.
2. **Challenge (server):** `requestCode()` returns a single-use 6-character code (10 min TTL, bound to the user). The user writes it in block capitals on a sheet.
3. **Photo (client):** the user takes one photo holding the ID and the sheet next to their face. The browser checks:
   - OCR finds the code (one OCR error tolerated);
   - two faces are found: the person (biggest) and the ID portrait;
   - the date of birth is read from the ID, exact age ≥ `minAge`;
   - person and ID portrait match (distance < `matchThreshold`).
   If the date of birth is unreadable in the photo, `verify(photo, idScan)` accepts a close-up of the same ID (its portrait must match the one in the photo).
4. **Register (client → server):** POST `{ code, ageVerified, face }` where `face` is a 224 px crop of the person's face only (never the ID, the sheet or the date of birth). The server burns the challenge, validates it, computes the face vector itself on CPU, stores the vector and drops the crop.
5. **Training upload:** POST one crop per face found in the training image to `/match`. The server computes the vectors, compares them with the stored reference and returns `{ match, distances }`. `match` is true only if every face matches. The reference vector never goes back to the client.

Models, OCR worker, WASM core and language data are self-hosted under `<prefix>/assets/*` (from npm packages), so no third-party CDN sees the user.

## Dates and timezones

The date of birth is parsed as integers (day-first, `DD/MM/YYYY`) and compared with the local calendar day. It never goes through `Date`/UTC, which is what shifts a birth date by one day. `pnpm check` runs the checks under `Pacific/Kiritimati` (UTC+14) and `Pacific/Pago_Pago` (UTC-11).

## Usage (module)

```js
// nuxt.config.js
export default defineNuxtConfig({
  modules: ['@paga-peaha-ai/dont-trust-verify'],
  dontTrustVerify: { enabled: true }
})
```

```js
const { init, requestCode, verify, checkTrainingImage, ready, code, ocrText, age, distance } = useDontTrustVerify()
await init()                                   // then ready.value === true
await requestCode()                            // show `code` to the user
const res = await verify(photoCanvas)          // { ok } or { ok: false, reason }
const check = await checkTrainingImage(img)    // { match, distance }
```

`reason`: `code`, `faces`, `id-mismatch`, `dob-not-found`, `age`, `face-mismatch`.

The host app must set `event.context.user.id` (its own auth). Data is stored with `useStorage('dont-trust-verify')`: mount a persistent driver in the host app, the default is memory.

## Standalone

Node only (Docker/VPS). The server-side face check runs tfjs on the WASM backend (CPU, no GPU, about 1 s for a large image, 200 ms model load once), which does not run on Cloudflare Workers. Deploy with `node_modules` next to `.output` (install then build on the target, like `services/tor`).

```bash
cp .env.example .env
pnpm dev
```

In a built standalone server the env prefix is `NUXT_` (set in `nitro.config.js`). It trusts `x-user-id` only when `x-dont-trust-verify-secret` matches `NUXT_DONT_TRUST_VERIFY_PROXY_SECRET`.

## Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NUXT_DONT_TRUST_VERIFY_MIN_AGE` | no | `18` | Minimum age |
| `NUXT_DONT_TRUST_VERIFY_MATCH_THRESHOLD` | no | `0.6` | Max Euclidean distance for a face match |
| `NUXT_DONT_TRUST_VERIFY_PROXY_SECRET` | standalone | none | Shared secret to trust `x-user-id` |

## Routes

| Route | Description |
|-------|-------------|
| `GET /api/dont-trust-verify` | Health |
| `POST /api/dont-trust-verify/challenge` | New single-use code for the current user |
| `POST /api/dont-trust-verify/register` | `{ code, ageVerified, face }`: validate the challenge, store the server-computed vector |
| `POST /api/dont-trust-verify/match` | `{ faces: [face] }`: compare every face with the stored reference |

## Threat model

- **A bare `ageVerified: true` is rejected:** `/register` needs the live, single-use, user-bound code. Replaying another user's result or an old request fails.
- **The reference vector cannot be invented:** it is computed by the server from a real face crop.
- **Still open (client-side by design):** a scripted attacker can request a code and POST it back with any face crop and `ageVerified: true`. The ID never reaches the server, so the server can check neither the age nor that the face belongs to the ID. This is the accepted residual risk.
- **No real liveness:** the sheet with the code proves freshness, not a live person. A video or a good print of someone else's face plus ID plus sheet is not detected.
- **OCR on the DOB is a heuristic** (oldest past date on the document); MRZ or PDF417 parsing is more reliable where present. A hand-written code is the weakest OCR input: block capitals, dark pen.
- **Face descriptors are biometric data.** Not reversible to a photo, but not anonymous either. Store per user, allow deletion.
- **Matching quality:** face-api (128-d) is weak on ID portrait vs selfie. Tune `matchThreshold` with real data.
- **Weights license:** code is MIT/Apache-2.0, the pre-trained weights come from academic datasets. Review before scaling.

## License

MIT.
