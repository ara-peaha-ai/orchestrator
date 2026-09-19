# rails

Payment rail modules live under `rails/*`.

Each rail is a dual-mode module: it can run as a **standalone Nitro server** or be embedded as a **Nuxt module** into any host app. Rails inject pages, composables, and API server handlers. They contain no business logic beyond their own rail's integration.

## Available rails

| Package | Page | API | Description |
|---------|------|-----|-------------|
| `@ara-peaha-ai/template` | `/rails/template` | `/api/rails/template` | Reference rail — copy this to scaffold a new integration |
| `@ara-peaha-ai/peach` | `/rails/peach` | `/api/rails/peach/*` | [Peach](https://peachbitcoin.com) P2P Bitcoin rail |
| `@ara-peaha-ai/robosats` | `/rails/robosats` | `/api/rails/robosats/*` | [RoboSats](https://robosats.com) P2P Bitcoin rail — includes `@ara-peaha-ai/tor` automatically |
| `@ara-peaha-ai/masspay` | `/rails/masspay` | `/api/rails/masspay/*` | [MassPay](https://www.masspay.io) wallet rail — sweeps incoming USDT/ACH funds to PYG via SIPAP |

## Adding a new rail

1. Copy `rails/template` to `rails/<name>`
2. Rename the package in `package.json` to `@ara-peaha-ai/<name>`
3. Update `module/module.js` defaults (`routeBase`, `configKey`)
4. Add `"@ara-peaha-ai/<name>": "workspace:*"` to the app's `package.json`
5. Add `'@ara-peaha-ai/<name>'` to the app's `nuxt.config.js` modules array
6. Run `pnpm install`

## Rail anatomy

```text
rails/<name>/
├── package.json                  name: @ara-peaha-ai/<name>
├── nitro.config.js               standalone Nitro server config
├── routes/
│   └── index.get.js              standalone health check
├── module/
│   ├── module.js                 defineNuxtModule entry point
│   └── definitions/
│       └── endpoints.js          endpoint list shared by module and nitro config
└── runtime/
    ├── pages/                    injected via pages:extend hook
    ├── composables/              injected via addImportsDir
    ├── handlers/                 registered via addServerHandler
    └── lib/                      server-side utilities
```
