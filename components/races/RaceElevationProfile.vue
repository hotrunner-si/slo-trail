<script setup lang="ts">
import type { RaceDistance } from '~/types'
import type { GpxData } from '~/types/gpx'
import { effortCategory } from '~/utils/raceCategories'

type ProfilePoint = { distanceKm: number; elevation: number }
const props = defineProps<{
  distance: RaceDistance
  data?: GpxData
  hoverProgress?: number | null
}>()
const emit = defineEmits<{ hover: [progress: number | null] }>()
const width = ref(900)
const height = 250
const profileContainer = ref<HTMLElement | null>(null)
let resizeObserver: ResizeObserver | undefined
onMounted(() => {
  if (!profileContainer.value) return
  resizeObserver = new ResizeObserver(([entry]) => {
    if (entry) width.value = Math.max(1, Math.round(entry.contentRect.width))
  })
  resizeObserver.observe(profileContainer.value)
})
onBeforeUnmount(() => resizeObserver?.disconnect())
const pad = { left: 58, right: 18, top: 18, bottom: 34 }
const profile = computed<ProfilePoint[]>(() =>
  props.data?.detailedProfile?.length
    ? props.data.detailedProfile.filter(
        (point): point is ProfilePoint =>
          point.elevation != null && Number.isFinite(point.elevation),
      )
    : (props.data?.profile || []).map((elevation, index, array) => ({
        distanceKm:
          (index / Math.max(1, array.length - 1)) * (props.data?.distanceKm || props.distance.km),
        elevation,
      })),
)
const actualMin = computed(() =>
  profile.value.length ? Math.min(...profile.value.map((p) => p.elevation)) : 0,
)
const actualMax = computed(() =>
  profile.value.length ? Math.max(...profile.value.map((p) => p.elevation)) : 1,
)
const elevationScale = computed(() => {
  const range = Math.max(0, actualMax.value - actualMin.value)
  const rounding = range > 300 ? 50 : 10
  const margin = Math.max(rounding / 2, range * 0.08)
  const roundedMin = Math.floor((actualMin.value - margin) / rounding) * rounding
  const min = actualMin.value >= 0 ? Math.max(0, roundedMin) : roundedMin
  const interval = Math.max(
    rounding,
    Math.ceil((actualMax.value + margin - min) / (3 * rounding)) * rounding,
  )
  return { min, max: min + 3 * interval, interval }
})
const elevationInterval = computed(() => elevationScale.value.interval)
const scaleMin = computed(() => elevationScale.value.min)
const scaleMax = computed(() => elevationScale.value.max)
const elevationSpan = computed(() => Math.max(1, scaleMax.value - scaleMin.value))
const maxDistance = computed(() => profile.value.at(-1)?.distanceKm || props.distance.km || 1)
const x = (km: number) => pad.left + (km / maxDistance.value) * (width.value - pad.left - pad.right)
const y = (ele: number) =>
  pad.top + ((scaleMax.value - ele) / elevationSpan.value) * (height - pad.top - pad.bottom)
const line = computed(() =>
  profile.value.map((p) => `${x(p.distanceKm).toFixed(1)},${y(p.elevation).toFixed(1)}`).join(' '),
)
const area = computed(
  () =>
    `${pad.left},${height - pad.bottom} ${line.value} ${width.value - pad.right},${height - pad.bottom}`,
)
const horizontal = computed(() =>
  Array.from({ length: 4 }, (_, i) => {
    const elevation = scaleMin.value + i * elevationInterval.value
    return { y: y(elevation), label: elevation }
  }),
)
const vertical = computed(() => {
  const interval = Math.min(40, maxDistance.value / 4)
  return Array.from({ length: Math.ceil(maxDistance.value / interval) }, (_, i) =>
    Math.min(maxDistance.value, (i + 1) * interval),
  ).filter((v, i, a) => i === 0 || v > a[i - 1])
})
const hoverPoint = computed(() => {
  if (props.hoverProgress == null || !profile.value.length) return null
  return profile.value[
    Math.round(Math.max(0, Math.min(1, props.hoverProgress)) * (profile.value.length - 1))
  ]
})
function move(event: PointerEvent) {
  if (
    event.pointerType !== 'mouse' &&
    !(event.currentTarget as SVGElement).hasPointerCapture(event.pointerId)
  )
    return
  const rect = (event.currentTarget as SVGElement).getBoundingClientRect()
  const px = ((event.clientX - rect.left) / rect.width) * width.value
  emit('hover', Math.max(0, Math.min(1, (px - pad.left) / (width.value - pad.left - pad.right))))
}
function startTouch(event: PointerEvent) {
  if (event.pointerType === 'mouse') return
  const svg = event.currentTarget as SVGElement
  svg.setPointerCapture(event.pointerId)
  move(event)
}
function stopTouch(event: PointerEvent) {
  if (event.pointerType === 'mouse') return
  const svg = event.currentTarget as SVGElement
  if (svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId)
  emit('hover', null)
}
</script>

<template>
  <div :class="['race-detail-profile', `effort-${effortCategory(distance).toLowerCase()}`]">
    <p v-if="!profile.length" class="profile-unavailable">Profil ni na voljo</p>
    <svg
      v-else
      ref="profileContainer"
      :viewBox="`0 0 ${width} ${height}`"
      preserveAspectRatio="none"
      role="img"
      :aria-label="`Višinski profil trase ${distance.name || distance.label}`"
      @pointerdown="startTouch"
      @pointermove="move"
      @pointerup="stopTouch"
      @pointercancel="stopTouch"
      @pointerleave="
        (event) => {
          if (event.pointerType === 'mouse') emit('hover', null)
        }
      "
    >
      <g class="profile-grid">
        <g v-for="(tick, index) in horizontal" :key="tick.y">
          <line
            :class="{ 'profile-grid-baseline': index === 0 }"
            :x1="pad.left"
            :x2="width - pad.right"
            :y1="tick.y"
            :y2="tick.y"
          />
          <text x="4" :y="tick.y + 4">{{ tick.label }} m</text>
        </g>
        <g v-for="km in vertical" :key="km">
          <line :x1="x(km)" :x2="x(km)" :y1="pad.top" :y2="height - pad.bottom" />
          <text :x="x(km)" :y="height - 9" text-anchor="middle">
            {{ Number(km.toFixed(1)) }} km
          </text>
        </g>
      </g>
      <polygon v-if="profile.length" :points="area" />
      <polyline v-if="profile.length" :points="line" />
      <g v-if="hoverPoint" class="profile-hover">
        <line
          :x1="x(hoverPoint.distanceKm)"
          :x2="x(hoverPoint.distanceKm)"
          :y1="pad.top"
          :y2="height - pad.bottom"
        />
        <circle :cx="x(hoverPoint.distanceKm)" :cy="y(hoverPoint.elevation)" r="4" />
        <text
          :x="Math.min(width - 105, x(hoverPoint.distanceKm) + 10)"
          :y="Math.max(18, y(hoverPoint.elevation) - 10)"
        >
          {{ hoverPoint.distanceKm.toFixed(1) }} km · {{ Math.round(hoverPoint.elevation) }} m
        </text>
      </g>
    </svg>
  </div>
</template>
