import assert from 'node:assert/strict'
import { deduce } from './deduce.js'

assert.deepEqual(deduce({ cf: 'PY', db: 'PY' }), { deduction: 'consistent', vpn: false })
assert.deepEqual(deduce({ cf: 'US', db: 'PY' }), { deduction: 'proton-smart-routing', vpn: true })
assert.deepEqual(deduce({ cf: 'GB', db: 'LY' }), { deduction: 'proton-smart-routing', vpn: true })
assert.deepEqual(deduce({ cf: 'DE', db: 'PY' }), { deduction: 'vpn', vpn: true })
assert.deepEqual(deduce({ cf: 'US', db: 'DE' }), { deduction: 'vpn', vpn: true })
assert.deepEqual(deduce({ cf: 'T1', db: 'DE' }), { deduction: 'tor', vpn: true })
assert.deepEqual(deduce({ cf: undefined, db: 'PY' }), { deduction: 'no-cloudflare', vpn: false })
assert.deepEqual(deduce({ cf: 'PY', db: undefined }), { deduction: 'no-db', vpn: false })
assert.deepEqual(deduce({}), { deduction: 'unknown', vpn: false })
console.log('deduce ok')
