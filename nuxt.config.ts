export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],
  runtimeConfig: { public: { mapboxToken: process.env.NUXT_PUBLIC_MAPBOX_TOKEN || '', mapboxStyle: process.env.NUXT_PUBLIC_MAPBOX_STYLE || 'mapbox://styles/geo-mont/cmubd65wo00cp01qsa01fdsfn' } },
  modules: ['@nuxtjs/sitemap'],
  sitemap: { exclude: [
    '/journal', '/journal/**',
    '/routes/velika-planina-loop', '/routes/stol-grebenska-linija',
    '/routes/nanos-krozna', '/routes/pohorje-tiha-pot',
    '/routes/tolminski-grebeni', '/routes/slivnica-jutranji-krog'
  ] },
  site: { url: 'https://trail-slovenija.netlify.app', name: 'Trail Slovenija' },
  app: {
    head: {
      htmlAttrs: { lang: 'sl' },
      meta: [
        { name: 'theme-color', content: '#f7f5ef' }
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
