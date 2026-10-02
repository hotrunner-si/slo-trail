<script setup lang="ts">
import { races } from '~/data/races'
import type { Race, RaceCompareItem, RaceDistance } from '~/types'
import { effortCategory } from '~/utils/raceCategories'
import { formatSlovenianCount, slovenianCountForms } from '~/utils/slovenianCount'
import { formatDate, parseIsoDate } from '~/utils/formatDate'

useSiteSeo(
  'Trail in gorskotekaške tekme',
  'Poišči trail in gorskotekaške tekme v Sloveniji. Preglej datume, kraje, razdalje, višinske profile in GPX trase.',
)
definePageMeta({ keepalive: true })

type ViewMode = 'list' | 'map' | 'calendar'
const query = ref(''),
  month = ref('Vsi meseci'),
  distance = ref('Vse razdalje'),
  status = ref('Vsi statusi')
const effort = ref('Vsi razredi')
const collection = ref('vse'),
  view = ref<ViewMode>('map')
const activeId = ref(races[0]?.id || ''),
  compareItems = ref<RaceCompareItem[]>([])
const datedRaces = races.filter((race) => parseIsoDate(race.date))
const months = [
  'Vsi meseci',
  ...new Set(
    datedRaces
      .map((race) => formatDate(race.date, { month: 'long' }))
      .map((v) => v.charAt(0).toUpperCase() + v.slice(1)),
  ),
]
// Uredniški seznam priljubljenih tekem: za spremembo samo dodaj ali odstrani slug.
const popularRaceSlugs = new Set([
  'julian-alps-trail-run-by-utmb',
  'obala-ultra-trail',
  'ultra-trail-vipava-valley',
  'soca-outdoor-festival',
  'k24-ultra-trail',
  'kocevsko-outdoor-festival',
])
const collections = [
  {
    id: 'vse',
    label: 'Vse tekme',
    description: `${formatSlovenianCount(races.length, slovenianCountForms.event)} v Sloveniji`,
  },
  { id: 'priljubljene', label: 'Najbolj priljubljene', description: 'Izbrane tekme' },
  {
    id: 'ponavljajoce',
    label: 'Krožne preizkušnje',
    description: 'Časovni in ponavljajoči formati',
  },
]
const filtersOpen = ref(false)
const openFilter = ref<string | null>(null)
const filterOptions = {
  month: months,
  distance: ['Vse razdalje', 'Do 30 km', '30–60 km', 'Nad 60 km'],
  effort: ['Vsi razredi', 'short', '20K', '50K', '100K', '100M'],
  status: ['Vsi statusi', 'Odprte', 'Kmalu', 'Zaprte', 'Ni podatka'],
}
const selectFilter = (key: 'month' | 'distance' | 'effort' | 'status', value: string) => {
  if (key === 'month') month.value = value
  else if (key === 'distance') distance.value = value
  else if (key === 'effort') effort.value = value
  else status.value = value
  openFilter.value = null
}
const selectedFilter = (key: 'month' | 'distance' | 'effort' | 'status') =>
  key === 'month'
    ? month.value
    : key === 'distance'
      ? distance.value
      : key === 'effort'
        ? effort.value
        : status.value
useUrlControls({
  query: { value: query },
  month: { value: month, options: months },
  distance: { value: distance, options: ['Vse razdalje', 'Do 30 km', '30–60 km', 'Nad 60 km'] },
  status: { value: status, options: ['Vsi statusi', 'Odprte', 'Kmalu', 'Zaprte', 'Ni podatka'] },
  effort: { value: effort, options: ['Vsi razredi', 'short', '20K', '50K', '100K', '100M'] },
  collection: { value: collection, options: collections.map((item) => item.id) },
  view: { value: view, options: ['list', 'map', 'calendar'] },
  activeId: { value: activeId, options: races.map((race) => race.id) },
  filtersOpen: { value: filtersOpen },
})
const filtered = computed(() =>
  races.filter((race) => {
    const haystack =
      `${race.name} ${race.location} ${race.region} ${race.country} ${race.distances.map((d) => d.name || d.label).join(' ')}`.toLowerCase()
    const monthName = race.date ? formatDate(race.date, { month: 'long' }) : ''
    const collectionMatch =
      collection.value === 'vse' ||
      (collection.value === 'priljubljene' && popularRaceSlugs.has(race.slug)) ||
      (collection.value === 'ponavljajoce' &&
        race.distances.some((d) => d.name?.toLowerCase().includes('ponavljajoča')))
    return (
      (!query.value || haystack.includes(query.value.toLowerCase())) &&
      (month.value === 'Vsi meseci' || monthName === month.value.toLowerCase()) &&
      (status.value === 'Vsi statusi' || race.registrationStatus === status.value) &&
      (distance.value === 'Vse razdalje' ||
        race.distances.some((d) =>
          distance.value === 'Do 30 km'
            ? d.km <= 30
            : distance.value === '30–60 km'
              ? d.km > 30 && d.km <= 60
              : d.km > 60,
        )) &&
      (effort.value === 'Vsi razredi' ||
        race.distances.some((d) => effortCategory(d) === effort.value)) &&
      collectionMatch
    )
  }),
)
const comparedKeys = computed(() =>
  compareItems.value.map((item) => `${item.race.id}:${item.index}`),
)
function toggleCompare(race: Race, index: number) {
  const found = compareItems.value.findIndex(
    (item) => item.race.id === race.id && item.index === index,
  )
  if (found >= 0) compareItems.value.splice(found, 1)
  else if (compareItems.value.length < 4)
    compareItems.value.push({ race, distance: race.distances[index] as RaceDistance, index })
}
function resetFilters() {
  query.value = ''
  month.value = 'Vsi meseci'
  distance.value = 'Vse razdalje'
  status.value = 'Vsi statusi'
  effort.value = 'Vsi razredi'
  collection.value = 'vse'
}
</script>

