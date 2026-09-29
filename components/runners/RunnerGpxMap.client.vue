<script setup lang="ts">
import 'mapbox-gl/dist/mapbox-gl.css'
import type { GpxData } from '~/types/gpx'

const lifetime = useComponentLifetime()
const props = defineProps<{
  data: GpxData
  activeDistanceKm: number
  color: string
  title: string
}>()
const emit = defineEmits<{ 'distance-change': [distanceKm: number] }>()
const config = useRuntimeConfig()
const mapEl = ref<HTMLElement | null>(null)
const error = ref('')
let mb: typeof import('mapbox-gl') | null = null
let map: import('mapbox-gl').Map | null = null
let route: [number, number][] = []
let profile: NonNullable<GpxData['detailedProfile']> = []

function nearestIndexForDistance(distanceKm: number) {
  let nearestIndex = 0
  for (let index = 1; index < profile.length; index++) {
    if (
      Math.abs(profile[index]!.distanceKm - distanceKm) <
      Math.abs(profile[nearestIndex]!.distanceKm - distanceKm)
    ) nearestIndex = index
  }
  return nearestIndex
}

function updateMarker(distanceKm: number) {
  if (!map || !route.length) return
  const source = map.getSource('runner-gpx-active-point') as
    | import('mapbox-gl').GeoJSONSource
    | undefined
  const point = route[nearestIndexForDistance(distanceKm)]
  if (!source || !point) return
  source.setData({
    type: 'Feature',
    properties: {},
    geometry: { type: 'Point', coordinates: [point[1], point[0]] },
  })
}

function selectNearest(lng: number, lat: number) {
  let nearestIndex = 0
  const longitudeScale = Math.cos((lat * Math.PI) / 180)
  for (let index = 1; index < route.length; index++) {
    const [latitude, longitude] = route[index]!
    const [nearestLatitude, nearestLongitude] = route[nearestIndex]!
    const currentDistance =
      (latitude - lat) ** 2 + ((longitude - lng) * longitudeScale) ** 2
    const nearestDistance =
      (nearestLatitude - lat) ** 2 + ((nearestLongitude - lng) * longitudeScale) ** 2
    if (currentDistance < nearestDistance) nearestIndex = index
  }
  const point = profile[nearestIndex]
  if (point) {
    updateMarker(point.distanceKm)
    emit('distance-change', point.distanceKm)
  }
}

