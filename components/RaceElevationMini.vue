<script setup lang="ts">
import type { RaceDistance } from '~/types'
import { effortCategory, effortKm, effortLabel } from '~/utils/raceCategories'

const props = defineProps<{ distance: RaceDistance; raceId: string }>()
const category = computed(() => effortCategory(props.distance))
const points = computed(() => {
  const seed = [...`${props.raceId}-${props.distance.km}-${props.distance.elevation}`].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  const count = 12
  const heights = Array.from({ length: count }, (_, index) => {
    const wave = Math.sin((index + seed % 5) * .82) * 15 + Math.sin((index + seed % 7) * 1.71) * 8
    const climb = index < count * .58 ? index * 3.2 : (count - index) * 2.4
    return Math.max(12, Math.min(58, 22 + wave + climb))
  })
  heights[0] = 10; heights[count - 1] = 12
  return heights.map((height, index) => `${((index / (count - 1)) * 180).toFixed(2)},${(68 - height).toFixed(2)}`).join(' ')
})
const areaPoints = computed(() => `0,70 ${points.value} 180,70`)
</script>

<template>
  <div :class="['race-mini-profile', `effort-${category.toLowerCase()}`]" :aria-label="`Višinski profil ${distance.km} km, ${distance.elevation} metrov vzpona`">
    <div class="mini-profile-meta"><span>{{ effortLabel(distance) }}</span><strong>{{ effortKm(distance).toLocaleString('sl-SI') }} EFF</strong></div>
    <svg viewBox="0 0 180 72" preserveAspectRatio="none" aria-hidden="true">
      <polygon :points="areaPoints" />
      <polyline :points="points" />
    </svg>
  </div>
</template>
