import assert from 'node:assert/strict'
import { computeTotal } from '../runtime/lib/pricing.js'

assert.equal(computeTotal([]), 120)
assert.equal(computeTotal(['priority']), 132)
assert.equal(computeTotal(['summary']), 126)
assert.equal(computeTotal(['recording']), 138)
assert.equal(computeTotal(['priority', 'summary', 'recording']), 156)
assert.equal(computeTotal(['bogus']), 120)
console.log('pricing ok')
