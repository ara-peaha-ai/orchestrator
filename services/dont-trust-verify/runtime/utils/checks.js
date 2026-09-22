// Pure helpers shared by client, server and the self-check.
// No Date objects on the birth date: a DOB is a calendar date, not an instant, so parsing it
// through Date/UTC is what shifts it by one day. Everything here is integer y/m/d.

const DATE_RE = /\b(\d{2})[/\-.](\d{2})[/\-.](\d{4})\b/g

// Unambiguous alphabet (no 0/O, 1/I/L, 8/B, 5/S, 2/Z) so a hand-written code survives OCR
export const CODE_ALPHABET = 'ACDEFGHJKMNPRTUVWXY34679'
export const CODE_LENGTH = 6

export const todayLocal = (d = new Date()) => ({ y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() })

const isRealDate = (y, m, d) => {
  const dim = [31, y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  return m >= 1 && m <= 12 && d >= 1 && d <= dim[m - 1]
}

const before = (a, b) => a.y - b.y || a.m - b.m || a.d - b.d

// Day-first (DD/MM/YYYY). The oldest valid past date on the document is assumed to be the DOB
export const parseAgeFromText = (text, today = todayLocal()) => {
  const births = [...text.matchAll(DATE_RE)]
    .map(([, d, m, y]) => ({ y: +y, m: +m, d: +d }))
    .filter(b => b.y >= 1900 && isRealDate(b.y, b.m, b.d) && before(b, today) <= 0)
    .sort(before)
  if (!births.length) return null

  const birth = births[0]
  const age = today.y - birth.y - (today.m < birth.m || (today.m === birth.m && today.d < birth.d) ? 1 : 0)
  return { birth, age }
}

export const euclideanDistance = (a, b) =>
  Math.sqrt(a.reduce((sum, v, i) => sum + (v - b[i]) ** 2, 0))

export const generateCode = () => {
  const limit = 256 - (256 % CODE_ALPHABET.length)
  let code = ''
  while (code.length < CODE_LENGTH) {
    for (const byte of crypto.getRandomValues(new Uint8Array(16))) {
      if (byte < limit && code.length < CODE_LENGTH) code += CODE_ALPHABET[byte % CODE_ALPHABET.length]
    }
  }
  return code
}

const editDistance = (a, b) => {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0]
    row[0] = i
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j]
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1))
      prev = tmp
    }
  }
  return row[b.length]
}

// OCR of a hand-held sheet is noisy: accept a token within one edit of the code
export const codeInText = (text, code) =>
  typeof code === 'string' && code.length === CODE_LENGTH &&
  text.toUpperCase().split(/[^A-Z0-9]+/).some(t => editDistance(t, code) <= 1)
