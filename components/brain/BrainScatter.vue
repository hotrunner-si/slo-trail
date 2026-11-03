<script setup lang="ts">
import {
  effortBandPolygon,
  trailCategories,
  trailCategory,
  trailAxisTicks,
  type TrailPoint,
} from '~/utils/trailAnalytics'
const props = defineProps<{ points: TrailPoint[]; title?: string; note: string }>()
const id = useId().replace(/:/g, '')
const zoom = ref(1),
  selected = ref<TrailPoint | null>(null)
const valid = computed(() =>
  props.points.filter(
    (p) => Number.isFinite(p.km) && p.km > 0 && Number.isFinite(p.elevation) && p.elevation >= 0,
  ),
)
const baseKm = computed(() =>
  Math.max(50, Math.ceil(Math.max(0, ...valid.value.map((p) => p.km)) / 50) * 50),
)
const baseElevation = computed(() =>
  Math.max(2000, Math.ceil(Math.max(0, ...valid.value.map((p) => p.elevation)) / 2000) * 2000),
)
const maxKm = computed(() => baseKm.value / zoom.value),
  maxElevation = computed(() => baseElevation.value / zoom.value)
const visible = computed(() =>
  valid.value.filter((p) => p.km <= maxKm.value && p.elevation <= maxElevation.value),
)
const distanceMilestones = [20, 50, 100, 160]
const elevationMilestones = [2000, 5000, 10000, 16000]
const xTicks = computed(() => trailAxisTicks(maxKm.value, distanceMilestones))
const yTicks = computed(() => trailAxisTicks(maxElevation.value, elevationMilestones, 0.12))
const x = (km: number) => 64 + (km / maxKm.value) * 600,
  y = (elevation: number) => 332 - (elevation / maxElevation.value) * 288
const number = (n: number) => new Intl.NumberFormat('sl-SI', { maximumFractionDigits: 1 }).format(n)
const bands = computed(() =>
  trailCategories.map((c) => ({
    ...c,
    polygon: effortBandPolygon(maxKm.value, maxElevation.value, c.min, c.max)
      .map(([km, e]) => `${x(km)},${y(e)}`)
      .join(' '),
  })),
)
function setZoom(value: number) {
  zoom.value = Math.max(1, Math.min(16, value))
  selected.value = null
}
function wheel(event: WheelEvent) {
  // Trackpad pinch is delivered as Ctrl+wheel by Chromium and Firefox.
  if (!event.ctrlKey || !event.deltaY) return
  event.preventDefault()
  const next = Math.max(
    1,
    Math.min(16, zoom.value * Math.exp(-Math.max(-120, Math.min(120, event.deltaY)) * 0.004)),
  )
  if (Math.abs(next - zoom.value) < 0.00001) return
  setZoom(next)
}
let pinch: { distance: number; zoom: number } | null = null
const touchDistance = (touches: TouchList) =>
  Math.hypot(touches[0]!.clientX - touches[1]!.clientX, touches[0]!.clientY - touches[1]!.clientY)
