<script setup lang="ts">
import { runnerTours } from '~/data/runnerTours'
import { effortColor, effortLabel } from '~/utils/raceCategories'

useSiteSeo('Ture tekačev', 'Resnične GPX ture tekačev, razvrščene od najnovejše do najstarejše.')
const view = ref<'list' | 'cards' | 'map'>('cards')
const activeId = ref(runnerTours[0]?.key || '')
const mapRef = ref<{ focusTour: (id: string) => void; fitAll: () => void } | null>(null)
const number = (value: number) => new Intl.NumberFormat('sl-SI', { maximumFractionDigits: 1 }).format(value)
const color = (tour: { distanceKm: number; elevationGain: number }) => effortColor({ km: tour.distanceKm, elevation: tour.elevationGain })
const label = (tour: { distanceKm: number; elevationGain: number }) => effortLabel({ km: tour.distanceKm, elevation: tour.elevationGain })
function profilePoints(profile: number[]) {
  const low = Math.min(...profile), span = Math.max(Math.max(...profile) - low, 1)
  return profile.map((height, index) => `${(index / Math.max(profile.length - 1, 1) * 100).toFixed(2)},${(38 - (height - low) / span * 32).toFixed(2)}`).join(' ')
}
function routePoints(route: [number, number][]) {
  const latitudes = route.map(point => point[0]), longitudes = route.map(point => point[1])
  const south = Math.min(...latitudes), west = Math.min(...longitudes)
  const latSpan = Math.max(Math.max(...latitudes) - south, .0001), lngSpan = Math.max(Math.max(...longitudes) - west, .0001)
  const scale = Math.min(78 / lngSpan, 78 / latSpan)
  const left = (100 - lngSpan * scale) / 2, top = (100 - latSpan * scale) / 2
  return route.map(([lat, lng]) => `${(left + (lng - west) * scale).toFixed(2)},${(100 - top - (lat - south) * scale).toFixed(2)}`).join(' ')
}
function selectTour(id: string) { activeId.value = id; mapRef.value?.focusTour(id) }
</script>

<template>
  <div class="page runner-tours-page shell">
    <header class="page-header runner-tours-header">
      <p class="eyebrow">Tekači · GPX ture</p>
      <h1>Ture s poti.</h1>
      <p>Prave sledi tekačev, zbrane po datumu. Najnovejše so na vrhu.</p>
    </header>
    <div class="runner-tours-toolbar">
      <div class="route-view-switch view-switch" aria-label="Način prikaza tur">
        <button type="button" :class="{ active: view === 'list' }" @click="view = 'list'">Seznam</button>
        <button type="button" :class="{ active: view === 'cards' }" @click="view = 'cards'">Kartice</button>
        <button type="button" :class="{ active: view === 'map' }" @click="view = 'map'">Zemljevid</button>
      </div>
      <span class="mono runner-tours-count">{{ runnerTours.length }} TUR · NAJNOVEJŠE NAJPREJ</span>
    </div>
    <div v-if="!runnerTours.length" class="empty-state"><h2>Tur še ni.</h2><p>Ko tekači dodajo GPX sledi, se bodo prikazale tukaj.</p></div>
    <div v-else-if="view === 'cards'" class="runner-tour-cards">
      <article v-for="(tour, index) in runnerTours" :key="tour.key" class="runner-tour-card" :style="{ '--tour-color': color(tour) }">
        <div class="runner-tour-card-map" aria-hidden="true">
          <span class="runner-tour-card-index mono">{{ String(index + 1).padStart(2, '0') }} / {{ String(runnerTours.length).padStart(2, '0') }}</span>
          <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet"><polyline class="runner-tour-card-halo" :points="routePoints(tour.preview.overviewRoute as [number, number][])"/><polyline class="runner-tour-card-trace" :points="routePoints(tour.preview.overviewRoute as [number, number][])"/></svg>
          <span class="runner-tour-card-category mono">{{ label(tour) }}</span>
        </div>
        <div class="runner-tour-card-body">
          <p class="eyebrow">{{ tour.date }} · {{ tour.location }}</p>
          <h2>{{ tour.title }}</h2>
          <p class="runner-tour-card-description">{{ tour.description }}</p>
          <div class="runner-tour-card-stats mono"><strong>{{ number(tour.distanceKm) }} km</strong><strong>↗ {{ number(tour.elevationGain) }} m</strong></div>
          <svg class="runner-tour-card-profile" viewBox="0 0 100 42" preserveAspectRatio="none" role="img" :aria-label="`Višinski profil ture ${tour.title}`"><polygon :points="`0,42 ${profilePoints(tour.preview.profile)} 100,42`"/><polyline :points="profilePoints(tour.preview.profile)"/></svg>
          <div class="runner-tour-card-footer"><NuxtLink :to="`/runners/${tour.runnerSlug}#runner-gpx-title`">{{ tour.runnerName }} ↗</NuxtLink><a :href="`/gpx/runners/${tour.runnerSlug}/${tour.preview.source}`" download>Prenesi GPX ↓</a></div>
        </div>
      </article>
    </div>
    <div v-else-if="view === 'list'" class="runner-tour-list">
      <article v-for="tour in runnerTours" :key="tour.key" class="runner-tour-list-row" :style="{ '--tour-color': color(tour) }">
        <time class="mono" :datetime="tour.dateIso">{{ tour.date }}</time>
        <div><h2>{{ tour.title }}</h2><p>{{ tour.runnerName }} · {{ tour.location }}</p></div>
        <span class="mono">{{ number(tour.distanceKm) }} km<br>↗ {{ number(tour.elevationGain) }} m</span>
        <svg viewBox="0 0 100 42" preserveAspectRatio="none" role="img" :aria-label="`Višinski profil ture ${tour.title}`"><polygon :points="`0,42 ${profilePoints(tour.preview.profile)} 100,42`"/><polyline :points="profilePoints(tour.preview.profile)"/></svg>
        <NuxtLink :to="`/runners/${tour.runnerSlug}#runner-gpx-title`" :aria-label="`Odpri profil tekača ${tour.runnerName}`">↗</NuxtLink>
      </article>
    </div>
    <div v-show="view === 'map' && runnerTours.length" class="race-map-layout runner-tour-map-layout">
      <RunnerToursMap ref="mapRef" :tours="runnerTours" :active-id="activeId" :visible="view === 'map'" @activate="activeId = $event" />
      <aside class="map-side-list runner-tour-map-list" aria-label="Ture na zemljevidu">
        <button v-for="tour in runnerTours" :key="tour.key" type="button" :class="{ active: activeId === tour.key }" :style="{ '--tour-color': color(tour) }" @click="selectTour(tour.key)">
          <time :datetime="tour.dateIso">{{ tour.date }}</time><strong>{{ tour.title }}</strong><span>{{ tour.runnerName }} · {{ tour.location }}</span><small>{{ number(tour.distanceKm) }} km · ↗ {{ number(tour.elevationGain) }} m</small>
        </button>
      </aside>
    </div>
  </div>
</template>
