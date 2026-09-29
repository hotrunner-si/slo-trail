if (process.env.NETLIFY === 'true') {
  const mapboxToken = process.env.NUXT_PUBLIC_MAPBOX_TOKEN || ''
  console.info('[Mapbox build configuration]', {
    context: process.env.CONTEXT || 'unknown',
    tokenPresent: Boolean(mapboxToken),
    publicTokenFormat: mapboxToken.startsWith('pk.'),
    customStylePresent: Boolean(process.env.NUXT_PUBLIC_MAPBOX_STYLE),
  })
  if (!mapboxToken) {
    throw new Error(
      'NUXT_PUBLIC_MAPBOX_TOKEN is missing in this Netlify build context. Set it for this project and deploy context, then rebuild.',
    )
  }
}

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],
  components: [{ path: '~/components', pathPrefix: false }],
  runtimeConfig: {
    public: {
      mapboxToken: process.env.NUXT_PUBLIC_MAPBOX_TOKEN || '',
      mapboxStyle:
        process.env.NUXT_PUBLIC_MAPBOX_STYLE ||
        'mapbox://styles/geo-mont/cmubd65wo00cp01qsa01fdsfn',
    },
  },
  modules: ['@nuxtjs/sitemap'],
  sitemap: {
    exclude: [
      '/journal',
      '/journal/**',
      '/routes/velika-planina-loop',
      '/routes/stol-grebenska-linija',
      '/routes/nanos-krozna',
      '/routes/pohorje-tiha-pot',
      '/routes/tolminski-grebeni',
      '/routes/slivnica-jutranji-krog',
    ],
  },
  site: { url: 'https://trail-slovenija.netlify.app', name: 'Trail Slovenija' },
  app: {
    head: {
      htmlAttrs: { lang: 'sl' },
      meta: [{ name: 'theme-color', content: '#f7f5ef' }],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },
  // Render URL-dependent controls on the server, including the first page load.
  routeRules: {
    '/races': { prerender: false },
    '/routes': { prerender: false },
    '/journal': { prerender: false },
  },
  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ['/races', '/runners', '/routes', '/journal'],
    },
  },
})
