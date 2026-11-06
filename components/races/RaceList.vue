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
    (longest, distance, index) =>
      distance.km > (race.distances[longest]?.km ?? -Infinity) ? index : longest,
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
    const date = parseIsoDate(race.date)
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
          <time :datetime="race.dateStatus !== 'estimated' && hasDate(race) ? race.date : undefined"
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
            <span class="event-gain-label">Vzpon</span>
            <IconArrowUpRight />
            {{ race.distances[selectedIndex(race)]?.elevation.toLocaleString('sl-SI') ?? '—' }} m
          </div>
          <span :class="['status', statusClass(race)]">{{ race.registrationStatus }}</span>
          <RaceElevationMini
            v-if="showProfile && race.distances[selectedIndex(race)]"
            :distance="race.distances[selectedIndex(race)]!"
            :race-id="race.id"
          />
          <button
            v-if="showCompare && race.distances[selectedIndex(race)]"
            class="compare-button"
            :class="{ active: comparedKeys.includes(`${race.id}:${selectedIndex(race)}`) }"
            :aria-label="`Primerjaj ${race.name}, ${race.distances[selectedIndex(race)]?.label}`"
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

<style scoped>
/* Compact list: shared by the homepage and race browser. */
@media (max-width: 1272px) {
  .event-list.with-profiles .event-row,
  .event-list.with-profiles.with-compare .event-row {
    grid-template-columns: 62px minmax(0, 1.1fr) minmax(120px, .9fr) 145px;
    gap: 18px;
  }
  .event-list.with-profiles .event-row time { grid-column: 1; grid-row: 1; }
  .event-list.with-profiles .event-main { grid-column: 2; grid-row: 1; min-width: 0; }
  .event-list.with-profiles .event-distance {
    display: flex;
    grid-column: 3;
    grid-row: 1;
    margin-top: 0;
  }
  .event-list.with-profiles .race-mini-profile {
    grid-column: 4;
    grid-row: 1;
    width: 100%;
    min-width: 0;
    margin-top: 0;
  }
  .event-list.with-profiles .event-gain,
  .event-list.with-profiles .status,
  .event-list.with-profiles .compare-button { display: none; }
  .event-list.with-profiles :deep(.mini-profile-category) { display: none; }
  .event-list.with-profiles :deep(.mini-profile-gain) { display: inline; color: var(--muted); }
  .event-list.with-profiles :deep(.mini-profile-meta strong) { color: var(--profile-color); font-weight: 500; }
}
/* Month headings move at 900px; distances stay beside the name until 720px. */
@media (max-width: 720px) {
  .race-list-months {
    display: grid;
    grid-template-columns: 46px fit-content(48%) minmax(0, 1fr);
    column-gap: 12px;
  }
  .race-list-month,
  .race-list-month > .event-list {
    display: grid;
    grid-column: 1 / -1;
    grid-template-columns: subgrid;
  }
  .race-list-month > header { grid-column: 1 / -1; }
  .event-list.with-profiles .event-row,
  .event-list.with-profiles.with-compare .event-row {
    grid-column: 1 / -1;
    grid-template-columns: subgrid;
    gap: 12px;
  }
  .event-list.with-profiles .event-distance { grid-column: 2; grid-row: 2; margin-top: 0; margin-bottom: 6px; }
  .event-list.with-profiles .race-mini-profile { grid-column: 3; grid-row: 1 / 3; margin-top: 0; }
}
@media (max-width: 552px) {
  .race-list-months { grid-template-columns: 46px minmax(0, 1fr); }
  .event-list.with-profiles .event-row,
  .event-list.with-profiles.with-compare .event-row {
    padding-top: 16px;
    row-gap: 6px;
  }
  .event-list.with-profiles .event-distance {
    grid-column: 1 / -1;
    grid-row: 2;
    justify-content: center;
    flex-wrap: nowrap;
    min-width: 0;
    margin-bottom: 0;
  }
  .event-list.with-profiles .event-distance button {
    min-width: 0;
    padding-inline: 8px;
    font-size: clamp(.5rem, 2vw, .7rem);
    white-space: nowrap;
  }
  .event-list.with-profiles .race-mini-profile {
    grid-column: 1 / -1;
    grid-row: 3;
  }
}
</style>
