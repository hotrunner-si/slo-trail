<script setup lang="ts">
import { getRace, races } from '~/data/races'
import { articles } from '~/data/articles'

const route = useRoute()
const race = computed(() => getRace(route.params.slug as string))
if (!race.value) throw createError({ statusCode: 404, statusMessage: 'Tekma ni najdena' })

useSiteSeo(() => race.value?.name, () => race.value?.summary)
const related = computed(() => articles.filter(article => article.relatedRace === race.value?.slug))
const hasDate = computed(() => Boolean(race.value?.date && !Number.isNaN(new Date(race.value.date).getTime())))
const dateLabel = computed(() => hasDate.value && race.value?.dateStatus !== 'estimated' ? new Date(race.value!.date).toLocaleDateString('sl-SI', { day: 'numeric', month: 'long', year: 'numeric' }) : '—')
const mainDistance = computed(() => Math.max(...(race.value?.distances.map(distance => distance.km) || [0])))
const maxElevation = computed(() => Math.max(...(race.value?.distances.map(distance => distance.elevation) || [0])))
</script>

<template>
  <div v-if="race" class="detail-page">
    <header class="race-hero shell">
      <div>
        <p class="eyebrow">{{ dateLabel }} · {{ race.location }}</p>
        <h1>{{ race.name }}</h1>
        <p>{{ race.summary }}</p>
        <a v-if="race.sourceUrl" class="button secondary" :href="race.sourceUrl" target="_blank" rel="noopener noreferrer">Uradna spletna stran ↗</a>
      </div>
      <RouteVisual :variant="1" dark :label="`Trasa ${race.name}`" />
    </header>

    <div class="shell">
      <StatStrip :items="[
        { value: mainDistance ? `${mainDistance} KM` : 'KROG', label: 'Najdaljša trasa' },
        { value: maxElevation ? `${maxElevation.toLocaleString('sl-SI')} M+` : '—', label: 'Največ vzpona' },
        { value: `${race.distances.length}`, label: race.distances.length === 1 ? 'Trasa' : 'Trase' }
      ]" />
    </div>

    <section id="trasa" class="detail-section shell">
      <SectionHead eyebrow="Vse trase na enem mestu" title="Zemljevid dogodka" />
      <RaceCourseMap :race="race" />
    </section>

    <section class="detail-section shell">
      <SectionHead eyebrow="Izberi izziv" title="Razdalje" />
      <div class="distance-grid">
        <article v-for="distance in race.distances" :key="distance.id || distance.label">
          <strong>{{ distance.name || distance.label }}</strong>
          <span class="mono">{{ distance.km ? `${distance.km} KM` : 'Dolžina ni objavljena' }}</span>
          <span class="mono">{{ distance.elevation ? `${distance.elevation.toLocaleString('sl-SI')} M+` : 'Višinci niso objavljeni' }}</span>
        </article>
      </div>
    </section>

    <section class="detail-section shell info-grid">
      <div><p class="eyebrow">Osnovne informacije</p><h2>Vir podatkov</h2></div>
      <dl>
        <div><dt>Lokacija</dt><dd>{{ race.location }}</dd></div>
        <div><dt>Datum</dt><dd>{{ dateLabel }}</dd></div>
        <div><dt>Prijave</dt><dd>{{ race.registrationStatus }}</dd></div>
        <div><dt>Vir</dt><dd><a v-if="race.sourcePage" :href="race.sourcePage" target="_blank" rel="noopener noreferrer">{{ race.sourceName || 'Trail tek Slovenija' }} ↗</a></dd></div>
        <div v-if="race.sourceUrl"><dt>Organizator</dt><dd><a :href="race.sourceUrl" target="_blank" rel="noopener noreferrer">Uradna spletna stran ↗</a></dd></div>
      </dl>
    </section>

    <section id="rezultati" class="detail-section shell">
      <SectionHead eyebrow="Arhiv" title="Pretekli rezultati" />
      <p class="placeholder-block">Rezultati bodo na tem stalnem naslovu dodani po tekmi.</p>
    </section>

    <section class="detail-section shell placeholder-grid">
      <article><p class="eyebrow">Slovenski tekači</p><h3>Na startni listi</h3><p>Profili in povezave bodo dodani ob objavi startne liste.</p></article>
      <article><p class="eyebrow">Kako spremljati</p><h3>V živo</h3><p>Na dan tekme bomo tukaj zbrali sledenje, prenose in vmesne čase.</p></article>
    </section>

    <section v-if="related.length" class="detail-section shell">
      <SectionHead eyebrow="Poglobljeno" title="Povezani članki" />
      <div class="article-grid"><ArticleCard v-for="article in related" :key="article.id" :article="article" /></div>
    </section>

    <section class="detail-section shell next-link">
      <p class="eyebrow">Naslednja tekma</p>
      <NuxtLink :to="`/races/${races[(races.findIndex(item => item.slug === race.slug) + 1) % races.length].slug}`">{{ races[(races.findIndex(item => item.slug === race.slug) + 1) % races.length].name }} ↗</NuxtLink>
    </section>
  </div>
</template>
