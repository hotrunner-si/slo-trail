<script setup lang="ts">
import { formatDate, parseIsoDate, todayIsoDate } from '~/utils/formatDate'
const { races, runners, articles, getWeeklyRunnerTour, siteContent } = await useSiteContent()
const asset = useContentAsset()
useSiteSeo(undefined, siteContent.site.homeDescription, {
  image: '/images/kv01.jpg',
  imageAlt: 'Trail tek v slovenskih gorah',
})
useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Trail Slovenija',
        url: 'https://trail-slovenija.netlify.app/',
        inLanguage: 'sl-SI',
        description: 'Slovenske trail in gorskotekaške tekme, tekači, GPX ture in zgodbe s poti.',
      }),
    },
  ],
})
const latestArticle = computed(
  () => [...articles].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))[0],
)
const latestResults = computed(
  () =>
    [...articles]
      .filter((article) => article.category === 'Rezultati')
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))[0],
)
const latestResultLists = computed(() =>
  (latestResults.value?.results ?? []).map((result) => ({
    ...result,
    rows: result.rows.slice(0, 3),
  })),
)
const featuredTourDate = useState('home-featured-tour-date', () => todayIsoDate())
// Keep the weekly tour available for a future return to the homepage.
const showWeeklyTour = false
const featuredTour = computed(() => getWeeklyRunnerTour(featuredTourDate.value))
let featuredTourTimer: number | undefined