function touchStart(event: TouchEvent) {
  if (event.touches.length !== 2) {
    pinch = null
    return
  }
  const distance = touchDistance(event.touches)
  pinch = distance > 0 ? { distance, zoom: zoom.value } : null
  event.preventDefault()
}
function touchMove(event: TouchEvent) {
  if (event.touches.length !== 2 || !pinch) return
  event.preventDefault()
  setZoom((pinch.zoom * touchDistance(event.touches)) / pinch.distance)
}
let gestureZoom = 1
function gestureStart(event: Event) {
  event.preventDefault()
  gestureZoom = zoom.value
}
function gestureChange(event: Event) {
  event.preventDefault()
  const scale = (event as Event & { scale?: number }).scale
  if (scale && Number.isFinite(scale)) setZoom(gestureZoom * scale)
}
function key(event: KeyboardEvent) {
  if (['+', '=', '-', 'Home', '0'].includes(event.key)) {
    event.preventDefault()
    setZoom(
      event.key === '-'
        ? zoom.value / 1.3
        : ['Home', '0'].includes(event.key)
          ? 1
          : zoom.value * 1.3,
    )
  }
}
</script>
<template>
  <section class="brain-panel scatter-panel trail-scatter">
    <header class="panel-head">
      <div>
        <h2>{{ title || 'Slovenske trase' }}</h2>
        <p class="scatter-subtitle">Razdalja, vzpon in značaj vsake trase.</p>
      </div>
      <span class="data-chip">{{ visible.length }} / {{ valid.length }} tras</span>
    </header>
    <div class="scatter-tools">
      <div class="scatter-zoom-buttons">
        <button
          type="button"
          aria-label="Oddalji graf"
          :disabled="zoom <= 1"
          @click="setZoom(zoom / 1.3)"
        >
          −</button
        ><output aria-live="polite">{{ number(zoom) }}×</output
        ><button
          type="button"
          aria-label="Približaj graf"
          :disabled="zoom >= 16"
          @click="setZoom(zoom * 1.3)"
        >
          +</button
        ><button type="button" class="scatter-reset" :disabled="zoom <= 1" @click="setZoom(1)">
          Vse trase
        </button>
      </div>
      <label class="scatter-range"
        >Približanje
        <input
          type="range"
          min="1"
          max="16"
          step="0.1"
          :value="zoom"
          aria-label="Približanje obeh osi grafa"
          @input="setZoom(Number(($event.target as HTMLInputElement).value))"
      /></label>
    </div>
    <svg
      viewBox="0 0 700 390"
      role="group"
      aria-label="Slovenske trase: razdalja in vzpon. S Ctrl in drsenjem, ščipanjem z dvema prstoma ali tipkama plus in minus približaj obe osi. Tipka Home prikaže vse trase."
      tabindex="0"
      :data-zoom="zoom"
      @wheel="wheel"
      @touchstart="touchStart"
      @touchmove="touchMove"
      @touchend="pinch = null"
      @touchcancel="pinch = null"
      @gesturestart="gestureStart"
      @gesturechange="gestureChange"
      @keydown="key"
    >
      <defs>
        <clipPath :id="id + '-clip'"><rect x="64" y="44" width="600" height="288" /></clipPath>
        <pattern :id="id + '-texture'" width="18" height="18" patternUnits="userSpaceOnUse">
          <path d="M0 18L18 0" stroke="white" stroke-opacity=".17" />
        </pattern>
      </defs>
      <g :clip-path="`url(#${id}-clip)`">
        <polygon
          v-for="band in bands"
          :key="band.id"
          :points="band.polygon"
          :fill="band.background"
          stroke="#fff"
          stroke-width="1.2"
        />
        <rect x="64" y="44" width="600" height="288" :fill="`url(#${id}-texture)`" />
        <g class="scatter-grid">
          <line
            v-for="tick in yTicks"
            :key="'h' + tick"
            x1="64"
            :y1="y(tick)"
            x2="664"
            :y2="y(tick)"
          />
          <line
            v-for="tick in xTicks"
            :key="'v' + tick"
            :x1="x(tick)"
            y1="44"
            :x2="x(tick)"
            y2="332"
          />
        </g>
        <a
          v-for="point in visible"
          :key="point.key"
          :href="point.raceSlug ? `/races/${point.raceSlug}` : undefined"
          :aria-label="`${point.raceName}, ${point.label}, ${number(point.km)} kilometrov, ${number(point.elevation)} metrov vzpona`"
          @mouseenter="selected = point"
          @focusin="selected = point"
        >
          <circle
            :cx="x(point.km)"
            :cy="y(point.elevation)"
            :r="selected?.key === point.key ? 6 : 4"
            class="plot-point"
            :style="{ fill: trailCategory(point).color }"
            stroke="white"
            stroke-width="1"
          >
            <title>
              {{ point.raceName }} · {{ point.label }} · {{ number(point.km) }} km ·
              {{ number(point.elevation) }} m+ · {{ trailCategory(point).label }}
            </title>
          </circle>
        </a>
      </g>
      <g class="scatter-axis">
        <text
          v-for="tick in yTicks"
          :key="'y' + tick"
          x="55"
          :y="y(tick) + 4"
          :class="{ 'axis-milestone': elevationMilestones.includes(tick) }"
          text-anchor="end"
        >
          {{ number(tick) }}
        </text>
        <text
          v-for="tick in xTicks"
          :key="'x' + tick"
          :x="x(tick)"
          :class="{ 'axis-milestone': distanceMilestones.includes(tick) }"
          y="353"
          text-anchor="middle"
        >
          {{ number(tick) }}
        </text>
        <text x="64" y="24">VZPON / m</text>
        <text x="664" y="379" text-anchor="end">RAZDALJA / km</text>
      </g>
    </svg>
    <div class="scatter-selection" aria-live="polite">
      <template v-if="selected"
        ><strong>{{ selected.raceName }}</strong
        ><span
          >{{ selected.label }} · {{ number(selected.km) }} km · {{ number(selected.elevation) }} m+
          · {{ trailCategory(selected).label }}</span
        ></template
      ><template v-else
        ><strong>{{ visible.length ? 'Razišči trase' : 'V tem približanju ni tras' }}</strong
        ><span>{{
          visible.length
            ? 'Premakni se na točko za podatke; klik odpre tekmo.'
            : 'Oddalji graf ali izberi »Vse trase«.'
        }}</span></template
      >
    </div>
    <div class="trail-legend">
      <span v-for="category in trailCategories" :key="category.id"
        ><i :style="{ background: category.color }" />{{ category.label }}</span
      >
    </div>
    <p class="chart-note">
      Ctrl + drsenje ali ščip z dvema prstoma približa obe osi. Navadno drsenje premika stran.
      Pasovi: km-effort = km + vzpon/100.
      {{ note }}
    </p>
    <p v-if="!valid.length" class="empty-panel">Za prikaz še ni podatkov o razdalji in vzponu.</p>
  </section>
