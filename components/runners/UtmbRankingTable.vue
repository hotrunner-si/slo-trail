<script setup lang="ts">
import { sortUtmbRunners, utmbCategories, utmbDisplayName } from '~/utils/utmb'
import type { UtmbCategory, UtmbRanking, UtmbSex } from '~/utils/utmb'
const selections = [
  { id: 'world-H', label: 'Svetovna lestvica · moški' },
  { id: 'world-F', label: 'Svetovna lestvica · ženske' },
  { id: 'slovenia-H', label: 'Slovenska lestvica · moški' },
  { id: 'slovenia-F', label: 'Slovenska lestvica · ženske' },
  { id: 'slovenia-mixed', label: 'Slovenska lestvica · mešana' },
]
const selection = ref('world-H')
const pickerOpen = ref(false)
const picker = ref<HTMLElement | null>(null)
const pickerButton = ref<HTMLButtonElement | null>(null)
async function openPicker() {
  pickerOpen.value = true
  await nextTick()
  picker.value?.querySelector<HTMLElement>('[role="option"][aria-selected="true"]')?.focus()
}
function chooseRanking(id: string) {
  selection.value = id
  pickerOpen.value = false
  pickerButton.value?.focus()
}
function pickerKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    pickerOpen.value = false
    pickerButton.value?.focus()
    return
  }
  if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
  event.preventDefault()
  const options = [...(picker.value?.querySelectorAll<HTMLElement>('[role="option"]') ?? [])]
  const current = options.indexOf(document.activeElement as HTMLElement)
  const next =
    event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? options.length - 1
        : (current + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length
  options[next]?.focus()
}
function closePickerOutside(event: PointerEvent) {
  if (!picker.value?.contains(event.target as Node)) pickerOpen.value = false
}
function closePickerOnFocus(event: FocusEvent) {
  if (!picker.value?.contains(event.target as Node)) pickerOpen.value = false
}
onMounted(() => {
  document.addEventListener('pointerdown', closePickerOutside)
  document.addEventListener('focusin', closePickerOnFocus)
})
onUnmounted(() => {
  document.removeEventListener('pointerdown', closePickerOutside)
  document.removeEventListener('focusin', closePickerOnFocus)
})
const scope = computed(() => (selection.value.startsWith('world-') ? 'world' : 'slovenia'))
const mixed = computed(() => selection.value === 'slovenia-mixed')
const female = computed(() => selection.value.endsWith('-F'))
const category = ref<UtmbCategory>('general')
const labels: Record<UtmbCategory, string> = {
  general: 'General UTMB',
  '20k': '20K',
  '50k': '50K',
  '100k': '100K',
  '100m': '100M',
}
const title = computed(() => selections.find((item) => item.id === selection.value)!.label)
const requestCategory = computed(() => (scope.value === 'world' ? category.value : 'general'))
const dataKey = computed(() => `utmb-table-${selection.value}-${requestCategory.value}`)
const { data, status, error, refresh } = await useAsyncData(dataKey, async () => {
  const sexes: UtmbSex[] = mixed.value ? ['H', 'F'] : [female.value ? 'F' : 'H']
  const rankings = await Promise.all(
    sexes.map(async (sex) => {
      const ranking = await $fetch<UtmbRanking & { stale: boolean }>('/api/utmb/rankings', {
        query: { scope: scope.value, sex, category: requestCategory.value },
      })
      return { ...ranking, runners: ranking.runners.map((runner) => ({ ...runner, sex })) }
    }),
  )
  return {
    runners: rankings.flatMap((ranking) => ranking.runners),
    fetchedAt: rankings.map((ranking) => ranking.fetchedAt).sort()[0]!,
    stale: rankings.some((ranking) => ranking.stale),
  }
})
const rows = computed(() => sortUtmbRunners(data.value?.runners ?? [], category.value))
const runnerSex = (id: number) => data.value?.runners.find((runner) => runner.id === id)?.sex
const fetchedAt = computed(() =>
  data.value
    ? new Date(data.value.fetchedAt).toLocaleString('sl-SI', {
        timeZone: 'Europe/Ljubljana',
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : '',
)
</script>

<template>
  <section
    class="utmb-section"
    :class="{ 'utmb-female': female }"
    :aria-label="title"
    :aria-busy="status === 'pending'"
  >
    <div class="utmb-section-heading">
      <div ref="picker" class="utmb-ranking-picker" @keydown="pickerKeydown">
        <h2>
          <button
            ref="pickerButton"
            type="button"
            class="utmb-ranking-select"
            aria-haspopup="listbox"
            :aria-expanded="pickerOpen"
            aria-controls="utmb-ranking-options"
            @click="pickerOpen ? (pickerOpen = false) : openPicker()"
            @keydown.down.prevent="openPicker()"
            @keydown.up.prevent="openPicker()"
          >
            {{ title }}
            <svg
              :class="{ expanded: pickerOpen }"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <path d="m5 8 5 5 5-5" stroke="currentColor" stroke-width="1.5" />
            </svg>
          </button>
        </h2>
        <div
          v-if="pickerOpen"
          id="utmb-ranking-options"
          class="utmb-ranking-options"
          role="listbox"
          aria-label="Izberi lestvico"
        >
          <button
            v-for="item in selections"
            :key="item.id"
            type="button"
            role="option"
            :aria-selected="selection === item.id"
            tabindex="-1"
            @click="chooseRanking(item.id)"
          >
            <span>{{ item.label }}</span
            ><span class="utmb-option-check" aria-hidden="true">{{
              selection === item.id ? '✓' : ''
            }}</span>
          </button>
        </div>
      </div>
      <span class="mono">{{
        mixed ? '100 M + 100 Ž' : `TOP ${scope === 'world' ? 25 : 100}`
      }}</span>
    </div>
    <p class="utmb-scope-note">
      {{
        mixed
          ? '100 najboljših moških in 100 najboljših žensk po generalnem UTMB indeksu.'
          : scope === 'world'
            ? 'Najboljših 25.'
            : '100 najboljših po generalnem UTMB indeksu.'
      }}
    </p>
    <p v-if="mixed" class="utmb-gender-legend">
      <span class="utmb-men">● Moški</span><span class="utmb-women">● Ženske</span>
    </p>
    <p v-if="error" role="alert">
      Lestvice trenutno ni mogoče naložiti.
      <button type="button" @click="refresh()">Poskusi znova</button>
    </p>
    <p v-else-if="status === 'pending'" role="status">Nalagam lestvico …</p>
    <div class="utmb-table-scroll" role="region" :aria-label="title + ' – tabela'" tabindex="0">
      <table>
        <caption class="sr-only">
          {{
            title
          }}. Za razvrščanje izberi indeks v glavi stolpca.
        </caption>
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Ime in priimek</th>
            <th v-if="scope === 'world'" scope="col">Država</th>
            <th v-if="mixed" scope="col">Spol</th>
            <th
              v-for="key in utmbCategories"
              :key="key"
              scope="col"
              :class="`utmb-heading-${key}`"
              :aria-sort="category === key ? 'descending' : 'none'"
            >
              <button type="button" @click="category = key">
                {{ labels[key] }} <span aria-hidden="true">{{ category === key ? '↓' : '↕' }}</span>
              </button>
            </th>
          </tr>
        </thead>
        <tbody v-if="status !== 'pending' && !error">
          <tr
            v-for="(runner, index) in rows"
            :key="runner.id"
            :class="{ 'utmb-female': runnerSex(runner.id) === 'F' }"
          >
            <td class="utmb-position">{{ index + 1 }}</td>
            <th scope="row">
              <a
                :href="`https://utmb.world/runner/${runner.uri}`"
                target="_blank"
                rel="noopener noreferrer"
                >{{ utmbDisplayName(runner.name) }}</a
              >
            </th>
            <td v-if="scope === 'world'">{{ runner.country }}</td>
            <td v-if="mixed" :class="runnerSex(runner.id) === 'F' ? 'utmb-women' : 'utmb-men'">
              <abbr :title="runnerSex(runner.id) === 'F' ? 'Ženske' : 'Moški'">{{
                runnerSex(runner.id) === 'F' ? 'Ž' : 'M'
              }}</abbr>
            </td>
            <td
              v-for="key in utmbCategories"
              :key="key"
              :class="{ 'utmb-selected': category === key }"
            >
              {{ runner.indices[key] || '—' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-if="data && !error" class="utmb-updated">
      Podatki: {{ fetchedAt }}
      <span v-if="data.stale">· Prikazan je zadnji uspešen zajem; osvežitev še ni na voljo.</span>
    </p>
  </section>
</template>

<style scoped>
.utmb-section {
  --selected-index-color: #2869a2;
  margin-block: 48px 64px;
}
.utmb-female {
  --selected-index-color: #a13f78;
}
.utmb-ranking-select {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  max-width: 100%;
  padding: 10px 0;
  border: 0;
  border-bottom: 1px solid var(--line);
  border-radius: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  letter-spacing: inherit;
  cursor: pointer;
}
.utmb-ranking-select svg {
  flex: 0 0 20px;
  width: 20px;
  height: 20px;
  transition: transform 0.15s;
}
.utmb-ranking-select svg.expanded {
  transform: rotate(180deg);
}
.utmb-ranking-picker {
  position: relative;
  min-width: 0;
  max-width: 100%;
}
.utmb-ranking-options {
  position: absolute;
  left: 0;
  top: calc(100% + 8px);
  z-index: 30;
  width: max-content;
  min-width: 100%;
  max-width: calc(100vw - 48px);
  padding: 6px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--paper, #f7f5ef);
  box-shadow: 0 12px 36px #17212b16;
}
.utmb-ranking-options button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  width: 100%;
  min-height: 46px;
  padding: 12px 14px;
  border: 0;
  border-radius: 3px;
  background: transparent;
  text-align: left;
  font: inherit;
  font-size: 0.86rem;
  color: inherit;
  cursor: pointer;
}
.utmb-ranking-options button:hover,
.utmb-ranking-options button:focus-visible {
  background: #2663580d;
  outline: none;
}
.utmb-ranking-options button[aria-selected='true'] {
  color: var(--accent);
  background: #26635814;
  font-weight: 700;
}
.utmb-option-check {
  min-width: 14px;
}
.utmb-section-heading h2 {
  min-width: 0;
  margin: 0;
}
.utmb-ranking-select:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 4px;
}
.utmb-gender-legend {
  display: flex;
  gap: 20px;
  font-size: 0.78rem;
  margin-block: 12px 18px;
}
.utmb-men {
  color: #2869a2;
}
.utmb-women {
  color: #a13f78;
}
abbr {
  text-decoration: none;
  font-weight: 700;
}
.utmb-section-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
}
h2 {
  font-size: clamp(1.2rem, 2.8vw, 1.8rem);
  letter-spacing: -0.04em;
}
.utmb-section-heading .mono {
  font-size: 0.72rem;
  white-space: nowrap;
  color: var(--muted);
}
.utmb-scope-note,
.utmb-updated {
  font-size: 0.78rem;
  color: var(--muted);
  margin-block: 12px 18px;
}
.utmb-table-scroll {
  overflow-x: auto;
  border-block: 1px solid var(--line);
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
  font-variant-numeric: tabular-nums;
}
th,
td {
  padding: 14px 12px;
  text-align: right;
  border-bottom: 1px solid var(--line);
  white-space: nowrap;
}
th:nth-child(2),
tbody th {
  text-align: left;
}
thead {
  background: #ebe9e2;
}
thead th {
  font-size: 0.7rem;
}
thead button {
  font: inherit;
  color: inherit;
  border: 0;
  background: transparent;
  padding: 8px 0;
  cursor: pointer;
}
thead th[aria-sort='descending'],
.utmb-selected {
  color: var(--selected-index-color);
  background: color-mix(in srgb, var(--selected-index-color) 7%, transparent);
  font-weight: 700;
}
.utmb-heading-20k button {
  color: var(--effort-20k, #d6b529);
}
.utmb-heading-50k button {
  color: var(--effort-50k, #d8792c);
}
.utmb-heading-100k button {
  color: var(--effort-100k, #3e8d68);
}
.utmb-heading-100m button {
  color: var(--effort-100m, #ba4b4f);
}
.utmb-position {
  color: var(--muted);
  font-family: var(--mono);
  font-size: 0.7rem;
}
tbody th {
  font-weight: 500;
  min-width: 180px;
}
tbody a:hover {
  text-decoration: underline;
}
tbody tr:hover {
  background: #26635805;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}
@media (max-width: 600px) {
  thead th:nth-child(2),
  tbody th[scope='row'] {
    position: sticky;
    left: 0;
    z-index: 2;
    background: var(--paper, #f7f5ef);
    border-right: 0;
    box-shadow: none;
  }
  thead th:nth-child(2) { background: #ebe9e2; z-index: 3; }
  .utmb-section-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }
  .utmb-section-heading h2 {
    width: 100%;
  }
  .utmb-ranking-picker {
    width: 100%;
  }
  .utmb-ranking-select {
    width: 100%;
    text-align: left;
    gap: 10px;
  }
  .utmb-ranking-options {
    width: 100%;
    max-width: 100%;
  }
  th,
  td {
    padding: 12px 10px;
  }
  .utmb-section {
    margin-block: 32px 44px;
  }
}
</style>
