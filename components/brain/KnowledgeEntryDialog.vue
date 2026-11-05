<script setup lang="ts">
import type { KnowledgeEntry } from '~/types/knowledge'
import { knowledgeKindNames, knowledgeOriginNames, safeKnowledgeUrl } from '~/utils/knowledge'
const props = defineProps<{ entry: KnowledgeEntry | null; entries: KnowledgeEntry[] }>()
const emit = defineEmits<{ close: []; select: [id: string]; contribute: [entry: KnowledgeEntry] }>()
const dialog = ref<HTMLDialogElement>()
const related = computed(() => props.entries.filter((e) => props.entry?.related.includes(e.id)))
const readable = computed(() => {
  const text = props.entry?.excerpt || ''
  const start = text.indexOf('{')
  if (start < 0) return null
  try {
    const raw = text.slice(start).replace(/\\"/g, '"')
    const value = JSON.parse(raw)
    const labels: Record<string, string> = {
      name: 'Ime',
      label: 'Oznaka',
      km: 'Dolžina (km)',
      elevation: 'Vzpon (m)',
      date: 'Datum',
      location: 'Kraj',
      region: 'Regija',
      summary: 'Opis',
      technicality: 'Zahtevnost',
      startDate: 'Datum starta',
      startTime: 'Ura starta',
      utmbIndexCategory: 'UTMB kategorija',
      itra: 'ITRA točke',
    }
    return Object.entries(value)
      .filter(([key, v]) => labels[key] && (typeof v === 'string' || typeof v === 'number'))
      .map(([key, value]) => ({ label: labels[key]!, value: String(value) }))
  } catch {
    return null
  }
})
watch(
  () => props.entry,
  async (value) => {
    await nextTick()
    if (value && !dialog.value?.open) dialog.value?.showModal()
    if (!value && dialog.value?.open) dialog.value.close()
  },
  { immediate: true },
)
function date(value?: string | null) {
  return value
    ? new Intl.DateTimeFormat('sl-SI', { timeZone: 'Europe/Ljubljana' }).format(new Date(value))
    : 'Ni navedeno'
}
</script>
<template>
  <dialog
    ref="dialog"
    class="kb-dialog kb-entry-dialog"
    aria-labelledby="entry-title"
    @cancel.prevent="emit('close')"
    @click="
      (e) => {
        if (e.target === dialog) emit('close')
      }
    "
  >
    <template v-if="entry">
      <div class="kb-dialog-top">
        <span class="kb-eyebrow">{{ knowledgeKindNames[entry.kind] || entry.kind }}</span
        ><button class="kb-icon-button" aria-label="Zapri zapis" @click="emit('close')">
          <KnowledgeIcon name="close" />
        </button>
      </div>
      <h2 id="entry-title">{{ entry.title }}</h2>
      <span class="kb-badge" :data-origin="entry.origin">{{
        knowledgeOriginNames[entry.origin] || entry.origin
      }}</span>
      <p
        v-if="['community', 'conversation', 'unverified'].includes(entry.origin)"
        class="kb-callout"
      >
        To je nepreverjeno gradivo. Osebne izkušnje in odgovori AI ne nadomeščajo uradnih
        informacij.
      </p>
      <p v-if="!readable?.length" class="kb-entry-intro">{{ entry.excerpt }}</p>
      <dl v-else class="kb-facts">
        <div v-for="fact in readable" :key="fact.label">
          <dt>{{ fact.label }}</dt>
          <dd>{{ fact.value }}</dd>
        </div>
      </dl>
      <dl v-if="entry.facts.length" class="kb-facts">
        <div v-for="fact in entry.facts" :key="fact.label">
          <dt>{{ fact.label }}</dt>
          <dd>{{ fact.value }}</dd>
        </div>
      </dl>
      <section v-for="(section, i) in entry.sections" :key="i" class="kb-entry-section">
        <h3 v-if="section.title">{{ section.title }}</h3>
        <p>{{ section.text }}</p>
      </section>
      <div class="kb-provenance">
        <h3>Izvor in veljavnost</h3>
        <p>
          {{
            entry.origin === 'site'
              ? 'Podatki so prebrani iz trenutne vsebine spletne strani. Uredniški katalog ni uradna potrditev organizatorja.'
              : 'Pri uporabi upoštevaj izvor, datum preverjanja in leto, na katero se informacija nanaša.'
          }}
        </p>
        <dl class="kb-facts">
          <div>
            <dt>Nazadnje preverjeno</dt>
            <dd>{{ date(entry.verifiedAt) }}</dd>
          </div>
          <div>
            <dt>Velja od – do</dt>
            <dd>
              {{ entry.validFrom || 'Ni navedeno' }} – {{ entry.validUntil || 'Ni navedeno' }}
            </dd>
          </div>
        </dl>
      </div>
      <div class="kb-entry-links">
        <template v-for="link in entry.links" :key="link.url"
          ><a
            v-if="safeKnowledgeUrl(link.url)"
            :href="safeKnowledgeUrl(link.url)!"
            target="_blank"
            rel="noopener noreferrer"
            >{{ link.label }} <span class="sr-only">(odpre se v novem zavihku)</span
            ><KnowledgeIcon name="source" /></a
        ></template>
      </div>
      <section v-if="related.length" class="kb-entry-section">
        <h3>
          Povezano znanje <span class="kb-muted">{{ related.length }}</span>
        </h3>
        <ul class="kb-related">
          <li v-for="record in related" :key="record.id">
            <button @click="emit('select', record.id)">
              <span>{{ record.title }}</span
              ><small>{{ knowledgeKindNames[record.kind] || record.kind }}</small
              ><KnowledgeIcon name="arrow" />
            </button>
          </li>
        </ul>
      </section>
      <footer class="kb-dialog-footer">
        <p>Veš kaj več? Dopolni zapis z vprašanjem, virom ali svojo izkušnjo.</p>
        <button class="kb-primary" @click="emit('contribute', entry)">
          Prispevaj k temu zapisu <KnowledgeIcon name="plus" />
        </button>
      </footer>
      <details v-if="readable?.length" class="kb-help">
        <summary>Izvorni zapis</summary>
        <pre style="white-space: pre-wrap; overflow-wrap: anywhere">{{ entry.excerpt }}</pre>
      </details>
    </template>
  </dialog>
</template>
