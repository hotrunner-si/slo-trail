<script setup lang="ts">
import { elevationPoints } from '~/utils/gpx'
const props = withDefaults(
  defineProps<{
    profile: number[]
    width?: number
    height?: number
    top?: number
    bottom?: number
    label?: string
  }>(),
  {
    width: 100,
    height: 42,
    top: 6,
    bottom: 4,
    label: 'Višinski profil',
  },
)
const points = computed(() =>
  elevationPoints(props.profile, props.width, props.height, props.top, props.bottom),
)
</script>
<template>
  <svg
    :viewBox="`0 0 ${width} ${height}`"
    preserveAspectRatio="none"
    role="img"
    :aria-label="label"
  >
    <polygon v-if="points" :points="`0,${height} ${points} ${width},${height}`" />
    <polyline v-if="points" :points="points" />
  </svg>
</template>
