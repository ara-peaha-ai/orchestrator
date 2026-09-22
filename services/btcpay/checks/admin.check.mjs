import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { register } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'

// h3 is only installed by the host app; resolve it from the workspace store when running standalone
const h3Url = (() => {
  try { return pathToFileURL(createRequire(import.meta.url).resolve('h3')).href } catch {
    return pathToFileURL(createRequire(fileURLToPath(new URL('../../../node_modules/.pnpm/node_modules/', import.meta.url))).resolve('h3')).href
  }
})()
register(`data:text/javascript,export const resolve=(s,c,n)=>s==='h3'?{url:${JSON.stringify(h3Url)},shortCircuit:true}:n(s,c)`)
import { adminEndpointDefs } from '../module/definitions/admin.js'

let secret = ''
globalThis.useRuntimeConfig = () => ({ btcpayAdminSecret: secret })
const { requireAdmin } = await import('../runtime/lib/requireAdmin.js')
const ev = (value) => ({ node: { req: { headers: value === undefined ? {} : { 'x-btcpay-admin-secret': value } } }, headers: new Headers(value === undefined ? {} : { 'x-btcpay-admin-secret': value }) })

const denied = (value) => { try { requireAdmin(ev(value)); return false } catch (e) { return e.statusCode === 401 } }

assert.ok(denied(''), 'empty secret + empty header denied')
assert.ok(denied(undefined), 'empty secret + no header denied')
secret = 's3cret'
assert.ok(denied('wrong'), 'wrong secret denied')
assert.ok(denied(undefined), 'missing header denied')
assert.equal(denied('s3cret'), false, 'right secret allowed')

for (const d of adminEndpointDefs) {
  assert.ok(existsSync(fileURLToPath(new URL(`../runtime/handlers/${d.file}`, import.meta.url))), `missing ${d.file}`)
  assert.ok(d.route.startsWith('admin/'), `bad prefix ${d.route}`)
}
console.log(`ok: ${adminEndpointDefs.length} defs`)
