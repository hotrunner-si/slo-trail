<script setup lang="ts">
const { admin } = await useBrainSession()
if (!admin.value) throw createError({ statusCode: 403, statusMessage: 'Potrebuješ skrbniški dostop.' })
if (import.meta.server) useResponseHeader('Cache-Control').value = 'private, no-store'
const request = useRequestFetch()
const { data: article, error } = await useAsyncData('journal-current-draft', () => request('/api/journal/draft'))
if (error.value || !article.value) throw createError({ statusCode: error.value?.statusCode || 404, statusMessage: 'Predogled ni na voljo.' })
useSiteSeo(() => article.value?.title, () => article.value?.description, { noindex: true })
</script>

<template>
  <JournalAnalysisStory v-if="article" :article="article" preview />
</template>
