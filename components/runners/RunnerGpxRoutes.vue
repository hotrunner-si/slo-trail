<script setup lang="ts">
import { formatDate } from '~/utils/formatDate'
import { runnerGpxRoutes } from '~/data/runnerGpxRoutes'
import { effortColor, effortKm, effortLabel } from '~/utils/raceCategories'
import type { GpxData } from '~/types/gpx'

const props = defineProps<{ runnerSlug: string }>()
const routes = computed(() => runnerGpxRoutes[props.runnerSlug] || [])
const pageRoute = useRoute()
const router = useRouter()
const requestedRouteId = computed(() => {
  const id = typeof pageRoute.query.gpx === 'string' ? pageRoute.query.gpx : null
  return routes.value.some((route) => route.id === id) ? id : null
})
const openId = ref<string | null>(requestedRouteId.value)
const expandedData = shallowRef<GpxData | null>(null)
const expandedError = ref(false)
const activeDistanceKm = ref(0)
const scrollSpacer = ref(0)
const gpxSection = ref<HTMLElement | null>(null)
const loadGpx = useGpxData()
let loadSequence = 0
let scrollSequence = 0
const number = (value: number) =>
  new Intl.NumberFormat('sl-SI', { maximumFractionDigits: 1 }).format(value)
const effort = (route: { distanceKm: number; elevationGain: number }) => ({
  km: route.distanceKm,
  elevation: route.elevationGain,
})

watch(
  requestedRouteId,
  (id) => {
    openId.value = id
  },
  { immediate: true },
)

watch(
  requestedRouteId,
  async (id) => {
    const sequence = ++loadSequence
    expandedData.value = null
    expandedError.value = false
    activeDistanceKm.value = 0
    if (!id || !import.meta.client) return
    try {
      const data = await loadGpx<GpxData>(`/gpx/runners/${props.runnerSlug}/${id}.detail.json`)
      if (sequence === loadSequence && openId.value === id) expandedData.value = data
    } catch {
      if (sequence === loadSequence) expandedError.value = true
    }
  },
  { immediate: true },
)

async function toggleRoute(id: string, event: MouseEvent) {
  const toggle = event.currentTarget as HTMLElement
  const sequence = ++scrollSequence
  scrollSpacer.value = 0
  const nextId = openId.value === id ? null : id
  openId.value = nextId
  expandedData.value = null
  expandedError.value = false
  activeDistanceKm.value = 0
  const query = { ...pageRoute.query }
  if (nextId) query.gpx = nextId
  else delete query.gpx
  await router.replace({ path: pageRoute.path, query, hash: pageRoute.hash })
  await nextTick()
  if (import.meta.client) {
    requestAnimationFrame(async () => {
      if (sequence !== scrollSequence) return
      const isMobile = window.matchMedia('(max-width: 750px)').matches
      const target = !isMobile && !nextId ? gpxSection.value : toggle
      if (!target) return
      const headerHeight = document.querySelector<HTMLElement>('.site-header')?.offsetHeight ?? 0
      const top = target.getBoundingClientRect().top + window.scrollY - headerHeight - 8
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight
      scrollSpacer.value = isMobile || nextId ? Math.max(0, Math.ceil(top - maxScroll)) : 0
      await nextTick()
      if (sequence !== scrollSequence) return
      window.scrollTo({ top, behavior: 'instant' })
    })
  }
}
</script>

