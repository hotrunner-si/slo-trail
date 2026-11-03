<script setup lang="ts">
import { trailCategory, trailHistogram, trailMonths, type TrailPoint } from '~/utils/trailAnalytics'
const props = defineProps<{ points: TrailPoint[] }>()
const distances = computed(() =>
  trailHistogram(props.points, [0, 10, 20, 30, 40, 50, 60, 80, 100, 120, 160], (p) => p.km),
)
const elevations = computed(() =>
  trailHistogram(
    props.points,
    [0, 500, 1000, 1500, 2000, 3000, 4000, 6000, 8000, 10000],
    (p) => p.elevation,
  ),
)
const months = computed(() => trailMonths(props.points))
const steepest = computed(() =>
  props.points
    .filter((p) => p.km >= 5)
    .map((p) => ({ ...p, density: p.elevation / p.km }))
    .sort((a, b) => b.density - a.density || a.key.localeCompare(b.key))
    .slice(0, 10),
)
const maxDensity = computed(() => Math.max(1, ...steepest.value.map((p) => p.density)))
const nf = (n: number) => new Intl.NumberFormat('sl-SI', { maximumFractionDigits: 1 }).format(n)
</script>
<template>
  <div class="trail-insights">
    <BrainHistogram
      title="Kako dolge so naše trase?"
      :bins="distances"
      unit="km"
      note="Histogram dejanskih razdalj. Barvni deli stolpcev pokažejo kategorije km-effort; desna meja intervala pripada naslednjemu stolpcu."
    />
    <BrainHistogram
      title="Koliko vzpona nas čaka?"
      :bins="elevations"
      unit="m vzpona"
      note="Histogram skupnega vzpona. Enako dolgi trasi lahko zaradi višinskih metrov sodita v različni kategoriji."
    />
    <BrainHistogram
      title="Barve trail sezone"
      :bins="months"
      unit="leto–mesec"
      note="Število tras po mesecih in kategorijah. Vključeni so le dogodki s potrjenim datumom; ena tekma lahko ponuja več tras."
    />
    <section class="brain-panel trail-density">
      <header class="panel-head">
        <div>
          <h2>Kje se vzpon najbolj zgosti?</h2>
          <p class="density-subtitle">Deset tras z največ vzpona na kilometer</p>
        </div>
        <span class="data-chip">m+ / km</span>
      </header>
      <ol v-if="steepest.length" class="density-list">
        <li v-for="(p, i) in steepest" :key="p.key">
          <div class="density-label">
            <a :href="`/races/${p.raceSlug}`"
              ><span>{{ String(i + 1).padStart(2, '0') }}</span> {{ p.raceName }}
              <small>{{ p.label }}</small></a
            ><strong>{{ nf(p.density) }}</strong>
          </div>
          <div class="density-track">
            <span
              :style="{
                width: `${(p.density / maxDensity) * 100}%`,
                background: trailCategory(p).color,
              }"
            />
          </div>
          <p>{{ nf(p.km) }} km · {{ nf(p.elevation) }} m+ · {{ trailCategory(p).label }}</p>
        </li>
      </ol>
      <p v-else class="empty-panel">Za primerjavo še ni dovolj podatkov.</p>
      <p class="chart-note">
        Vzpon ÷ razdalja, za trase dolge vsaj 5 km. To je gostota vzpona po celotni trasi, ne naklon
        posameznega vzpona ali ocena tehnične zahtevnosti.
      </p>
    </section>
  </div>
</template>
<style scoped>
.trail-insights {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  margin-top: 18px;
}
.density-subtitle {
  font-size: 11px;
  margin: 5px 0 0;
}
.density-list {
  list-style: none;
  padding: 0;
  margin: 20px 0 0;
  display: grid;
  gap: 15px;
}
.density-label {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  font-size: 11px;
}
.density-label a {
  line-height: 1.5;
  text-decoration: none;
  color: #35543b;
}
.density-label a > span {
  font: 9px var(--mono);
  color: #8a9880;
  margin-right: 6px;
}
.density-label small {
  color: #718168;
}
.density-label strong {
  font: 12px var(--mono);
  white-space: nowrap;
}
.density-track {
  height: 6px;
  background: #e9eedf;
  border-radius: 3px;
  margin-top: 5px;
  overflow: hidden;
}
.density-track > span {
  display: block;
  height: 100%;
  border-radius: 3px;
}
.density-list li > p {
  font: 9px var(--mono);
  margin: 5px 0 0;
}
@media (max-width: 800px) {
  .trail-insights {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
