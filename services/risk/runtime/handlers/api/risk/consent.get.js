import { defineEventHandler, getRouterParam, setResponseHeader } from 'h3'
import { getProfile, saveRail } from '../../../utils/profiles.js'
import { getUseCase } from '../../../utils/useCases.js'
import ip from '../../../rails/ip.js'

const escape = (s) => String(s).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`)

// ponytail: consent placeholder, nothing is recorded; the button only moves to the next step.
// It is also the only request from the subject's own connection, so the ip rail runs here.
export default defineEventHandler(async (event) => {
  const profile = await getProfile(getRouterParam(event, 'id'))
  await saveRail(profile, 'ip', await ip({ event }))
  const next = getUseCase(profile.useCase).consentNext
  setResponseHeader(event, 'content-type', 'text/html; charset=utf-8')
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Consent</title></head>
<body style="font-family:sans-serif;max-width:32rem;margin:3rem auto;padding:0 1rem">
<h1>Verification consent</h1>
<p>Placeholder: the consent text for each check goes here.</p>
${next ? `<a href="${escape(next)}"><button>Continue</button></a>` : '<button onclick="this.replaceWith(\'Thank you, you can close this page.\')">Continue</button>'}
</body></html>`
})
