const OPS = {
  '==': (a, b) => a === b,
  '>=': (a, b) => a >= b,
  '<=': (a, b) => a <= b,
  '>': (a, b) => a > b,
  '<': (a, b) => a < b
}

const clamp = (n) => Math.max(0, Math.min(100, n))

// rails: { [rail]: { status, signals } }, rules: [{ rail, signal, op, value, risk?, trust? }], required: rail names
// A rail that did not run (skipped/error/missing) matches no rule, so it is listed in `missing`:
// an unchecked PEP must not read like a clean one.
export const score = (rails, rules = [], required = []) => {
  let risk = 0
  let trust = 0
  const hits = []
  for (const rule of rules) {
    const rail = rails[rule.rail]
    if (rail?.status !== 'ok') continue
    const value = rail.signals?.[rule.signal]
    if (value === undefined || !OPS[rule.op]?.(value, rule.value)) continue
    risk += rule.risk || 0
    trust += rule.trust || 0
    hits.push(rule)
  }
  const missing = required.filter(name => rails[name]?.status !== 'ok')
  return { risk: clamp(risk), trust: clamp(trust), hits, complete: !missing.length, missing }
}
