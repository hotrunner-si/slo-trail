type SiteSeoOptions = {
  image?: MaybeRefOrGetter<string | undefined>
  imageAlt?: MaybeRefOrGetter<string | undefined>
  type?: 'website' | 'article' | 'profile'
  noindex?: boolean
  publishedAt?: MaybeRefOrGetter<string | undefined>
}

const siteOrigin = 'https://trail-slovenija.netlify.app'

export function useSiteSeo(
  title?: MaybeRefOrGetter<string | undefined>,
  description?: MaybeRefOrGetter<string | undefined>,
  options: SiteSeoOptions = {}
) {
  const appConfig = useAppConfig()
  const route = useRoute()
  const pageTitle = computed(() => toValue(title)?.trim() || '')
  const pageDescription = computed(() => toValue(description)?.trim() || appConfig.site.description)
  const canonical = computed(() => `${siteOrigin}${route.path === '/' ? '/' : route.path.replace(/\/+$/, '')}`)
  const image = computed(() => new URL(toValue(options.image) || '/images/kv01.jpg', siteOrigin).toString())
  const imageAlt = computed(() => toValue(options.imageAlt) || pageTitle.value || appConfig.site.name)

  useSeoMeta({
    title: () => pageTitle.value ? `${pageTitle.value} | ${appConfig.site.name}` : `${appConfig.site.name} | Slovenski trail tek`,
    description: () => pageDescription.value,
    robots: options.noindex ? 'noindex, follow' : 'index, follow',
    ogType: options.type || 'website',
    ogSiteName: appConfig.site.name,
    ogLocale: 'sl_SI',
    ogUrl: () => canonical.value,
    ogTitle: () => pageTitle.value ? `${pageTitle.value} | ${appConfig.site.name}` : appConfig.site.name,
    ogDescription: () => pageDescription.value,
    ogImage: () => image.value,
    ogImageAlt: () => imageAlt.value,
    twitterCard: 'summary_large_image',
    twitterTitle: () => pageTitle.value ? `${pageTitle.value} | ${appConfig.site.name}` : appConfig.site.name,
    twitterDescription: () => pageDescription.value,
    twitterImage: () => image.value,
    articlePublishedTime: () => toValue(options.publishedAt)
  })
  useHead({ link: [{ rel: 'canonical', href: () => canonical.value }] })
}
