<script setup lang="ts">
import type { Race } from '~/types'
import { formatSlovenianCount, slovenianCountForms } from '~/utils/slovenianCount'
const props = defineProps<{ races: Race[] }>()
const names = [
  'Januar',
  'Februar',
  'Marec',
  'April',
  'Maj',
  'Junij',
  'Julij',
  'Avgust',
  'September',
  'Oktober',
  'November',
  'December',
]
const selected = ref<number | null>(null)
const hovered = ref<number | null>(null)
const active = computed(() => selected.value ?? hovered.value)
function selectMonth(index: number) {
  selected.value = index
  hovered.value = null
}
const shortMonths = [
  'jan',
  'feb',
  'mar',
  'apr',
  'maj',
  'jun',
  'jul',
  'avg',
  'sep',
  'okt',
  'nov',
  'dec',
]
function eventDate(race: Race) {
  const format = (date: string) => {
    const [year, month, day] = date.split('-')
    return `${day}. ${shortMonths[Number(month) - 1]}. ${year}`
  }
  let label = format(race.date)
  if (race.dateEnd && race.dateEnd !== race.date) {
    const start =
      race.date.slice(0, 7) === race.dateEnd.slice(0, 7)
        ? `${race.date.slice(8, 10)}.`
        : format(race.date)
    label = `${start} - ${format(race.dateEnd)}`
  }
  return race.dateStatus === 'confirmed' ? label : `${label} (predviden datum)`
}
const months = computed(() =>
  names.map((name, index) => ({
    name,
    events: props.races
      .filter(
        (race) =>
          (!race.country || ['Slovenija', 'Slovenia', 'SI'].includes(race.country)) &&
          /^\d{4}-\d{2}/.test(race.date) &&
          Number(race.date.slice(5, 7)) === index + 1,
      )
      .sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name, 'sl')),
  })),
)
</script>
<template>
  <section class="brain-panel season-calendar" @mouseleave="hovered = null">
    <header class="panel-head"><h2>Trail skozi leto</h2></header>
    <div class="months">
      <button
        v-for="(month, index) in months"
        :key="month.name"
        type="button"
        :class="{ active: active === index }"
        :aria-expanded="active === index"
        aria-controls="season-events"
        :aria-label="`${month.name}: ${formatSlovenianCount(month.events.length, slovenianCountForms.event)}`"
        @mouseenter="hovered = index"
        @focus="hovered = index"
        @blur="hovered = null"
        @click="selectMonth(index)"
      >
        <span>{{ month.name }}</span
        ><strong>{{ month.events.length }}</strong>
      </button>
    </div>
    <div v-if="active !== null" id="season-events" class="events">
      <h3>
        {{ months[active]!.name }} ·
        {{ formatSlovenianCount(months[active]!.events.length, slovenianCountForms.event) }}
      </h3>
      <ul v-if="months[active]!.events.length">
        <li v-for="race in months[active]!.events" :key="race.slug">
          <NuxtLink :to="`/races/${race.slug}`">{{ race.name }}</NuxtLink>
          <span class="event-date">{{ eventDate(race) }}</span>
        </li>
      </ul>
      <p v-else>V tem mesecu še ni dogodkov.</p>
    </div>
    <p class="chart-note">
      Vsak dogodek šteje enkrat, ne glede na leto. Vključeni so tudi okvirni termini. Mesec pokaže
      dogodke ob prehodu z miško; s klikom seznam ostane odprt za izbiro tekme.
    </p>
  </section>
</template>
<style scoped>
.months {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin-top: 20px;
}
.months button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 18px 4px;
  color: #35543b;
  background: #f1f4eb;
  border: 1px solid #dce4d5;
  cursor: pointer;
}
.months button.active,
.months button:hover {
  background: #e0e9d4;
  border-color: #668449;
}
.months span {
  font-size: 12px;
}
.months strong {
  font-size: 32px;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.events {
  margin-top: 18px;
  font-size: 13px;
}
.events h3 {
  font-size: 14px;
}
.events ul {
  display: grid;
  gap: 8px;
  padding-left: 18px;
}
.events a {
  color: #35543b;
}
.event-date {
  display: block;
  margin-top: 3px;
  color: #596653;
  font-size: 12px;
}
@media (max-width: 450px) {
  .months span {
    font-size: 10px;
  }
  .months strong {
    font-size: 27px;
  }
}
</style>
