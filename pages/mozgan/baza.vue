<script setup lang="ts">
import type { KnowledgeEntry } from '~/types/knowledge'
import type { BrainSource } from '~/types/brain'
import { knowledgeKindNames, knowledgeOriginNames, safeKnowledgeUrl } from '~/utils/knowledge'
definePageMeta({ middleware: 'brain-account' })
useSiteSeo('Baza znanja · Možgan', 'Vsi zapisi in pomensko iskanje po trail zbirki.', {
  noindex: true,
})
const request = useRequestFetch()
const { session } = await useBrainSession()
const {
  data,
  status,
  error: loadError,
  refresh,
} = await useAsyncData(
  () => `brain-knowledge-list-${session.value?.user?.id || 'guest'}`,
  () => request('/api/brain/knowledge'),
)
const query = ref(''),
  kind = ref(''),
  origin = ref(''),
  page = ref(1)
const busy = ref(false),
  error = ref(''),
  submitted = ref(''),
  matches = ref<BrainSource[] | null>(null)
let generation = 0
const entries = computed(() => data.value?.entries || [])
const kinds = computed(() => [...new Set(entries.value.map((e) => e.kind))])
const origins = computed(() => [...new Set(entries.value.map((e) => e.origin))])
const filter = (entry: KnowledgeEntry) =>
  (!kind.value || entry.kind === kind.value) && (!origin.value || entry.origin === origin.value)
