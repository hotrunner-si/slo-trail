<script setup lang="ts">
import type { Race } from '~/types'
import { effortCategory } from '~/utils/raceCategories'
const props = defineProps<{ races: Race[]; activeId?: string }>()
const emit = defineEmits<{ activate:[id:string] }>()
const mainDistance = (race: Race) => race.distances.reduce((a,b) => a.km > b.km ? a : b)
const mappedRaces = computed(() => props.races.filter(race => race.mapPosition))
const dateLabel = (race: Race) => race.date && race.dateStatus !== 'estimated' && !Number.isNaN(new Date(race.date).getTime()) ? new Date(race.date).toLocaleDateString('sl-SI',{day:'2-digit',month:'short'}) : '—'
type GpxJson = { overviewRoute?: [number, number][] }
const gpxData = ref<Record<string, GpxJson>>({})
const gpxRoutes = computed(() => props.races.flatMap(race => race.distances.map((distance, index) => ({ race, distance, index, data: gpxData.value[`${race.id}:${distance.id || index}`] })).filter(item => item.data?.overviewRoute?.length)))
const allPoints = computed(() => gpxRoutes.value.flatMap(item => item.data?.overviewRoute || []))
const projectRoute = (route: [number, number][]) => {
  const points = allPoints.value; if (!points.length) return ''
  const lats=points.map(point=>point[0]), lngs=points.map(point=>point[1]); const minLat=Math.min(...lats), maxLat=Math.max(...lats), minLng=Math.min(...lngs), maxLng=Math.max(...lngs)
  return route.map(point => `${(8 + ((point[1]-minLng)/Math.max(maxLng-minLng,.001))*84).toFixed(2)},${(92 - ((point[0]-minLat)/Math.max(maxLat-minLat,.001))*84).toFixed(2)}`).join(' ')
}
onMounted(async () => { await Promise.all(props.races.flatMap(race => race.distances.map(async (distance,index) => { if (!distance.gpx?.file) return; try { gpxData.value[`${race.id}:${distance.id || index}`] = await $fetch<GpxJson>(distance.gpx.file) } catch {} }))) })
</script>
<template>
  <div class="race-map-layout">
    <LeafletRacesMap :races="races" :active-id="activeId" @activate="emit('activate', $event)" />
    <div class="race-map race-map-legacy" role="img" aria-label="Zemljevid lokacij tekem v Sloveniji">
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <path class="slovenia-shape" d="M10 40L18 24 35 18 45 24 55 17 70 22 87 35 91 50 82 61 76 78 59 84 46 75 31 82 20 70 8 61Z"/>
        <path class="map-contours" d="M7 49c20-13 36-5 48-13s23-7 38 1M12 62c18-10 28-1 42-10s24-8 35 0M22 75c12-8 25-1 37-8s17-7 24-3"/>
        <polyline v-for="item in gpxRoutes" :key="`${item.race.id}-${item.distance.id}`" :points="projectRoute(item.data!.overviewRoute!)" :class="['race-map-gpx-route',`effort-${effortCategory(item.distance).toLowerCase()}`,{active:activeId===item.race.id}]" @mouseenter="emit('activate',item.race.id)"/>
      </svg>
      <button v-for="race in mappedRaces" :key="race.id" :class="['map-pin',`effort-${effortCategory(mainDistance(race)).toLowerCase()}`,{active:activeId===race.id}]" :style="{left:`${race.mapPosition?.x}%`,top:`${race.mapPosition?.y}%`}" :aria-label="race.name" @mouseenter="emit('activate',race.id)" @focus="emit('activate',race.id)" @click="emit('activate',race.id)"><i/><span>{{ race.location }}</span></button>
      <p v-if="!mappedRaces.length" class="map-empty">Lokacije bomo dodali ob preverjanju uradnih podatkov.</p>
      <div class="map-scale mono">{{ gpxRoutes.length ? `${gpxRoutes.length} GPX TRAS · SLOVENIJA` : 'SLOVENIJA · LOKACIJE' }}</div>
    </div>
    <div class="map-side-list">
      <NuxtLink v-for="race in races" :key="race.id" :to="`/races/${race.slug}`" :class="{active:activeId===race.id}" @mouseenter="emit('activate',race.id)"><time>{{ dateLabel(race) }}</time><strong>{{ race.name }}</strong><span>{{ race.location }} · {{ race.distances.length }} tras</span></NuxtLink>
    </div>
  </div>
</template>
