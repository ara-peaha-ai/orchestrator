import sharp from 'sharp'
import { createError } from 'h3'
import { readImage } from '../utils/images.js'

const MAX_SIDE = 512 // dont-trust-verify rejects bigger images

// input: { images: ['instagram-03.jpg', ...] }, the 3-4 the operator picked.
// The subject must have completed the dont-trust-verify flow with user id = profile id (reference vector).
// Each image goes whole: /match requires every face found in it to match, so a group photo fails.
// ponytail: images are downscaled to 512 px, very small background faces may go undetected
export default async ({ profile, input }) => {
  const { dontTrustVerifyUrl: url, dontTrustVerifySecret: secret } = useRuntimeConfig().risk
  if (!url || !secret) return { status: 'skipped', reason: 'dont-trust-verify not configured' }
  const names = input.images
  if (!Array.isArray(names) || !names.length || names.length > 4) {
    throw createError({ statusCode: 400, statusMessage: 'images: 1-4 names' })
  }

  const results = []
  for (const name of names) {
    const { data, info } = await sharp(await readImage(profile.id, name))
      .resize(MAX_SIDE, MAX_SIDE, { fit: 'inside', withoutEnlargement: true })
      .removeAlpha()
      .toColourspace('srgb')
      .raw()
      .toBuffer({ resolveWithObject: true })
    const res = await $fetch(`${url}/match`, {
      method: 'POST',
      headers: { 'x-dont-trust-verify-secret': secret, 'x-user-id': profile.id },
      body: { faces: [{ width: info.width, height: info.height, rgb: data.toString('base64') }] }
    })
    results.push({ image: name, match: res.match, reason: res.reason, distances: res.distances })
  }
  return { status: 'ok', results }
}
