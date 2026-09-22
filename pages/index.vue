<script setup lang="ts">
import { races } from '~/data/races'; import { runners } from '~/data/runners'; import { trailRoutes } from '~/data/routes'; import { articles } from '~/data/articles'
useSiteSeo()
const email = ref(''); const message = ref('')
const latestArticle = computed(() => [...articles].sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt))[0])
const latestResults = computed(() => [...articles].filter(article=>article.category==='Rezultati').sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt))[0])
const upcomingRaces = computed(() => {
  const today=new Date();today.setHours(0,0,0,0)
  const future=races.filter(race=>race.date&&!Number.isNaN(new Date(`${race.date}T12:00:00`).getTime())&&new Date(`${race.date}T12:00:00`)>=today).sort((a,b)=>a.date.localeCompare(b.date))
  const months=[...new Set(future.map(race=>race.date.slice(0,7)))].slice(0,2)
  return future.filter(race=>months.includes(race.date.slice(0,7)))
})
function subscribe() { message.value = 'Newsletter prijave bodo kmalu na voljo.'; email.value = '' }
</script>

<template>
  <div>
    <section class="hero shell">
      <div class="hero-copy"><p class="eyebrow">Slovenski trail · sezona 2026</p><h1>Trail tek<br><span>v Sloveniji.</span></h1><p class="hero-lead">Tekme. Ture. Tekači. Rezultati. Zgodbe.</p><p class="hero-text">Prostor za spremljanje slovenskega trail teka — od startne črte do zadnjega vzpona.</p><div class="button-row"><NuxtLink to="/races" class="button primary">Poglej tekme <span>↗</span></NuxtLink><NuxtLink to="/routes" class="button secondary">Razišči ture</NuxtLink></div></div>
      <div class="hero-visual"><img src="/images/verbier03.jpg" alt="Gorska pokrajina kot vizual slovenskega trail portala"><div class="hero-photo-note"><span>Fotografija tedna</span><strong>Alpska linija</strong></div></div>
    </section>

    <section class="section shell"><SectionHead eyebrow="Koledar" title="Naslednje tekme" link-label="Celoten seznam" to="/races"/><RaceList :races="upcomingRaces.slice(0,5)" show-profile /></section>

    <section v-if="latestArticle" class="section shell home-feature-article"><div><p class="eyebrow">Zadnja tedenska objava · {{ latestArticle.category }}</p><h2>{{ latestArticle.title }}</h2><p>{{ latestArticle.description }}</p><NuxtLink :to="`/journal/${latestArticle.slug}`" class="button primary">Preberi objavo ↗</NuxtLink></div><img :src="latestArticle.image" :alt="latestArticle.title" loading="lazy"></section>

    <section class="section ink-section"><div class="shell"><SectionHead eyebrow="Rezultati zadnjega vikenda" title="Preverjeno na enem mestu" link-label="Vsi rezultati" to="/journal"/><NuxtLink v-if="latestResults" :to="`/journal/${latestResults.slug}`" class="home-results-card"><span class="mono">{{ new Date(latestResults.publishedAt).toLocaleDateString('sl-SI') }}</span><div><h3>{{ latestResults.title }}</h3><p>{{ latestResults.description }}</p></div><em>↗</em></NuxtLink><p v-else class="home-results-empty">Prvi preverjeni tedenski pregled rezultatov bo objavljen tukaj.</p></div></section>

    <section class="section shell"><SectionHead eyebrow="Ljudje na poteh" title="Slovenski trail tekači" link-label="Vsi tekači" to="/runners"/><div class="runner-grid"><RunnerCard v-for="(runner,index) in runners" :key="runner.id" :runner="runner" :index="index"/></div></section>

    <section class="section route-week"><div class="shell route-week-grid"><div class="route-photo"><img src="/images/kv01.jpg" alt="Trail tekač na gorski turi" loading="lazy"><RouteVisual :variant="3" dark/></div><div class="route-week-copy"><p class="eyebrow">Tura tedna · kurirano</p><h2>{{ trailRoutes[0].name }}</h2><p>{{ trailRoutes[0].description }}</p><StatStrip :items="[{value:'27,4 KM',label:'Razdalja'},{value:'1.640 M+',label:'Vzpon'},{value:'ZAHTEVNA',label:'Težavnost'}]"/><ElevationProfile/><p class="route-quote">“{{ trailRoutes[0].quote }}”<span>— {{ trailRoutes[0].recommendedBy }}</span></p><NuxtLink :to="`/routes/${trailRoutes[0].slug}`" class="button primary">Razišči turo ↗</NuxtLink></div></div></section>

    <section id="newsletter" class="section shell newsletter"><div><p class="eyebrow">Vsak četrtek zjutraj</p><h2>Trail Weekly</h2><p class="newsletter-lead">Vse pomembno iz slovenskega traila enkrat tedensko.</p></div><div><ul><li>rezultati prejšnjega tedna</li><li>tekme naslednjega vikenda</li><li>analiza trase, tekač in priporočena pot</li></ul><form @submit.prevent="subscribe"><label for="email" class="sr-only">E-poštni naslov</label><input id="email" v-model="email" type="email" required placeholder="tvoj@email.si"><button class="button primary" type="submit">Prijavi me ↗</button></form><p v-if="message" class="form-message" role="status">{{ message }}</p></div></section>
  </div>
</template>
