import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createError } from 'h3'
import { saveImages } from '../utils/images.js'

const run = promisify(execFile)
const LIMIT = 10
const HANDLE = /^[A-Za-z0-9._]{1,30}$/
const DAY = 86_400_000

// gallery-dl prints UTC dates as 'YYYY-MM-DD HH:MM:SS'
const toIso = (d) => {
  const t = Date.parse(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(d) ? `${d.replace(' ', 'T')}Z` : d)
  return Number.isFinite(t) ? new Date(t).toISOString() : undefined
}

// Free CLIs first. Cookies of the dedicated logged-in account (Netscape cookies.txt, Instagram + TikTok).
const cli = async (platform, handle, cookiesFile) => {
  const cookies = cookiesFile ? ['--cookies', cookiesFile] : []
  const opts = { timeout: 120_000, maxBuffer: 50e6 }
  if (platform === 'instagram') {
    const { stdout } = await run('gallery-dl', [...cookies, '--range', `1-${LIMIT}`, '-j', `https://www.instagram.com/${handle}/posts/`], opts)
    const messages = JSON.parse(stdout)
    // gallery-dl exits 0 and reports errors (login wall, not found) as [-1, { error }]
    const failed = messages.find(m => m[0] === -1)
    if (failed) throw new Error(failed[1]?.message || 'gallery-dl error')
    return messages
      .filter(m => m[0] === 3)
      .map(([, url, meta]) => ({ url: meta.display_url || url, date: toIso(meta.date) }))
  }
  // TikTok user pages need impersonation: install yt-dlp with curl-cffi on the host
  const { stdout } = await run('yt-dlp', [...cookies, '-j', '--skip-download', '--playlist-end', String(LIMIT), `https://www.tiktok.com/@${handle}`], opts)
  return stdout.trim().split('\n').filter(Boolean).map(line => JSON.parse(line))
    .map(v => ({ url: v.thumbnail, date: v.timestamp ? new Date(v.timestamp * 1000).toISOString() : undefined }))
}

// ponytail: output shape not verified with a paid run, collects every image-like URL by key name
// and takes the post date from a sibling key of the same object
const IMAGE_KEY = /^(displayUrl|display_url|cover|originCover|thumbnail|thumbnailUrl)$/i
const DATE_KEY = /^(timestamp|takenAtTimestamp|taken_at|createTime|createTimeISO)$/
const dateOf = (obj) => {
  const v = Object.entries(obj).find(([k]) => DATE_KEY.test(k))?.[1]
  if (typeof v === 'number') return toIso(new Date(v < 1e12 ? v * 1000 : v).toISOString())
  return typeof v === 'string' ? toIso(v) : undefined
}
const imageUrls = (node, out = []) => {
  if (Array.isArray(node)) node.forEach(n => imageUrls(n, out))
  else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if (typeof v === 'string' && IMAGE_KEY.test(k)) out.push({ url: v, date: dateOf(node) })
      else imageUrls(v, out)
    }
  }
  return out
}

// Paid fallback (~$0.003 IG, ~$0.005 TikTok per profile) when the CLIs are blocked
const monid = async (platform, handle) => {
  const [endpoint, input] = platform === 'instagram'
    ? ['/apify/instagram-profile-scraper', { usernames: [handle] }]
    : ['/apidojo/tiktok-profile-scraper', { usernames: [handle], maxItems: LIMIT }]
  const { stdout } = await run('monid', ['run', '-p', 'apify', '-e', endpoint, '-i', JSON.stringify(input), '-w', '180', '-j'], { timeout: 200_000, maxBuffer: 50e6 })
  return imageUrls(JSON.parse(stdout))
}

export const fetchPosts = async (platform, handle) => {
  if (!['instagram', 'tiktok'].includes(platform)) throw createError({ statusCode: 400, statusMessage: 'platform: instagram | tiktok' })
  if (!HANDLE.test(String(handle))) throw createError({ statusCode: 400, statusMessage: 'Invalid handle' })
  const { cookiesFile, monidFallback } = useRuntimeConfig().risk
  // A blocked CLI must not look like an empty profile (that would score as a bot): an empty answer
  // cannot be told apart from a silent block, so it is an error too
  const posts = await cli(platform, handle, cookiesFile).catch(() => [])
  if (posts.length) return { posts, source: 'cli' }
  if (monidFallback) {
    const fallback = await monid(platform, handle)
    if (fallback.length) return { posts: fallback, source: 'monid' }
  }
  throw createError({ statusCode: 502, statusMessage: `${platform}: no posts returned (blocked, private or empty profile)` })
}

export const postSignals = (posts) => {
  const dates = posts.map(p => Date.parse(p.date)).filter(Number.isFinite)
  return {
    posts: posts.length,
    oldestPostDays: dates.length ? Math.floor((Date.now() - Math.min(...dates)) / DAY) : undefined
  }
}

// input: { platform, handle }. The operator then picks 3-4 of the saved images for face and genai.
export default async ({ profile, input }) => {
  const { posts, source } = await fetchPosts(input.platform, input.handle)
  const images = await saveImages(profile.id, input.platform, posts.map(p => p.url).filter(Boolean), LIMIT)
  return { status: 'ok', signals: { ...postSignals(posts), images: images.length, source }, images }
}
