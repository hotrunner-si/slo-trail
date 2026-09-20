<script setup lang="ts">
import type { Race, RaceDistance } from '~/types'
import { effortColor } from '~/utils/raceCategories'
import 'leaflet/dist/leaflet.css'

const props = defineProps<{ race: Race; selectedId?: string }>()
const emit = defineEmits<{ select: [id: string] }>()
const mapEl = ref<HTMLElement | null>(null)
const loaded = ref(0)
type GpxJson = { route?: [number, number][] }
const gpxData = ref<Record<string, GpxJson>>({})
let L: typeof import('leaflet') | null = null
let map: import('leaflet').Map | null = null
let layers: import('leaflet').Polyline[] = []
let bounds: import('leaflet').LatLngBounds | null = null

const routeId = (distance: RaceDistance, index: number) => distance.id || `${props.race.slug}-${index}`

function refreshLayers() {
  if (!map || !L) return
  layers.forEach(layer => layer.remove())
  layers = []
  bounds = null
  props.race.distances.forEach((distance, index) => {
    const route = gpxData.value[routeId(distance, index)]?.route
    if (!route?.length) return
    const points = route.map(([lat, lng]) => [lat, lng] as [number, number])
    const selectedId = props.selectedId || 'all'
    const layer = L.polyline(points, { color: effortColor(distance), weight: selectedId === 'all' ? 4 : selectedId === routeId(distance, index) ? 6 : 2, opacity: selectedId === 'all' || selectedId === routeId(distance, index) ? 0.92 : 0.25, lineCap: 'round', lineJoin: 'round' }).addTo(map!)
    layer.bindTooltip(`${distance.name || distance.label} · ${distance.km || '—'} km`, { sticky: true })
    layer.on('click', () => emit('select', selectedId === routeId(distance, index) ? 'all' : routeId(distance, index)))
    layers.push(layer)
    bounds = bounds ? bounds.extend(layer.getBounds()) : layer.getBounds()
  })
  if (bounds?.isValid() && map.getZoom() < 8) map.fitBounds(bounds, { padding: [28, 28] })
}

function fitMap() {
  if (!map) return
  map.invalidateSize()
  if (bounds?.isValid()) map.fitBounds(bounds, { padding: [28, 28], maxZoom: 14 })
  else map.setView([46.2, 14.8], 8)
}

onMounted(async () => {
  if (!mapEl.value) return
  L = await import('leaflet')
  map = L.map(mapEl.value, { zoomControl: false, attributionControl: true, scrollWheelZoom: true, doubleClickZoom: true, dragging: true, touchZoom: true, boxZoom: true, keyboard: true }).setView([46.2, 14.8], 8)
  L.control.zoom({ position: 'topright' }).addTo(map)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    subdomains: 'abcd',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
  }).addTo(map)
  await Promise.all(props.race.distances.map(async (distance, index) => {
    if (!distance.gpx?.file) return
    try { gpxData.value[routeId(distance, index)] = await $fetch<GpxJson>(distance.gpx.file); loaded.value++ } catch { /* no GPX yet */ }
  }))
  refreshLayers()
  setTimeout(() => map?.invalidateSize(), 100)
})

watch(() => props.selectedId, refreshLayers)

onBeforeUnmount(() => { map?.remove(); map = null })
</script>

<template>
  <div class="leaflet-map-shell">
    <div ref="mapEl" class="leaflet-map" role="application" :aria-label="`Kartografski zemljevid tras dogodka ${race.name}`" />
    <div class="leaflet-map-toolbar">
      <span class="mono">{{ loaded ? `${loaded}/${race.distances.length} GPX TRAS` : 'GPX NI NALOŽEN' }}</span>
      <button type="button" @click="emit('select', 'all'); fitMap()">Vse trase</button>
      <button type="button" @click="fitMap">Ponastavi pogled</button>
    </div>
    <p class="leaflet-map-note">Povleci zemljevid za premik. Uporabi kolešček ali gumba +/− za približanje.</p>
  </div>
</template>
