# P2Pagos IP Detection Service

Privacy-oriented IP, country, and currency detection for Nuxt/Nitro applications.

This service provides a minimal server-side IP detection layer for P2Pagos payment flows.

It is designed to help applications understand only the basic routing context they need:

- probable visitor country;
- probable local currency;
- infrastructure-level IP source;
- optional comparison with an external IP database;
- lightweight rate limiting for API routes.

It is not designed for invasive tracking, fingerprinting, or identity verification.

## Why This Exists

Payment infrastructure often needs to adapt to the visitor’s local context.

For example:

- preselecting a local currency;
- showing a likely local payment rail;
- choosing a regional fallback flow;
- detecting whether a visitor appears to come from a supported country;
- avoiding false assumptions when VPNs, Tor, proxies, or Smart Routing systems are involved.

But IP detection is not identity.

IP location is only a signal.

Different providers can disagree. Cloudflare may report one country, IPinfo may report another, and the user may be behind a VPN, Tor, carrier NAT, corporate proxy, or a routed VPS.

This module keeps that uncertainty explicit.

## Core Principle

P2Pagos treats IP detection as a weak, privacy-oriented context signal.

It should help the interface adapt.

It should not be used as a perfect compliance system, personal identity layer, or surveillance mechanism.

## Multi-Source Detection

The service follows the same multi-rail principle used across P2Pagos.

Instead of trusting a single source blindly, it can compare multiple infrastructure signals:

- Cloudflare country detection through `CF-IPCountry`;
- real visitor IP headers such as `cf-connecting-ip`, `x-forwarded-for`, and `x-real-ip`;
- optional IPinfo lookup as a second external reference;
- own server-side deployment, avoiding client-side third-party scripts that may be blocked by ad blockers.

This gives the application a more resilient and privacy-aware way to understand location context.

## Why Server-Side Detection Matters

Many browser-side geolocation or IP lookup scripts are unreliable in production.

They may be blocked by:

- ad blockers;
- privacy extensions;
- corporate firewalls;
- browser tracking protections;
- DNS filtering;
- anti-tracking lists.

This module runs inside the Nuxt/Nitro server layer.

That means the application can detect country and currency context without forcing the browser to call third-party tracking-style scripts.

## Current Behavior

When enabled, the middleware can detect:

- visitor IP;
- country from Cloudflare;
- currency inferred from Cloudflare country;
- country from IPinfo, when an API key is configured;
- currency inferred from IPinfo country;
- API rate-limit metadata.

The result is attached to:

```js
event.context.ipDetection
```

Example shape:

```js
{
  ip: "203.0.113.10",
  country: "PY",
  currency: "PYG",
  countryIPinfo: "PY",
  currencyIPinfo: "PYG"
}
```

Cloudflare is currently treated as the primary infrastructure signal.

IPinfo is exposed as an additional comparison signal.

This is intentional: the application can decide how much confidence to assign when both sources agree or disagree.

## Cloudflare Header Protection

The module can require a private Cloudflare-origin token before trusting `CF-IPCountry`.

This helps prevent clients from spoofing Cloudflare headers directly.

Configure a Cloudflare Transform Rule or origin rule to send:

```txt
x-cf-origin-token: <your-secret-token>
```

Then set the same value in the application environment.

If the configured token is missing or invalid, the module ignores the Cloudflare country header.

## Environment Variables

```env
NUXT_IP_DETECTION_CLOUDFLARE_SECRET="set this in your Cloudflare Transform Rule as x-cf-origin-token header value"
NUXT_IP_DETECTION_COUNTRY="false"
NUXT_IP_DETECTION_CURRENCY="true"
NUXT_IP_DETECTION_RATE_LIMIT="100"
NUXT_IP_DETECTION_LIMIT_PATHS=""
NUXT_IPINFO_API_KEY="optional — enables IPinfo fallback/comparison"
```

## Configuration Meaning

