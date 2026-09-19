import { defineNuxtModule, createResolver, addComponentsDir, addImportsDir, addServerHandler, addTemplate } from '@nuxt/kit'
import { pageDefs } from './definitions/pages.js'
import { endpointDefs } from './definitions/endpoints.js'
import { middlewareDefs } from './definitions/middlewares.js'

export default defineNuxtModule({
  meta: {
    name: '@ara-peaha-ai/booking',
    configKey: 'paguaituBookingFlow'
  },
  defaults: {
    enabled: true,
    routeBase: '/flows/booking'
  },
  setup(options, nuxt) {
    if (options.enabled === false) return

    const resolver = createResolver(import.meta.url)
    const base = String(options.routeBase).replace(/\/+$/, '')

    addTemplate({
      filename: 'booking-ui.css',
      write: true,
      getContents: () => `@source "${resolver.resolve('./runtime')}";`
    })

    addComponentsDir({
      path: resolver.resolve('./runtime/components'),
      pathPrefix: false
    })

    addImportsDir(resolver.resolve('./runtime/composables'))

    nuxt.hook('pages:extend', (pages) => {
      for (const pg of pageDefs) {
        const rel = String(pg.route ?? '').replace(/^\/+/, '').replace(/\/+$/, '')
        pages.push({
          name: pg.name,
          path: rel ? `${base}/${rel}` : base,
          file: resolver.resolve(`./runtime/pages/${pg.file}`)
        })
      }
    })

    for (const mw of middlewareDefs) {
      addServerHandler({
        middleware: true,
        route: '/',
        handler: resolver.resolve(`./runtime/middleware/${mw.file}`)
      })
    }

    const seen = new Set()
    const specific = endpointDefs.filter(e => String(e.method).toUpperCase() !== 'ALL')
    const catchAll = endpointDefs.filter(e => String(e.method).toUpperCase() === 'ALL')

    for (const ep of [...specific, ...catchAll]) {
      const method = String(ep.method).toUpperCase()
      const rel = String(ep.route ?? '').replace(/^\/+/, '').replace(/\/+$/, '')
      const route = rel ? `${base}/${rel}` : base
      const key = `${method} ${route}`

      if (seen.has(key)) throw new Error(`[@ara-peaha-ai/booking] Duplicate endpoint: ${key}`)
      seen.add(key)

      addServerHandler({
        method: method !== 'ALL' ? method : undefined,
        route,
        handler: resolver.resolve(`./runtime/handlers/${ep.file}`)
      })
    }
  }
})
