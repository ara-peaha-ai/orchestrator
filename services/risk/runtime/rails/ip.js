// Reads services/ip (must be enabled in the host with an IPinfo key). Runs on the consent page,
// the only request that comes from the subject's own connection.
export default async ({ event }) => {
  const d = event.context.ipDetection
  if (!d) return { status: 'skipped', reason: 'services/ip not enabled' }
  return {
    status: 'ok',
    signals: { vpn: d.vpn, tor: d.deduction === 'tor', deduction: d.deduction, country: d.countryDb || d.country }
  }
}
