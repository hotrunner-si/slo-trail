<script setup lang="ts">
import { formatDate } from '~/utils/formatDate'
import { runnerGpxRoutes } from '~/data/runnerGpxRoutes'
import { effortColor, effortKm, effortLabel } from '~/utils/raceCategories'

const props = defineProps<{ runnerSlug: string }>()
const routes = computed(() => runnerGpxRoutes[props.runnerSlug] || [])
const openId = ref<string | null>(null)
const number = (value: number) =>
  new Intl.NumberFormat('sl-SI', { maximumFractionDigits: 1 }).format(value)
const effort = (route: { distanceKm: number; elevationGain: number }) => ({
  km: route.distanceKm,
  elevation: route.elevationGain,
})
</script>

<template>
  <section
    v-if="routes.length"
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
    <div class="runner-gpx-list">
      <div
        v-for="(route, index) in routes"
        :key="route.id"
        class="runner-gpx-item"
        :style="{ '--route-color': effortColor(effort(route)) }"
      >
        <button
          class="runner-gpx-row"
          type="button"
          :aria-expanded="openId === route.id"
          :aria-controls="`runner-map-${route.id}`"
          @click="openId = openId === route.id ? null : route.id"
        >
          <span class="runner-gpx-number mono">{{ String(index + 1).padStart(2, '0') }}</span>
          <span class="runner-gpx-name"
            ><strong>{{ route.title }}</strong
            ><small>{{ formatDate(route.dateIso) }} · {{ route.location }}</small></span
          >
          <span class="runner-gpx-stats mono"
            >{{ number(route.distanceKm) }} km <em>↗ {{ number(route.elevationGain) }} m</em></span
          >
          <span class="runner-gpx-effort mono"
            >{{ effortLabel(effort(route)) }}
            <small>{{ number(effortKm(effort(route))) }} km-effort</small></span
          >
          <GpxMiniProfile
            class="runner-gpx-profile"
            :profile="route.preview.profile"
            :height="38"
            :label="`Višinski profil ture ${route.title}`"
          />
          <span class="runner-gpx-chevron" aria-hidden="true">{{
            openId === route.id ? '−' : '+'
          }}</span>
        </button>
        <div v-if="openId === route.id" :id="`runner-map-${route.id}`" class="runner-gpx-expanded">
          <p class="runner-gpx-description">{{ route.description }}</p>
          <RunnerGpxMap
            :file="`/gpx/runners/${runnerSlug}/${route.id}.detail.json`"
            :color="effortColor(effort(route))"
            :title="route.title"
          />
          <div class="runner-gpx-detail">
            <span class="mono"
              >{{ number(route.distanceKm) }} km · {{ number(route.elevationGain) }} m vzpona ·
              najvišja točka:
              {{
                route.preview.highestPoint == null ? '—' : `${number(route.preview.highestPoint)} m`
              }}</span
            ><a :href="`/gpx/runners/${runnerSlug}/${route.preview.source}`" download
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
  </section>
</template>