const all = computed(() => entries.value.filter(filter))
const searchEntries = computed(() =>
  (matches.value || [])
    .map((source) => {
      const entry = entries.value.find((e) => e.id === `source:${source.id}`)
      return entry
        ? { ...entry, similarity: source.similarity }
        : {
            id: `source:${source.id}`,
            title: source.title,
            kind: 'source',
            origin: source.origin,
            excerpt: source.excerpt,
            topic: 'other' as const,
            sections: [],
            facts: [],
            related: [],
            links: source.url ? [{ label: 'Odpri vir', url: source.url }] : [],
            verifiedAt: source.verified_at,
            validFrom: source.valid_from,
            validUntil: source.valid_until,
            similarity: source.similarity,
          }
    })
    .filter(filter),
)
const records = computed(() => (matches.value === null ? all.value : searchEntries.value))
const pages = computed(() => Math.max(1, Math.ceil(records.value.length / 30)))
const currentPage = computed(() => Math.min(page.value, pages.value))
const visible = computed(() =>
  records.value.slice((currentPage.value - 1) * 30, currentPage.value * 30),
)
watch([kind, origin], () => {
  page.value = 1
})
async function search() {
  const question = query.value.trim(),
    current = ++generation
  error.value = ''
  page.value = 1
  if (!question) {
    matches.value = null
    submitted.value = ''
    return
  }
  busy.value = true
  try {
    const result = await $fetch<{ records: BrainSource[]; mode: string }>('/api/brain/search', {
      method: 'POST',
      body: { query: question, semantic: true, kind: '', origin: '' },
    })
    if (current !== generation) return
    if (result.mode !== 'vector') throw new Error('vector-unavailable')
    matches.value = result.records
    submitted.value = question
  } catch (e) {
    if (current !== generation) return
    error.value =
      e instanceof Error && e.message === 'vector-unavailable'
        ? 'Vektorsko iskanje trenutno ni na voljo. Spodaj ostaja seznam vseh zapisov.'
        : brainError(e)
    matches.value = null
    submitted.value = ''
  } finally {
    if (current === generation) busy.value = false
  }
}
function clear() {
  generation++
  query.value = ''
  submitted.value = ''
  matches.value = null
  error.value = ''
  busy.value = false
  page.value = 1
}
function resetFilters() {
  kind.value = ''
  origin.value = ''
}
function date(value?: string | null) {
  return value
    ? new Intl.DateTimeFormat('sl-SI', { timeZone: 'Europe/Ljubljana' }).format(new Date(value))
    : 'Ni navedeno'
}
function readable(text: string) {
  const start = text.indexOf('{')
  if (start < 0) return text
  try {
    return (
      text.slice(0, start) +
      '\n' +
      JSON.stringify(JSON.parse(text.slice(start).replace(/\\"/g, '"')), null, 2)
    )
  } catch {
    return text
  }
}
function similarity(entry: KnowledgeEntry) {
  return (entry as KnowledgeEntry & { similarity?: number }).similarity
}
onBeforeUnmount(() => generation++)
</script>

<template>
  <section class="knowledge-list" aria-label="Baza znanja">
    <header class="list-header">
      <h2>Baza znanja</h2>
      <p>Vsi zapisi na enem mestu. Vpiši vprašanje za 25 najbližjih zadetkov po pomenu.</p>
    </header>
    <form class="list-search" role="search" @submit.prevent="search">
      <label for="knowledge-query" class="sr-only">Vprašanje ali opis za pomensko iskanje</label>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.6"
        aria-hidden="true"
      >
        <circle cx="10.5" cy="10.5" r="7.5" />
        <path d="m16 16 5 5" />
      </svg>
      <input
        id="knowledge-query"
        v-model="query"
        maxlength="300"
        placeholder="Poišči po pomenu: tekma, podatek ali vprašanje …"
      />
      <button type="submit" :disabled="busy || !query.trim()">
        {{ busy ? 'Iščem …' : 'Poišči' }}
      </button>
      <button v-if="query || submitted" type="button" class="clear-search" @click="clear">
        Počisti
      </button>
    </form>
    <div class="list-filters">
      <label for="knowledge-kind"
        >Vrsta<select id="knowledge-kind" v-model="kind">
          <option value="">Vse vrste</option>
          <option v-for="value in kinds" :key="value" :value="value">
            {{ knowledgeKindNames[value] || value }}
          </option>
        </select></label
      ><label for="knowledge-origin"
        >Izvor<select id="knowledge-origin" v-model="origin">
          <option value="">Vsi izvori</option>
          <option v-for="value in origins" :key="value" :value="value">
            {{ knowledgeOriginNames[value] || value }}
          </option>
        </select></label
      ><button v-if="kind || origin" class="reset-filters" @click="resetFilters">
        Ponastavi filtre
      </button>
    </div>
    <p v-if="error" class="list-error" role="alert">{{ error }}</p>
    <div v-if="loadError" class="list-error" role="alert">
      <p>Seznama trenutno ni mogoče naložiti.</p>
      <button @click="refresh()">Poskusi znova</button>
    </div>
    <div class="list-count" aria-live="polite">
      <h3>
        {{ matches === null ? 'Vsi zapisi' : 'Najbližji zadetki' }}
        <span>{{ records.length }}</span>
      </h3>
      <p v-if="submitted">
        Za »{{ submitted }}« · razvrščeno po vektorski podobnosti, nato omejeno z izbranimi filtri.
      </p>
      <p v-else>{{ entries.length }} zapisov v zbirki · klikni zapis za podrobnosti.</p>
    </div>
    <p v-if="status === 'pending' && !entries.length" role="status">Nalagam zapise …</p>
    <div class="record-list" :aria-busy="busy">
      <details v-for="entry in visible" :key="entry.id" class="record-row">
        <summary>
          <span class="record-name">{{ entry.title }}</span
          ><span class="record-kind">{{ knowledgeKindNames[entry.kind] || entry.kind }}</span
          ><span class="record-origin" :data-origin="entry.origin">{{
            knowledgeOriginNames[entry.origin] || entry.origin
          }}</span
          ><span
            v-if="matches !== null && similarity(entry) != null"
            class="record-similarity"
            title="Kosinusna podobnost ni ocena resničnosti"
            >{{ similarity(entry)!.toFixed(3) }}</span
          >
        </summary>
        <div class="record-detail">
          <p class="record-text">{{ readable(entry.excerpt) }}</p>
          <dl v-if="entry.facts.length">
            <div v-for="fact in entry.facts" :key="fact.label">
              <dt>{{ fact.label }}</dt>
              <dd>{{ fact.value }}</dd>
            </div>
          </dl>
          <section v-for="(section, index) in entry.sections" :key="index">
            <h4 v-if="section.title">{{ section.title }}</h4>
            <p class="record-text">{{ section.text }}</p>
          </section>
          <p class="source-date">
            Preverjeno: {{ date(entry.verifiedAt) }} · Velja:
            {{ entry.validFrom || 'ni navedeno' }} – {{ entry.validUntil || 'ni navedeno' }}
          </p>
          <div class="record-links">
            <template v-for="link in entry.links" :key="link.url"
              ><a
                v-if="safeKnowledgeUrl(link.url)"
                :href="safeKnowledgeUrl(link.url)!"
                target="_blank"
                rel="noopener noreferrer"
                >{{ link.label }} ↗<span class="sr-only"> (nov zavihek)</span></a
              ></template
            >
          </div>
        </div>
      </details>
    </div>
    <p v-if="!loadError && status !== 'pending' && !records.length" class="empty-list">
      Ni zapisov za ta izbor. Odstrani filtre ali poskusi drugo vprašanje.
    </p>
    <nav v-if="pages > 1" class="list-pagination" aria-label="Strani zapisov">
      <button :disabled="currentPage <= 1" @click="page = currentPage - 1">← Prejšnja</button
      ><span>Stran {{ currentPage }} od {{ pages }}</span
      ><button :disabled="currentPage >= pages" @click="page = currentPage + 1">Naslednja →</button>
    </nav>
    <p class="list-note">
      Pomensko iskanje primerja indeksirane vire. Bližina zadetka ne potrjuje njegove pravilnosti;
      pri uporabi preveri izvor in veljavnost.
    </p>
  </section>
</template>

<style scoped>
.knowledge-list {
  max-width: 1100px;
  margin: 0 auto 30px;
  padding: 28px 30px;
  border: 1px solid #d9e1d2;
  border-radius: 8px;
  background: #fcfdf9;
  color: #294332;
  font-size: 14px;
}
.list-header h2 {
  font-size: 25px;
  font-weight: 500;
  margin: 0 0 8px;
}
.list-header p {
  margin: 0 0 24px;
  font-size: 13px;
  line-height: 1.7;
  color: #596c56;
}
.list-search {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px 8px 16px;
  background: white;
  border: 1px solid #becdb4;
  border-radius: 8px;
}
.list-search svg {
  width: 20px;
  height: 20px;
  flex: none;
  color: #6b805f;
}
.list-search input {
  min-width: 0;
  flex: 1;
  padding: 10px 0;
  border: 0;
  outline: none;
  font: inherit;
  color: #294332;
  background: transparent;
}
.list-search:focus-within {
  outline: 2px solid #759667;
  outline-offset: 2px;
}
button {
  min-height: 40px;
  padding: 9px 15px;
  border: 1px solid #cad6bf;
  border-radius: 6px;
  color: #315438;
  background: #f4f7ee;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}
.list-search button[type='submit'] {
  color: white;
  background: #315438;
  border-color: #315438;
}
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.clear-search,
.reset-filters {
  border: 0;
  background: transparent;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.list-filters {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  align-items: end;
  margin: 20px 0 26px;
}
.list-filters label {
  display: grid;
  gap: 6px;
  color: #50664b;
  font-size: 11px;
}
.list-filters select {
  min-width: 180px;
  min-height: 39px;
  padding: 8px 12px;
  border: 1px solid #cbd7c1;
  background: #fff;
  border-radius: 6px;
  color: #294332;
  font: inherit;
  font-size: 12px;
}
.list-count {
  display: flex;
  align-items: baseline;
  gap: 16px;
  justify-content: space-between;
  flex-wrap: wrap;
  margin: 0 0 12px;
}
.list-count h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}
.list-count h3 span {
  margin-left: 7px;
  color: #687e5b;
  font-size: 12px;
  font-weight: 400;
}
.list-count p {
  margin: 0;
  color: #607358;
  font-size: 11px;
}
.record-list {
  border-top: 1px solid #d9e1d2;
}
.record-row {
  border-bottom: 1px solid #e0e6d9;
}
.record-row summary {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 5px;
  cursor: pointer;
  list-style: none;
}
.record-row summary::-webkit-details-marker {
  display: none;
}
.record-row summary::before {
  content: '›';
  color: #6e885d;
  font-size: 20px;
  line-height: 1;
  width: 12px;
  flex: none;
}
.record-row[open] summary::before {
  transform: rotate(90deg);
}
.record-row summary:hover {
  background: #f2f6eb;
}
.record-name {
  flex: 1;
  font-size: 13px;
  line-height: 1.6;
  font-weight: 500;
  overflow-wrap: anywhere;
}
.record-kind {
  font-size: 11px;
  color: #64775a;
}
.record-origin {
  min-width: 112px;
  font-size: 10px;
  padding: 3px 7px;
  border-radius: 4px;
  color: #58704d;
  background: #edf2e5;
  text-align: center;
}
.record-origin[data-origin='official'] {
  background: #e4efde;
  color: #325c30;
}
.record-origin[data-origin='unverified'],
.record-origin[data-origin='community'],
.record-origin[data-origin='conversation'] {
  background: #f7efdd;
  color: #795b2d;
}
.record-similarity {
  width: 40px;
  text-align: right;
  font-size: 11px;
  color: #607358;
  font-variant-numeric: tabular-nums;
}
.record-detail {
  padding: 0 24px 24px;
  font-size: 13px;
  color: #43583d;
}
.record-text {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  line-height: 1.85;
  color: #43583d;
  margin: 8px 0 18px;
}
.record-detail h4 {
  margin: 22px 0 7px;
  font-size: 14px;
}
.record-detail dl {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 22px;
  padding: 16px;
  background: #f3f6ed;
  border-radius: 5px;
}
.record-detail dt {
  font-size: 11px;
  color: #667b5b;
}
.record-detail dd {
  margin: 4px 0 0;
  overflow-wrap: anywhere;
}
.source-date {
  font-size: 11px;
  color: #607358;
  margin-top: 20px;
}
.record-links {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 24px;
}
.record-links a {
  font-size: 12px;
  color: #375e36;
  text-decoration: underline;
  text-underline-offset: 4px;
}
.list-pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-top: 24px;
  font-size: 12px;
}
.list-note {
  color: #62765a;
  font-size: 11px;
  line-height: 1.8;
  margin: 24px 0 0;
}
.list-error {
  color: #8a422b;
  background: #fcf0e7;
  padding: 12px;
  border: 1px solid #ecd5c5;
  border-radius: 6px;
  font-size: 12px;
}
.empty-list {
  padding: 28px 0;
  font-size: 13px;
  color: #607358;
}
:is(button, summary, select, a):focus-visible {
  outline: 3px solid #6e915b;
  outline-offset: 3px;
}
@media (max-width: 700px) {
  .knowledge-list {
    padding: 20px 16px;
  }
  .list-header h2 {
    font-size: 22px;
  }
  .list-search {
    gap: 8px;
    padding-left: 10px;
    flex-wrap: wrap;
  }
  .list-search input {
    font-size: 16px;
    width: calc(100% - 35px);
    flex-basis: calc(100% - 35px);
  }
  .list-search button[type='submit'] {
    margin-left: 28px;
  }
  .list-filters {
    gap: 12px;
  }
  .list-filters label {
    flex: 1;
    min-width: 125px;
  }
  .list-filters select {
    min-width: 0;
    width: 100%;
    font-size: 14px;
  }
  .record-row summary {
    flex-wrap: wrap;
    gap: 7px 10px;
  }
  .record-name {
    flex-basis: calc(100% - 28px);
  }
  .record-kind {
    margin-left: 22px;
  }
  .record-origin {
    min-width: 0;
  }
  .record-detail {
    padding: 0 8px 20px;
  }
  .record-detail dl {
    gap: 14px;
  }
}
</style>
