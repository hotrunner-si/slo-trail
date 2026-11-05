<script setup lang="ts">
import type { KnowledgeEntry, CommunityThread } from '~/types/knowledge'
import { knowledgeTopics } from '~/types/knowledge'
import { normalizeKnowledge } from '~/utils/knowledge'
const props = defineProps<{
  open: boolean
  entries: KnowledgeEntry[]
  initialEntry?: KnowledgeEntry | null
  initialType?: CommunityThread['type']
  initialBody?: string
}>()
const emit = defineEmits<{ close: []; created: [id: string]; existing: [id: string] }>()
const { saving, session } = await useBrainSession()
const dialog = ref<HTMLDialogElement>()
const title = ref(''),
  body = ref(''),
  type = ref<CommunityThread['type']>('question'),
  topic = ref('other'),
  year = ref(''),
  conditions = ref(''),
  relatedKey = ref(''),
  relatedSearch = ref(''),
  consent = ref(false)
const error = ref(''),
  busy = ref(false),
  similar = ref<CommunityThread[]>([])
let timer: ReturnType<typeof setTimeout>
let duplicateGeneration = 0
const choices = computed(() =>
  props.entries
    .filter(
      (e) =>
        !['source', 'experience', 'page'].includes(e.kind) &&
        normalizeKnowledge(e.title).includes(normalizeKnowledge(relatedSearch.value)),
    )
    .slice(0, 20),
)
const relatedEntry = computed(() => props.entries.find((e) => e.id === relatedKey.value))
function chooseRelated(id: string) {
  relatedKey.value = id
  relatedSearch.value = ''
}
watch(
  () => props.open,
  async (open) => {
    await nextTick()
    if (open) {
      relatedKey.value = props.initialEntry?.id || ''
      relatedSearch.value = ''
      type.value = props.initialType || 'question'
      topic.value =
        props.initialEntry?.topic === 'all' ? 'other' : props.initialEntry?.topic || 'other'
      if (!body.value) body.value = props.initialBody || ''
      error.value = ''
      dialog.value?.showModal()
    } else dialog.value?.close()
  },
  { immediate: true },
)
watch(title, (value) => {
  clearTimeout(timer)
  const generation = ++duplicateGeneration
  similar.value = []
  if (value.trim().length < 8) return
  timer = setTimeout(async () => {
    try {
      const query = value
        .trim()
        .split(/\s+/)
        .filter((w) => w.length > 3)
        .slice(0, 5)
        .join(' OR ')
      if (!query) return
      const result = await $fetch('/api/brain/forum', { query: { query, page: 1 } })
      if (generation === duplicateGeneration) similar.value = result.threads.slice(0, 3)
    } catch {
      /* The compose form remains usable if duplicate lookup is unavailable. */
    }
  }, 500)
})
onBeforeUnmount(() => {
  clearTimeout(timer)
  duplicateGeneration++
})
async function submit() {
  if (busy.value || !saving.value) return
  busy.value = true
  error.value = ''
  try {
    const result = await $fetch<{ id: string }>('/api/brain/forum', {
      method: 'POST',
      body: {
        title: title.value,
        body: body.value,
        type: type.value,
        topic: topic.value,
        relatedKey: relatedKey.value || null,
        year: year.value ? Number(year.value) : null,
        conditions: conditions.value,
        consent: consent.value,
      },
    })
    title.value = ''
    body.value = ''
    year.value = ''
    conditions.value = ''
    consent.value = false
    similar.value = []
    emit('created', result.id)
  } catch (e) {
    error.value = brainError(e)
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <dialog
    ref="dialog"
    class="kb-dialog kb-compose"
    aria-labelledby="compose-title"
    @cancel.prevent="!busy && emit('close')"
  >
    <div class="kb-dialog-top">
      <span class="kb-eyebrow">Znanje raste z nami</span
      ><button
        class="kb-icon-button"
        aria-label="Zapri obrazec, ohrani osnutek"
        :disabled="busy"
        @click="emit('close')"
      >
        <KnowledgeIcon name="close" />
      </button>
    </div>
    <h2 id="compose-title">Prispevaj svoj del.</h2>
    <p>
      Vprašaj, deli izkušnjo ali predlagaj nov vir. Osnutek ostane v tem zavihku, dokler si na tej
      strani.
    </p>
    <form class="kb-form" @submit.prevent="submit">
      <fieldset class="kb-type-picker">
        <legend>Kaj želiš dodati?</legend>
        <label
          v-for="option in [
            { id: 'question', label: 'Vprašanje' },
            { id: 'discussion', label: 'Razpravo / izkušnjo' },
            { id: 'source', label: 'Vir / popravek' },
          ]"
          :key="option.id"
          ><input v-model="type" type="radio" :value="option.id" /><span>{{
            option.label
          }}</span></label
        >
      </fieldset>
      <label for="contribution-title"
        >Naslov<input
          id="contribution-title"
          v-model="title"
          required
          minlength="5"
          maxlength="160"
          placeholder="Kaj te zanima ali kaj želiš deliti?"
      /></label>
      <div v-if="similar.length" class="kb-callout">
        <strong>Je odgovor morda že tukaj?</strong>
        <ul>
          <li v-for="thread in similar" :key="thread.id">
            <button type="button" class="kb-text-button" @click="emit('existing', thread.id)">
              {{ thread.title }} · {{ thread.reply_count }} odgovorov
            </button>
          </li>
        </ul>
      </div>
      <label for="contribution-body"
        >{{ type === 'source' ? 'Podatek, povezava do vira in predlagani popravek' : 'Vsebina'
        }}<textarea
          id="contribution-body"
          v-model="body"
          required
          minlength="20"
          maxlength="5000"
          rows="6"
          :placeholder="
            type === 'source'
              ? 'Navedi povezavo, kaj vir pove in na katero leto se nanaša. Pri predlogu profila dodaj javne vire.'
              : 'Dodaj dovolj okoliščin, da ti skupnost lahko pomaga. Pri izkušnji navedi tekmo, razdaljo in razmere.'
          "
        /><small
          >{{ body.length }} / 5000 znakov · brez kontaktov in zasebnih podatkov</small
        ></label
      >
      <div class="kb-form-columns">
        <label for="contribution-topic"
          >Tema<select id="contribution-topic" v-model="topic">
            <option
              v-for="item in knowledgeTopics.filter((t) => t.id !== 'all')"
              :key="item.id"
              :value="item.id"
            >
              {{ item.label }}
            </option>
          </select></label
        ><label for="contribution-year"
          >Leto <span class="kb-muted">(neobvezno)</span
          ><input
            id="contribution-year"
            v-model="year"
            type="number"
            min="1900"
            max="2200"
            placeholder="Npr. 2026"
        /></label>
      </div>
      <label for="contribution-conditions"
        >Razmere / okoliščine <span class="kb-muted">(neobvezno)</span
        ><input
          id="contribution-conditions"
          v-model="conditions"
          maxlength="200"
          placeholder="Npr. mokra trasa, prvi ultra, razdalja 50 km"
      /></label>
      <fieldset class="kb-link-picker">
        <legend>
          Poveži s tekmo, tekačem ali drugim zapisom <span class="kb-muted">(neobvezno)</span>
        </legend>
        <div v-if="relatedEntry" class="kb-chosen">
          <KnowledgeIcon name="link" />{{ relatedEntry.title
          }}<button type="button" class="kb-text-button" @click="relatedKey = ''">
            Odstrani povezavo
          </button>
        </div>
        <template v-else
          ><label class="sr-only" for="related-search">Poišči povezani zapis</label
          ><input
            id="related-search"
            v-model="relatedSearch"
            placeholder="Vpiši ime tekme, tekača ali trase …"
          />
          <ul v-if="relatedSearch.length > 1" class="kb-related-choices">
            <li v-for="entry in choices" :key="entry.id">
              <button type="button" @click="chooseRelated(entry.id)">
                {{ entry.title }}
              </button>
            </li>
            <li v-if="!choices.length">Ni zadetkov. Prispevek lahko objaviš tudi brez povezave.</li>
          </ul></template
        >
      </fieldset>
      <p class="kb-callout">
        Prispevek bo viden prijavljenim uporabnikom pod imenom
        <strong>{{
          session?.account?.profile?.display_name || session?.user?.displayName || 'Član skupnosti'
        }}</strong
        >. Po pregledu je lahko povzetek uporabljen tudi v javnih odgovorih Možgana, kot označeno
        znanje skupnosti.
      </p>
      <label class="kb-check"
        ><input v-model="consent" type="checkbox" required />Želim objaviti ta prispevek in
        dovoljujem njegovo uporabo v povzetkih skupnosti.</label
      >
      <p v-if="!saving" class="kb-error" role="status">
        Zgoraj vključi »Shrani prispevke iz obrazca«, da omogočiš objavo.
      </p>
      <p v-if="error" class="kb-error" role="alert">{{ error }}</p>
      <div class="kb-form-actions">
        <button type="button" class="kb-secondary" :disabled="busy" @click="emit('close')">
          Nazaj</button
        ><button class="kb-primary" :disabled="busy || !consent || !saving">
          {{ busy ? 'Objavljam …' : 'Objavi prispevek' }}<KnowledgeIcon name="arrow" />
        </button>
      </div>
    </form>
  </dialog>
</template>
