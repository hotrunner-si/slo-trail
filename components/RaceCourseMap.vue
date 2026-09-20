<script setup lang="ts">
import type { Race, RaceDistance } from '~/types'
import { effortCategory, effortKm, effortLabel } from '~/utils/raceCategories'

const props = defineProps<{ race: Race }>()
const selectedId = ref('all')
const detail = ref<1 | 2 | 3>(2)
type GpxJson = { route?: [number, number][]; bounds?: { north:number; south:number; east:number; west:number } }
const gpxData = ref<Record<string, GpxJson>>({})

onMounted(async () => {
  const entries = props.race.distances.map(async (distance, index) => {
    if (!distance.gpx?.file) return
    try { gpxData.value[routeId(distance, index)] = await $fetch<GpxJson>(distance.gpx.file) } catch { /* GPX preview remains available */ }
  })
  await Promise.all(entries)
})

const routeId = (distance: RaceDistance, index: number) => distance.id || `${props.race.slug}-${index}`
const isVisible = (distance: RaceDistance, index: number) => selectedId.value === 'all' || selectedId.value === routeId(distance, index)
const isMuted = (distance: RaceDistance, index: number) => selectedId.value !== 'all' && selectedId.value !== routeId(distance, index)

const selectedDistance = computed(() => {
  const index = props.race.distances.findIndex((distance, distanceIndex) => routeId(distance, distanceIndex) === selectedId.value)
  return index >= 0 ? props.race.distances[index] : null
})

function routePoints(distance: RaceDistance, index: number) {
  const source = gpxData.value[routeId(distance, index)]?.route
  if (source?.length) {
    const allRoutes = Object.values(gpxData.value).flatMap(item => item.route || [])
    const coordinates = allRoutes.length ? allRoutes : source
    const lats = coordinates.map(point => point[0]); const lngs = coordinates.map(point => point[1])
    const minLat = Math.min(...lats); const maxLat = Math.max(...lats); const minLng = Math.min(...lngs); const maxLng = Math.max(...lngs)
    const latSpan = Math.max(maxLat - minLat, .001); const lngSpan = Math.max(maxLng - minLng, .001)
    return source.map(point => `${(70 + ((point[1] - minLng) / lngSpan) * 660).toFixed(1)},${(410 - ((point[0] - minLat) / latSpan) * 350).toFixed(1)}`).join(' ')
  }
  const pointCount = detail.value === 1 ? 14 : detail.value === 2 ? 28 : 52
  const seed = [...`${props.race.slug}-${distance.name}-${distance.km}`].reduce((sum, character) => sum + character.charCodeAt(0), 0)
  const radius = 78 + Math.min(125, distance.km * 1.35) + index * 7
  const centerX = 390 + ((seed % 11) - 5) * 5
  const centerY = 245 + ((seed % 7) - 3) * 4
  const points: string[] = ['400,420']

  for (let point = 0; point < pointCount; point++) {
    const progress = point / (pointCount - 1)
    const angle = progress * Math.PI * 2 - Math.PI / 2
    const variation = Math.sin(progress * Math.PI * (3 + index % 4) + seed) * (14 + index * 2)
    const x = centerX + Math.cos(angle) * (radius + variation) * 1.32
    const y = centerY + Math.sin(angle) * (radius * .72 + variation)
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`)
  }

  points.push('400,420')
  return points.join(' ')
}

function selectRoute(distance: RaceDistance, index: number) {
  const id = routeId(distance, index)
  selectedId.value = selectedId.value === id ? 'all' : id
}
</script>

<template>
  <div class="course-map-shell">
    <header class="course-map-header">
      <div><span class="eyebrow">Interaktivni prototip</span><strong>{{ selectedDistance?.name || 'Vse trase dogodka' }}</strong></div>
      <div class="map-detail-control" aria-label="Podrobnost trase">
        <span>Podrobnost</span>
        <button v-for="level in ([1,2,3] as const)" :key="level" :class="{ active: detail === level }" @click="detail = level">{{ level }}</button>
      </div>
    </header>

    <div class="course-map-layout">
      <LeafletRaceMap :race="race" :selected-id="selectedId" @select="selectedId = $event" />
      <div class="course-map-stage course-map-stage-legacy" aria-hidden="true">
        <svg viewBox="0 0 800 480" role="img" :aria-label="`Predogled vseh tras dogodka ${race.name}`">
          <g class="course-map-contours" aria-hidden="true">
            <ellipse cx="395" cy="240" rx="330" ry="184" />
            <ellipse cx="395" cy="240" rx="282" ry="153" />
            <ellipse cx="395" cy="240" rx="230" ry="121" />
            <ellipse cx="395" cy="240" rx="175" ry="88" />
            <path d="M40 340C180 275 232 365 375 315S620 248 770 310" />
            <path d="M54 122C185 178 270 98 390 148S612 194 754 118" />
          </g>
          <g class="course-map-routes">
            <polyline
              v-for="(distance,index) in race.distances"
              :key="routeId(distance,index)"
              :points="routePoints(distance,index)"
              :class="[`effort-${effortCategory(distance).toLowerCase()}`, { muted:isMuted(distance,index), hidden:!isVisible(distance,index) }]"
              tabindex="0"
              @click="selectRoute(distance,index)"
              @keydown.enter="selectRoute(distance,index)"
            />
          </g>
          <g class="course-map-start" aria-label="Predvidena skupna točka starta in cilja"><circle cx="400" cy="420" r="8"/><circle cx="400" cy="420" r="3"/></g>
        </svg>
        <div class="course-map-note"><span>{{ Object.keys(gpxData).length ? 'GPX PREDOGLED' : 'GPX ŠE NI POVEZAN' }}</span><strong>{{ Object.keys(gpxData).length ? `${Object.keys(gpxData).length} tras z dejansko geometrijo` : 'Geometrija je začasni vizualni prototip' }}</strong></div>
        <div class="course-map-scale mono">500 M</div>
      </div>

      <aside class="course-map-routes-list" aria-label="Trase dogodka">
        <button :class="{ active:selectedId === 'all' }" @click="selectedId = 'all'"><i class="all-routes-dot"/><span><strong>Vse trase</strong><small>{{ race.distances.length }} na enem zemljevidu</small></span></button>
        <button v-for="(distance,index) in race.distances" :key="routeId(distance,index)" :class="[`effort-${effortCategory(distance).toLowerCase()}`, { active:selectedId === routeId(distance,index) }]" @click="selectRoute(distance,index)">
          <i/><span><strong>{{ distance.name || distance.label }}</strong><small>{{ distance.km || '—' }} km · {{ distance.elevation || '—' }} m+ · {{ effortLabel(distance) }}</small></span><em>{{ effortKm(distance).toLocaleString('sl-SI') }}</em>
        </button>
      </aside>
    </div>

    <div v-if="selectedDistance" class="course-map-profile"><RaceElevationMini :distance="selectedDistance" :race-id="race.id"/><span class="mono">IZBRANA TRASA · PROFIL SE BO POVEZAL Z ZEMLJEVIDOM</span></div>
  </div>
</template>
