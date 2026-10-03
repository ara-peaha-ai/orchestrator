import assert from 'node:assert/strict'
import { score } from './score.js'

const rules = [
  { rail: 'ip', signal: 'vpn', op: '==', value: true, risk: 10 },
  { rail: 'face', signal: 'matches', op: '>=', value: 2, trust: 40 },
  { rail: 'genai', signal: 'max', op: '>=', value: 0.8, risk: 50 },
  { rail: 'pep', signal: 'hit', op: '==', value: true, risk: 80 }
]

const r = score({
  ip: { status: 'ok', signals: { vpn: true } },
  face: { status: 'ok', signals: { matches: 3 } },
  genai: { status: 'ok', signals: { max: 0.2 } },
  pep: { status: 'skipped' }
}, rules)
assert.equal(r.risk, 10)
assert.equal(r.trust, 40)
assert.equal(r.hits.length, 2)

// Required rails that did not run make the profile incomplete
const req = score({ ip: { status: 'ok', signals: {} }, pep: { status: 'skipped' } }, rules, ['ip', 'pep', 'face'])
assert.equal(req.complete, false)
assert.deepEqual(req.missing, ['pep', 'face'])
assert.equal(score({ ip: { status: 'ok', signals: {} } }, rules, ['ip']).complete, true)

// Missing or failed rails add nothing, scores are clamped to 0-100
assert.deepEqual(score({}, rules), { risk: 0, trust: 0, hits: [], complete: true, missing: [] })
assert.equal(score({ genai: { status: 'error', signals: { max: 1 } } }, rules).risk, 0)
assert.equal(score({
  genai: { status: 'ok', signals: { max: 0.9 } },
  pep: { status: 'ok', signals: { hit: true } }
}, rules).risk, 100)
console.log('score ok')
