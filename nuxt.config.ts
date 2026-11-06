import process from 'node:process'
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
  vite: {
    optimizeDeps: {
      include: ['mapbox-gl'],
    },
  },
  components: [{ path: '~/components', pathPrefix: false }],
  runtimeConfig: {
    supabaseSecretKey: '',
    openaiApiKey: '',
    geminiApiKey: '',
    geminiModel: '',
    brainAiModel: '',
    brainEmbeddingModel: '',
    brainAiZeroRetention: false,
    public: {
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL || '',
      supabasePublishableKey: process.env.NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '',
      mapboxToken: process.env.NUXT_PUBLIC_MAPBOX_TOKEN || '',
      mapboxStyle:
        process.env.NUXT_PUBLIC_MAPBOX_STYLE ||
        'mapbox://styles/geo-mont/cmubd65wo00cp01qsa01fdsfn',
      runnerMapboxStyle: process.env.NUXT_PUBLIC_RUNNER_MAPBOX_STYLE || '',
    },
  },
  modules: ['@nuxtjs/sitemap'],
  sitemap: {
    sources: ['/api/sitemap/articles'],
    exclude: [
      '/journal/predogled',
      '/runners/nov',
      '/mozgan',
      '/mozgan/**',
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
    '/': { prerender: false },
    '/mozgan': { prerender: false },
    '/mozgan/**': { prerender: false },
    '/races': { prerender: false },
    '/races/**': { prerender: false },
    '/runners': { prerender: false },
    '/runners/**': { prerender: false },
    '/routes': { prerender: false },
    '/routes/**': { prerender: false },
    '/journal': { prerender: false },
    '/journal/**': { prerender: false },
  },
  nitro: {
    prerender: {
      crawlLinks: false,
    },
  },
})
