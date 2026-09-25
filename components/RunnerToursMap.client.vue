<script setup lang="ts">
import type { RunnerTour } from '~/data/runnerTours'
import { effortColor } from '~/utils/raceCategories'
import 'mapbox-gl/dist/mapbox-gl.css'

const props = defineProps<{ tours: RunnerTour[]; activeId: string; visible: boolean }>()
const emit = defineEmits<{ activate: [id: string] }>()
const config = useRuntimeConfig()
const mapEl = ref<HTMLElement | null>(null)
const error = ref('')
let map: import('mapbox-gl').Map | null = null
let mb: typeof import('mapbox-gl') | null = null
const layerId = (id: string) => `runner-tour-${id}`
const coordinates = (tour: RunnerTour) => tour.preview.overviewRoute.map(([lat, lng]) => [lng, lat] as [number, number])

function update() {
  if (!map) return
  for (const tour of props.tours) {
    const id = layerId(tour.key)
    if (!map.getLayer(id)) continue
    const active = tour.key === props.activeId
    map.setPaintProperty(id, 'line-width', active ? 6 : 3)
    map.setPaintProperty(id, 'line-opacity', active ? 1 : .66)
    if (active) map.moveLayer(id)
  }
}
function fitTours(selectedId?: string) {
  if (!map || !mb) return
  const selected = selectedId ? props.tours.filter(tour => tour.key === selectedId) : props.tours
  const bounds = new mb.LngLatBounds()
  selected.flatMap(coordinates).forEach(point => bounds.extend(point))
  if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 60, maxZoom: selectedId ? 12 : 8, duration: 450 })
}
function draw() {
  if (!map?.isStyleLoaded()) return
  for (const tour of props.tours) {
    const id = layerId(tour.key)
    if (!map.getSource(id)) map.addSource(id, { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coordinates(tour) } } })
    if (!map.getLayer(`${id}-halo`)) map.addLayer({ id: `${id}-halo`, type: 'line', source: id, layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#fff', 'line-width': 9, 'line-opacity': .8 } })
    if (!map.getLayer(id)) {
      map.addLayer({ id, type: 'line', source: id, layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': effortColor({ km: tour.distanceKm, elevation: tour.elevationGain }), 'line-width': 3 } })
      map.on('click', id, () => emit('activate', tour.key))
      map.on('mouseenter', id, () => { map!.getCanvas().style.cursor = 'pointer'; emit('activate', tour.key) })
      map.on('mouseleave', id, () => { map!.getCanvas().style.cursor = '' })
    }
  }
  update()
  fitTours()
}
watch(() => props.activeId, update)
watch(() => props.visible, async visible => { if (visible) { await nextTick(); map?.resize(); fitTours() } })
onMounted(async () => {
  if (!mapEl.value) return
  if (!config.public.mapboxToken) { error.value = 'Zemljevid trenutno ni na voljo.'; return }
  try {
    mb = await import('mapbox-gl')
    mb.default.accessToken = String(config.public.mapboxToken)
    map = new mb.default.Map({ container: mapEl.value, style: String(config.public.mapboxStyle), center: [12, 46], zoom: 5.5 })
    map.addControl(new mb.default.NavigationControl({ showCompass: false }), 'top-right')
    map.on('load', draw)
    map.on('error', event => { if (event.error) error.value = 'Zemljevida ni bilo mogoče naložiti.' })
  } catch { error.value = 'Zemljevida ni bilo mogoče naložiti.' }
})
onBeforeUnmount(() => map?.remove())
defineExpose({ focusTour: (id: string) => fitTours(id), fitAll: () => fitTours() })
</script>

<template>
  <div class="leaflet-map-shell combined-leaflet-map mapbox-map-shell runner-tours-map">
    <div ref="mapEl" class="leaflet-map mapbox-map" role="application" aria-label="Skupni zemljevid GPX tur tekačev" />
    <p v-if="error" class="mapbox-map-error">{{ error }}</p>
    <div class="leaflet-map-toolbar"><span class="mono">{{ tours.length }} GPX TUR</span><button type="button" @click="fitTours()">Vse ture</button></div>
  </div>
</template>
