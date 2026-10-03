import { readFileSync } from 'node:fs'
import { createError } from 'h3'

let cache

// Private JSON file (see use-cases.example.json): which rails each use case may run, consent next step
export const getUseCase = (name) => {
  const { useCasesFile } = useRuntimeConfig().risk
  if (!useCasesFile) throw createError({ statusCode: 500, statusMessage: 'NUXT_RISK_USE_CASES_FILE not set' })
  cache ??= JSON.parse(readFileSync(useCasesFile, 'utf8'))
  const useCase = cache[name]
  if (!useCase) throw createError({ statusCode: 400, statusMessage: `Unknown use case: ${name}` })
  return useCase
}
