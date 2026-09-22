# @ara-peaha-ai/booking

Nuxt 4 module for the booking/scheduling flow. Ships a full-page booking UI and an embeddable iframe variant with custom theming support.

## Pages

| Route | Description |
|-------|-------------|
| `/flows/booking` | Full booking flow — calendar, time slots, optional extras |
| `/flows/booking/embed` | Embeddable iframe variant with custom theme support |

## Components

| Component | Description |
|-----------|-------------|
| `BookingCalendar` | Date picker with availability slots |
| `BookingFlowView` | Orchestrates the multi-step booking flow |

## Composables

| Composable | Description |
|------------|-------------|
| `useCustomTheme` | Applies custom brand colours in embed mode |

## Adding to an app

```json
// package.json
"dependencies": {
  "@ara-peaha-ai/booking": "workspace:*"
}
```

```js
// nuxt.config.js
export default defineNuxtConfig({
  modules: ['@ara-peaha-ai/booking']
})
```

## Embed theming

The `/flows/booking/embed` page accepts three optional query params:

| Param | Type | Description |
|-------|------|-------------|
| `customMode` | `light` \| `dark` | Forces light or dark mode. Omit to follow system preference. |
| `customPrimary` | color | Primary/accent color. Accepts hex (`0ea5e9`), named (`violet`), or any CSS color. |
| `customBackground` | color | Base background color for all widget surfaces. Derives `elevated`, `muted`, `accented`, and `border` shades automatically via `color-mix`. Requires `customMode` to take effect. |

`customBackground` overrides the Nuxt UI `--ui-bg` CSS variable family — cards, inputs, dropdowns, and borders all derive from it. Without `customMode` it has no effect because the mix direction (toward white or black) cannot be determined.

### Examples

Default dark mode with amber primary (Nuxt UI dark blue background):
```
/flows/booking/embed?customMode=dark&customPrimary=f59e0b
```

Dark mode with custom brown background and amber primary:
```
/flows/booking/embed?customMode=dark&customPrimary=f59e0b&customBackground=3d1a00
```

Light mode with custom primary, no background override:
```
/flows/booking/embed?customMode=light&customPrimary=0ea5e9
```

No params — follows system dark/light preference and Nuxt UI default colors:
```
/flows/booking/embed
```

## Payment (BTCPay)

- `POST /flows/booking/checkout` validates the body, computes the price server-side from `runtime/lib/pricing.js` (the client never sends an amount), creates a BTCPay invoice and returns `{ orderId, invoiceId, checkoutLink }`. Optional `currency` (`EUR` default, `USD`).
- `GET /flows/booking/order?orderId=` returns the order status (`pending` | `paid`); `/flows/booking/thanks` polls it.
- `runtime/plugins/btcpay-settled.js` listens to the `btcpay:invoice-settled` Nitro hook, calls the `openPurchaseRequest` stub (where the RoboSats/Peach offer will be opened), then marks the invoice `fulfilled` in its own metadata — only after `openPurchaseRequest` succeeds, so a failure there is retried on the next redelivery.
- `@ara-peaha-ai/btcpay` is a workspace dependency, imported via its `./createInvoice`, `./findInvoiceByOrderId` and `./updateInvoiceMetadata` subpath exports.
- There is no separate order store: the BTCPay invoice (and its metadata) is the order record. `POST /flows/booking/checkout` rate-limits to 5 attempts/minute per IP (in-memory, single-process).
