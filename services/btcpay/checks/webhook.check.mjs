import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { verifyBtcpaySig } from '../runtime/lib/verifyBtcpaySig.js'

const secret = 's3cret'
const rawBody = Buffer.from(JSON.stringify({ type: 'InvoiceSettled', invoiceId: 'abc' }))
const sig = `sha256=${createHmac('sha256', secret).update(rawBody).digest('hex')}`

assert.equal(verifyBtcpaySig({ rawBody, header: sig, secret }), true, 'valid signature accepted')
assert.equal(verifyBtcpaySig({ rawBody: Buffer.from(rawBody + ' '), header: sig, secret }), false, 'tampered body rejected')
assert.equal(verifyBtcpaySig({ rawBody, header: sig, secret: 'other' }), false, 'wrong secret rejected')
assert.equal(verifyBtcpaySig({ rawBody, header: undefined, secret }), false, 'missing header rejected')
assert.equal(verifyBtcpaySig({ rawBody, header: sig.slice(7), secret }), false, 'missing prefix rejected')
assert.equal(verifyBtcpaySig({ rawBody, header: 'sha256=zz', secret }), false, 'malformed rejected')
assert.equal(verifyBtcpaySig({ rawBody, header: sig, secret: '' }), false, 'empty secret rejected')
console.log('webhook check ok')
