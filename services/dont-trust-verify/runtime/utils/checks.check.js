import assert from 'node:assert/strict'
import { parseAgeFromText, euclideanDistance, generateCode, codeInText, CODE_ALPHABET } from './checks.js'

const today = { y: 2026, m: 9, d: 18 }

// Turns 18 tomorrow: still 17 (subtracting years alone would say 18)
assert.equal(parseAgeFromText('NAC 19/09/2008 EXP 01/01/2030', today).age, 17)
assert.equal(parseAgeFromText('NAC 18-09-2008', today).age, 18)
assert.equal(parseAgeFromText('31.12.1990', today).age, 35)
assert.equal(parseAgeFromText('29/02/2001', today), null) // not a leap year
assert.equal(parseAgeFromText('12/31/1990', today), null) // month 31
assert.equal(parseAgeFromText('no dates', today), null)
assert.deepEqual(parseAgeFromText('18/09/2008', today).birth, { y: 2008, m: 9, d: 18 })

// Timezone independence: run under `TZ=Pacific/Kiritimati` and `TZ=Pacific/Pago_Pago` (see package.json)
const code = generateCode()
assert.equal(code.length, 6)
assert.ok([...code].every(c => CODE_ALPHABET.includes(c)))
assert.ok(codeInText(`foo ${code} bar`, code))
assert.ok(codeInText(`x ${code.slice(0, 5)}Q y`, code)) // one OCR error tolerated
assert.ok(!codeInText(`x ${code.slice(0, 4)}QQ y`, code)) // two errors rejected
assert.ok(!codeInText('  ', '')) // empty code never matches an empty token
assert.equal(euclideanDistance([0, 0], [3, 4]), 5)
console.log('checks ok')
