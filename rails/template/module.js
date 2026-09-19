import { defineNuxtModule, addServerHandler, createResolver } from '@nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: '@ara-peaha-ai/template',
    configKey: 'paguaituTemplateRail'
  },
  defaults: {
    enabled: true,
    routeBase: '/rails/template'
  },
  setup(options, nuxt) {
    if (options.enabled === false) return

    const resolver = createResolver(import.meta.url)

    // Page at /rails/template
    nuxt.hook('pages:extend', (pages) => {
      pages.push({
        name: 'paguaitu-rail-template',
        path: options.routeBase,
        file: resolver.resolve('./runtime/pages/template.vue')
      })
    })

    // API at /api/rails/template
    addServerHandler({
      route: '/api/rails/template',
      handler: resolver.resolve('./runtime/server/api/template.get.js')
    })
  }
})
