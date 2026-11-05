<script setup lang="ts">
import {
  trailCategory,
  trailDescent,
  trailHighestPoint,
  type TrailPoint,
} from '~/utils/trailAnalytics'
const props = defineProps<{ points: TrailPoint[] }>()
const loadGpx = useGpxData()
const previews = ref<Record<string, NonNullable<TrailPoint['gpx']>>>({})
const loading = ref(false)
onMounted(async () => {
  loading.value = true
  const pending = props.points.filter(
    (point) =>
      point.gpx?.file && (trailDescent(point) === null || trailHighestPoint(point) === null),
  )
  await Promise.all(
    Array.from({ length: Math.min(6, pending.length) }, async () => {
      while (pending.length) {
        const point = pending.shift()!
        try {
          previews.value[point.key] = await loadGpx<NonNullable<TrailPoint['gpx']>>(
            point.gpx!.file!,
          )
        } catch {
          /* Routes without available GPX stay outside rankings requiring it. */
        }
      }
    }),
  )
  loading.value = false
})
const enriched = computed(() =>
  props.points.map((point) => ({ ...point, gpx: { ...point.gpx, ...previews.value[point.key] } })),
)
const mode = ref<'average' | 'terrain' | 'highest'>('average')
const lengthFilters = ref({ average: true, terrain: false, highest: true })
const modes = [
  { id: 'average', label: 'Vzpon / km' },
  { id: 'terrain', label: 'Vzpon + spust / km' },
  { id: 'highest', label: 'Najvišja točka' },
] as const
const ranked = computed(() =>
  enriched.value
    .filter((p) => p.km > 0 && (!lengthFilters.value[mode.value] || p.km > 5))
    .map((point) => {
      const descent = trailDescent(point)
      const value =
        mode.value === 'highest'
          ? trailHighestPoint(point)
          : mode.value === 'terrain'
            ? descent === null
              ? null
              : (point.elevation + descent) / point.km
            : point.elevation / point.km
      return { ...point, value }
    })
    .filter((p): p is typeof p & { value: number } => p.value !== null && Number.isFinite(p.value))
    .sort((a, b) => b.value - a.value || a.key.localeCompare(b.key)),
)
const maximum = computed(() => Math.max(1, ...ranked.value.map((p) => p.value)))
const nf = (n: number) => new Intl.NumberFormat('sl-SI', { maximumFractionDigits: 1 }).format(n)
</script>
<template>
  <section class="brain-panel trail-ranking">
    <header class="panel-head"><h2>Trase v primerjavi</h2></header>
    <div class="ranking-switch" role="group" aria-label="Razvrsti trase">
      <button
        v-for="option in modes"
        :key="option.id"
        type="button"
        :aria-pressed="mode === option.id"
        @click="mode = option.id"
      >
        {{ option.label }}
      </button>
    </div>
    <label class="length-filter"
      ><input v-model="lengthFilters[mode]" type="checkbox" :disabled="mode === 'average'" /> Daljše
      od 5 km</label
    >
    <div
      v-if="ranked.length"
      class="ranking-scroll"
      role="region"
      aria-label="Razvrščene trase"
      tabindex="0"
    >
      <ol class="ranking-list">
        <li v-for="(point, index) in ranked" :key="point.key">
          <a :href="`/races/${point.raceSlug}`" class="race-name"
            ><span>{{ String(index + 1).padStart(2, '0') }}</span>
            <div>
              {{ point.raceName }}<small>{{ point.name || point.label }}</small>
            </div></a
          >
          <div class="rank-data">
            <div class="rank-track">
              <span
                :style="{
                  width: `${(point.value / maximum) * 100}%`,
                  background: trailCategory(point).color,
                }"
              />
            </div>
            <p>{{ nf(point.km) }} km · {{ nf(point.elevation) }} m+</p>
          </div>
          <strong
            >{{ nf(point.value) }}
            <small>{{ mode === 'highest' ? 'm n. v.' : 'm / km' }}</small></strong
          >
        </li>
      </ol>
    </div>
    <p v-else class="empty-panel">
      {{
        loading
          ? 'Nalagam višinske podatke …'
          : 'Za to razvrstitev še ni dovolj višinskih podatkov.'
      }}
    </p>
    <p class="chart-note" v-if="mode === 'average'">
      Trase po vzponu na kilometer celotne trase. Vključene so trase, daljše od 5 km.
    </p>
    <p class="chart-note" v-else-if="mode === 'terrain'">
      Ocena strmine: (vzpon + spust) ÷ razdalja. Predpostavlja enako povprečno strmino vzponov in
      spustov. Spust je izračunan kot začetna nadmorska višina + vzpon − končna nadmorska višina;
      pri krožni trasi je enak vzponu. Brez filtra so vključene tudi trase, krajše od 5 km, z
      znanimi višinskimi podatki.
    </p>
    <p class="chart-note" v-else>
      Trase po najvišji doseženi nadmorski višini iz podatkov GPX. Vključene so trase z znano
      najvišjo točko.
    </p>
  </section>
</template>
<style scoped>
.length-filter {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
  font-size: 12px;
  color: #35543b;
}
.length-filter input {
  accent-color: #35543b;
}
.ranking-scroll {
  max-height: 560px;
  overflow-y: auto;
  margin-top: 20px;
  padding-right: 12px;
  scrollbar-gutter: stable;
}
.ranking-switch {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 20px;
}
.ranking-switch button {
  padding: 9px 12px;
  border: 1px solid #d2ddc8;
  background: #f0f4e9;
  color: #35543b;
  font-size: 12px;
  cursor: pointer;
}
.ranking-switch button[aria-pressed='true'] {
  background: #35543b;
  color: white;
  border-color: #35543b;
}
.ranking-list {
  list-style: none;
  padding: 0;
  margin: 0;
  padding-block: 4px;
  display: grid;
  gap: 18px;
}
.ranking-list li {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) minmax(0, 2fr) auto;
  align-items: center;
  gap: 22px;
}
.race-name {
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: #35543b;
  text-decoration: none;
}
.race-name > span {
  font: 10px var(--mono);
  color: #8a9880;
  padding-top: 3px;
}
.race-name small {
  display: block;
  font-size: 11px;
  color: #718168;
  margin-top: 3px;
}
.rank-track {
  height: 18px;
  background: #e9eedf;
  border-radius: 3px;
  overflow: hidden;
}
.rank-track > span {
  display: block;
  height: 100%;
  border-radius: 3px;
}
.rank-data p {
  margin: 5px 0 0;
  font: 10px var(--mono);
  color: #718168;
}
.ranking-list strong {
  min-width: 110px;
  text-align: right;
  font: 15px var(--mono);
}
.ranking-list strong small {
  font-size: 10px;
}
@media (max-width: 700px) {
  .ranking-list li {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 8px 12px;
  }
  .race-name {
    grid-column: 1 / -1;
  }
  .ranking-list strong {
    min-width: 90px;
  }
  .rank-track {
    height: 16px;
  }
}
</style>
