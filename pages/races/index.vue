<script setup lang="ts">
import type { Race, RaceCompareItem, RaceDistance } from '~/types'
import { formatSlovenianCount, slovenianCountForms } from '~/utils/slovenianCount'
import { parseIsoDate } from '~/utils/formatDate'
const { races, siteContent } = await useSiteContent()
const chronologicalRaces = [...races].sort((a, b) => {
  const aDate = parseIsoDate(a.date)
  const bDate = parseIsoDate(b.date)
  if (!aDate || !bDate) return aDate ? -1 : bDate ? 1 : a.name.localeCompare(b.name, 'sl')
  return a.date.localeCompare(b.date) || a.name.localeCompare(b.name, 'sl')
})

useSiteSeo(siteContent.races.title, siteContent.races.description)
definePageMeta({ keepalive: true })

type ViewMode = 'list' | 'map' | 'calendar'
const query = ref('')
const view = ref<ViewMode>('map')
const activeId = ref(chronologicalRaces[0]?.id || ''),
  compareItems = ref<RaceCompareItem[]>([])
useUrlControls({
  query: { value: query },
  view: { value: view, options: ['list', 'map', 'calendar'] },
  activeId: { value: activeId, options: races.map((race) => race.id) },
})
const filtered = computed(() =>
  chronologicalRaces.filter((race) => {
    const haystack =
      `${race.name} ${race.location} ${race.region} ${race.country} ${race.distances.map((d) => d.name || d.label).join(' ')}`.toLowerCase()
    return !query.value || haystack.includes(query.value.toLowerCase())
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
function resetSearch() {
  query.value = ''
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
        <h2>Ni najdenih tekem.</h2>
        <p>Poskusi z drugim iskalnim izrazom.</p>
        <button class="button secondary" @click="resetSearch">Prikaži vse tekme</button>
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
        <h2>{{ siteContent.races.sourceTitle }}</h2>
      </div>
      <div>
        <p>
          {{ siteContent.races.sourceDescription }}
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