function drawRoute(data: GpxData) {
  if (!map || !map.isStyleLoaded()) return
  route = data.route || []
  profile = data.detailedProfile || []
  if (!route.length || route.length !== profile.length) {
    error.value = 'Manjkajo usklajene točke trase in profila.'
    return
  }
  error.value = ''

  const coordinates = route.map(([latitude, longitude]) => [longitude, latitude] as [number, number])
  const routeFeature = {
    type: 'Feature' as const,
    properties: {},
    geometry: { type: 'LineString' as const, coordinates },
  }
  const bounds = coordinates.reduce(
    (current, coordinate) => current.extend(coordinate),
    new mb!.default.LngLatBounds(coordinates[0]!, coordinates[0]!),
  )

  if (map.getSource('runner-gpx-route')) {
    ;(map.getSource('runner-gpx-route') as import('mapbox-gl').GeoJSONSource).setData(routeFeature)
    ;(map.getSource('runner-gpx-endpoints') as import('mapbox-gl').GeoJSONSource).setData({
      type: 'FeatureCollection',
      features: [coordinates[0], coordinates.at(-1)].map((point, index) => ({
        type: 'Feature' as const,
        properties: { kind: index === 0 ? 'start' : 'finish' },
        geometry: { type: 'Point' as const, coordinates: point! },
      })),
    })
  } else {
    map.addSource('runner-gpx-route', { type: 'geojson', data: routeFeature })
    map.addLayer({
      id: 'runner-gpx-route-line',
      type: 'line',
      source: 'runner-gpx-route',
      paint: {
        'line-color': props.color,
        'line-width': 5,
        'line-opacity': 0.95,
        'line-cap': 'round',
        'line-join': 'round',
      },
    })
    map.addSource('runner-gpx-endpoints', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [coordinates[0], coordinates.at(-1)].map((point, index) => ({
          type: 'Feature' as const,
          properties: { kind: index === 0 ? 'start' : 'finish' },
          geometry: { type: 'Point' as const, coordinates: point! },
        })),
      },
    })
    map.addLayer({
      id: 'runner-gpx-endpoint-circles',
      type: 'circle',
      source: 'runner-gpx-endpoints',
      paint: {
        'circle-radius': 6,
        'circle-color': ['match', ['get', 'kind'], 'start', '#fff', props.color],
        'circle-stroke-color': props.color,
        'circle-stroke-width': 3,
      },
    })
    map.addSource('runner-gpx-active-point', {
      type: 'geojson',
      data: { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: coordinates[0]! } },
    })
    map.addLayer({
      id: 'runner-gpx-active-circle',
      type: 'circle',
      source: 'runner-gpx-active-point',
      paint: {
        'circle-radius': 7,
        'circle-color': props.color,
        'circle-stroke-color': '#fff',
        'circle-stroke-width': 3,
      },
    })
    map.on('mousemove', 'runner-gpx-route-line', (event) => {
      if (event.lngLat) selectNearest(event.lngLat.lng, event.lngLat.lat)
    })
    map.on('click', 'runner-gpx-route-line', (event) => {
      if (event.lngLat) selectNearest(event.lngLat.lng, event.lngLat.lat)
    })
    map.on('mouseenter', 'runner-gpx-route-line', () => {
      if (map) map.getCanvas().style.cursor = 'crosshair'
    })
    map.on('mouseleave', 'runner-gpx-route-line', () => {
      if (map) map.getCanvas().style.cursor = ''
    })
  }

  map.fitBounds(bounds, { padding: 28, maxZoom: 15, animate: false })
  updateMarker(props.activeDistanceKm)
}

onMounted(async () => {
  await nextTick()
  if (!mapEl.value) return
  const token = String(config.public.mapboxToken || '')
  if (!token) {
    error.value = 'Zemljevida trenutno ni mogoče prikazati.'
    return
  }
  try {
    mb = await import('mapbox-gl')
    if (!lifetime.active || !mapEl.value) return
    mb.default.accessToken = token
    map = new mb.default.Map({
      container: mapEl.value,
      style: String(config.public.runnerMapboxStyle || config.public.mapboxStyle),
      center: props.data.route?.length
        ? [props.data.route[0]![1], props.data.route[0]![0]]
        : [14.8, 46.2],
      zoom: 10,
    })
    map.addControl(new mb.default.NavigationControl({ showCompass: false }), 'top-right')
    map.on('load', () => drawRoute(props.data))
    map.on('error', (event) => {
      if (event.error) error.value = 'Zemljevida trenutno ni mogoče prikazati.'
    })
  } catch {
    error.value = 'Zemljevida trenutno ni mogoče prikazati.'
  }
})

watch(() => props.data, (data) => {
  if (map?.isStyleLoaded()) drawRoute(data)
})
watch(() => props.activeDistanceKm, updateMarker)
watch(() => props.color, (color) => {
  if (!map?.getLayer('runner-gpx-route-line')) return
  map.setPaintProperty('runner-gpx-route-line', 'line-color', color)
  map.setPaintProperty('runner-gpx-endpoint-circles', 'circle-stroke-color', color)
  map.setPaintProperty('runner-gpx-endpoint-circles', 'circle-color', ['match', ['get', 'kind'], 'start', '#fff', color])
  map.setPaintProperty('runner-gpx-active-circle', 'circle-color', color)
})

onBeforeUnmount(() => map?.remove())
</script>

<template>
  <div class="runner-gpx-map-wrap">
    <div
      ref="mapEl"
      class="runner-gpx-map mapbox-map"
      role="application"
      :aria-label="`Zemljevid ture ${title}`"
    />
    <p v-if="error" class="runner-gpx-map-error">{{ error }}</p>
  </div>
</template>
