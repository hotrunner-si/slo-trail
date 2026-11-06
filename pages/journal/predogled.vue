<script setup lang="ts">
const { admin } = await useBrainSession()
if (!admin.value) throw createError({ statusCode: 403, statusMessage: 'Potrebuješ skrbniški dostop.' })
if (import.meta.server) useResponseHeader('Cache-Control').value = 'private, no-store'
const request = useRequestFetch()
const { data: article, error } = await useAsyncData('journal-current-draft', () => request('/api/journal/draft'))
if (error.value || !article.value) throw createError({ statusCode: error.value?.statusCode || 404, statusMessage: 'Predogled ni na voljo.' })
const asset = useContentAsset()
useSiteSeo(() => article.value?.title, () => article.value?.description, { noindex: true })
</script>

<template>
  <article v-if="article" class="journal-preview">
    <div class="story-image"><img :src="asset(article.image)" :alt="article.title" /></div>
    <header class="story-header shell">
      <p class="preview-label">Uredniški predogled · članek v pripravi</p>
      <h1>{{ article.title }}</h1>
      <p>{{ article.subtitle }}</p>
    </header>
    <div class="shell preview-body">
      <ArticleTrailAnalysis v-if="article.trailAnalysis"
        hide-length-filter
        :before-chart="article.trailAnalysis.beforeChart"
        :after-chart="article.trailAnalysis.afterChart"
        :points="article.trailAnalysis.points" />
      <template v-else><p v-for="(paragraph, index) in article.body" :key="index">{{ paragraph }}</p></template>
    </div>
  </article>
</template>

<style src="~/assets/css/winner-speed-charts.css"></style>

<style scoped>
.preview-label { color: #97551f; background: #fff2e3; border: 1px solid #efc998; padding: 10px 16px; display: inline-block; font-size: 12px; }
.preview-body { padding-bottom: 70px; }
.journal-preview :deep(h2.runner-section-heading) { font-size: clamp(30px, 3.5vw, 40px); margin-top: 64px; line-height: 1.25; }
.journal-preview :deep(.profiles-distance) { grid-template-columns: 1fr; }
.journal-preview :deep(.profile-chart) { overflow-x: auto; }
.journal-preview :deep(.profile-chart svg) { display: block; min-width: 720px; }
.journal-preview :deep(.profile-scale-note) { font-size: 13px; color: #63735b; }
</style>
