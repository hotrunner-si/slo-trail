<script setup lang="ts">
import { getArticle } from '~/data/articles'
import { getRace } from '~/data/races'
import { getRunner } from '~/data/runners'
import { getTrailRoute } from '~/data/routes'
import { formatDate } from '~/utils/formatDate'
const pageRoute = useRoute()
const article = computed(() => getArticle(pageRoute.params.slug as string))
if (!article.value) throw createError({ statusCode: 404, statusMessage: 'Članek ni najden' })
useSiteSeo(
  () => article.value?.title,
  () => article.value?.description,
  {
    type: 'article',
    image: () => article.value?.image,
    imageAlt: () => article.value?.title,
    publishedAt: () => article.value?.publishedAt,
    noindex: true,
  },
)
const related = computed(() => {
  if (!article.value) return []
  const list = []
  if (article.value.relatedRace) {
    const v = getRace(article.value.relatedRace)
    if (v) list.push({ label: 'Povezana tekma', name: v.name, to: `/races/${v.slug}` })
  }
  if (article.value.relatedRunner) {
    const v = getRunner(article.value.relatedRunner)
    if (v) list.push({ label: 'Povezan tekač', name: v.name, to: `/runners/${v.slug}` })
  }
  if (article.value.relatedRoute) {
    const v = getTrailRoute(article.value.relatedRoute)
    if (v) list.push({ label: 'Povezana trasa', name: v.name, to: `/routes/${v.slug}` })
  }
  return list
})
</script>
<template>
  <article v-if="article" class="story-page">
    <header class="story-header shell">
      <p class="eyebrow">{{ article.category }} · {{ formatDate(article.publishedAt) }}</p>
      <h1>{{ article.title }}</h1>
      <p>{{ article.subtitle }}</p>
    </header>
    <div class="story-image"><img :src="article.image" :alt="article.title" /></div>
    <div
      class="story-layout shell"
      :class="{ 'story-layout-with-media': article.sideImages?.length }"
    >
      <aside
        v-if="article.sideImages?.length"
        class="story-media-column"
        aria-label="Fotografije s tekme"
      >
        <figure v-for="photo in article.sideImages" :key="photo.src">
          <img :src="photo.src" :alt="photo.alt" loading="lazy" />
          <figcaption>
            <a :href="photo.sourceUrl" target="_blank" rel="noopener noreferrer">{{
              photo.caption
            }}</a>
          </figcaption>
        </figure>
      </aside>
      <div class="story-body">
        <p v-for="paragraph in article.body" :key="paragraph">{{ paragraph }}</p>
        <aside v-if="article.editorialNote" class="article-editorial-note">
          <strong>Uredniška opomba</strong>
          <p>{{ article.editorialNote }}</p>
        </aside>
        <section v-for="result in article.results" :key="result.heading" class="article-results">
          <h2>{{ result.heading }}</h2>
          <div class="article-results-scroll">
            <table>
              <thead>
                <tr>
                  <th>Mesto</th>
                  <th>{{ result.participantLabel }}</th>
                  <th class="article-result-time">Čas</th>
                  <th v-if="result.showUtmbScore" class="article-result-score">UTMB score</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in result.rows" :key="`${result.heading}-${row.place}`">
                  <td>{{ row.place }}.</td>
                  <td>{{ row.name }}</td>
                  <td class="article-result-time">{{ row.time }}</td>
                  <td v-if="result.showUtmbScore" class="article-result-score">
                    {{ row.utmbScore ?? '—' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
        <section v-if="article.quotes?.length" class="article-quotes">
          <h2>Izjave tekačev</h2>
          <blockquote v-for="quote in article.quotes" :key="quote.attribution">
            <p style="white-space: pre-line">»{{ quote.text }}«</p>
            <cite>
              <NuxtLink v-if="quote.runnerSlug" :to="`/runners/${quote.runnerSlug}`">
                {{ quote.attribution }}
              </NuxtLink>
              <template v-else>{{ quote.attribution }}</template>
            </cite>
          </blockquote>
        </section>
        <section v-if="article.sources?.length" class="article-sources">
          <h2>Viri</h2>
          <ul>
            <li v-for="source in article.sources" :key="source.url">
              <a :href="source.url" target="_blank" rel="noopener noreferrer">
                {{ source.label }} <IconArrowUpRight />
              </a>
            </li>
          </ul>
        </section>
        <a
          v-if="article.relatedRunner === 'nejc-ursic'"
          href="https://utmb.world/runner/2586047.nejc.ursic"
          target="_blank"
          rel="noopener noreferrer"
          >UTMB profil Nejca Uršiča <IconArrowUpRight
        /></a>
      </div>
    </div>
    <section v-if="related.length" class="related-entities shell">
      <p class="eyebrow">Povezano</p>
      <NuxtLink v-for="item in related" :key="item.to" :to="item.to"
        ><span>{{ item.label }}</span
        ><strong>{{ item.name }}</strong
        ><em><IconArrowUpRight /></em
      ></NuxtLink>
    </section>
  </article>
</template>
