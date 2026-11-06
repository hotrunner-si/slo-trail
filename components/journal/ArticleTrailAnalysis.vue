<script setup lang="ts">
import type { TrailPoint } from '~/utils/trailAnalytics'
defineProps<{ beforeChart: string; afterChart: string; points: TrailPoint[]; hideLengthFilter?: boolean }>()
</script>
<template>
  <div class="trail-analysis">
    <div v-html="beforeChart" />
    <BrainTrailInsights :points="points" :hide-length-filter="hideLengthFilter" />
    <div v-html="afterChart" />
  </div>
</template>
<style src="~/assets/css/winner-speed-charts.css"></style>
<style scoped>
.trail-analysis { width: 100%; min-width: 0; color: #294531; line-height: 1.75; }
.draft-label { font-size: 12px; text-transform: uppercase; letter-spacing: .12em; }
.trail-analysis :deep(.brain-panel) { padding: 24px; border: 1px solid #d2ddc8; background: #f8faf3; border-radius: 12px; }
.trail-analysis :deep(.panel-head h2) { margin: 0; }
.trail-analysis :deep(.chart-note) { font-size: 12px; color: #63735b; }
.trail-analysis :deep(h1) { font-size: clamp(30px, 5vw, 52px); line-height: 1.2; margin: 20px 0 28px; }
.trail-analysis :deep(h2) { font-size: 27px; line-height: 1.3; margin: 45px 0 20px; }
.trail-analysis :deep(h2.runner-section-heading) { font-size: clamp(30px, 3.5vw, 40px); margin-top: 64px; line-height: 1.25; }
.trail-analysis :deep(p) { margin: 20px 0; }
.trail-analysis :deep(a) { color: #356749; text-decoration: underline; }
.trail-analysis :deep(.table-wrap) { overflow-x: auto; margin: 24px 0; }
.trail-analysis :deep(table) { border-collapse: collapse; width: 100%; font-size: 13px; text-align: left; }
.trail-analysis :deep(th), .trail-analysis :deep(td) { padding: 12px; border-bottom: 1px solid #d2ddc8; vertical-align: top; }
.trail-analysis :deep(th) { background: #35543b; color: white; }
.trail-analysis :deep(details) { padding: 20px; border: 1px solid #d2ddc8; margin: 25px 0; background: #f8faf3; }
.trail-analysis :deep(summary) { cursor: pointer; font-weight: 700; }
.trail-analysis :deep(.profiles) { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; }
.trail-analysis :deep(.profile) { min-width: 0; margin: 20px 0; }
.trail-analysis :deep(.profile svg) { width: 100%; }
.trail-analysis :deep(figcaption) { font-size: 12px; color: #63735b; }
@media (max-width: 650px) { .trail-analysis :deep(.profiles) { grid-template-columns: 1fr; } }
.trail-analysis :deep(.profiles-distance) { grid-template-columns: 1fr; }
.trail-analysis :deep(.profile-chart) { overflow-x: auto; }
.trail-analysis :deep(.profile-chart svg) { display: block; min-width: 720px; }
.trail-analysis :deep(.profile-scale-note) { font-size: 13px; color: #63735b; }
</style>