| Variable | Purpose |
|---|---|
| `NUXT_IP_DETECTION_CLOUDFLARE_SECRET` | Optional secret required before trusting Cloudflare country headers. |
| `NUXT_IP_DETECTION_COUNTRY` | Enables country detection. |
| `NUXT_IP_DETECTION_CURRENCY` | Enables currency inference from detected country. |
| `NUXT_IP_DETECTION_RATE_LIMIT` | Requests per minute per detected IP for limited routes. |
| `NUXT_IP_DETECTION_LIMIT_PATHS` | Optional comma-separated list of paths to rate limit. |
| `NUXT_IPINFO_API_KEY` | Optional IPinfo key for second-source comparison. |

## Rate Limiting

The service includes a simple in-memory rate limiter.

By default, it applies to `/api/*` routes, excluding internal Nuxt paths and webhook routes.

It adds the following headers:

```txt
x-ratelimit-limit
x-ratelimit-remaining
x-ratelimit-reset-ms
```

If the limit is exceeded, the request returns:

```txt
429 Too Many Requests
```

This is meant as a lightweight protection layer, not as a full distributed anti-abuse system.

For multi-instance production deployments, a shared external store may be required later.

## Privacy Model

The module is designed around data minimization.

It should only detect what the application needs to improve routing and user experience.

Recommended usage:

- use country for interface adaptation;
- use currency for payment rail selection;
- keep IP-based decisions reversible;
- show neutral options when confidence is low;
- avoid blocking privacy tools by default;
- do not treat IP location as identity.

Not recommended:

- fingerprinting users;
- storing raw IPs unnecessarily;
- treating country detection as KYC;
- blocking Tor or VPN users blindly;
- assuming Cloudflare, IPinfo, or any single database is always correct.

## Tor, VPNs, and Smart Routing

Tor, VPNs, mobile carriers, and Smart Routing systems can make country detection ambiguous.

This module is built with that reality in mind.

The correct behavior is not to pretend IP geolocation is perfect.

The correct behavior is to expose enough context for the application to choose a safer flow.

For example:

- if Cloudflare and IPinfo agree, confidence is higher;
- if they disagree, the app can avoid strong assumptions;
- if a user appears to be behind a privacy tool, the app can ask for explicit country/currency confirmation;
- if a regulated action is involved, stronger verification can be requested only at that step.

## Use Cases

This service is useful for:

- multi-rail payment routing;
- local currency preselection;
- country-aware checkout flows;
- payment method ordering;
- fraud and abuse rate limiting;
- detecting uncertainty in VPN-heavy environments;
- reducing dependency on browser-side geolocation scripts;
- comparing Cloudflare detection against IPinfo.

## P2Pagos Context

P2Pagos is built around multi-rail payment infrastructure.

That same logic applies here.

Country detection should not depend on one fragile signal.

A payment application should be able to compare Cloudflare, IPinfo, and its own deployment context without turning the user into a tracking target.

The goal is practical:

- better routing;
- fewer false positives;
- fewer broken payment flows;
- less dependency on client-side scripts;
- privacy by design;
- explicit uncertainty when location cannot be trusted.

## Development

Install dependencies from the service folder:

```bash
npm install
```

Run Nitro locally:

```bash
npm run dev
```

Build:

```bash
npm run build
```

## Package

```json
{
  "name": "@ara-peaha-ai/ip",
  "version": "0.1.0",
  "license": "MIT",
  "private": true
}
```

## Status

Early internal service.

Current implementation:

- Nuxt module;
- Nitro middleware;
- Cloudflare country support;
- optional IPinfo comparison;
- country-to-currency mapping;
- basic API rate limiting;
- server-side detection only.

Future improvements may include:

- explicit confidence scoring;
- configurable source priority;
- automatic fallback strategy;
- optional Tor/VPN classification;
- persistent or distributed rate-limit backend;
- public examples for checkout and payment rail selection.

## License

MIT.
