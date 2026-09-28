<script setup lang="ts">
import { gpxDetailFile } from '~/utils/gpx'
const loadGpx = useGpxData()
import type { GpxData } from '~/types/gpx'
import type { Race, RaceDistance } from '~/types'
import { effortCategory, effortKm, effortLabel } from '~/utils/raceCategories'

const props = defineProps<{ race: Race }>()
const selectedId = ref(
  props.race.distances.length === 1 ? props.race.distances[0].id || `${props.race.slug}-0` : 'all',
)
const gpxData = ref<Record<string, GpxData>>({})
const hoverProgress = ref<number | null>(null)

onMounted(async () => {
  const entries = props.race.distances.map(async (distance, index) => {
    if (!distance.gpx?.file) return
    try {
      gpxData.value[routeId(distance, index)] = await loadGpx<GpxData>(
        gpxDetailFile(distance.gpx.file),
      )
    } catch {
      /* GPX preview remains available */
    }
  })
  await Promise.all(entries)
})

const routeId = (distance: RaceDistance, index: number) =>
  distance.id || `${props.race.slug}-${index}`

const selectedDistance = computed(() => {
  const index = props.race.distances.findIndex(
    (distance, distanceIndex) => routeId(distance, distanceIndex) === selectedId.value,
  )
  return index >= 0 ? props.race.distances[index] : null
})

function selectRoute(distance: RaceDistance, index: number) {
  const id = routeId(distance, index)
  selectedId.value = selectedId.value === id ? 'all' : id
}
function selectFromMap(id: string) {
  selectedId.value = id
  hoverProgress.value = null
}
</script>

<template>
  <div class="course-map-shell">
    <header class="course-map-header">
      <div>
        <span class="eyebrow">Interaktivni prototip</span
        ><strong>{{ selectedDistance?.name || 'Vse trase dogodka' }}</strong>
      </div>
    </header>

    <div class="course-map-layout">
      <MapboxRaceMap
        :race="race"
        :selected-id="selectedId"
        :hover-progress="hoverProgress"
        @select="selectFromMap"
        @hover="hoverProgress = $event"
      />
      <aside class="course-map-routes-list" aria-label="Trase dogodka">
        <button
          v-if="race.distances.length > 1"
          :class="{ active: selectedId === 'all' }"
          @click="selectedId = 'all'"
        >
          <i class="all-routes-dot" /><span
            ><strong>Vse trase</strong
            ><small>{{ race.distances.length }} na enem zemljevidu</small></span
          >
        </button>
        <button
          v-for="(distance, index) in race.distances"
          :key="routeId(distance, index)"
          :class="[
            `effort-${effortCategory(distance).toLowerCase()}`,
            { active: selectedId === routeId(distance, index) },
          ]"
          @click="selectRoute(distance, index)"
        >
          <i /><span
            ><strong>{{ distance.name || distance.label }}</strong
            ><small
              >{{ distance.km || '—' }} km · {{ distance.elevation || '—' }} m+ ·
              {{ effortLabel(distance) }}</small
            ></span
          ><em>{{ effortKm(distance).toLocaleString('sl-SI') }}</em>
        </button>
      </aside>
    </div>

    <div v-if="selectedDistance" class="course-map-profile">
      <RaceElevationProfile
        :distance="selectedDistance"
        :data="gpxData[selectedId]"
        :hover-progress="hoverProgress"
        @hover="hoverProgress = $event"
      />
      <a
        v-if="selectedDistance.gpx?.rawFile"
        :href="selectedDistance.gpx.rawFile"
        :download="selectedDistance.gpx.rawFile.split('/').at(-1)"
        :class="['gpx-download', `effort-${effortCategory(selectedDistance).toLowerCase()}`]"
        :aria-label="`Prenesi GPX za traso ${selectedDistance.name || selectedDistance.label}`"
      >
        <span aria-hidden="true">↓</span> Prenesi GPX
      </a>
    </div>
  </div>
</template>
