export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],
  runtimeConfig: { public: { mapboxToken: process.env.NUXT_PUBLIC_MAPBOX_TOKEN || '', mapboxStyle: process.env.NUXT_PUBLIC_MAPBOX_STYLE || 'mapbox://styles/geo-mont/cmubd65wo00cp01qsa01fdsfn' } },
  modules: ['@nuxtjs/sitemap'],
  site: { url: 'https://trail-slovenija.netlify.app', name: 'Trail Slovenija' },
  app: {
    head: {
      htmlAttrs: { lang: 'sl' },
      meta: [
        { name: 'theme-color', content: '#f7f5ef' },
        { property: 'og:type', content: 'website' }
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }]
    }
  },
  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ['/races', '/runners', '/routes', '/journal']
    }
  }
})
