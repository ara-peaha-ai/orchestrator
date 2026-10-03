import { defineEventHandler, getRouterParam } from 'h3'
import { getProfile } from '../../../../utils/profiles.js'
import { listImages, profileDir } from '../../../../utils/images.js'

export default defineEventHandler(async (event) => {
  const profile = await getProfile(getRouterParam(event, 'id'))
  // dir: the folder the operator opens to pick the 3-4 images for face and genai
  return { ...profile, dir: profileDir(profile.id), images: await listImages(profile.id) }
})
