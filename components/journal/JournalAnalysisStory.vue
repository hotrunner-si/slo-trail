<script setup lang="ts">
import type { Article } from '~/types'
import { formatDate } from '~/utils/formatDate'
defineProps<{ article: Article; preview?: boolean }>()
const asset = useContentAsset()
</script>

<template>
  <article class="journal-analysis-story">
    <div class="story-image"><img :src="asset(article.image)" :alt="article.title" /></div>
    <header class="story-header shell">
      <p v-if="preview" class="preview-label">Uredniški predogled · članek v pripravi</p>
      <p v-else class="eyebrow">{{ article.category }} · {{ formatDate(article.publishedAt) }}</p>
      <h1>{{ article.title }}</h1>
      <p>{{ article.subtitle }}</p>
    </header>
    <div class="shell analysis-story-body">
      <ArticleTrailAnalysis v-if="article.trailAnalysis"
        hide-length-filter
        :before-chart="article.trailAnalysis.beforeChart"
        :after-chart="article.trailAnalysis.afterChart"
        :points="article.trailAnalysis.points" />
      <template v-else><p v-for="(paragraph, index) in article.body" :key="index">{{ paragraph }}</p></template>
    </div>
  </article>
</template>

<style scoped>
.preview-label { color: #97551f; background: #fff2e3; border: 1px solid #efc998; padding: 10px 16px; display: inline-block; font-size: 12px; }
.analysis-story-body { padding-bottom: 70px; }
</style>
