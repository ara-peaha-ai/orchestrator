# flows

Business flow modules live under `flows/*`.

Flows are richer than rails: they can ship pages, embeddable components, composables (auto-imported), and server handlers — all in a single Nuxt 4 module. A flow represents a complete user-facing feature spanning both client and server.

## Available flows

| Package | Page(s) | Description |
|---------|---------|-------------|
| `@ara-peaha-ai/booking` | `/flows/booking`, `/flows/booking/embed` | Booking/scheduling UI — calendar, time slots, optional extras, embeddable iframe variant with custom theming |

## Adding a new flow

1. Create `flows/<name>/` with `package.json`, `module.js`, and `runtime/`
2. Name the package `@ara-peaha-ai/<name>` — no `-flow` suffix
3. Use `addImportsDir` for composables, `addComponentsDir` for components, `addServerHandler` for API handlers, `pages:extend` for pages
4. Add `"@ara-peaha-ai/<name>": "workspace:*"` to the app's `package.json`
5. Add `'@ara-peaha-ai/<name>'` to the app's `nuxt.config.js` modules array
6. Run `pnpm install`
