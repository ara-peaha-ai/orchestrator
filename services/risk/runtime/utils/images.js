import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createError } from 'h3'

const MAX_BYTES = 10 * 1024 * 1024
// Only CDN hosts the scrapers return: the URLs come from third-party output, never fetch anything else
const ALLOWED_HOSTS = ['cdninstagram.com', 'fbcdn.net', 'tiktokcdn.com', 'tiktokcdn-us.com', 'tiktokcdn-eu.com', 'ibyteimg.com']
const NAME = /^[a-z]+-\d{2}\.(jpg|png|webp)$/

const allowedHost = (url) => {
  try {
    const { protocol, hostname } = new URL(url)
    return protocol === 'https:' && ALLOWED_HOSTS.some(h => hostname === h || hostname.endsWith(`.${h}`))
  } catch {
    return false
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

export const profileDir = (id) => {
  if (!UUID.test(String(id))) throw createError({ statusCode: 400, statusMessage: 'Invalid profile id' })
  return join(useRuntimeConfig().risk.workDir, id)
}

// Downloads right away: Instagram/TikTok CDN URLs are signed and expire within hours
export const saveImages = async (id, platform, urls, limit) => {
  const dir = profileDir(id)
  await mkdir(dir, { recursive: true })
  const names = []
  for (const url of urls) {
    if (names.length >= limit) break
    if (!allowedHost(url)) continue
    const res = await fetch(url, { redirect: 'error' }).catch(() => null)
    const type = res?.headers.get('content-type') || ''
    if (!res?.ok || !type.startsWith('image/')) continue
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length > MAX_BYTES) continue
    const ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : 'jpg'
    const name = `${platform}-${String(names.length + 1).padStart(2, '0')}.${ext}`
    await writeFile(join(dir, name), buf)
    names.push(name)
  }
  return names
}

export const listImages = async (id) => (await readdir(profileDir(id)).catch(() => [])).filter(n => NAME.test(n))

// Names come from the request: only names saveImages produced are accepted, so no path traversal
export const readImage = async (id, name) => {
  if (!NAME.test(String(name))) throw createError({ statusCode: 400, statusMessage: `Invalid image name: ${name}` })
  return readFile(join(profileDir(id), name))
}

export const deleteImages = (id) => rm(profileDir(id), { recursive: true, force: true })
