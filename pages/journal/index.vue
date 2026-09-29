<script setup lang="ts">
import { articles } from '~/data/articles'
useSiteSeo('Članki', 'Članki o tekmah, trasah in ljudeh slovenskega traila.', { noindex: true })
const categories = ['Vse', 'Tekme', 'Rezultati', 'Trase', 'Ljudje', 'Trening', 'Oprema']
const active = ref('Vse')
useUrlControls({ category: { value: active, options: categories } })
const visible = computed(() =>
  active.value === 'Vse' ? articles : articles.filter((a) => a.category === active.value),
)
</script>
<template>
  <div class="page shell">
    <header class="page-header journal-head">
      <p class="eyebrow">Članki</p>
      <h1>Zgodbe <br />slovenskega traila.</h1>
      <p>Preberite aktualne novice slovenskega traila, preverite rezultate naših tekačev, pripravite se na naslednjo tekmo z analizo trase in preverite, kaj načrtujejo naši tekači.</p>
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
