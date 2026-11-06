<script setup lang="ts">
import type { Article } from '~/types'
import { formatDate } from '~/utils/formatDate'
const asset = useContentAsset()
defineProps<{ article: Article; featured?: boolean; draft?: boolean }>()
</script>
<template>
  <NuxtLink :to="draft ? '/journal/predogled' : `/journal/${article.slug}`" :class="['article-card', { featured, 'article-card-draft': draft }]">
    <div class="article-image">
      <img :src="asset(article.image)" :alt="article.title" loading="lazy" />
    </div>
    <div>
      <p v-if="draft" class="draft-badge">Uredniški predogled · samo za administratorja</p>
      <p class="eyebrow">{{ article.category }} · {{ formatDate(article.publishedAt) }}</p>
      <h3>{{ article.title }}</h3>
      <p>{{ article.subtitle }}</p>
      <span class="text-link">{{ draft ? 'Odpri predogled' : 'Preberi članek' }} <IconArrowUpRight /></span>
    </div>
  </NuxtLink>
</template>

<style scoped>
.article-card-draft { background: #fff2e3; border: 1px solid #efc998; padding: 18px; }
.draft-badge { color: #97551f; font-size: 11px; font-weight: 600; letter-spacing: .05em; }
</style>
