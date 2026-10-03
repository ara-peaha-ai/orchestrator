// CF-IPCountry reports where the server physically is, the IPinfo DB the country the IP is registered for.
// The mismatch between the two is the signal.

// VPN countries Proton serves through physical servers elsewhere (Smart Routing)
const PROTON_SMART_ROUTING = new Set([
  'CR', 'CU', 'DO', 'EC', 'SV', 'GT', 'HT', 'HN', 'JM', 'LY', 'LI', 'NI', 'PA', 'PY', 'UY', 'VE',
  'AR', 'BO', 'BR', 'CL', 'CO', 'MX', 'PE'
])
const PROTON_PHYSICAL = new Set(['US', 'GB', 'FR'])

// cf: raw CF-IPCountry (T1 kept), db: IPinfo country_code
export const deduce = ({ cf, db }) => {
  if (cf === 'T1') return { deduction: 'tor', vpn: true }
  if (!cf && !db) return { deduction: 'unknown', vpn: false }
  if (!cf) return { deduction: 'no-cloudflare', vpn: false }
  if (!db || cf === db) return { deduction: 'consistent', vpn: false }
  if (PROTON_PHYSICAL.has(cf) && PROTON_SMART_ROUTING.has(db)) {
    return { deduction: 'proton-smart-routing', vpn: true }
  }
  // ponytail: no datacenter ASN list yet, add one when countries agree but the IP is a VPS
  return { deduction: 'vpn', vpn: true }
}