onMounted(() => {
  featuredTourDate.value = todayIsoDate()
  featuredTourTimer = window.setInterval(() => {
    featuredTourDate.value = todayIsoDate()
  }, 60_000)
})
onUnmounted(() => window.clearInterval(featuredTourTimer))
const upcomingRaces = computed(() => {
  const today = todayIsoDate()
  const future = races
    .filter((race) => race.date && parseIsoDate(race.date) && race.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
  const months = [...new Set(future.map((race) => race.date.slice(0, 7)))].slice(0, 2)
  return future.filter((race) => months.includes(race.date.slice(0, 7)))
})
</script>

<template>
  <div class="home-page">
    <section class="hero shell">
      <div class="hero-copy">
        <h1>
          {{ siteContent.home.title[0] }}<br /><span>{{ siteContent.home.title[1] }}</span>
        </h1>
        <nav class="hero-lead" aria-label="Razišči Trail Slovenija">
          <NuxtLink to="/runners">Tekači.</NuxtLink>
          <NuxtLink to="/races">Tekme.</NuxtLink>
          <NuxtLink to="/runners/routes">Ture.</NuxtLink>
          <NuxtLink :to="{ path: '/journal', query: { category: 'Rezultati' } }"
            >Rezultati.</NuxtLink
          >
          <NuxtLink :to="{ path: '/journal', query: { category: 'Vse' } }">Zgodbe.</NuxtLink>
        </nav>
        <p class="hero-text">
          {{ siteContent.home.intro }}
        </p>
        <div class="button-row">
          <NuxtLink to="/races" class="button primary"
            >Poglej tekme <span><IconArrowUpRight /></span></NuxtLink
          ><NuxtLink to="/runners" class="button secondary"
            >Poišči tekača <span><IconArrowUpRight /></span
          ></NuxtLink>
        </div>
      </div>
      <div class="hero-visual">
        <img :src="asset(siteContent.home.heroImage)" :alt="siteContent.home.heroAlt" />
        <span class="hero-photo-note">Trail Verbier St-Bernard</span>
      </div>
    </section>

    <section class="section shell home-upcoming-races">
      <SectionHead
        eyebrow="Koledar"
        title="Naslednje tekme"
        link-label="Celoten seznam"
        to="/races"
      /><RaceList :races="upcomingRaces.slice(0, 5)" show-profile />
    </section>

    <section v-if="latestArticle" class="section shell home-feature-article">
      <div>
        <p class="eyebrow">Članek</p>
        <h2>{{ latestArticle.title }}</h2>
        <p>{{ latestArticle.subtitle }}</p>
        <NuxtLink :to="`/journal/${latestArticle.slug}`" class="button primary"
          >Preberi objavo <IconArrowUpRight
        /></NuxtLink>
      </div>
      <img :src="asset(latestArticle.image)" :alt="latestArticle.title" loading="lazy" />
    </section>

    <section class="section ink-section">
      <div class="shell">
        <SectionHead
          eyebrow="Zadnji rezultati"
          title="Časi in uvrstitve"
          link-label="Vsi rezultati"
          to="/journal?category=Rezultati"
        />
        <div v-if="latestResults" class="home-results-card">
          <span class="mono">{{ formatDate(latestResults.publishedAt) }}</span>
          <div class="home-results-content">
            <NuxtLink :to="`/journal/${latestResults.slug}`" class="home-results-article">
              <h3>{{ latestResults.title }}</h3>
              <p>{{ latestResults.description }}</p>
              <span class="home-results-read">Preberi članek <IconArrowUpRight /></span>
            </NuxtLink>
            <div class="home-results-lists">
              <section
                v-for="result in latestResultLists"
                :key="result.heading"
                class="home-result-list"
              >
                <h4>{{ result.heading }}</h4>
                <ol>
                  <li v-for="row in result.rows" :key="row.place">
                    <span class="home-result-place">{{ row.place }}.</span>
                    <span>{{ row.name }}</span>
                    <span class="mono">{{ row.time }}</span>
                  </li>
                </ol>
              </section>
            </div>
          </div>
          <NuxtLink
            :to="`/journal/${latestResults.slug}`"
            class="home-results-arrow"
            :aria-label="`Odpri članek: ${latestResults.title}`"
          >
            <IconArrowUpRight />
          </NuxtLink>
        </div>
        <p v-else class="home-results-empty">Pregled rezultatov bo objavljen tukaj.</p>
      </div>
    </section>

    <section class="section shell">
      <SectionHead
        eyebrow="Ljudje"
        title="Slovenski trail tekači"
        link-label="Vsi tekači"
        to="/runners"
      />
      <div class="runner-grid">
        <RunnerCard
          v-for="(runner, index) in runners"
          :key="runner.id"
          :runner="runner"
          :index="index"
        />
      </div>
    </section>

    <section v-if="showWeeklyTour && featuredTour" class="section route-week">
      <div class="shell route-week-grid">
        <div class="route-photo">
          <img
            :src="
              asset(
                featuredTour.portraitMapImage ||
                  `/images/tour-maps/${featuredTour.runnerSlug}-${featuredTour.id}-portrait.png`,
              )
            "
            :alt="`Zemljevid trase ${featuredTour.title}`"
            loading="lazy"
          />
          <div class="route-photo-caption">
            <span class="eyebrow"
              >{{ formatDate(featuredTour.dateIso) }} · {{ featuredTour.location }}</span
            >
            <strong>{{ featuredTour.runnerName }}</strong>
          </div>
        </div>
        <div class="route-week-copy">
          <p class="eyebrow">Tura tedna · tekačeva GPX pot</p>
          <h2>{{ featuredTour.title }}</h2>
          <p>{{ featuredTour.description }}</p>
          <StatStrip
            :items="[
              { value: `${featuredTour.distanceKm.toLocaleString('sl-SI')} KM`, label: 'Razdalja' },
              {
                value:
                  featuredTour.elevationGain == null
                    ? 'Ni podatka'
                    : `${featuredTour.elevationGain.toLocaleString('sl-SI')} M+`,
                label: 'Vzpon',
              },
              {
                value: `${featuredTour.preview.highestPoint?.toLocaleString('sl-SI') ?? '—'} M`,
                label: 'Najvišja točka',
              },
            ]"
          /><GpxMiniProfile
            class="route-week-profile"
            :profile="featuredTour.preview.profile"
            :label="`Višinski profil ture ${featuredTour.title}`"
          /><NuxtLink
            :to="{
              path: `/runners/${featuredTour.runnerSlug}`,
              query: { gpx: featuredTour.id },
              hash: `#runner-gpx-toggle-${featuredTour.id}`,
            }"
            class="button primary"
            >Poglej turo <IconArrowUpRight
          /></NuxtLink>
        </div>
      </div>
    </section>

    <section id="newsletter" class="section shell newsletter">
      <div>
        <p class="eyebrow">Tedensko</p>
        <h2>{{ siteContent.home.newsletterTitle }}</h2>
        <p class="newsletter-lead">{{ siteContent.home.newsletterDescription }}</p>
      </div>
      <div>
        <ul>
          <li v-for="topic in siteContent.home.newsletterTopics" :key="topic">{{ topic }}</li>
        </ul>
        <a
          class="button primary"
          :href="siteContent.home.newsletterUrl"
          target="_blank"
          rel="noopener noreferrer"
          >Prijavi se preko obrazca <IconArrowUpRight
        /></a>
      </div>
    </section>
  </div>
</template>
