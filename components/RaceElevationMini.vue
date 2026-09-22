<script setup lang="ts">
import type { RaceDistance } from '~/types'
import { effortCategory, effortKm, effortLabel } from '~/utils/raceCategories'

const props = defineProps<{ distance: RaceDistance; raceId: string }>()
const category = computed(() => effortCategory(props.distance))
type Gpx={profile?:number[]};const gpx=ref<Gpx|null>(null)
let loadVersion=0
onMounted(()=>watch(()=>props.distance.gpx?.file,async file=>{
  const version=++loadVersion
  gpx.value=null
  if(props.distance.gpx?.profile||!file)return
  try{const loaded=await $fetch<Gpx>(file);if(version===loadVersion)gpx.value=loaded}catch{/* use the generated fallback profile */}
},{immediate:true}))
const points = computed(() => {
  const source=props.distance.gpx?.profile||gpx.value?.profile
  if(source?.length){const min=Math.min(...source),max=Math.max(...source),span=Math.max(1,max-min);return source.map((elevation,index)=>`${((index/(source.length-1))*180).toFixed(2)},${(66-((elevation-min)/span)*56).toFixed(2)}`).join(' ')}
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
