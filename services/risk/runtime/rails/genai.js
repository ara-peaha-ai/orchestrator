import { createError } from 'h3'
import { readImage, listImages } from '../utils/images.js'

// Free plan credits: never more than 5 images (25 ops) per call
const MAX_IMAGES = 5

// Sightengine free plan: 2,000 ops/month, 500/day; the genai model costs 5 ops per image (~400 images/month).
// input: { images?: [...] }, the whole folder when omitted and it holds at most MAX_IMAGES.
export default async ({ profile, input }) => {
  const { sightengineUser, sightengineSecret } = useRuntimeConfig().risk
  if (!sightengineUser || !sightengineSecret) return { status: 'skipped', reason: 'Sightengine not configured' }
  const names = input.images?.length ? input.images : await listImages(profile.id)
  if (!names.length) return { status: 'skipped', reason: 'no images, run the social rail first' }
  if (names.length > MAX_IMAGES) {
    throw createError({ statusCode: 400, statusMessage: `${names.length} images: pick at most ${MAX_IMAGES} and pass them as images` })
  }

  const results = []
  for (const name of names) {
    const form = new FormData()
    form.append('media', new Blob([await readImage(profile.id, name)]), name)
    form.append('models', 'genai')
    form.append('api_user', sightengineUser)
    form.append('api_secret', sightengineSecret)
    const data = await (await fetch('https://api.sightengine.com/1.0/check.json', { method: 'POST', body: form })).json()
    if (data.status !== 'success') throw new Error(`Sightengine: ${data.error?.message || 'request failed'}`)
    results.push({ image: name, type: data.type })
  }
  return { status: 'ok', results }
}
