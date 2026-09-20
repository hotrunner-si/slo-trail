<script setup lang="ts">
import type { Race } from '~/types'
const props = defineProps<{ races: Race[] }>()
const hasDate = (race: Race) => Boolean(race.date && !Number.isNaN(new Date(race.date).getTime()))
const grouped = computed(() => Object.entries(props.races.reduce<Record<string,Race[]>>((acc,race) => {
  const key = hasDate(race) ? new Date(race.date).toLocaleDateString('sl-SI',{month:'long',year:'numeric'}) : 'Datum še ni objavljen'
  ;(acc[key] ||= []).push(race); return acc
},{})))
</script>
<template><div class="race-calendar"><section v-for="([month,items]) in grouped" :key="month"><header><h2>{{ month }}</h2><span class="mono">{{ items.length }} DOGODKOV</span></header><div><NuxtLink v-for="race in items" :key="race.id" :to="`/races/${race.slug}`"><time><strong>{{ hasDate(race) && race.dateStatus !== 'estimated' ? new Date(race.date).toLocaleDateString('sl-SI',{day:'2-digit'}) : '—' }}</strong>{{ hasDate(race) && race.dateStatus !== 'estimated' ? new Date(race.date).toLocaleDateString('sl-SI',{weekday:'short'}) : '' }}</time><span><b>{{ race.name }}</b><small>{{ race.location }} · {{ race.distances.map(d=>d.label).join(' / ') }}</small></span><em :class="['status',race.registrationStatus.toLowerCase().replaceAll(' ','-')]">{{ race.registrationStatus }}</em></NuxtLink></div></section></div></template>
