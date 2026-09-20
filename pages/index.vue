<script setup lang="ts">
import { races } from '~/data/races'; import { runners } from '~/data/runners'; import { trailRoutes } from '~/data/routes'; import { articles } from '~/data/articles'
useSiteSeo()
const email = ref(''); const message = ref('')
const featuredRace = races.find(r => r.slug === 'julian-alps-trail-run-by-utmb') || races[0]!
const directoryRace = races[0]!
const featuredDistance = featuredRace.distances.reduce((longest, distance) => distance.km > longest.km ? distance : longest)
function subscribe() { message.value = 'Newsletter prijave bodo kmalu na voljo.'; email.value = '' }
</script>

<template>
  <div>
    <section class="hero shell">
      <div class="hero-copy"><p class="eyebrow">Slovenski trail · sezona 2026</p><h1>Trail tek<br><span>v Sloveniji.</span></h1><p class="hero-lead">Tekme. Trase. Tekači. Rezultati. Zgodbe.</p><p class="hero-text">Prostor za spremljanje slovenskega trail teka — od startne črte do zadnjega vzpona.</p><div class="button-row"><NuxtLink to="/races" class="button primary">Poglej tekme <span>↗</span></NuxtLink><NuxtLink to="/routes" class="button secondary">Razišči trase</NuxtLink></div></div>
      <div class="hero-visual"><img src="/images/verbier03.jpg" alt="Gorska pokrajina kot vizual slovenskega trail portala"><div class="hero-photo-note"><span>Fotografija tedna</span><strong>Alpska linija</strong></div></div>
    </section>

    <section class="section shell week-section">
      <SectionHead eyebrow="Slovenski koledar" title="Odkrij naslednji trail" />
      <div class="week-grid"><div class="week-date"><span>BAZA</span><strong>44</strong><small>DOGODKOV</small></div><div class="week-race"><p class="eyebrow">Iz zbirke</p><h3>{{ directoryRace.name }}</h3><p>{{ directoryRace.summary }}</p><div class="inline-meta mono"><span>{{ directoryRace.distances.length }} TRASI</span><span>{{ Math.max(...directoryRace.distances.map(d => d.km)) }} KM</span><span>SLOVENIJA</span></div></div><div class="week-actions"><NuxtLink :to="`/races/${directoryRace.slug}`">Predstavitev ↗</NuxtLink><NuxtLink :to="`/races/${directoryRace.slug}#trasa`">Trase ↗</NuxtLink></div></div>
    </section>

    <section class="section ink-section"><div class="shell"><SectionHead eyebrow="Podatkovna baza" title="Rezultati prihajajo" link-label="Poglej tekme" to="/races"/><div class="results-layout"><div><p class="eyebrow">Naslednja faza</p><h3>Arhiv slovenskega traila</h3></div><div class="result-winner"><span>BREZ IZMIŠLJENIH VNOSOV</span><strong>Rezultate bomo objavili šele po preverjanju.</strong></div><div class="result-winner"><span>STALNI URL-JI</span><strong>Vsaka tekma že ima pripravljeno arhivsko stran.</strong></div></div></div></section>

    <section class="section shell"><SectionHead eyebrow="Koledar" title="Naslednje tekme" link-label="Celoten seznam" to="/races"/><RaceList :races="races.slice(0,4)" /></section>

    <section class="section shell featured-race"><div class="feature-copy"><p class="eyebrow">Izpostavljena tekma</p><h2>{{ featuredRace.name }}</h2><p>{{ featuredRace.summary }}</p><StatStrip :items="[{value:`${featuredDistance.km} KM`,label:'Najdaljša trasa'},{value:`${featuredDistance.elevation.toLocaleString('sl-SI')} M+`,label:'Vzpon'},{value:`${featuredRace.distances.length}`,label:'Tras'}]"/><NuxtLink :to="`/races/${featuredRace.slug}`" class="button primary">Razišči tekmo ↗</NuxtLink></div><div class="feature-map"><RouteVisual :variant="1" dark :label="featuredRace.name"/><ElevationProfile dark/><span class="map-label">JULIJSKE ALPE / PREDOGLED</span></div></section>

    <section class="section shell"><SectionHead eyebrow="Ljudje na poteh" title="Slovenski trail tekači" link-label="Vsi tekači" to="/runners"/><div class="runner-grid"><RunnerCard v-for="(runner,index) in runners" :key="runner.id" :runner="runner" :index="index"/></div></section>

    <section class="section route-week"><div class="shell route-week-grid"><div class="route-photo"><img src="/images/kv01.jpg" alt="Trail tekač na gorski trasi" loading="lazy"><RouteVisual :variant="3" dark/></div><div class="route-week-copy"><p class="eyebrow">Trasa tedna · kurirano</p><h2>{{ trailRoutes[0].name }}</h2><p>{{ trailRoutes[0].description }}</p><StatStrip :items="[{value:'27,4 KM',label:'Razdalja'},{value:'1.640 M+',label:'Vzpon'},{value:'ZAHTEVNA',label:'Težavnost'}]"/><ElevationProfile/><p class="route-quote">“{{ trailRoutes[0].quote }}”<span>— {{ trailRoutes[0].recommendedBy }}</span></p><NuxtLink :to="`/routes/${trailRoutes[0].slug}`" class="button primary">Razišči traso ↗</NuxtLink></div></div></section>

    <section class="section shell"><SectionHead eyebrow="Branje za dolg vzpon" title="Zadnje iz Journala" link-label="Ves Journal" to="/journal"/><div class="article-grid"><ArticleCard v-for="(article,index) in articles" :key="article.id" :article="article" :featured="index===0"/></div></section>

    <section id="newsletter" class="section shell newsletter"><div><p class="eyebrow">Vsak četrtek zjutraj</p><h2>Trail Weekly</h2><p class="newsletter-lead">Vse pomembno iz slovenskega traila enkrat tedensko.</p></div><div><ul><li>rezultati prejšnjega tedna</li><li>tekme naslednjega vikenda</li><li>analiza trase, tekač in priporočena pot</li></ul><form @submit.prevent="subscribe"><label for="email" class="sr-only">E-poštni naslov</label><input id="email" v-model="email" type="email" required placeholder="tvoj@email.si"><button class="button primary" type="submit">Prijavi me ↗</button></form><p v-if="message" class="form-message" role="status">{{ message }}</p></div></section>
  </div>
</template>
