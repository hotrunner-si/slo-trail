<script setup lang="ts">
import type { Race } from '~/types'
import { effortCategory } from '~/utils/raceCategories'
const props = defineProps<{ races: Race[]; activeId?: string; visible?: boolean }>()
const emit = defineEmits<{ activate:[id:string] }>()
const mapRef = ref<{ focusRace: (id: string) => void; resize: () => void } | null>(null)
const listRef = ref<HTMLElement | null>(null)
function focusFromList(id: string) { emit('activate', id); mapRef.value?.focusRace(id) }
function revealInList(id: string) {
  const list = listRef.value
  const item = [...(list?.querySelectorAll<HTMLElement>('[data-race-id]') || [])].find(element => element.dataset.raceId === id)
  if (!list || !item) return
  const offset = item.getBoundingClientRect().top - list.getBoundingClientRect().top
  list.scrollTo({ top: list.scrollTop + offset - (list.clientHeight - item.clientHeight) / 2, behavior: 'smooth' })
}
watch(() => props.visible, async visible => { if (visible) { await nextTick(); mapRef.value?.resize() } })
const mainDistance = (race: Race) => race.distances.reduce((a,b) => a.km > b.km ? a : b)
const mappedRaces = computed(() => props.races.filter(race => race.mapPosition))
const dateLabel = (race: Race) => race.date && race.dateStatus !== 'estimated' && !Number.isNaN(new Date(race.date).getTime()) ? new Date(race.date).toLocaleDateString('sl-SI',{day:'2-digit',month:'short'}) : '—'
</script>
<template>
  <div class="race-map-layout">
    <LeafletRacesMap ref="mapRef" :races="races" :active-id="activeId" @activate="emit('activate', $event)" @route-hover="revealInList" />
    <div class="race-map race-map-legacy" role="img" aria-label="Zemljevid lokacij tekem v Sloveniji">
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <path class="slovenia-shape" d="M10 40L18 24 35 18 45 24 55 17 70 22 87 35 91 50 82 61 76 78 59 84 46 75 31 82 20 70 8 61Z"/>
        <path class="map-contours" d="M7 49c20-13 36-5 48-13s23-7 38 1M12 62c18-10 28-1 42-10s24-8 35 0M22 75c12-8 25-1 37-8s17-7 24-3"/>
      </svg>
      <button v-for="race in mappedRaces" :key="race.id" :class="['map-pin',`effort-${effortCategory(mainDistance(race)).toLowerCase()}`,{active:activeId===race.id}]" :style="{left:`${race.mapPosition?.x}%`,top:`${race.mapPosition?.y}%`}" :aria-label="race.name" @mouseenter="emit('activate',race.id)" @focus="emit('activate',race.id)" @click="emit('activate',race.id)"><i/><span>{{ race.location }}</span></button>
      <p v-if="!mappedRaces.length" class="map-empty">Lokacije bomo dodali ob preverjanju uradnih podatkov.</p>
      <div class="map-scale mono">SLOVENIJA · LOKACIJE</div>
    </div>
    <div ref="listRef" class="map-side-list">
      <NuxtLink v-for="race in races" :key="race.id" :data-race-id="race.id" :to="`/races/${race.slug}`" :class="{active:activeId===race.id}" @mouseenter="focusFromList(race.id)" @focus="focusFromList(race.id)"><time>{{ dateLabel(race) }}</time><strong>{{ race.name }}</strong><span>{{ race.location }} · {{ race.distances.length }} tras</span></NuxtLink>
    </div>
  </div>
</template>
