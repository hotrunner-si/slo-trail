<script setup lang="ts">
import { getRace, races } from '~/data/races'
import { articles } from '~/data/articles'
import { runners } from '~/data/runners'

const route = useRoute()
const race = computed(() => getRace(route.params.slug as string))
if (!race.value) throw createError({ statusCode: 404, statusMessage: 'Tekma ni najdena' })

useSiteSeo(
  () => race.value?.name,
  () => {
    const event = race.value
    if (!event) return undefined
    const place = event.location && event.location !== '-' ? ` v kraju ${event.location}` : ' v Sloveniji'
    const date = event.dateStatus === 'confirmed' && !Number.isNaN(Date.parse(event.date))
      ? ` Datum: ${new Date(`${event.date}T12:00:00`).toLocaleDateString('sl-SI')}.`
      : ' Datum še ni objavljen.'
    const distances = event.distances.map(distance => distance.label).join(', ')
    return `${event.name}: trail tek${place}.${date} Razdalje: ${distances}.`
  },
  { image: () => race.value?.logo || '/images/kv01.jpg', imageAlt: () => race.value ? `Trail tek ${race.value.name}` : undefined }
)
const related = computed(() => articles.filter(article => article.relatedRace === race.value?.slug))
const hasDate = computed(() => Boolean(race.value?.date && !Number.isNaN(new Date(race.value.date).getTime())))
const dateLabel = computed(() => hasDate.value && race.value?.dateStatus !== 'estimated' ? new Date(race.value!.date).toLocaleDateString('sl-SI', { day: 'numeric', month: 'long', year: 'numeric' }) : '—')
const entrants = computed(() => (race.value?.entrants || []).map(entry => ({ runner:runners.find(item=>item.slug===entry.runnerSlug), distance:race.value?.distances.find(item=>item.id===entry.distanceId) })).filter(item=>item.runner&&item.distance))
const resultsArticle = computed(() => articles.find(article => article.category === 'Rezultati' && article.relatedRace === race.value?.slug))
const raceHasPassed = computed(() => hasDate.value && new Date(`${race.value!.date}T23:59:59`) < new Date())
const showIndexes = computed(() => race.value?.distances.some(distance => distance.itra != null || distance.utmbIndexCategory != null) || false)
function startDay(startDate?: string) {
  if (!startDate) return '—'
  const date = new Date(`${startDate}T12:00:00`)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('sl-SI', { weekday: 'short', day: 'numeric', month: 'short' })
}
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

    <section class="race-entrants shell"><header><p class="eyebrow">Slovenci na startu</p><h2>Znana imena</h2></header><div v-if="entrants.length" class="race-entrant-list"><NuxtLink v-for="item in entrants" :key="`${item.runner!.slug}-${item.distance!.id}`" :to="`/runners/${item.runner!.slug}`"><img :src="item.runner!.image" :alt="item.runner!.name"><span><strong>{{ item.runner!.name }}</strong><small>{{ item.distance!.name || item.distance!.label }}</small></span></NuxtLink></div><p v-else class="race-entrants-empty">Potrjene slovenske udeležence bomo dodali ob objavi startne liste.</p></section>

    <section id="trasa" class="detail-section shell">
      <RaceCourseMap :race="race" />
    </section>

    <section class="detail-section shell race-distances-section">
      <SectionHead eyebrow="Izberi izziv" title="Razdalje" />
      <div class="race-distances-wrap">
        <table class="race-distances-table" :class="{ 'with-indexes': showIndexes }">
          <thead><tr>
            <th scope="col">Trasa</th><th scope="col">Dolžina</th><th scope="col">Vzpon</th>
            <th scope="col">Dan štarta</th><th scope="col">Ura</th>
            <th v-if="showIndexes" scope="col">ITRA</th><th v-if="showIndexes" scope="col">UTMB</th>
            <th scope="col">Višinski profil</th>
          </tr></thead>
          <tbody>
            <tr v-for="distance in race.distances" :key="distance.id || distance.label">
              <th scope="row"><strong>{{ distance.name || distance.label }}</strong></th>
              <td class="mono">{{ distance.km ? `${distance.km.toLocaleString('sl-SI')} km` : '—' }}</td>
              <td class="mono">{{ distance.elevation ? `${distance.elevation.toLocaleString('sl-SI')} m+` : '—' }}</td>
              <td>{{ startDay(distance.startDate || (race.dateStatus === 'confirmed' && !race.dateEnd ? race.date : undefined)) }}</td>
              <td class="mono">{{ distance.startTime || '—' }}</td>
              <td v-if="showIndexes" class="mono">{{ distance.itra != null ? `ITRA ${distance.itra}` : '—' }}</td>
              <td v-if="showIndexes"><span v-if="distance.utmbIndexCategory" :class="['utmb-estimate', `effort-${distance.utmbIndexCategory.toLowerCase()}`]">{{ distance.utmbIndexCategory }}</span><span v-else>—</span></td>
              <td class="distance-profile-cell"><RaceElevationMini :distance="distance" :race-id="race.id" /></td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="showIndexes" class="race-index-note">UTMB kategorije so ocena iz razdalje in višinskih metrov (KM-effort); uradna kategorija se lahko razlikuje. ITRA bo dodana po preverjanju.</p>
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

    <section class="detail-section shell race-live"><div><p class="eyebrow">Na dan tekme</p><h2>V živo</h2></div><div><p>Na enem mestu bomo zbrali uradno sledenje, prenose in vmesne čase.</p><a v-if="race.liveUrl" :href="race.liveUrl" class="button primary" target="_blank" rel="noopener noreferrer">Odpri spremljanje ↗</a><span v-else class="mono">POVEZAVA BO OBJAVLJENA PRED STARTOM</span><NuxtLink v-if="raceHasPassed && resultsArticle" :to="`/journal/${resultsArticle.slug}`" class="race-results-link">Preberi končni pregled rezultatov ↗</NuxtLink></div></section>

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
