<script setup lang="ts">
import type { Race } from '~/types'
import { formatSlovenianCount, slovenianCountForms } from '~/utils/slovenianCount'
import { formatDate, parseIsoDate } from '~/utils/formatDate'
const props = withDefaults(
  defineProps<{
    races: Race[]
    showProfile?: boolean
    showCompare?: boolean
    activeId?: string
    comparedKeys?: string[]
  }>(),
  {
    showProfile: false,
    showCompare: false,
    activeId: '',
    comparedKeys: () => [],
  },
)
const emit = defineEmits<{ activate: [id: string]; compare: [race: Race, index: number] }>()
const navigateToRace = (race: Race) => navigateTo(`/races/${race.slug}`)
const onRowKeydown = (event: KeyboardEvent, race: Race) => {
  if (event.target !== event.currentTarget || (event.key !== 'Enter' && event.key !== ' ')) return
  event.preventDefault()
  void navigateToRace(race)
}
const selected = ref<Record<string, number>>({})
const selectedIndex = (race: Race) =>
  selected.value[race.id] ??
  race.distances.reduce(
    (longest, distance, index) => (distance.km > race.distances[longest].km ? index : longest),
    0,
  )
const setDistance = (race: Race, index: number) => {
  selected.value[race.id] = index
}
const hasDate = (race: Race) => Boolean(parseIsoDate(race.date))
const dateLabel = (race: Race) =>
  !hasDate(race) || race.dateStatus === 'estimated'
    ? '—'
    : race.dateEnd
      ? `${formatDate(race.date, { day: '2-digit' })}–${formatDate(race.dateEnd, { day: '2-digit' })}`
      : formatDate(race.date, { day: '2-digit' })
const statusClass = (race: Race) => race.registrationStatus.toLowerCase().replaceAll(' ', '-')
const groups = computed(() => {
  const result = new Map<string, { label: string; races: Race[] }>()
  for (const race of props.races) {
    const date = hasDate(race) && race.dateStatus !== 'estimated' ? parseIsoDate(race.date) : null
    const key = date
      ? `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
      : 'undated'
    const label = date
      ? formatDate(race.date, { month: 'long', year: 'numeric' })
      : 'Datum še ni objavljen'
    if (!result.has(key)) result.set(key, { label, races: [] })
    result.get(key)!.races.push(race)
  }
  return [...result.entries()]
    .sort(([a], [b]) =>
      a === b ? 0 : a === 'undated' ? 1 : b === 'undated' ? -1 : a.localeCompare(b),
    )
    .map(([, group]) => ({
      ...group,
      races: [...group.races].sort((a, b) => a.date.localeCompare(b.date)),
    }))
})
</script>
<template>
  <div class="race-list-months">
    <section v-for="group in groups" :key="group.label" class="race-list-month">
      <header>
        <h2>{{ group.label }}</h2>
        <span class="mono">{{
          formatSlovenianCount(group.races.length, slovenianCountForms.event).toLocaleUpperCase(
            'sl-SI',
          )
        }}</span>
      </header>
      <div :class="['event-list', { 'with-profiles': showProfile, 'with-compare': showCompare }]">
        <article
          v-for="race in group.races"
          :key="race.id"
          :class="['event-row', { highlighted: activeId === race.id }]"
          role="link"
          tabindex="0"
          :aria-label="`Odpri tekmo ${race.name}`"
          @click="navigateToRace(race)"
          @keydown="onRowKeydown($event, race)"
          @mouseenter="emit('activate', race.id)"
          @focusin="emit('activate', race.id)"
        >
          <time :datetime="race.date || undefined"
            ><span>{{ dateLabel(race) }}</span></time
          >
          <div class="event-main">
            <NuxtLink :to="`/races/${race.slug}`"
              ><h3>{{ race.name }}</h3></NuxtLink
            >
            <p>{{ race.location }} · {{ race.region }}</p>
          </div>
          <div class="event-distance" aria-label="Izberi razdaljo">
            <button
              v-for="(distance, index) in race.distances"
              :key="distance.label"
              :class="{ active: selectedIndex(race) === index }"
              :aria-pressed="selectedIndex(race) === index"
              @click.stop
              @click="setDistance(race, index)"
            >
              {{ distance.label }}
            </button>
          </div>
          <div class="event-gain mono">
            {{ race.distances[selectedIndex(race)].elevation.toLocaleString('sl-SI') }} M+
          </div>
          <span :class="['status', statusClass(race)]">{{ race.registrationStatus }}</span>
          <RaceElevationMini
            v-if="showProfile"
            :distance="race.distances[selectedIndex(race)]"
            :race-id="race.id"
          />
          <button
            v-if="showCompare"
            class="compare-button"
            :class="{ active: comparedKeys.includes(`${race.id}:${selectedIndex(race)}`) }"
            :aria-label="`Primerjaj ${race.name}, ${race.distances[selectedIndex(race)].label}`"
            @click.stop
            @click="emit('compare', race, selectedIndex(race))"
          >
            {{ comparedKeys.includes(`${race.id}:${selectedIndex(race)}`) ? '✓' : '+' }}
          </button>
        </article>
      </div>
    </section>
  </div>
</template>