</template>
<style scoped>
.trail-scatter {
  min-width: 0;
}
.scatter-subtitle {
  font-size: 11px;
  margin: 5px 0 0;
}
.scatter-tools {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 16px;
}
.scatter-zoom-buttons {
  display: flex;
  gap: 5px;
  align-items: center;
}
.scatter-zoom-buttons button {
  background: #eef3e8;
  color: #315736;
  border: 1px solid #cfdcc5;
  padding: 5px 11px;
  font-size: 14px;
  min-width: 32px;
  min-height: 32px;
}
.scatter-zoom-buttons button:disabled {
  opacity: 0.4;
}
.scatter-zoom-buttons .scatter-reset {
  font-size: 11px;
  margin-left: 4px;
}
.scatter-zoom-buttons output {
  font-size: 11px;
  min-width: 38px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}
.scatter-range {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 10px;
  color: #6a7e65;
}
.scatter-range input {
  width: 100px;
  accent-color: #315736;
}
.trail-scatter > svg {
  width: 100%;
  flex: none;
  min-height: 0;
  margin: 12px 0 0;
  display: block;
  outline-offset: 2px;
  max-height: 300px;
  touch-action: pan-x pan-y;
}
.scatter-grid line {
  stroke: white;
  stroke-opacity: 0.65;
  stroke-dasharray: 2 5;
}
.scatter-axis text {
  font: 10px var(--mono);
  fill: #61735d;
}
.scatter-axis text.axis-milestone {
  fill: #294a32;
  font-weight: 700;
}
.trail-scatter .plot-point {
  opacity: 0.85;
  transition:
    r 0.12s,
    opacity 0.12s;
}
.trail-scatter a:hover .plot-point,
.trail-scatter a:focus .plot-point {
  r: 6px;
  opacity: 1;
  stroke: #244035;
  stroke-width: 1.5;
}
.scatter-selection {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 42px;
  font-size: 11px;
  border-left: 3px solid #bdd39c;
  padding: 4px 10px;
}
.scatter-selection span {
  color: #74816e;
  font-size: 10px;
}
.trail-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 13px;
  margin-top: 13px;
  font: 10px var(--mono);
}
.trail-legend span {
  display: flex;
  align-items: center;
  gap: 5px;
}
.trail-legend i {
  width: 9px;
  height: 9px;
  border-radius: 50%;
}
@media (max-width: 700px) {
  .scatter-tools {
    gap: 8px;
  }
  .scatter-range {
    width: 100%;
  }
  .scatter-range input {
    flex: 1;
  }
  .scatter-axis text {
    font-size: 18px;
  }
}
</style>
