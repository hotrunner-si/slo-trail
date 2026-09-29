<script setup lang="ts">
import type { Article } from '~/types'
import { formatDate } from '~/utils/formatDate'
defineProps<{ article: Article; featured?: boolean }>()
</script>
<template>
  <NuxtLink :to="`/journal/${article.slug}`" :class="['article-card', { featured }]">
    <div class="article-image">
      <img :src="article.image" :alt="article.title" loading="lazy" />
    </div>
    <div>
      <p class="eyebrow">
        {{ article.category }} · {{ formatDate(article.publishedAt) }}
      </p>
      <h3>{{ article.title }}</h3>
      <p>{{ article.subtitle }}</p>
      <span class="text-link">Preberi članek ↗</span>
    </div>
  </NuxtLink>
</template>