<template>
  <section
    v-if="routes.length"
    ref="gpxSection"
    class="runner-gpx-section shell section"
    aria-labelledby="runner-gpx-title"
  >
    <div class="section-head">
      <div>
        <p class="eyebrow">GPX · tekačeve ture</p>
        <h2 id="runner-gpx-title">Sledi s poti</h2>
      </div>
      <p>Ture in njihove GPX sledi. Odpri vrstico za opis in zemljevid.</p>
    </div>
    <div class="runner-gpx-list" :class="{ 'has-open-route': openId !== null }">
      <div
        v-for="(route, index) in routes"
        :key="route.id"
        class="runner-gpx-item"
        :class="{ 'is-expanded': openId === route.id }"
        :style="{ '--route-color': effortColor(effort(route)) }"
      >
        <div class="runner-gpx-row" :class="{ 'is-expanded': openId === route.id }">
          <button
            :id="`runner-gpx-toggle-${route.id}`"
            class="runner-gpx-toggle"
            type="button"
            :aria-expanded="openId === route.id"
            :aria-controls="`runner-map-${route.id}`"
            @click="toggleRoute(route.id, $event)"
          >
            <span class="runner-gpx-number mono">{{ String(index + 1).padStart(2, '0') }}</span>
            <span class="runner-gpx-name">
              <span class="runner-gpx-title">
                <strong>{{ route.title }}</strong>
                <span class="runner-gpx-chevron" aria-hidden="true">{{
                  openId === route.id ? '−' : '+'
                }}</span>
              </span>
              <small>{{ formatDate(route.dateIso) }} · {{ route.location }}</small>
            </span>
            <span v-if="openId !== route.id" class="runner-gpx-stats mono"
              >{{ number(route.distanceKm) }} km <em><IconArrowUpRight /> {{ number(route.elevationGain) }} m</em></span
            >
            <span v-if="openId !== route.id" class="runner-gpx-effort mono"
              >{{ effortLabel(effort(route)) }}
              <small>{{ number(effortKm(effort(route))) }} km-effort</small></span
            >
            <GpxMiniProfile
              v-if="openId !== route.id"
              class="runner-gpx-profile"
              :profile="route.preview.profile"
              :height="38"
              :label="`Višinski profil ture ${route.title}`"
            />
          </button>
          <p v-if="openId === route.id" class="runner-gpx-description">{{ route.description }}</p>
          <RunnerGpxProfile
            v-if="openId === route.id && expandedData?.detailedProfile?.length"
            class="runner-gpx-selected-profile"
            :profile="expandedData.detailedProfile"
            :active-distance-km="activeDistanceKm"
            :color="effortColor(effort(route))"
            :label="`Višinski profil ture ${route.title}`"
            @distance-change="activeDistanceKm = $event"
          />
          <p v-else-if="openId === route.id" class="runner-gpx-selected-profile runner-gpx-profile-status">
            {{ expandedError ? 'Višinskega profila ni mogoče naložiti.' : expandedData ? 'Višinski profil ni na voljo.' : 'Nalaganje višinskega profila …' }}
          </p>
        </div>
        <div v-if="openId === route.id" :id="`runner-map-${route.id}`" class="runner-gpx-expanded">
          <RunnerGpxMap
            v-if="expandedData"
            :data="expandedData"
            :active-distance-km="activeDistanceKm"
            :color="effortColor(effort(route))"
            :title="route.title"
            @distance-change="activeDistanceKm = $event"
          />
          <p v-else-if="expandedError" class="runner-gpx-map-error-message">
            Podatkov zemljevida ni mogoče naložiti.
          </p>
          <p v-else class="runner-gpx-map-loading">Nalaganje zemljevida …</p>
          <div class="runner-gpx-detail">
            <div class="mono runner-gpx-detail-stats">
              <span>Razdalja <strong>{{ number(route.distanceKm) }} km</strong></span>
              <span>Vzpon <strong>{{ number(route.elevationGain) }} m</strong></span>
              <span>Najvišja točka <strong>{{ route.preview.highestPoint == null ? '—' : `${number(route.preview.highestPoint)} m` }}</strong></span>
            </div>
            <a
              class="button secondary runner-gpx-download"
              :href="`/gpx/runners/${runnerSlug}/${route.preview.source}`"
              download
              >Prenesi GPX ↓</a
            >
          </div>
        </div>
      </div>
    </div>
    <p class="runner-gpx-note">
      Razdalje in višinski metri so podatki tekača; zemljevid in profil sta iz datotek GPX. Barva
      sledi kategoriji km-effort.
    </p>
    <div v-if="scrollSpacer" aria-hidden="true" :style="{ height: `${scrollSpacer}px` }" />
  </section>
</template>
