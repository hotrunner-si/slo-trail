export function useSiteSeo(title?: MaybeRefOrGetter<string | undefined>, description?: MaybeRefOrGetter<string | undefined>) {
  const appConfig = useAppConfig()
  const route = useRoute()
  useSeoMeta({
    title: () => toValue(title) ? `${toValue(title)} — ${appConfig.site.name}` : `${appConfig.site.name} — slovenski trail portal`,
    description: () => toValue(description) || appConfig.site.description,
    ogTitle: () => toValue(title) || appConfig.site.name,
    ogDescription: () => toValue(description) || appConfig.site.description,
    ogLocale: 'sl_SI',
    twitterCard: 'summary_large_image'
  })
  useHead({ link: [{ rel:'canonical', href: `https://trail-slovenija.netlify.app${route.path}` }] })
}
