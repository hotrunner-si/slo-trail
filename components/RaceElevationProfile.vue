<script setup lang="ts">
import type { RaceDistance } from '~/types'
import { effortCategory } from '~/utils/raceCategories'

type ProfilePoint = { distanceKm: number; elevation: number }
const props = defineProps<{ distance: RaceDistance; data?: { detailedProfile?: ProfilePoint[]; profile?: number[]; distanceKm?: number }; hoverProgress?: number | null }>()
const emit = defineEmits<{ hover: [progress: number | null] }>()
const width=900,height=250,pad={left:58,right:18,top:18,bottom:34}
const profile=computed<ProfilePoint[]>(()=>props.data?.detailedProfile?.length?props.data.detailedProfile:(props.data?.profile||[]).map((elevation,index,array)=>({distanceKm:(index/Math.max(1,array.length-1))*(props.data?.distanceKm||props.distance.km),elevation})))
const actualMin=computed(()=>profile.value.length?Math.min(...profile.value.map(p=>p.elevation)):0)
const maxElevation=computed(()=>profile.value.length?Math.max(...profile.value.map(p=>p.elevation)):1)
const elevationSpan=computed(()=>Math.max(1,maxElevation.value-actualMin.value))
const maxDistance=computed(()=>profile.value.at(-1)?.distanceKm||props.distance.km||1)
const x=(km:number)=>pad.left+(km/maxDistance.value)*(width-pad.left-pad.right)
const y=(ele:number)=>pad.top+((maxElevation.value-ele)/elevationSpan.value)*(height-pad.top-pad.bottom)
const line=computed(()=>profile.value.map(p=>`${x(p.distanceKm).toFixed(1)},${y(p.elevation).toFixed(1)}`).join(' '))
const area=computed(()=>`${pad.left},${height-pad.bottom} ${line.value} ${width-pad.right},${height-pad.bottom}`)
const horizontal=computed(()=>Array.from({length:4},(_,i)=>{const ratio=i/3;return{y:pad.top+ratio*(height-pad.top-pad.bottom),label:Math.round(maxElevation.value-ratio*elevationSpan.value)}}))
const vertical=computed(()=>{const interval=Math.min(40,maxDistance.value/4);return Array.from({length:Math.ceil(maxDistance.value/interval)},(_,i)=>Math.min(maxDistance.value,(i+1)*interval)).filter((v,i,a)=>i===0||v>a[i-1])})
const hoverPoint=computed(()=>{if(props.hoverProgress==null||!profile.value.length)return null;return profile.value[Math.round(Math.max(0,Math.min(1,props.hoverProgress))*(profile.value.length-1))]})
function move(event:MouseEvent){const rect=(event.currentTarget as SVGElement).getBoundingClientRect();const px=(event.clientX-rect.left)/rect.width*width;emit('hover',Math.max(0,Math.min(1,(px-pad.left)/(width-pad.left-pad.right))))}
</script>

<template>
  <div :class="['race-detail-profile',`effort-${effortCategory(distance).toLowerCase()}`]">
    <svg :viewBox="`0 0 ${width} ${height}`" preserveAspectRatio="none" role="img" :aria-label="`Višinski profil trase ${distance.name || distance.label}`" @mousemove="move" @mouseleave="emit('hover',null)">
      <g class="profile-grid"><g v-for="tick in horizontal" :key="tick.y"><line :x1="pad.left" :x2="width-pad.right" :y1="tick.y" :y2="tick.y"/><text x="4" :y="tick.y+4">{{ tick.label }} m</text></g><g v-for="km in vertical" :key="km"><line :x1="x(km)" :x2="x(km)" :y1="pad.top" :y2="height-pad.bottom"/><text :x="x(km)" :y="height-9" text-anchor="middle">{{ Number(km.toFixed(1)) }} km</text></g></g>
      <polygon v-if="profile.length" :points="area"/><polyline v-if="profile.length" :points="line"/>
      <g v-if="hoverPoint" class="profile-hover"><line :x1="x(hoverPoint.distanceKm)" :x2="x(hoverPoint.distanceKm)" :y1="pad.top" :y2="height-pad.bottom"/><circle :cx="x(hoverPoint.distanceKm)" :cy="y(hoverPoint.elevation)" r="6"/><text :x="Math.min(width-105,x(hoverPoint.distanceKm)+10)" :y="Math.max(18,y(hoverPoint.elevation)-10)">{{ hoverPoint.distanceKm.toFixed(1) }} km · {{ hoverPoint.elevation }} m</text></g>
    </svg>
  </div>
</template>
