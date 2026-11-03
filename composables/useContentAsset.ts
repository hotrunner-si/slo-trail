import type { SiteContent } from '~/types/content'

/** Keep existing logical asset paths; all binary content is served from Storage. */
export function useContentAsset() {
  const config = useRuntimeConfig()
  const content = useState<SiteContent | null>('loaded-site-content', () => null)
  return (path: string): string => {
    if (!path.startsWith('/images/') && !path.startsWith('/gpx/') && path !== '/favicon.svg')
      return path
    const assets = content.value?.siteContent.assets
    if (!assets?.ready) return path
    const encoded = path.slice(1).split('/').map(encodeURIComponent).join('/')
    return `${config.public.supabaseUrl}/storage/v1/object/public/${assets.bucket}/${encoded}`
  }
}
