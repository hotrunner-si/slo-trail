<script setup lang="ts">
const { session, signedIn, saving, refresh } = await useBrainSession()
const text = ref(''),
  busy = ref(false),
  error = ref('')
const entity = ref<string | null>(null)
const { data: topics } = await useAsyncData('brain-topics', () => $fetch('/api/brain/topics'))
const messages = ref<{ role: 'user' | 'assistant'; text: string }[]>([])
const citations = ref<
  { id: string; title: string; url: string | null; origin: string; verified_at: string | null }[]
>([])
const note = ref(
  'Celotnega prepisa ne hranimo. Ob vključenem shranjevanju izločimo kratek povzetek in anonimizirano izkušnjo. Ne vpisuj osebnih ali občutljivih podatkov.',
)
watch(saving, () => {
  messages.value = []
  citations.value = []
  text.value = ''
})
async function send() {
  if (!text.value.trim() || busy.value) return
  error.value = ''
  busy.value = true
  messages.value.push({ role: 'user', text: text.value.trim() })
  text.value = ''
  try {
    const result = await $fetch('/api/brain/chat', {
      method: 'POST',
      body: {
        messages: messages.value.slice(-12),
        save: saving.value,
        entity: entity.value,
        question: null,
      },
    })
    if (result.entityId) entity.value = result.entityId
    messages.value.push({
      role: 'assistant',
      text: result.answer + (result.clarification ? '\n' + result.clarification : ''),
    })
    citations.value = result.citations
    note.value = result.note
    if (result.saved) await refresh()
  } catch (e) {
    error.value = brainError(e)
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <section class="brain-panel chat-panel">
    <header class="panel-head">
      <h2><span class="brain-spark">✳</span>Poveži znanje</h2>
      <span class="muted-chip">{{
        session?.aiAvailable ? 'AI pomočnik' : 'AI ni nastavljen'
      }}</span>
    </header>
    <label class="brain-topic-label"
      >Predmet pogovora<select v-model="entity">
        <option :value="null">Izberi za natančnejšo povezavo …</option>
        <option v-for="t in topics" :key="t.id" :value="t.id">{{ t.title }}</option>
      </select></label
    >
    <div class="brain-chat-history" aria-live="polite">
      <p v-if="!messages.length">
        Vprašaj o slovenskem trail teku ali opiši izkušnjo. Odgovor mora imeti sledljive vire; brez
        njih podatkov ni dovolj.
      </p>
      <p v-if="!session?.aiAvailable">
        AI potrebuje strežniško nastavitev ponudnika in hrambe.
        <NuxtLink :to="signedIn ? '/mozgan/baza' : '/mozgan/racun'">{{
          signedIn ? 'Poišči izvorne podatke v Bazi' : 'Prijavi se za iskanje virov'
        }}</NuxtLink
        >. Izkušnjo lahko oddaš v desnem obrazcu.
      </p>
      <div v-for="(m, i) in messages" :key="i" :class="['brain-message', m.role]">
        <strong>{{ m.role === 'user' ? 'Ti' : 'Možgan' }}</strong>
        <p>{{ m.text }}</p>
      </div>
      <ul v-if="citations.length" class="brain-citations">
        <li v-for="s in citations" :key="s.id">
          <a v-if="s.url" :href="s.url" target="_blank" rel="noopener noreferrer">{{ s.title }}</a
          ><span v-else>{{ s.title }}</span> ·
          {{ s.origin === 'official' ? 'uradni vir' : 'uredniški podatek' }} ·
          {{ s.verified_at ? `preverjen ${s.verified_at.slice(0, 10)}` : 'ni ponovno preverjen' }}
        </li>
      </ul>
    </div>
    <form class="chat-composer" @submit.prevent="send">
      <label for="brain-query" class="sr-only">Vprašanje</label
      ><textarea
        id="brain-query"
        v-model="text"
        maxlength="3000"
        rows="2"
        placeholder="Kaj te zanima?"
        :disabled="busy"
      /><button
        :disabled="busy || !session?.aiAvailable || !text.trim()"
        aria-label="Pošlji vprašanje"
      >
        ↑
      </button>
    </form>
    <p class="brain-notice">{{ note }}</p>
    <p v-if="error" role="alert" class="brain-error">{{ error }}</p>
  </section>
</template>
