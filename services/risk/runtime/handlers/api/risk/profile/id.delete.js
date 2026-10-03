import { defineEventHandler, getRouterParam, createError } from 'h3'
import { getProfile, deleteProfile } from '../../../../utils/profiles.js'
import { deleteImages } from '../../../../utils/images.js'

// Closes the profile: face vector, images and record. The vector goes first: if dont-trust-verify
// cannot delete it, the profile stays and the call fails, so a delete is never reported while it remains.
export default defineEventHandler(async (event) => {
  const profile = await getProfile(getRouterParam(event, 'id'))
  const { dontTrustVerifyUrl: url, dontTrustVerifySecret: secret } = useRuntimeConfig().risk
  if (url && secret) {
    await $fetch(`${url}/vector`, {
      method: 'DELETE',
      headers: { 'x-dont-trust-verify-secret': secret, 'x-user-id': profile.id }
    }).catch((err) => {
      throw createError({ statusCode: 502, statusMessage: `Face vector not deleted: ${err.message}` })
    })
  }
  await deleteImages(profile.id)
  await deleteProfile(profile.id)
  return { ok: true }
})
