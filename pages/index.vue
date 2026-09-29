<script setup lang="ts">
import { races } from '~/data/races'
import { runners } from '~/data/runners'
import { trailRoutes } from '~/data/routes'
import { articles } from '~/data/articles'
import { formatDate, parseIsoDate, todayIsoDate } from '~/utils/formatDate'
useSiteSeo(
  undefined,
  'Trail Slovenija: slovenske trail in gorskotekaške tekme, tekači, GPX ture in zgodbe s poti.',
  { image: '/images/kv01.jpg', imageAlt: 'Trail tek v slovenskih gorah' },
)
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
const upcomingRaces = computed(() => {
  const today = todayIsoDate()
  const future = races
    .filter(
      (race) =>
        race.date &&
        parseIsoDate(race.date) &&
        race.date >= today,
    )
    .sort((a, b) => a.date.localeCompare(b.date))
  const months = [...new Set(future.map((race) => race.date.slice(0, 7)))].slice(0, 2)
  return future.filter((race) => months.includes(race.date.slice(0, 7)))
})
</script>

<template>
  <div>
    <section class="hero shell">
      <div class="hero-copy">
        <h1>Trail tek<br /><span>Slovenija.</span></h1>
        <nav class="hero-lead" aria-label="Razišči Trail Slovenija">
          <NuxtLink to="/runners">Tekači.</NuxtLink>
          <NuxtLink to="/races">Tekme.</NuxtLink>
          <NuxtLink to="/routes">Ture.</NuxtLink>
          <NuxtLink :to="{ path: '/journal', query: { category: 'Rezultati' } }">Rezultati.</NuxtLink>
          <NuxtLink :to="{ path: '/journal', query: { category: 'Vse' } }">Zgodbe.</NuxtLink>
        </nav>
        <p class="hero-text">
          Prostor za spremljanje slovenskega trail teka — pregled tekem, doživetja tekačev, UTMB lestvice, GPX datoteke.
        </p>
        <div class="button-row">
          <NuxtLink to="/races" class="button primary">Poglej tekme <span>↗</span></NuxtLink
          ><NuxtLink to="/runners" class="button secondary">Poišči tekača <span>↗</span></NuxtLink>
        </div>
      </div>
      <div class="hero-visual">
        <img
          src="/images/verbier03.jpg"
          alt="Gorska pokrajina kot vizual slovenskega trail portala"
        />
        <div class="hero-photo-note">
          <span>Fotografija tedna</span><strong>Alpska linija</strong>
        </div>
      </div>
    </section>

    <section class="section shell">
      <SectionHead
        eyebrow="Koledar"
        title="Naslednje tekme"
        link-label="Celoten seznam"
        to="/races"
      /><RaceList :races="upcomingRaces.slice(0, 5)" show-profile />
    </section>

    <section v-if="latestArticle" class="section shell home-feature-article">
      <div>
        <p class="eyebrow">Članek · {{ latestArticle.category }}</p>
        <h2>{{ latestArticle.title }}</h2>
        <p>{{ latestArticle.subtitle }}</p>
        <NuxtLink :to="`/journal/${latestArticle.slug}`" class="button primary"
          >Preberi objavo ↗</NuxtLink
        >
      </div>
      <img :src="latestArticle.image" :alt="latestArticle.title" loading="lazy" />
    </section>

    <section class="section ink-section">
      <div class="shell">
        <SectionHead
          eyebrow="Rezultati zadnjega vikenda"
          title="Časi in uvrstitve"
          link-label="Vsi rezultati"
          to="/journal"
        /><NuxtLink
          v-if="latestResults"
          :to="`/journal/${latestResults.slug}`"
          class="home-results-card"
          ><span class="mono">{{
            formatDate(latestResults.publishedAt)
          }}</span>
          <div>
            <h3>{{ latestResults.title }}</h3>
            <p>{{ latestResults.description }}</p>
          </div>
          <em>↗</em></NuxtLink
        >
        <p v-else class="home-results-empty">Pregled rezultatov bo objavljen tukaj.</p>
      </div>
    </section>

    <section class="section shell">
      <SectionHead
        eyebrow="Ljudje na poteh"
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

    <section class="section route-week">
      <div class="shell route-week-grid">
        <div class="route-photo">
          <img src="/images/kv01.jpg" alt="Trail tekač na gorski turi" loading="lazy" /><RouteVisual
            :variant="3"
            dark
          />
        </div>
        <div class="route-week-copy">
          <p class="eyebrow">Tura tedna · kurirano</p>
          <h2>{{ trailRoutes[0].name }}</h2>
          <p>{{ trailRoutes[0].description }}</p>
          <StatStrip
            :items="[
              { value: `${trailRoutes[0].distance.toLocaleString('sl-SI')} KM`, label: 'Razdalja' },
              {
                value: `${trailRoutes[0].elevationGain.toLocaleString('sl-SI')} M+`,
                label: 'Vzpon',
              },
              { value: trailRoutes[0].difficulty.toUpperCase(), label: 'Težavnost' },
            ]"
          /><ElevationProfile /><NuxtLink
            :to="`/routes/${trailRoutes[0].slug}`"
            class="button primary"
            >Razišči turo ↗</NuxtLink
          >
        </div>
      </div>
    </section>

    <section id="newsletter" class="section shell newsletter">
      <div>
        <p class="eyebrow">Tedensko</p>
        <h2>Trail Novice</h2>
        <p class="newsletter-lead">Novice in zgodbe slovenskega traila.</p>
      </div>
      <div>
        <ul>
          <li>rezultati prejšnjega tedna</li>
          <li>prihajajoče tekme</li>
          <li>trase in tekači</li>
        </ul>
        <a
          class="button primary"
          href="https://forms.gle/WAtJ6zRW8ZCnLQNk8"
          target="_blank"
          rel="noopener noreferrer"
          >Prijavi se preko obrazca ↗</a
        >
      </div>
    </section>
  </div>
</template>
