<script setup lang="ts">
import { trailCategories, type TrailBin } from '~/utils/trailAnalytics'
const props = defineProps<{ title: string; note: string; bins: TrailBin[]; unit: string }>()
const maximum = computed(() => Math.max(1, ...props.bins.map((b) => b.count)))
const step = computed(() => 560 / Math.max(1, props.bins.length))
const stacks = computed(() =>
  props.bins.map((bin, i) => ({
    bin,
    x: 55 + i * step.value,
    segments: bin.categories.map((count, j) => ({
      count,
      color: trailCategories[j]!.color,
      label: trailCategories[j]!.label,
      y: 218 - (bin.categories.slice(0, j + 1).reduce((a, b) => a + b, 0) / maximum.value) * 175,
      height: (count / maximum.value) * 175,
    })),
  })),
)
const ticks = [0, 0.25, 0.5, 0.75, 1]
</script>
<template>
  <section class="brain-panel trail-histogram">
    <header class="panel-head">
      <h2>{{ title }}</h2>
      <span class="data-chip">{{ bins.reduce((sum, b) => sum + b.count, 0) }} tras</span>
    </header>
    <svg
      v-if="bins.some((b) => b.count)"
      viewBox="0 0 640 295"
      role="img"
      :aria-label="`${title}. ${note}`"
    >
      <g class="hist-grid">
        <line
          v-for="t in ticks"
          :key="t"
          x1="50"
          x2="620"
          :y1="218 - t * 175"
          :y2="218 - t * 175"
        />
      </g>
      <g class="hist-labels">
        <text x="50" y="23">ŠTEVILO TRAS</text>
        <text v-for="t in ticks" :key="t" x="43" :y="222 - t * 175" text-anchor="end">
          {{ Math.round(t * maximum) }}
        </text>
      </g>
      <g v-for="stack in stacks" :key="stack.bin.label">
        <rect
          v-for="segment in stack.segments.filter((s) => s.count > 0)"
          :key="segment.label"
          :x="stack.x"
          :y="segment.y"
          :width="Math.max(2, step - 6)"
          :height="segment.height"
          :fill="segment.color"
          stroke="#fff"
          stroke-width=".7"
        >
          <title>
            {{ stack.bin.label }} {{ unit }} · {{ segment.label }}: {{ segment.count }} tras
          </title>
        </rect>
        <text
          v-if="stack.bin.count"
          :x="stack.x + (step - 6) / 2"
          :y="210 - (stack.bin.count / maximum) * 175"
          text-anchor="middle"
          class="hist-total"
        >
          {{ stack.bin.count }}
        </text>
        <text
          :transform="`translate(${stack.x + (step - 6) / 2},236) rotate(-35)`"
          text-anchor="end"
          class="hist-bin"
        >
          {{ stack.bin.label }}
        </text>
      </g>
      <text x="620" y="289" text-anchor="end" class="hist-bin">{{ unit }}</text>
    </svg>
    <p v-else class="empty-panel">Za ta prikaz še ni dovolj podatkov.</p>
    <div class="hist-legend">
      <span v-for="c in trailCategories" :key="c.id"
        ><i :style="{ background: c.color }" />{{ c.label }}</span
      >
    </div>
    <p class="chart-note">{{ note }}</p>
    <details class="hist-table">
      <summary>Prikaži podatke</summary>
      <div class="hist-table-scroll">
        <table>
          <thead>
            <tr>
              <th>{{ unit }}</th>
              <th>Skupaj</th>
              <th v-for="c in trailCategories" :key="c.id">{{ c.label }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="bin in bins" :key="bin.label">
              <th>{{ bin.label }}</th>
              <td>{{ bin.count }}</td>
              <td v-for="(count, i) in bin.categories" :key="i">{{ count }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </details>
  </section>
</template>
<style scoped>
.trail-histogram {
  min-width: 0;
}
.trail-histogram svg {
  display: block;
  width: 100%;
  flex: none;
  margin-top: 14px;
}
.hist-grid line {
  stroke: #dfe7d8;
  stroke-dasharray: 2 5;
}
.hist-labels text,
.hist-bin {
  font: 10px var(--mono);
  fill: #78876f;
}
.hist-total {
  font: 11px var(--mono);
  fill: #3a543b;
}
.hist-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font: 9px var(--mono);
  margin-top: 8px;
}
.hist-legend span {
  display: flex;
  align-items: center;
  gap: 5px;
}
.hist-legend i {
  width: 8px;
  height: 8px;
  border-radius: 2px;
}
.hist-table {
  margin-top: 12px;
  font-size: 10px;
}
.hist-table summary {
  cursor: pointer;
  color: #315736;
}
.hist-table-scroll {
  overflow-x: auto;
  margin-top: 8px;
}
.hist-table table {
  width: 100%;
  border-collapse: collapse;
  display: table;
}
.hist-table th,
.hist-table td {
  padding: 6px;
  text-align: right;
  border-bottom: 1px solid #e2e7dc;
  white-space: nowrap;
}
.hist-table th:first-child {
  text-align: left;
}
@media (max-width: 700px) {
  .hist-labels text,
  .hist-bin {
    font-size: 16px;
  }
  .hist-total {
    font-size: 15px;
  }
}
</style>
