<script setup lang="ts">
import 'leaflet/dist/leaflet.css'

const props = defineProps<{ file: string; color: string; title: string }>()
const mapEl = ref<HTMLElement | null>(null)
const error = ref('')
let map: import('leaflet').Map | undefined

onMounted(async () => {
  try {
    const [leaflet, data] = await Promise.all([
      import('leaflet'),
      $fetch<{ route: [number, number][] }>(props.file)
    ])
    if (!mapEl.value || !data.route?.length) throw new Error('Manjkajo točke trase.')
    const L = leaflet.default
    map = L.map(mapEl.value, {
      dragging: true,
      touchZoom: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      zoomControl: true
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors', maxZoom: 19
    }).addTo(map)
    const line = L.polyline(data.route, { color: props.color, weight: 5, opacity: .95 }).addTo(map)
    L.circleMarker(data.route[0], { radius: 6, color: props.color, fillColor: '#fff', fillOpacity: 1, weight: 3 }).addTo(map)
    L.circleMarker(data.route.at(-1)!, { radius: 6, color: props.color, fillColor: props.color, fillOpacity: 1, weight: 3 }).addTo(map)
    map.fitBounds(line.getBounds(), { padding: [28, 28] })
    setTimeout(() => map?.invalidateSize(), 0)
  } catch {
    error.value = 'Zemljevida trenutno ni mogoče prikazati.'
  }
})
onBeforeUnmount(() => map?.remove())
</script>

<template>
  <div class="runner-gpx-map-wrap">
    <div ref="mapEl" class="runner-gpx-map" role="application" :aria-label="`Zemljevid ture ${title}`" />
    <p v-if="error" class="runner-gpx-map-error">{{ error }}</p>
  </div>
</template>
