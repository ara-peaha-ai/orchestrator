const OPS = {
  '==': (a, b) => a === b,
  '>=': (a, b) => a >= b,
  '<=': (a, b) => a <= b,
  '>': (a, b) => a > b,
  '<': (a, b) => a < b
}

const clamp = (n) => Math.max(0, Math.min(100, n))

// rails: { [rail]: { status, signals } }, rules: [{ rail, signal, op, value, risk?, trust? }]
// A rail that did not run (skipped/error/missing) matches no rule: it never adds risk nor trust.
export const score = (rails, rules = []) => {
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
  return { risk: clamp(risk), trust: clamp(trust), hits }
}
