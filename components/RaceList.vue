<script setup lang="ts">
import type { Race } from '~/types'
const props = withDefaults(defineProps<{ races: Race[]; showProfile?: boolean; density?: 'comfortable' | 'compact'; activeId?: string; comparedKeys?: string[] }>(), { showProfile: false, density: 'comfortable', activeId: '', comparedKeys: () => [] })
const emit = defineEmits<{ activate:[id:string]; compare:[race:Race,index:number] }>()
const selected = ref<Record<string, number>>({})
const selectedIndex = (race: Race) => selected.value[race.id] ?? (race.id.charCodeAt(race.id.length - 1) % race.distances.length)
const setDistance = (race: Race, index: number) => { selected.value[race.id] = index }
const hasDate = (race: Race) => Boolean(race.date && !Number.isNaN(new Date(race.date).getTime()))
const dateLabel = (race: Race) => !hasDate(race) || race.dateStatus === 'estimated' ? '—' : race.dateEnd
  ? `${new Date(race.date).toLocaleDateString('sl-SI',{day:'2-digit'})}–${new Date(race.dateEnd).toLocaleDateString('sl-SI',{day:'2-digit'})}`
  : new Date(race.date).toLocaleDateString('sl-SI',{day:'2-digit'})
const monthLabel = (race: Race) => hasDate(race) && race.dateStatus !== 'estimated' ? new Date(race.date).toLocaleDateString('sl-SI',{month:'short'}).replace('.','') : ''
const statusClass = (race: Race) => race.registrationStatus.toLowerCase().replaceAll(' ', '-')
</script>
<template>
  <div :class="['event-list', `density-${density}`, { 'with-profiles': showProfile }]">
    <article v-for="race in races" :key="race.id" :class="['event-row', { highlighted: activeId===race.id }]" @mouseenter="emit('activate',race.id)" @focusin="emit('activate',race.id)">
      <time :datetime="race.date || undefined"><span>{{ dateLabel(race) }}</span>{{ monthLabel(race) }}</time>
      <div class="event-main"><NuxtLink :to="`/races/${race.slug}`"><h3>{{ race.name }}</h3></NuxtLink><p>{{ race.location }} · {{ race.region }}</p></div>
      <div class="event-distance" aria-label="Izberi razdaljo">
        <button v-for="(distance,index) in race.distances" :key="distance.label" :class="{ active:selectedIndex(race)===index }" :aria-pressed="selectedIndex(race)===index" @click="setDistance(race,index)">{{ distance.label }}</button>
      </div>
      <div class="event-gain mono">{{ race.distances[selectedIndex(race)].elevation.toLocaleString('sl-SI') }} M+</div>
      <span :class="['status', statusClass(race)]">{{ race.registrationStatus }}</span>
      <RaceElevationMini v-if="showProfile" :distance="race.distances[selectedIndex(race)]" :race-id="race.id" />
      <button class="compare-button" :class="{ active: comparedKeys.includes(`${race.id}:${selectedIndex(race)}`) }" :aria-label="`Primerjaj ${race.name}, ${race.distances[selectedIndex(race)].label}`" @click="emit('compare',race,selectedIndex(race))">{{ comparedKeys.includes(`${race.id}:${selectedIndex(race)}`) ? '✓' : '+' }}</button>
      <NuxtLink :to="`/races/${race.slug}`" class="row-arrow" :aria-label="`Odpri ${race.name}`">↗</NuxtLink>
    </article>
  </div>
</template>
