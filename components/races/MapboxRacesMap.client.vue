<script setup lang="ts">
const loadGpx = useGpxData()
const lifetime = useComponentLifetime()
import type { GpxData } from '~/types/gpx'
import type { Race } from '~/types'
import { effortColor } from '~/utils/raceCategories'
import { slovenianCountForm, slovenianCountForms } from '~/utils/slovenianCount'
import 'mapbox-gl/dist/mapbox-gl.css'
const props = defineProps<{ races: Race[]; activeId?: string }>()
const emit = defineEmits<{ activate: [id: string]; 'route-hover': [id: string] }>()
const config = useRuntimeConfig()
const mapEl = ref<HTMLElement | null>(null)
const error = ref('')
const data = ref<Record<string, GpxData>>({})
let mb: typeof import('mapbox-gl') | null = null
let map: import('mapbox-gl').Map | null = null
const initialCenter: [number, number] = [14.8, 46.0]
const initialZoom = 7.7
const key = (r: Race, i: number) => `${r.id}:${r.distances[i].id || i}`
const lid = (r: Race, i: number) => `all-${r.id}-${r.distances[i].id || i}`
const routeOwners = new Map<string, string>()
function update() {
  if (!map) return
  const visible = new Set(props.races.map((r) => r.id))
  for (const [id, raceId] of routeOwners) {
    const shown = visible.has(raceId)
    if (map.getLayer(id)) {
      map.setLayoutProperty(id, 'visibility', shown ? 'visible' : 'none')
      if (shown) {
        const active = !props.activeId || props.activeId === raceId
        map.setPaintProperty(id, 'line-width', active ? 4.5 : 2.5)
        map.setPaintProperty(id, 'line-opacity', active ? 0.9 : 0.18)
      }
    }
    if (map.getLayer(`${id}-halo`))
      map.setLayoutProperty(`${id}-halo`, 'visibility', shown ? 'visible' : 'none')
  }
  const active = props.races.find((r) => r.id === props.activeId)
  active?.distances.forEach((_, i) => {
    const id = lid(active, i)
    if (map!.getLayer(`${id}-halo`)) map!.moveLayer(`${id}-halo`)
    if (map!.getLayer(id)) map!.moveLayer(id)
  })
}
function draw() {
  if (!map || !map.isStyleLoaded()) return
  props.races.forEach((r) =>
    r.distances.forEach((d, i) => {
      const gpx = data.value[key(r, i)],
        route = gpx?.overviewRoute || gpx?.route
      if (!route?.length) return
      const id = lid(r, i),
        c = route.map(([lat, lng]) => [lng, lat] as [number, number])
      if (!map!.getSource(id))
        map!.addSource(id, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: { type: 'LineString', coordinates: c },
          },
        })
      if (!map!.getLayer(`${id}-halo`))
        map!.addLayer({
          id: `${id}-halo`,
          type: 'line',
          source: id,
          paint: { 'line-color': '#fff', 'line-width': 5, 'line-opacity': 0.75 },
        })
      if (!map!.getLayer(id)) {
        routeOwners.set(id, r.id)
        map!.addLayer({
          id,
          type: 'line',
          source: id,
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': effortColor(d), 'line-width': 2.5, 'line-opacity': 0.82 },
        })
        map!.on('mouseenter', id, () => {
          emit('activate', r.id)
          emit('route-hover', r.id)
        })
        map!.on('click', id, () => emit('activate', r.id))
      }
    }),
  )
  update()
}
const loaded = ref(0)
const total = ref(0)
let generation = 0
let pendingFocusId = ''
async function load() {
  if (!map?.isStyleLoaded()) return
  const current = ++generation
  const entries = props.races
    .flatMap((r) => r.distances.map((d, i) => ({ r, d, i })))
    .filter(({ d }) => d.gpx?.file)
  total.value = entries.length
  loaded.value = entries.filter(({ r, i }) => data.value[key(r, i)]).length
  // A small queue lets Mapbox paint its tiles between route updates.
  const pending = entries.filter(({ r, i }) => !data.value[key(r, i)])
  let next = 0
  async function worker() {
    while (next < pending.length && current === generation) {
      const { r, d, i } = pending[next++]
      try {
        const fetched = await loadGpx<GpxData>(d.gpx!.file!)
        if (current !== generation || !lifetime.active) return
        data.value[key(r, i)] = fetched
        loaded.value++
        draw()
        if (pendingFocusId === r.id) {
          pendingFocusId = ''
          focusRace(r.id)
        }
      } catch {}
    }
  }
  await Promise.all(Array.from({ length: Math.min(4, pending.length) }, () => worker()))
}
function reset() {
  map?.easeTo({ center: initialCenter, zoom: initialZoom, duration: 500 })
}
function focusRace(id: string) {
  if (!map || !mb) {
    pendingFocusId = id
    return
  }
  const race = props.races.find((r) => r.id === id)
  if (!race) return
  const bounds = new mb.LngLatBounds()
  race.distances.forEach((_, i) => {
    const route = data.value[key(race, i)]?.overviewRoute || []
    route.forEach(([lat, lng]) => bounds.extend([lng, lat]))
  })
  if (!bounds.isEmpty()) {
    pendingFocusId = ''
    map.easeTo({ center: bounds.getCenter(), duration: 450 })
  } else pendingFocusId = id
}
function resize() {
  map?.resize()
}
defineExpose({ focusRace, resize })
watch(() => props.activeId, update)
watch(
  () => props.races.map((r) => r.id).join(','),
  () => {
    if (map?.isStyleLoaded()) {
      draw()
      load()
    }
  },
)
onMounted(async () => {
  await nextTick()
  if (!mapEl.value) return
  if (!config.public.mapboxToken) {
    error.value = 'Zemljevid trenutno ni na voljo.'
    return
  }
  mb = await import('mapbox-gl')
  if (!lifetime.active || !mapEl.value) return
  mb.default.accessToken = String(config.public.mapboxToken)
  if (!lifetime.active || !mapEl.value) return
  map = new mb.default.Map({
    container: mapEl.value,
    style: String(config.public.mapboxStyle),
    center: initialCenter,
    zoom: initialZoom,
  })
  map.addControl(new mb.default.NavigationControl({ showCompass: false }), 'top-right')
  map.on('load', () => {
    draw()
    load()
  })
  map.on('error', (e) => {
    if (e.error) error.value = 'Zemljevida ni bilo mogoče naložiti.'
  })
})
onActivated(async () => {
  await nextTick()
  resize()
})
onBeforeUnmount(() => {
  generation++
  map?.remove()
})
</script>
<template>
  <div class="leaflet-map-shell combined-leaflet-map mapbox-map-shell">
    <div
      ref="mapEl"
      class="leaflet-map mapbox-map"
      role="application"
      aria-label="Kartografski zemljevid slovenskih trail tekem"
    />
    <p v-if="error" class="mapbox-map-error">{{ error }}</p>
    <div class="leaflet-map-toolbar">
      <span class="mono"
        >{{ loaded }}/{{ total }} GPX
        {{ slovenianCountForm(total, slovenianCountForms.route).toLocaleUpperCase('sl-SI') }} ·
        SLOVENIJA</span
      ><button type="button" @click="reset">Ponastavi pogled</button>
    </div>
  </div>
</template>