<template>
  <div class="page races-page">
    <section class="race-explorer shell" aria-label="Raziskovalnik tekem">
      <div class="race-search">
        <div>
          <span>⌕</span
          ><input
            id="race-search"
            v-model="query"
            type="search"
            placeholder="Išči dogodek, kraj, razdaljo, ..."
          /><kbd>/</kbd>
        </div>
      </div>
      <div class="race-collections" aria-label="Uredniške zbirke">
        <button
          v-for="item in collections"
          :key="item.id"
          :class="{ active: collection === item.id }"
          @click="collection = item.id"
        >
          <strong>{{ item.label }}</strong
          ><span>{{ item.description }}</span>
        </button>
      </div>
      <details
        class="advanced-filters"
        :open="filtersOpen"
        @toggle="filtersOpen = ($event.target as HTMLDetailsElement).open"
      >
        <summary>
          Filtri
          <span class="mono">{{
            formatSlovenianCount(filtered.length, slovenianCountForms.result).toLocaleUpperCase(
              'sl-SI',
            )
          }}</span>
        </summary>
        <div class="filters filters-four">
          <div
            v-for="(label, key) in {
              month: 'Mesec',
              distance: 'Razdalja',
              effort: 'Effort',
              status: 'Prijave',
            }"
            :key="key"
            class="filter-field"
          >
            <span class="filter-label">{{ label }}</span>
            <div class="filter-select" :class="{ open: openFilter === key }">
              <button
                type="button"
                class="filter-select-trigger"
                :aria-expanded="openFilter === key"
                @click="openFilter = openFilter === key ? null : key"
              >
                <span>{{ selectedFilter(key) }}</span
                ><i aria-hidden="true"></i>
              </button>
              <div
                v-if="openFilter === key"
                class="filter-select-menu"
                role="listbox"
                :aria-label="label"
              >
                <button
                  v-for="option in filterOptions[key]"
                  :key="option"
                  type="button"
                  role="option"
                  :aria-selected="selectedFilter(key) === option"
                  :class="{ selected: selectedFilter(key) === option }"
                  @click="selectFilter(key, option)"
                >
                  {{ option
                  }}<span v-if="selectedFilter(key) === option" aria-hidden="true">✓</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="filter-actions"><button @click="resetFilters">Ponastavi filtre</button></div>
      </details>
      <div class="race-toolbar">
        <div class="view-switch" aria-label="Način prikaza">
          <button :class="{ active: view === 'list' }" @click="view = 'list'">Seznam</button
          ><button :class="{ active: view === 'map' }" @click="view = 'map'">Zemljevid</button
          ><button :class="{ active: view === 'calendar' }" @click="view = 'calendar'">
            Koledar
          </button>
        </div>
        <div class="toolbar-right">
          <div class="effort-legend">
            <span class="effort-short">&lt;20</span><span class="effort-20k">20K</span
            ><span class="effort-50k">50K</span><span class="effort-100k">100K</span
            ><span class="effort-100m">100M</span><em>KM-EFFORT</em>
          </div>
        </div>
      </div>
      <template v-if="filtered.length">
        <RaceList
          v-if="view === 'list'"
          :races="filtered"
          show-profile
          show-compare
          :active-id="activeId"
          :compared-keys="comparedKeys"
          @activate="activeId = $event"
          @compare="toggleCompare"
        />
        <RaceCalendar v-else-if="view === 'calendar'" :races="filtered" />
      </template>
      <div v-else class="empty-state">
        <h2>Ni tekem za izbrane pogoje.</h2>
        <p>Poskusi odstraniti enega od filtrov ali ponastavi celoten pogled.</p>
        <button class="button secondary" @click="resetFilters">Ponastavi filtre</button>
      </div>
      <RaceMap
        v-show="view === 'map' && filtered.length > 0"
        :races="filtered"
        :active-id="activeId"
        :visible="view === 'map' && filtered.length > 0"
        @activate="activeId = $event"
      />
    </section>
    <section class="data-promise shell">
      <div>
        <p class="eyebrow">Zakaj zaupati podatkom</p>
        <h2>Vsaka trasa ima vir.</h2>
      </div>
      <div>
        <p>
          Podatki o tekmah so bili preverjeni 1. oktobra 2026. Pri vsaki tekmi sta navedena vir in
          število pripravljenih GPX tras.
        </p>
        <dl>
          <div>
            <dt>Preverjeno</dt>
            <dd>{{ races.filter((r) => r.verifiedAt).length }}/{{ races.length }}</dd>
          </div>
          <div>
            <dt>Pripravljenih GPX datotek</dt>
            <dd>
              {{
                races.reduce(
                  (total, race) => total + race.distances.filter((distance) => distance.gpx).length,
                  0,
                )
              }}
            </dd>
          </div>
          <div>
            <dt>Dogodkov</dt>
            <dd>{{ formatSlovenianCount(races.length, slovenianCountForms.event) }}</dd>
          </div>
        </dl>
      </div>
    </section>
    <RaceCompare
      :items="compareItems"
      @remove="compareItems.splice($event, 1)"
      @clear="compareItems = []"
    />
  </div>
</template>
