<script setup lang="ts">
const { siteContent } = await useSiteContent()
const asset = useContentAsset()
const pageRoute = useRoute()
useHead({ link: [{ rel: 'icon', type: 'image/svg+xml', href: asset('/favicon.svg') }] })
updateAppConfig({
  site: {
    name: siteContent.site.name,
    shortName: siteContent.site.shortName,
    description: siteContent.site.description,
  },
})
</script>

<template>
  <div>
    <AppHeader />
    <main><NuxtPage /></main>
    <AppFooter v-if="pageRoute.path !== '/mozgan' && !pageRoute.path.startsWith('/mozgan/')" />
  </div>
</template>
