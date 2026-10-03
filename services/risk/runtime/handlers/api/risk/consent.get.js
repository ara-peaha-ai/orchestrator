import { defineEventHandler, getRouterParam, setResponseHeader } from 'h3'
import { getProfile } from '../../../utils/profiles.js'

// ponytail: consent placeholder, nothing is recorded. GET only renders: link previews (Instagram DM)
// and the operator opening the link must not record their IP; the button POST does.
export default defineEventHandler(async (event) => {
  const profile = await getProfile(getRouterParam(event, 'id'))
  setResponseHeader(event, 'content-type', 'text/html; charset=utf-8')
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Consent</title></head>
<body style="font-family:sans-serif;max-width:32rem;margin:3rem auto;padding:0 1rem">
<h1>Verification consent</h1>
<p>Placeholder: the consent text for each check goes here.</p>
<form method="post" action="${profile.id}"><button>Continue</button></form>
</body></html>`
})
