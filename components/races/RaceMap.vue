<script setup lang="ts">
import type { Race } from '~/types'
import { formatSlovenianCount, slovenianCountForms } from '~/utils/slovenianCount'
import { formatDate, parseIsoDate } from '~/utils/formatDate'
const props = defineProps<{ races: Race[]; activeId?: string; visible?: boolean }>()
const emit = defineEmits<{ activate: [id: string] }>()
const mapRef = ref<{ focusRace: (id: string) => void; resize: () => void } | null>(null)
const listRef = ref<HTMLElement | null>(null)
const trackRef = ref<HTMLElement | null>(null)
let trackScrollTimer: ReturnType<typeof setTimeout> | undefined
function focusFromList(id: string) {
  emit('activate', id)
  mapRef.value?.focusRace(id)
}
function selectSnappedCard(forceFocus = false) {
  const track = trackRef.value
  if (!track || !window.matchMedia('(max-width: 900px)').matches) return
  const snapLeft =
    track.getBoundingClientRect().left +
    track.clientLeft +
    Number.parseFloat(getComputedStyle(track).paddingLeft || '0')
  const cards = [...track.querySelectorAll<HTMLElement>('[data-race-id]')]
  const snapped = cards.reduce<HTMLElement | null>((closest, card) => {
    if (!closest) return card
    const cardDistance = Math.abs(card.getBoundingClientRect().left - snapLeft)
    const closestDistance = Math.abs(closest.getBoundingClientRect().left - snapLeft)
    return cardDistance < closestDistance ? card : closest
  }, null)
  const id = snapped?.dataset.raceId
  if (id && (forceFocus || id !== props.activeId)) focusFromList(id)
}
function handleTrackScroll() {
  if (!window.matchMedia('(max-width: 900px)').matches) return
  clearTimeout(trackScrollTimer)
  trackScrollTimer = setTimeout(selectSnappedCard, 160)
}
function revealInList(id: string) {
  const list = listRef.value
  const item = [...(list?.querySelectorAll<HTMLElement>('[data-race-id]') || [])].find(
    (element) => element.dataset.raceId === id,
  )
  if (!list || !item) return
  const track = trackRef.value
  if (track && track.scrollWidth > track.clientWidth + 1) {
    const horizontalOffset =
      item.getBoundingClientRect().left -
      track.getBoundingClientRect().left -
      track.clientLeft -
      Number.parseFloat(getComputedStyle(track).paddingLeft || '0')
    track.scrollTo({
      left: track.scrollLeft + horizontalOffset,
      behavior: 'smooth',
    })
    return
  }
  const offset = item.getBoundingClientRect().top - list.getBoundingClientRect().top
  list.scrollTo({
    top: list.scrollTop + offset - (list.clientHeight - item.clientHeight) / 2,
    behavior: 'smooth',
  })
}
onMounted(async () => {
  await nextTick()
  selectSnappedCard(true)
})
onBeforeUnmount(() => clearTimeout(trackScrollTimer))
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
    <div ref="listRef" class="map-side-list race-map-card-list">
      <div ref="trackRef" class="race-map-card-track" @scroll.passive="handleTrackScroll">
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
          ><span
            >{{ race.location }} ·
            {{ formatSlovenianCount(race.distances.length, slovenianCountForms.route) }}</span
          ></NuxtLink
        >
      </div>
    </div>
  </div>
</template>
