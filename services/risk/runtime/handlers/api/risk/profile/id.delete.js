import { defineEventHandler, getRouterParam } from 'h3'
import { getProfile, deleteProfile } from '../../../../utils/profiles.js'
import { deleteImages } from '../../../../utils/images.js'

// Closes the profile: images and the record go. The face vector lives in dont-trust-verify storage.
export default defineEventHandler(async (event) => {
  const profile = await getProfile(getRouterParam(event, 'id'))
  await deleteImages(profile.id)
  await deleteProfile(profile.id)
  return { ok: true }
})
