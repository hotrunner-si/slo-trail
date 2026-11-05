<script setup lang="ts">
import { trailCategories, trailCategory, type TrailPoint } from '~/utils/trailAnalytics'
import { formatSlovenianCount, slovenianCountForms } from '~/utils/slovenianCount'
const props = defineProps<{ points: TrailPoint[] }>()
const nf = (n: number) => new Intl.NumberFormat('sl-SI', { maximumFractionDigits: 1 }).format(n)
const charts = computed(() =>
  [
    { title: 'Po številu tras', unit: 'tras', value: (p: TrailPoint) => 1 },
    { title: 'Po kilometrih', unit: 'km', value: (p: TrailPoint) => p.km },
    { title: 'Po višincih', unit: 'm+', value: (p: TrailPoint) => p.elevation },
  ].map((chart) => {
    const values = trailCategories.map((category) => ({
      ...category,
      value: props.points
        .filter((p) => trailCategory(p).id === category.id)
        .reduce((sum, p) => sum + chart.value(p), 0),
    }))
    const total = values.reduce((sum, category) => sum + category.value, 0)
    let angle = -Math.PI / 2
    return {
      ...chart,
      total,
      segments: values.map((category) => {
        const start = angle,
          share = total ? category.value / total : 0
        angle += share * Math.PI * 2
        const path =
          share >= 1
            ? 'M100 10 A90 90 0 1 1 100 190 A90 90 0 1 1 100 10 Z'
            : `M100 100 L${100 + 90 * Math.cos(start)} ${100 + 90 * Math.sin(start)} A90 90 0 ${share > 0.5 ? 1 : 0} 1 ${100 + 90 * Math.cos(angle)} ${100 + 90 * Math.sin(angle)} Z`
        return {
          ...category,
          share,
          path,
          tooltip: `${category.label}: ${chart.unit === 'tras' ? formatSlovenianCount(category.value, slovenianCountForms.route) : `${nf(category.value)} ${chart.unit}`} · ${nf(share * 100)} %`,
        }
      }),
    }
  }),
)
</script>
<template>
  <section class="brain-panel category-pies">
    <header class="panel-head"><h2>Trase v petih kategorijah</h2></header>
    <div class="pies">
      <div v-for="chart in charts" :key="chart.title" class="pie">
        <h3>{{ chart.title }}</h3>
        <svg v-if="chart.total" viewBox="0 0 200 200" role="img" :aria-label="chart.title">
          <path
            v-for="segment in chart.segments.filter((s) => s.value > 0)"
            :key="segment.id"
            :d="segment.path"
            :fill="segment.color"
            tabindex="0"
            :aria-label="segment.tooltip"
          >
            <title>{{ segment.tooltip }}</title>
          </path>
        </svg>
        <p v-else>Ni podatkov.</p>
        <ul>
          <li v-for="segment in chart.segments" :key="segment.id" :title="segment.tooltip">
            <i :style="{ background: segment.color }" /><span>{{ segment.label }}</span
            ><strong>{{ nf(segment.share * 100) }} %</strong>
          </li>
        </ul>
      </div>
    </div>
    <p class="chart-note">
      Kategorije po km-effort: razdalja v kilometrih + vzpon/100. Deleži izhajajo iz števila tras,
      vsote kilometrov in vsote vzpona.
    </p>
  </section>
</template>
<style scoped>
.pies {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 28px;
  margin-top: 20px;
}
.pie {
  min-width: 0;
}
.pie h3 {
  font-size: 14px;
  text-align: center;
}
.pie svg {
  width: 100%;
  max-height: 220px;
  display: block;
}
.pie path:hover,
.pie path:focus {
  opacity: 0.8;
  outline: none;
  stroke: #fff;
  stroke-width: 2;
}
.pie ul {
  list-style: none;
  padding: 0;
  margin: 12px auto;
  max-width: 220px;
  display: grid;
  gap: 8px;
}
.pie li {
  display: flex;
  align-items: center;
  gap: 8px;
  font: 11px var(--mono);
}
.pie i {
  width: 9px;
  height: 9px;
}
.pie strong {
  margin-left: auto;
}
@media (max-width: 600px) {
  .pies {
    grid-template-columns: 1fr;
  }
}
</style>
