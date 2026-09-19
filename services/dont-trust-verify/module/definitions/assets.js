import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

const require = createRequire(import.meta.url)
const pkgDir = (name) => dirname(require.resolve(`${name}/package.json`))

// Self-hosted so the whole flow works offline (no CDN fetches by tesseract.js or face-api)
export const assetDefs = (prefix) => [
  { dir: join(pkgDir('@vladmandic/face-api'), 'model'), baseURL: `${prefix}/assets/face` },
  { dir: join(pkgDir('tesseract.js'), 'dist'), baseURL: `${prefix}/assets/tesseract` },
  { dir: pkgDir('tesseract.js-core'), baseURL: `${prefix}/assets/tesseract-core` },
  { dir: join(pkgDir('@tesseract.js-data/eng'), '4.0.0_best_int'), baseURL: `${prefix}/assets/tesseract-lang` }
]
