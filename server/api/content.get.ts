import type { SiteContent } from '~/types/content'

export default defineCachedEventHandler(
  async (event): Promise<SiteContent> => {
    const config = useRuntimeConfig(event)
    const { supabaseUrl, supabasePublishableKey } = config.public
    if (!supabaseUrl || !supabasePublishableKey) {
      throw createError({
        statusCode: 503,
        statusMessage: 'Povezava z vsebinsko bazo ni nastavljena.',
      })
    }
    try {
      const content = await $fetch<SiteContent>(`${supabaseUrl}/rest/v1/rpc/get_site_content`, {
        method: 'POST',
        body: {},
        timeout: 15_000,
        retry: 1,
        headers: { apikey: supabasePublishableKey },
      })
      if (
        !content.siteContent?.site ||
        !Array.isArray(content.races) ||
        !Array.isArray(content.runners) ||
        !Array.isArray(content.articles)
      )
        throw new Error('Incomplete content response')
      return content
    } catch {
      throw createError({
        statusCode: 503,
        statusMessage: 'Vsebine trenutno ni mogoče naložiti. Poskusi znova.',
      })
    }
  },
  { maxAge: 30, swr: false, name: 'supabase-site-content' },
)
