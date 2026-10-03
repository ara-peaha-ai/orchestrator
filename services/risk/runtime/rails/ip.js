// Reads services/ip (must be enabled in the host with an IPinfo key). Runs on the consent page,
// the only request that comes from the subject's own connection.
export default async ({ event }) => {
  const d = event.context.ipDetection
  if (!d) return { status: 'skipped', reason: 'services/ip not enabled' }
  // Raw services/ip output; its deduction (Cloudflare vs IPinfo, e.g. Proton Smart Routing) is the only analysis
  return { status: 'ok', ...d }
}
