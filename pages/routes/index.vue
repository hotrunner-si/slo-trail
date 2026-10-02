<script setup lang="ts">
import { formatDate } from '~/utils/formatDate'
import { runnerTours } from '~/data/runnerTours'
import type { RunnerTour } from '~/data/runnerTours'
import { effortColor, effortLabel } from '~/utils/raceCategories'
import { formatSlovenianCount, slovenianCountForms } from '~/utils/slovenianCount'

useSiteSeo('Ture tekačev', 'Resnične GPX ture tekačev, razvrščene od najnovejše do najstarejše.')
const view = ref<'list' | 'cards' | 'map'>('cards')
const activeId = ref(runnerTours[0]?.key || '')
useUrlControls({
  view: { value: view, options: ['list', 'cards', 'map'] },
  activeId: { value: activeId, options: runnerTours.map((tour) => tour.key) },
})
const mapRef = ref<{ focusTour: (id: string) => void; fitAll: () => void } | null>(null)
const number = (value: number) =>
  new Intl.NumberFormat('sl-SI', { maximumFractionDigits: 1 }).format(value)
const color = (tour: { distanceKm: number; elevationGain: number }) =>
  effortColor({ km: tour.distanceKm, elevation: tour.elevationGain })
const label = (tour: { distanceKm: number; elevationGain: number }) =>
  effortLabel({ km: tour.distanceKm, elevation: tour.elevationGain })
const lastMapSelection = ref<string | null>(null)
const mapTourList = ref<HTMLElement | null>(null)
const tourMapImage = (tour: RunnerTour) =>
  `/images/tour-maps/${tour.runnerSlug}-${tour.id}.png`

const runnerTourLink = (tour: RunnerTour) => ({
  path: `/runners/${tour.runnerSlug}`,
  query: { gpx: tour.id },
  hash: `#runner-gpx-toggle-${tour.id}`,
})

function selectTour(id: string) {
  activeId.value = id
  mapRef.value?.focusTour(id)
}

function selectMapTour(id: string) {
  if (lastMapSelection.value === id) {
    const tour = runnerTours.find((item) => item.key === id)
    if (tour) void navigateTo(runnerTourLink(tour))
    lastMapSelection.value = null
    return
  }
  lastMapSelection.value = id
  selectTour(id)
}

watch(view, () => {
  lastMapSelection.value = null
})

watch(
  [view, activeId],
  async ([currentView]) => {
    if (!import.meta.client || currentView !== 'map' || window.matchMedia('(min-width: 701px)').matches) return
    await nextTick()
    requestAnimationFrame(() => {
      const list = mapTourList.value
      const activeCard = list?.querySelector<HTMLElement>('.active')
      if (!list || !activeCard) return
      const listLeft = list.getBoundingClientRect().left
      const cardLeft = activeCard.getBoundingClientRect().left
      list.scrollTo({ left: list.scrollLeft + cardLeft - listLeft - 14, behavior: 'smooth' })
    })
  },
  { immediate: true },
)
</script>

