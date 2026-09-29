<script setup lang="ts">
import type { Race } from '~/types'
import { formatSlovenianCount, slovenianCountForms } from '~/utils/slovenianCount'
import { formatDate, parseIsoDate } from '~/utils/formatDate'
const props = defineProps<{ races: Race[]; activeId?: string; visible?: boolean }>()
const emit = defineEmits<{ activate: [id: string] }>()
const mapRef = ref<{ focusRace: (id: string) => void; resize: () => void } | null>(null)
const listRef = ref<HTMLElement | null>(null)
function focusFromList(id: string) {
  emit('activate', id)
  mapRef.value?.focusRace(id)
}
function revealInList(id: string) {
  const list = listRef.value
  const item = [...(list?.querySelectorAll<HTMLElement>('[data-race-id]') || [])].find(
    (element) => element.dataset.raceId === id,
  )
  if (!list || !item) return
  const offset = item.getBoundingClientRect().top - list.getBoundingClientRect().top
  list.scrollTo({
    top: list.scrollTop + offset - (list.clientHeight - item.clientHeight) / 2,
    behavior: 'smooth',
  })
}
watch(
  () => props.visible,
  async (visible) => {
    if (visible) {
      await nextTick()
      mapRef.value?.resize()
    }
  },
)
const dateLabel = (race: Race) =>
  race.date && race.dateStatus !== 'estimated' && parseIsoDate(race.date)
    ? formatDate(race.date, { day: '2-digit', month: 'short' })
    : '—'
</script>
<template>
  <div class="race-map-layout">
    <MapboxRacesMap
      ref="mapRef"
      :races="races"
      :active-id="activeId"
      @activate="emit('activate', $event)"
      @route-hover="revealInList"
    />
    <div ref="listRef" class="map-side-list">
      <NuxtLink
        v-for="race in races"
        :key="race.id"
        :data-race-id="race.id"
        :to="`/races/${race.slug}`"
        :class="{ active: activeId === race.id }"
        @mouseenter="focusFromList(race.id)"
        @focus="focusFromList(race.id)"
        ><time>{{ dateLabel(race) }}</time
        ><strong>{{ race.name }}</strong
        ><span>{{ race.location }} · {{ formatSlovenianCount(race.distances.length, slovenianCountForms.route) }}</span></NuxtLink
      >
    </div>
  </div>
</template>
