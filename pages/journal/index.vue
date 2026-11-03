<script setup lang="ts">
const { articles, siteContent } = await useSiteContent()
useSiteSeo('Članki', siteContent.journal.description, { noindex: true })
const categories = siteContent.journal.categories
const active = ref('Vse')
useUrlControls({ category: { value: active, options: categories } })
const visible = computed(() =>
  [...articles]
    .filter((article) => active.value === 'Vse' || article.category === active.value)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)),
)
</script>
<template>
  <div class="page shell">
    <header class="page-header journal-head">
      <p class="eyebrow">Članki</p>
      <h1>{{ siteContent.journal.title[0] }} <br />{{ siteContent.journal.title[1] }}</h1>
      <p>
        {{ siteContent.journal.intro }}
      </p>
    </header>
    <div class="category-nav" aria-label="Kategorije člankov">
      <button
        v-for="category in categories"
        :key="category"
        :class="{ active: active === category }"
        @click="active = category"
      >
        {{ category }}
      </button>
    </div>
    <div class="article-grid journal-grid">
      <ArticleCard
        v-for="(article, index) in visible"
        :key="article.id"
        :article="article"
        :featured="index === 0 && active === 'Vse'"
      />
    </div>
    <p v-if="!visible.length" class="empty-state">V tej kategoriji še ni člankov.</p>
  </div>
</template>