<template>
  <div class="page runner-tours-page shell">
    <header class="page-header runner-tours-header">
      <p class="eyebrow">Tekači · GPX ture</p>
      <h1>Naj ture</h1>
      <p>Tukaj so zbrani podvigi naših tekačev.</p>
    </header>
    <div class="runner-tours-toolbar">
      <div class="route-view-switch view-switch" aria-label="Način prikaza tur">
        <button type="button" :class="{ active: view === 'list' }" @click="view = 'list'">
          Seznam
        </button>
        <button type="button" :class="{ active: view === 'cards' }" @click="view = 'cards'">
          Kartice
        </button>
        <button type="button" :class="{ active: view === 'map' }" @click="view = 'map'">
          Zemljevid
        </button>
      </div>
      <span class="mono runner-tours-count">{{ formatSlovenianCount(runnerTours.length, slovenianCountForms.tour).toLocaleUpperCase('sl-SI') }} · NAJNOVEJŠE NAJPREJ</span>
    </div>
    <div v-if="!runnerTours.length" class="empty-state">
      <h2>Tur še ni.</h2>
      <p>Ko tekači dodajo GPX sledi, se bodo prikazale tukaj.</p>
    </div>
    <div v-else-if="view === 'cards'" class="runner-tour-cards">
      <article
        v-for="(tour, index) in runnerTours"
        :key="tour.key"
        class="runner-tour-card"
        :style="{ '--tour-color': color(tour) }"
      >
        <NuxtLink class="runner-tour-card-main" :to="runnerTourLink(tour)">
        <div class="runner-tour-card-map" aria-hidden="true">
          <img
            class="runner-tour-card-map-image"
            :src="tourMapImage(tour)"
            alt=""
            loading="lazy"
          />
          <span class="runner-tour-card-index mono"
            >{{ String(index + 1).padStart(2, '0') }} /
            {{ String(runnerTours.length).padStart(2, '0') }}</span
          >
          <span class="runner-tour-card-category mono">{{ label(tour) }}</span>
        </div>
        <div class="runner-tour-card-body">
          <p class="eyebrow">{{ formatDate(tour.dateIso) }} · {{ tour.location }}</p>
          <h2>{{ tour.title }}</h2>
          <p class="runner-tour-card-description">{{ tour.description }}</p>
          <div class="runner-tour-card-stats mono">
            <strong>{{ number(tour.distanceKm) }} km</strong
            ><strong><IconArrowUpRight /> {{ number(tour.elevationGain) }} m</strong>
          </div>
          <GpxMiniProfile
            class="runner-tour-card-profile"
            :profile="tour.preview.profile"
            :label="`Višinski profil ture ${tour.title}`"
          />
          <span class="runner-tour-card-runner">{{ tour.runnerName }} · Odpri turo <IconArrowUpRight /></span>
        </div>
        </NuxtLink>
        <div class="runner-tour-card-footer">
          <a :href="`/gpx/runners/${tour.runnerSlug}/${tour.preview.source}`" download>Prenesi GPX ↓</a>
        </div>
      </article>
    </div>
    <div v-else-if="view === 'list'" class="runner-tour-list">
      <NuxtLink
        v-for="tour in runnerTours"
        :key="tour.key"
        :to="runnerTourLink(tour)"
        class="runner-tour-list-row"
        :aria-label="`Odpri turo ${tour.title} na strani tekača ${tour.runnerName}`"
        :style="{ '--tour-color': color(tour) }"
      >
        <time class="mono" :datetime="tour.dateIso">{{ formatDate(tour.dateIso) }}</time>
        <div>
          <h2>{{ tour.title }}</h2>
          <p>{{ tour.runnerName }} · {{ tour.location }}</p>
        </div>
        <span class="mono"
          >{{ number(tour.distanceKm) }} km <IconArrowUpRight /> {{ number(tour.elevationGain) }} m</span
        >
        <GpxMiniProfile
          :profile="tour.preview.profile"
          :label="`Višinski profil ture ${tour.title}`"
        />
        <span aria-hidden="true"><IconArrowUpRight /></span>
      </NuxtLink>
    </div>
    <div
      v-show="view === 'map' && runnerTours.length"
      class="race-map-layout runner-tour-map-layout"
    >
      <RunnerToursMap
        ref="mapRef"
        :tours="runnerTours"
        :active-id="activeId"
        :visible="view === 'map'"
        @activate="selectMapTour"
      />
      <aside class="map-side-list runner-tour-map-list" aria-label="Ture na zemljevidu">
        <div ref="mapTourList" class="runner-tour-map-track">
          <button
            v-for="tour in runnerTours"
            :key="tour.key"
            type="button"
            :class="{ active: activeId === tour.key }"
            :style="{ '--tour-color': color(tour) }"
            @click="selectMapTour(tour.key)"
          >
            <time :datetime="tour.dateIso">{{ formatDate(tour.dateIso) }}</time
            ><strong>{{ tour.title }}</strong
            ><span>{{ tour.runnerName }} · {{ tour.location }}</span
            ><small>{{ number(tour.distanceKm) }} km · <IconArrowUpRight /> {{ number(tour.elevationGain) }} m</small>
          </button>
        </div>
      </aside>
    </div>
  </div>
</template>
