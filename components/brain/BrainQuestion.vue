<script setup lang="ts">
const { signedIn, saving, refresh: refreshSession } = await useBrainSession()
const request = useRequestFetch()
const seen = useState<string[]>('brain-ephemeral-seen', () => [])
const {
  data: question,
  refresh,
  error: loadError,
} = await useAsyncData('brain-question', () =>
  signedIn.value
    ? request('/api/brain/question', { query: { exclude: seen.value.join(',') } })
    : Promise.resolve(null),
)
const choice = ref(''),
  statement = ref(''),
  year = ref<number>(),
  conditions = ref(''),
  direct = ref(false),
  busy = ref(false),
  error = ref(''),
  result = ref<any>(null),
  followup = ref(false)
watch(signedIn, () => refresh())
async function submit() {
  if (!question.value) return
  error.value = ''
  busy.value = true
  if (
    choice.value === 'experience' &&
    (!year.value || !conditions.value || !direct.value || statement.value.trim().length < 15)
  ) {
    followup.value = true
    busy.value = false
    return
  }
  try {
    if (choice.value === 'experience') {
      result.value = await $fetch('/api/brain/experience', {
        method: 'POST',
        body: {
          question: question.value.id,
          entity: question.value.entity_id,
          year: year.value,
          conditions: conditions.value,
          statement: statement.value,
          direct: direct.value,
          save: saving.value,
        },
      })
    } else {
      result.value = await $fetch('/api/brain/answer', {
        method: 'POST',
        body: { question: question.value.id, choice: choice.value, save: saving.value },
      })
    }
    await refreshSession()
  } catch (e) {
    error.value = brainError(e)
  } finally {
    busy.value = false
  }
}
async function next() {
  if (question.value) seen.value = [...seen.value, question.value.id].slice(-100)
  result.value = null
  choice.value = ''
  statement.value = ''
  conditions.value = ''
  year.value = undefined
  direct.value = false
  followup.value = false
  await refresh()
}
</script>
<template>
  <section class="brain-panel brain-survey">
    <header class="panel-head">
      <h2>Dopolni povezano znanje</h2>
      <span class="muted-chip">{{ question?.claim_id ? 'Preverjanje' : 'Vrzel v zbirki' }}</span>
    </header>
    <p v-if="!signedIn">
      Za oddajo izkušnje in preverjanje znanja se <NuxtLink to="/mozgan/racun">prijavi</NuxtLink>.
      Obiskov ne štejemo kot neodvisne potrditve.
    </p>
    <p v-else-if="loadError" role="alert">Vprašanja trenutno ni mogoče naložiti. Osveži stran.</p>
    <p v-else-if="!question">Vsa razpoložljiva vprašanja si že obravnaval.</p>
    <div v-else-if="result" aria-live="polite">
      <p>
        {{
          result.message ||
          (result.saved
            ? 'Odgovor je shranjen.'
            : 'Odgovor ni shranjen. Vsebine nismo prenesli v znanje.')
        }}
      </p>
      <template v-if="result.counts"
        ><p>
          {{ result.counts.accounts }} različnih računov ·
          {{ result.counts.contributions }} prispevkov. Računi niso dokazano različne osebe.
        </p>
        <p>Podpora: {{ result.counts.support }} · nasprotovanje: {{ result.counts.oppose }}</p>
        <p>
          {{
            {
              single: 'Ena izkušnja',
              multiple: 'Več neodvisnih potrditev računov',
              conflicting: 'Nasprotujoče izkušnje',
              insufficient: 'Premalo podatkov',
            }[result.counts.category as string]
          }}
        </p></template
      >
      <button type="button" @click="next">Naslednje vprašanje</button>
    </div>
    <form v-else @submit.prevent="submit" class="brain-form question-form">
      <fieldset>
        <legend>{{ question.prompt }}</legend>
        <p v-if="question.year || question.conditions" class="brain-notice">
          Leto: {{ question.year || 'ni znano' }} · razmere:
          {{
            question.conditions === 'wet'
              ? 'mokro'
              : question.conditions === 'dry'
                ? 'suho'
                : 'neznane'
          }}
        </p>
        <div class="survey-options">
          <template v-if="question.claim_id"
            ><label
              ><input v-model="choice" type="radio" value="support" required />Moja neposredna
              izkušnja se ujema</label
            ><label
              ><input v-model="choice" type="radio" value="oppose" />Moja neposredna izkušnja se
              razlikuje</label
            ><label
              ><input v-model="choice" type="radio" value="different_context" />Drugo leto, odsek
              ali razmere</label
            ></template
          >
          <label v-else
            ><input v-model="choice" type="radio" value="experience" required />Opišem neposredno
            izkušnjo</label
          >
          <label
            ><input v-model="choice" type="radio" value="no_experience" />Nimam neposredne
            izkušnje</label
          ><label><input v-model="choice" type="radio" value="unknown" />Ne vem</label
          ><label><input v-model="choice" type="radio" value="skip" />Preskoči</label>
        </div>
      </fieldset>
      <template v-if="choice === 'experience'">
        <p v-if="followup" role="status">
          Za povezavo potrebujemo še leto, razmere, konkreten del trase in potrditev neposredne
          izkušnje.
        </p>
        <label
          >Konkreten del in izkušnja (brez imen ali kontaktov)<textarea
            v-model="statement"
            maxlength="700"
            minlength="15"
            required
            rows="2"
          />
        </label>
        <div class="brain-inline-fields">
          <label
            >Leto<input
              v-model.number="year"
              type="number"
              min="1900"
              :max="new Date().getFullYear()" /></label
          ><label
            >Razmere<select v-model="conditions">
              <option value="">Izberi</option>
              <option value="wet">Mokro</option>
              <option value="dry">Suho</option>
            </select></label
          >
        </div>
        <label><input v-model="direct" type="checkbox" />To je moja neposredna izkušnja</label>
      </template>
      <p v-if="choice === 'different_context'">
        Tega odgovora ne bomo šteli kot nasprotovanje v istih okoliščinah.
      </p>
      <button :disabled="busy || !choice">
        {{ busy ? 'Shranjujem …' : saving ? 'Oddaj odgovor' : 'Odgovori brez shranjevanja' }}
      </button>
    </form>
    <p v-if="error" role="alert" class="brain-error">{{ error }}</p>
  </section>
</template>
