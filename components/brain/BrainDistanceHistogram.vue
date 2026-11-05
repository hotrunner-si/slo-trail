<script setup lang="ts">
import { formatSlovenianCount, slovenianCountForms } from '~/utils/slovenianCount'
import { trailCategories, trailHistogram, type TrailPoint } from '~/utils/trailAnalytics'
const props = defineProps<{
  title: string
  note: string
  points: TrailPoint[]
}>()
const maxDistance = computed(() =>
  Math.max(20, (Math.floor(Math.max(0, ...props.points.map((p) => p.km)) / 20) + 1) * 20),
)
const rows = computed(() =>
  trailHistogram(
    props.points,
    Array.from({ length: maxDistance.value / 2 }, (_, i) => i * 2),
    (p) => p.km,
  ).map((bin, i) => ({
    ...bin,
    start: i * 2,
    end: (i + 1) * 2,
    segments: bin.categories
      .map((count, j) => ({
        ...trailCategories[j]!,
        count,
        cumulative: bin.categories.slice(0, j + 1).reduce((sum, n) => sum + n, 0),
      }))
      .filter((segment) => segment.count > 0),
  })),
)
const step = computed(() =>
  Math.max(1, Math.ceil(Math.max(1, ...rows.value.map((row) => row.count)) / 5)),
)
const maximum = computed(() => step.value * 5)
const yTicks = computed(() => Array.from({ length: 6 }, (_, index) => index * step.value))
const xTicks = computed(() =>
  Array.from({ length: maxDistance.value / 20 + 1 }, (_, index) => index * 20),
)
const x = (km: number) => 64 + (km / maxDistance.value) * 600
const y = (count: number) => 332 - (count / maximum.value) * 288
</script>

<template>
  <section class="brain-panel distance-histogram">
    <header class="panel-head">
      <h2>{{ title }}</h2>
    </header>
    <svg
      viewBox="0 0 700 390"
      role="img"
      :aria-label="`${title}. Število tras po razredih širine 2 kilometra.`"
    >
      <g class="grid">
        <line v-for="tick in yTicks" :key="tick" x1="64" x2="664" :y1="y(tick)" :y2="y(tick)" />
      </g>
      <g class="columns" shape-rendering="crispEdges">
        <g v-for="row in rows" :key="row.start">
          <rect
            v-for="segment in row.segments"
            :key="segment.id"
            :x="x(row.start)"
            :y="y(segment.cumulative)"
            :width="x(row.end) - x(row.start)"
            :height="332 - y(segment.count)"
            :fill="segment.color"
          >
            <title>
              {{ row.start }}–{{ row.end }} km · {{ segment.label }}:
              {{ formatSlovenianCount(segment.count, slovenianCountForms.route) }}
            </title>
          </rect>
        </g>
      </g>
      <path class="axis" d="M64 44V332H664" />
      <g class="labels">
        <text v-for="tick in yTicks" :key="`y${tick}`" x="54" :y="y(tick) + 4" text-anchor="end">
          {{ tick }}
        </text>
        <text v-for="tick in xTicks" :key="`x${tick}`" :x="x(tick)" y="353" text-anchor="middle">
          {{ tick }}
        </text>
        <text x="64" y="24">ŠTEVILO TRAS</text>
        <text x="664" y="379" text-anchor="end">RAZDALJA / km</text>
      </g>
    </svg>
    <div class="hist-legend">
      <span v-for="category in trailCategories" :key="category.id"
        ><i :style="{ background: category.color }" />{{ category.label }}</span
      >
    </div>
    <p class="chart-note">
      Razredi po 2 km. Barve prikazujejo kategorije km-effort (razdalja + vzpon/100). {{ note }}
    </p>
  </section>
</template>

<style scoped>
.distance-histogram {
  min-width: 0;
}
.distance-histogram > svg {
  display: block;
  width: 100%;
  max-height: 300px;
  margin-top: 12px;
}
.grid line {
  stroke: #dce4d5;
  stroke-dasharray: 2 5;
}
.columns rect:hover {
  opacity: 0.75;
}
.hist-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 8px;
  font: 10px var(--mono);
}
.hist-legend span {
  display: flex;
  align-items: center;
  gap: 5px;
}
.hist-legend i {
  width: 9px;
  height: 9px;
  border-radius: 2px;
}
.axis {
  fill: none;
  stroke: #87967b;
}
.labels text {
  font: 10px var(--mono);
  fill: #61735d;
}
</style>
