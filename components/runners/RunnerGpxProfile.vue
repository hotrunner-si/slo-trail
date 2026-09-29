<script setup lang="ts">
import type { GpxProfilePoint } from '~/types/gpx'

const props = defineProps<{
  profile: GpxProfilePoint[]
  activeDistanceKm: number
  color: string
  label: string
}>()
const emit = defineEmits<{ 'distance-change': [distanceKm: number] }>()
const width = 100
const height = 56
const number = (value: number) =>
  new Intl.NumberFormat('sl-SI', { maximumFractionDigits: 1 }).format(value)
const validPoints = computed(() => props.profile.filter((point) => point.elevation != null))
const maxDistanceKm = computed(() => props.profile.at(-1)?.distanceKm || 0)
const minElevation = computed(() =>
  Math.min(...validPoints.value.map((point) => point.elevation as number)),
)
const elevationRange = computed(() =>
  Math.max(
    ...validPoints.value.map((point) => point.elevation as number),
    minElevation.value + 1,
  ) - minElevation.value,
)
const xy = (point: GpxProfilePoint) => ({
  x: maxDistanceKm.value ? (point.distanceKm / maxDistanceKm.value) * width : 0,
  y:
    height -
    5 -
    (((point.elevation ?? minElevation.value) - minElevation.value) / elevationRange.value) *
      (height - 10),
})
const linePoints = computed(() =>
  validPoints.value.map((point) => {
    const { x, y } = xy(point)
    return `${x.toFixed(2)},${y.toFixed(2)}`
  }).join(' '),
)
const nearestPoint = computed(() =>
  props.profile.reduce<GpxProfilePoint | null>((nearest, point) => {
    if (point.elevation == null) return nearest
    return !nearest ||
      Math.abs(point.distanceKm - props.activeDistanceKm) <
        Math.abs(nearest.distanceKm - props.activeDistanceKm)
      ? point
      : nearest
  }, null),
)
const cursor = computed(() => (nearestPoint.value ? xy(nearestPoint.value) : { x: 0, y: 0 }))
const cursorStyle = computed(() => ({
  left: `${cursor.value.x}%`,
  top: `${(cursor.value.y / height) * 100}%`,
}))

function updateDistance(event: PointerEvent) {
  const bounds = (event.currentTarget as SVGSVGElement).getBoundingClientRect()
  if (!bounds.width || !maxDistanceKm.value) return
  const ratio = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width))
  emit('distance-change', ratio * maxDistanceKm.value)
}

function moveByKeyboard(event: KeyboardEvent) {
  const step = event.shiftKey ? 1 : 0.1
  if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
    event.preventDefault()
    emit('distance-change', Math.max(0, props.activeDistanceKm - step))
  } else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
    event.preventDefault()
    emit('distance-change', Math.min(maxDistanceKm.value, props.activeDistanceKm + step))
  } else if (event.key === 'Home') {
    event.preventDefault()
    emit('distance-change', 0)
  } else if (event.key === 'End') {
    event.preventDefault()
    emit('distance-change', maxDistanceKm.value)
  }
}
</script>

<template>
  <div class="runner-gpx-interactive-profile" :style="{ '--route-color': color }">
    <div class="runner-gpx-profile-chart">
      <svg
        viewBox="0 0 100 56"
        preserveAspectRatio="none"
        role="slider"
        tabindex="0"
        :aria-label="label"
        aria-valuemin="0"
        :aria-valuemax="maxDistanceKm"
        :aria-valuenow="nearestPoint?.distanceKm || 0"
        :aria-valuetext="nearestPoint ? `${number(nearestPoint.distanceKm)} km, ${number(Math.round(nearestPoint.elevation!))} m` : ''"
        @pointermove="updateDistance"
        @pointerdown="updateDistance"
        @keydown="moveByKeyboard"
      >
        <polygon v-if="linePoints" :points="`0,56 ${linePoints} 100,56`" />
        <polyline v-if="linePoints" :points="linePoints" />
        <line v-if="nearestPoint" :x1="cursor.x" y1="3" :x2="cursor.x" y2="53" />
      </svg>
      <span v-if="nearestPoint" class="runner-gpx-profile-dot" :style="cursorStyle" />
    </div>
    <div class="runner-gpx-profile-reading mono">
      <span>
        <small>RAZDALJA</small>
        <strong>{{ nearestPoint ? `${number(nearestPoint.distanceKm)} km` : '— km' }}</strong>
      </span>
      <span>
        <small>NADMORSKA VIŠINA</small>
        <strong>{{ nearestPoint ? `${number(Math.round(nearestPoint.elevation!))} m` : '— m' }}</strong>
      </span>
    </div>
  </div>
</template>
