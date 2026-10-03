import { readImage, listImages } from '../utils/images.js'

// Sightengine free plan: 2,000 ops/month, 500/day; one op per image.
// input: { images?: [...] }, all saved images when omitted.
export default async ({ profile, input }) => {
  const { sightengineUser, sightengineSecret } = useRuntimeConfig().risk
  if (!sightengineUser || !sightengineSecret) return { status: 'skipped', reason: 'Sightengine not configured' }
  const names = input.images?.length ? input.images : await listImages(profile.id)
  if (!names.length) return { status: 'skipped', reason: 'no images, run the social rail first' }

  const scores = []
  for (const name of names) {
    const form = new FormData()
    form.append('media', new Blob([await readImage(profile.id, name)]), name)
    form.append('models', 'genai')
    form.append('api_user', sightengineUser)
    form.append('api_secret', sightengineSecret)
    const data = await (await fetch('https://api.sightengine.com/1.0/check.json', { method: 'POST', body: form })).json()
    if (data.status !== 'success') throw new Error(`Sightengine: ${data.error?.message || 'request failed'}`)
    scores.push(data.type.ai_generated)
  }
  return {
    status: 'ok',
    signals: { checked: scores.length, max: Math.max(...scores), mean: scores.reduce((a, b) => a + b, 0) / scores.length },
    scores: Object.fromEntries(names.map((n, i) => [n, scores[i]]))
  }
}
