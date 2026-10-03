import { defineNuxtModule, addServerHandler, createResolver } from '@nuxt/kit'
import { endpointDefs } from './definitions/endpoints.js'
import { middlewareDefs } from './definitions/middlewares.js'

const toBoolean = (v) => String(v || '').toLowerCase() === 'true'

export default defineNuxtModule({
  meta: {
    name: '@ara-peaha-ai/risk',
    configKey: 'risk'
  },

  // '' and not undefined: undefined keys are dropped from runtime config, so NUXT_RISK_* would not apply
  defaults: {
    enabled: false,
    prefix: '/api/risk',
    secret: '',
    useCasesFile: '',
    workDir: '/tmp/risk',
    cookiesFile: '',
    monidFallback: false,
    sightengineUser: '',
    sightengineSecret: '',
    dontTrustVerifyUrl: '',
    dontTrustVerifySecret: '',
    mempoolUrl: 'https://mempool.space/api'
  },

  setup(options, nuxt) {
    if (!toBoolean(options.enabled)) return

    const prefix = String(options.prefix).replace(/\/+$/, '')
    const { enabled, ...rest } = options
    nuxt.options.runtimeConfig.risk = { ...rest, prefix, monidFallback: toBoolean(options.monidFallback) }

    const resolver = createResolver(import.meta.url)

    for (const mw of middlewareDefs) {
      addServerHandler({
        middleware: true,
        route: prefix,
        handler: resolver.resolve(`../runtime/middleware/${mw.file}`)
      })
    }

    for (const ep of endpointDefs) {
      addServerHandler({
        route: `${prefix}/${ep.route}`,
        method: ep.method.toLowerCase(),
        handler: resolver.resolve(`../runtime/handlers/${ep.file}`)
      })
    }
  }
})
