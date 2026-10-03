import { defineEventHandler, getRouterParam } from 'h3'
import { getProfile } from '../../../../utils/profiles.js'
import { listImages } from '../../../../utils/images.js'

export default defineEventHandler(async (event) => {
  const profile = await getProfile(getRouterParam(event, 'id'))
  return { ...profile, images: await listImages(profile.id) }
})
