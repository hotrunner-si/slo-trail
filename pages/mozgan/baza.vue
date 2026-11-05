<script setup lang="ts">
definePageMeta({ middleware: 'brain-account' })
useSiteSeo('Baza znanja · Možgan', 'Povezani viri in izvorni podatki', { noindex: true })
const query = ref(''),
  kind = ref(''),
  origin = ref(''),
  semantic = ref(true),
  busy = ref(false),
  error = ref(''),
  selected = ref<any>(null)
const results = ref<any>({
  records: [],
  relations: [],
  claims: [],
  mode: 'keyword',
  semanticNote: '',
})
const related = ref<{ id: string; title: string; kind: string }[]>([])
const { session } = await useBrainSession()
async function search() {
  busy.value = true
  error.value = ''
  try {
    results.value = await $fetch('/api/brain/search', {
      method: 'POST',
      body: {
        query: query.value,
        semantic: semantic.value,
        kind: kind.value,
        origin: origin.value,
      },
    })
    selected.value = results.value.records[0] || null
  } catch (e) {
    error.value = brainError(e)
  } finally {
    busy.value = false
  }
}
const kindNames: Record<string, string> = {
  race: 'Tekma',
  distance: 'Razdalja',
  article: 'Članek',
  edition: 'Letna izvedba',
  route: 'Trasa',
  segment: 'Odsek',
  runner: 'Tekač',
  result: 'Rezultat',
  participation: 'Udeležba',
}
const originNames: Record<string, string> = {
  official: 'Uradni vir',
  editorial: 'Uredniški podatek',
  unverified: 'Še nepreverjen',
  community: 'Uporabniška izkušnja',
}
const relationNames: Record<string, string> = {
  distance_of: 'Razdalja tekme',
  edition_of: 'Letna izvedba',
  version_of: 'Različica trase',
  segment_of: 'Odsek trase',
  participated_in: 'Udeležba',
  result_of: 'Rezultat',
  source_for: 'Vir',
}
function relatedId(link: any) {
  return link.subject_id === selected.value?.entity_id ? link.object_id : link.subject_id
}
function relatedTitle(link: any) {
  return related.value.find((r) => r.id === relatedId(link))?.title || 'Povezani zapis'
}
const links = computed(() =>
  selected.value
    ? results.value.relations.filter(
        (r: any) =>
          r.subject_id === selected.value.entity_id || r.object_id === selected.value.entity_id,
      )
    : [],
)
const claims = computed(() =>
  selected.value
    ? results.value.claims.filter((r: any) => r.entity_id === selected.value.entity_id)
    : [],
)
async function follow(id: string) {
  error.value = ''
  try {
    const r = await $fetch(`/api/brain/record/${id}`)
    selected.value = { ...r.entity, ...r.sources[0], entity_id: r.entity.id }
    results.value.relations = r.relations
    results.value.claims = r.claims
    related.value = r.related
  } catch (e) {
    error.value = brainError(e)
  }
}
watch(selected, async (record) => {
  if (!record?.entity_id) return
  try {
    const r = await $fetch(`/api/brain/record/${record.entity_id}`)
    results.value.relations = r.relations
    results.value.claims = r.claims
    related.value = r.related
  } catch (e) {
    error.value = brainError(e)
  }
})
onMounted(search)
</script>
<template>
  <div class="database-screen">
    <section class="brain-panel source-finder">
      <div class="finder-explanation">
        <h2>Poišči izvorne informacije</h2>
        <p>
          Iskanje virov in povezav. Uredniški zapis ni uradna potrditev; vektorska podobnost ni
          ocena resničnosti.
        </p>
      </div>
      <form class="brain-form" @submit.prevent="search">
        <label for="source-query">Besede ali opis</label>
        <div class="source-query">
          <input
            id="source-query"
            v-model="query"
            maxlength="300"
            placeholder="Ime tekme, razdalja, opis …"
          /><button :disabled="busy">{{ busy ? 'Iščem …' : 'Poišči vire' }}</button>
        </div>
        <div class="brain-inline-fields">
          <label
            >Vrsta<select v-model="kind">
              <option value="">Vse</option>
              <option value="race">Tekma</option>
              <option value="distance">Razdalja</option>
              <option value="article">Članek</option>
            </select></label
          ><label
            >Izvor<select v-model="origin">
              <option value="">Vsi izvori</option>
              <option value="official">Uradni vir</option>
              <option value="editorial">Uredniški podatek</option>
              <option value="unverified">Še nepreverjen</option>
            </select></label
          ><label
            ><input
              v-model="semantic"
              type="checkbox"
              :disabled="!session?.semanticAvailable"
            />Tudi po pomenu {{ session?.semanticAvailable ? '' : '(ni nastavljeno)' }}</label
          >
        </div>
      </form>
    </section>
    <div aria-live="polite">
      <span
        >{{ results.records.length }} zadetkov (največ 60; za več zoži iskanje) ·
        {{ results.mode === 'hybrid' ? 'besede in pomen' : 'besede' }}</span
      >
      <p>{{ results.semanticNote }}</p>
      <p v-if="error" class="brain-error" role="alert">{{ error }}</p>
    </div>
    <div class="database-content">
      <section class="brain-panel database-table-panel">
        <h2>Viri in zapisi</h2>
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Zapis</th>
                <th>Vrsta</th>
                <th>Izvor</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="record in results.records"
                :key="record.id"
                :class="{ active: selected?.id === record.id }"
              >
                <td>
                  <button class="brain-record-button" @click="selected = record">
                    {{ record.title }}
                  </button>
                </td>
                <td>{{ kindNames[record.kind] || record.kind }}</td>
                <td>{{ originNames[record.origin] || record.origin }}</td>
              </tr>
            </tbody>
          </table>
          <p v-if="!busy && !results.records.length">
            Ni dovolj podatkov za to iskanje. Poskusi krajši izraz.
          </p>
        </div>
      </section>
      <aside class="brain-panel raw-panel">
        <h2>Izvor in povezani zapisi</h2>
        <template v-if="selected"
          ><h3>{{ selected.title }}</h3>
          <p>{{ selected.excerpt }}</p>
          <a v-if="selected.url" :href="selected.url" target="_blank" rel="noopener noreferrer"
            >Odpri navedeni vir ↗</a
          >
          <p>
            Preverjeno: {{ selected.verified_at || 'ni ponovno preverjeno' }}<br />Veljavnost:
            {{ selected.valid_from || 'neznana' }} – {{ selected.valid_until || 'neznana' }}
          </p>
          <NuxtLink v-if="selected.race_slug" :to="`/races/${selected.race_slug}`"
            >Tekma v javnem katalogu ↗</NuxtLink
          >
          <ul>
            <li v-for="link in links" :key="link.subject_id + link.object_id">
              {{ relationNames[link.relation] || link.relation }} ·
              <button @click="follow(relatedId(link))">{{ relatedTitle(link) }}</button>
            </li>
          </ul>
          <div v-for="claim in claims" :key="claim.id">
            <p>
              <strong>Uporabniška izkušnja</strong> · {{ claim.year || 'leto ni znano' }} ·
              {{ claim.conditions }}
            </p>
            <p>{{ claim.statement }}</p>
            <small>Izvor ostane skupnosten; ne nadomešča aktualnega uradnega vira.</small>
          </div>
          <details>
            <summary>Izvorni zapis</summary>
            <pre>{{ JSON.stringify(selected, null, 2) }}</pre>
          </details></template
        >
        <p v-else>Izberi zapis.</p>
      </aside>
    </div>
  </div>
</template>
