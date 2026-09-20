<script setup lang="ts">
import type { Race, RaceDistance } from '~/types'
import { effortColor } from '~/utils/raceCategories'
import 'leaflet/dist/leaflet.css'
const props = defineProps<{ races: Race[]; activeId?: string }>()
const emit = defineEmits<{ activate: [id: string] }>()
const mapEl = ref<HTMLElement | null>(null)
type GpxJson = { route?: [number, number][] }
const gpxData = ref<Record<string, GpxJson>>({})
let L: typeof import('leaflet') | null = null
let map: import('leaflet').Map | null = null
let bounds: import('leaflet').LatLngBounds | null = null
let layers: import('leaflet').Polyline[] = []
function draw() {
  if (!map || !L) return
  layers.forEach(layer => layer.remove()); layers=[]; bounds=null
  props.races.forEach(race => race.distances.forEach((distance,index) => {
    const route = gpxData.value[`${race.id}:${distance.id || index}`]?.route
    if (!route?.length) return
    const layer = L.polyline(route as L.LatLngExpression[], { color:effortColor(distance), weight:props.activeId===race.id?4:2.5, opacity:props.activeId && props.activeId!==race.id ? .28 : .74, lineCap:'round', lineJoin:'round' }).addTo(map!)
    layer.bindTooltip(`${race.name} · ${distance.name || distance.label}`, { sticky:true })
    layer.on('mouseenter', () => emit('activate', race.id)); layer.on('click', () => emit('activate', race.id))
    layers.push(layer); bounds = bounds ? bounds.extend(layer.getBounds()) : layer.getBounds()
  }))
  if (bounds?.isValid()) map.fitBounds(bounds, { padding:[24,24], maxZoom:8 })
}
function reset() {
  if (!map) return
  map.invalidateSize()
  if (bounds?.isValid()) map.fitBounds(bounds, { padding:[24,24], maxZoom:8 })
  else map.setView([46.2,14.8],8)
}
async function loadRoutes() {
  await Promise.all(props.races.flatMap(race => race.distances.map(async (distance,index) => {
    const key = `${race.id}:${distance.id || index}`
    if (!distance.gpx?.file || gpxData.value[key]) return
    try { gpxData.value[key] = await $fetch<GpxJson>(distance.gpx.file) } catch {}
  })))
  draw()
}
watch(() => props.activeId, draw)
watch(() => props.races.map(race => race.id).join(','), loadRoutes)
onMounted(async () => {
  if (!mapEl.value) return
  L = await import('leaflet')
  map = L.map(mapEl.value, { zoomControl:false, scrollWheelZoom:true, dragging:true, touchZoom:true, doubleClickZoom:true }).setView([46.2,14.8],8)
  L.control.zoom({position:'topright'}).addTo(map)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    subdomains: 'abcd',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
  }).addTo(map)
  await loadRoutes(); setTimeout(() => map?.invalidateSize(),100)
})
onBeforeUnmount(() => { map?.remove(); map=null })
</script>
<template>
  <div class="leaflet-map-shell combined-leaflet-map">
    <div ref="mapEl" class="leaflet-map" role="application" aria-label="Kartografski zemljevid slovenskih trail tekem" />
    <div class="leaflet-map-toolbar"><span class="mono">GPX TRAS · SLOVENIJA</span><button type="button" @click="reset">Ponastavi pogled</button></div>
  </div>
</template>
