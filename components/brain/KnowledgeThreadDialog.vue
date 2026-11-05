<script setup lang="ts">
import type { CommunityDetail, KnowledgeEntry } from '~/types/knowledge'
import { knowledgeTopics } from '~/types/knowledge'
const props = defineProps<{ id: string | null; entries: KnowledgeEntry[] }>()
const emit = defineEmits<{
  close: []
  changed: []
  discussion: [body: string, entry?: KnowledgeEntry]
}>()
const { admin, saving, session } = await useBrainSession()
const dialog = ref<HTMLDialogElement>(),
  data = ref<CommunityDetail | null>(null)
const loading = ref(false),
  busy = ref(false),
  error = ref(''),
  notice = ref('')
const reply = ref(''),
  consent = ref(false),
  summaryConsent = ref(false),
  editId = ref(''),
  editText = ref(''),
  editConsent = ref(false)
let generation = 0
const linked = computed(() => props.entries.find((e) => e.id === data.value?.thread.related_key))
function date(value: string) {
  return new Intl.DateTimeFormat('sl-SI', {
    timeZone: 'Europe/Ljubljana',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
async function load() {
  const id = props.id,
    current = ++generation
  if (!id) return
  loading.value = true
  error.value = ''
  try {
    const result = await $fetch(`/api/brain/forum/${id}`)
    if (current !== generation) return
    data.value = result
    if (result.thread.following) {
      await $fetch('/api/brain/forum-action', {
        method: 'POST',
        body: { thread: id, action: 'seen', revision: result.thread.revision },
      })
      if (current === generation) emit('changed')
    }
  } catch (e) {
    if (current === generation) error.value = brainError(e)
  } finally {
    if (current === generation) loading.value = false
  }
}
watch(
  () => props.id,
  async (id) => {
    generation++
    data.value = null
    reply.value = ''
    consent.value = false
    notice.value = ''
    editId.value = ''
    summaryConsent.value = false
    await nextTick()
    if (id) {
      if (!dialog.value?.open) dialog.value?.showModal()
      await load()
    } else dialog.value?.close()
  },
  { immediate: true },
)
onMounted(() => {
  if (props.id && !dialog.value?.open) dialog.value?.showModal()
})
onBeforeUnmount(() => generation++)
async function action(action: string, post?: string, text?: string) {
  if (!props.id || busy.value) return
  busy.value = true
  error.value = ''
  notice.value = ''
  try {
    await $fetch('/api/brain/forum-action', {
      method: 'POST',
      body: {
        thread: props.id,
        action,
        post,
        text,
        revision: data.value?.thread.revision,
        ...(text ? { consent: editConsent.value } : {}),
      },
    })
    editId.value = ''
    editConsent.value = false
    notice.value =
      action === 'publish'
        ? 'Pregledani povzetek je vključen v skupno znanje kot nepreverjena razprava skupnosti.'
        : action === 'unpublish'
          ? 'Povzetek je umaknjen iz skupnega znanja.'
          : 'Sprememba je shranjena.'
    await load()
    emit('changed')
  } catch (e) {
    error.value = brainError(e)
  } finally {
    busy.value = false
  }
}
async function sendReply() {
  if (!props.id || busy.value || !saving.value) return
  busy.value = true
  error.value = ''
  try {
    await $fetch('/api/brain/forum-reply', {
      method: 'POST',
      body: { thread: props.id, body: reply.value, consent: consent.value },
    })
    reply.value = ''
    consent.value = false
    notice.value = 'Tvoj odgovor je objavljen.'
    await load()
    emit('changed')
  } catch (e) {
    error.value = brainError(e)
  } finally {
    busy.value = false
  }
}
async function summarize() {
  if (!props.id || busy.value) return
  busy.value = true
  error.value = ''
  notice.value = ''
  try {
    await $fetch('/api/brain/forum-summary', {
      method: 'POST',
      body: { thread: props.id, consent: summaryConsent.value },
    })
    await load()
    emit('changed')
    notice.value = 'Povzetek je pripravljen. Preveri tudi izvirne odgovore.'
  } catch (e) {
    error.value = brainError(e)
  } finally {
    busy.value = false
  }
}
function startEdit(id: string, text: string) {
  editId.value = id
  editText.value = text
  editConsent.value = false
}
async function goToPost(id: string) {
  await nextTick()
  const target = dialog.value?.querySelector<HTMLElement>(`[data-post-id="${id}"]`)
  target?.scrollIntoView({ block: 'center', behavior: 'instant' })
  target?.focus({ preventScroll: true })
}
</script>
<template>
  <dialog
    ref="dialog"
    class="kb-dialog kb-thread-dialog"
    aria-labelledby="thread-title"
    @cancel.prevent="!busy && emit('close')"
  >
    <div class="kb-dialog-top">
      <span class="kb-eyebrow"
        >Skupnost /
        {{
          data ? knowledgeTopics.find((t) => t.id === data?.thread.topic)?.label : 'Razprava'
        }}</span
      ><button
        class="kb-icon-button"
        aria-label="Zapri razpravo"
        :disabled="busy"
        @click="emit('close')"
      >
        <KnowledgeIcon name="close" />
      </button>
    </div>
    <p v-if="loading && !data" role="status">Nalagam pogovor …</p>
    <p v-if="error" class="kb-error" role="alert">{{ error }}</p>
    <p v-if="notice" class="kb-success" role="status">{{ notice }}</p>
    <template v-if="data">
      <div class="kb-badges">
        <span class="kb-badge">{{
          { question: 'Vprašanje', discussion: 'Razprava', source: 'Predlog vira / popravka' }[
            data.thread.type
          ]
        }}</span
        ><span v-if="data.thread.accepted_post_id" class="kb-badge" data-origin="official"
          >Uporaben odgovor izbran</span
        ><span v-if="data.thread.hidden" class="kb-badge" data-origin="unverified">Umaknjeno</span>
      </div>
      <h2 id="thread-title">{{ data.thread.title }}</h2>
      <p class="kb-meta">{{ data.thread.author_name }} · {{ date(data.thread.created_at) }}</p>
      <p class="kb-thread-body">{{ data.thread.body }}</p>
      <p v-if="data.thread.year || data.thread.conditions" class="kb-context">
        {{ data.thread.year }}{{ data.thread.year && data.thread.conditions ? ' · ' : ''
        }}{{ data.thread.conditions }}
      </p>
      <p v-if="linked" class="kb-context">
        <KnowledgeIcon name="link" /> Povezano: {{ linked.title }}
      </p>
      <div class="kb-thread-actions">
        <button
          class="kb-secondary"
          :disabled="busy"
          @click="action(data.thread.following ? 'unfollow' : 'follow')"
        >
          <KnowledgeIcon name="bell" />{{
            data.thread.following ? 'Spremljaš · prenehaj' : 'Spremljaj temo'
          }}</button
        ><button
          class="kb-text-button"
          @click="
            emit(
              'discussion',
              `Nadaljevanje teme »${data.thread.title}«: /mozgan/baza?thread=${data.thread.id}\n\n`,
              linked,
            )
          "
        >
          Odpri povezano razpravo ↗</button
        ><template v-if="data.thread.mine || admin"
          ><button
            class="kb-text-button"
            :disabled="busy"
            @click="startEdit('thread', data.thread.body)"
          >
            Uredi vsebino</button
          ><button
            class="kb-text-button"
            :disabled="busy"
            @click="action(data.thread.hidden ? 'restore-thread' : 'hide-thread')"
          >
            {{ data.thread.hidden ? 'Ponovno objavi' : 'Umakni temo' }}
          </button></template
        >
      </div>
      <form
        v-if="editId === 'thread'"
        class="kb-form kb-edit-form"
        @submit.prevent="action('edit-thread', undefined, editText)"
      >
        <label for="edit-thread-body"
          >Uredi vsebino<textarea
            id="edit-thread-body"
            v-model="editText"
            required
            minlength="20"
            maxlength="5000"
            rows="5"
          /></label
        ><label class="kb-check"
          ><input v-model="editConsent" required type="checkbox" />Potrjujem objavo popravka in
          uporabo v povzetkih.</label
        >
        <div class="kb-form-actions">
          <button type="button" class="kb-secondary" @click="editId = ''">Prekliči</button
          ><button class="kb-primary" :disabled="busy || !saving">Shrani</button>
        </div>
      </form>
      <section class="kb-summary" aria-labelledby="summary-heading">
        <div class="kb-section-heading">
          <h3 id="summary-heading"><BrainIcon />Povzetek pogovora</h3>
          <span class="kb-badge">AI · nepreverjeno</span>
        </div>
        <template v-if="data.summary"
          ><p>{{ data.summary.overview }}</p>
          <section
            v-for="group in [
              { label: 'Skupne ugotovitve', points: data.summary.agreements },
              { label: 'Različne izkušnje', points: data.summary.differences },
              { label: 'Omejitve in odprta vprašanja', points: data.summary.cautions },
            ]"
            :key="group.label"
          >
            <h4 v-if="group.points.length">{{ group.label }}</h4>
            <ul>
              <li v-for="(point, index) in group.points" :key="index">
                {{ point.text }}
                <button
                  v-for="id in point.postIds"
                  :key="id"
                  class="kb-summary-ref"
                  :aria-label="`Odpri odgovor ${data.posts.findIndex((p) => p.id === id) + 1}`"
                  @click="goToPost(id)"
                >
                  [{{ data.posts.findIndex((p) => p.id === id) + 1 }}]
                </button>
              </li>
            </ul>
          </section>
          <p class="kb-meta">
            Pripravljen {{ date(data.summaryAt!) }} · povzetek izkušenj, ne uradna potrditev.
          </p></template
        >
        <template v-else
          ><p>
            {{
              data.summaryStale
                ? 'Pogovor se je spremenil. Za aktualen pregled pripravi nov povzetek.'
                : data.thread.reply_count
                  ? 'Možgan lahko poveže odgovore, izpostavi razlike in navede prispevke, na katerih temelji povzetek.'
                  : 'Ko prispe prvi odgovor, bo tukaj mogoče pripraviti povzetek.'
            }}
          </p>
          <template v-if="data.thread.reply_count && !data.thread.hidden"
            ><label class="kb-check"
              ><input v-model="summaryConsent" type="checkbox" />Dovolim pošiljanje vsebine te
              skupnostne teme ponudniku AI za pripravo povzetka.</label
            ><button
              class="kb-secondary"
              :disabled="busy || !summaryConsent || !session?.aiAvailable"
              @click="summarize"
            >
              {{ busy ? 'Obdelujem …' : 'Pripravi povzetek' }}
            </button>
            <p v-if="!session?.aiAvailable" class="kb-meta">
              AI trenutno ni na voljo. Posamezne odgovore lahko prebereš spodaj.
            </p></template
          ></template
        >
        <div v-if="admin && data.summary" class="kb-review">
          <p>
            Preglej navedbe, okoliščine in različna mnenja. Vključitev ohrani oznako skupnostnega
            izvora. Ob spremembi prispevkov se ta posnetek samodejno umakne.
          </p>
          <button
            class="kb-secondary"
            :disabled="busy"
            @click="action(data.thread.published ? 'unpublish' : 'publish')"
          >
            {{
              data.thread.published
                ? 'Umakni povzetek iz znanja'
                : 'Potrdi pregled in vključi v znanje'
            }}
          </button>
        </div>
        <p v-else-if="data.thread.published" class="kb-meta">
          Pregledani povzetek je na voljo tudi Možganu kot označeno znanje skupnosti.
        </p>
      </section>
      <section class="kb-replies" aria-labelledby="replies-heading">
        <h3 id="replies-heading">
          Odgovori <span class="kb-muted">{{ data.thread.reply_count }}</span>
        </h3>
        <p v-if="!data.posts.length">Bodi prvi, ki pomaga s svojo izkušnjo ali virom.</p>
        <article
          v-for="(post, index) in data.posts"
          :key="post.id"
          :data-post-id="post.id"
          tabindex="-1"
          class="kb-post"
          :class="{
            'is-accepted': data.thread.accepted_post_id === post.id,
            'is-hidden': post.hidden,
          }"
        >
          <div class="kb-post-meta">
            <strong>{{ post.author_name }}</strong
            ><span>#{{ index + 1 }} · {{ date(post.created_at) }}</span>
          </div>
          <span
            v-if="data.thread.accepted_post_id === post.id"
            class="kb-badge"
            data-origin="official"
            >Avtorju uporaben odgovor · ni uradna potrditev</span
          >
          <p v-if="post.hidden" class="kb-meta">
            Umaknjen odgovor · viden samo avtorju in skrbniku
          </p>
          <template v-if="editId !== post.id"
            ><p class="kb-thread-body">{{ post.body }}</p>
            <div class="kb-post-actions">
              <button
                v-if="
                  (data.thread.mine || admin) && data.thread.type === 'question' && !post.hidden
                "
                class="kb-text-button"
                :disabled="busy"
                @click="action('accept', post.id)"
              >
                {{
                  data.thread.accepted_post_id === post.id
                    ? 'Odstrani oznako uporabnega odgovora'
                    : 'Označi kot uporaben odgovor'
                }}</button
              ><template v-if="post.mine || admin"
                ><button
                  class="kb-text-button"
                  :disabled="busy"
                  @click="startEdit(post.id, post.body)"
                >
                  Uredi</button
                ><button
                  class="kb-text-button"
                  :disabled="busy"
                  @click="action(post.hidden ? 'restore-post' : 'hide-post', post.id)"
                >
                  {{ post.hidden ? 'Ponovno objavi' : 'Umakni' }}
                </button></template
              >
            </div></template
          >
          <form v-else class="kb-form" @submit.prevent="action('edit-post', post.id, editText)">
            <label :for="`edit-${post.id}`"
              >Uredi odgovor<textarea
                :id="`edit-${post.id}`"
                v-model="editText"
                minlength="10"
                maxlength="5000"
                rows="4"
                required
              /></label
            ><label class="kb-check"
              ><input v-model="editConsent" type="checkbox" required />Potrjujem objavo popravka in
              uporabo v povzetkih.</label
            >
            <div class="kb-form-actions">
              <button type="button" class="kb-secondary" @click="editId = ''">Prekliči</button
              ><button class="kb-primary" :disabled="busy || !saving">Shrani popravek</button>
            </div>
          </form>
        </article>
      </section>
      <form v-if="!data.thread.hidden" class="kb-form kb-reply-form" @submit.prevent="sendReply">
        <h3>Dodaj svoj odgovor</h3>
        <p>
          Opiši svojo izkušnjo in okoliščine ali navedi vir. Tvoj prispevek je označen kot prispevek
          skupnosti.
        </p>
        <label for="thread-reply"
          >Odgovor<textarea
            id="thread-reply"
            v-model="reply"
            required
            minlength="10"
            maxlength="5000"
            rows="5"
            placeholder="Kako lahko pomagaš?"
          /></label
        ><label class="kb-check"
          ><input v-model="consent" type="checkbox" required />Želim objaviti odgovor in dovoljujem
          njegovo uporabo v povzetkih skupnosti.</label
        >
        <p v-if="!saving" class="kb-error">
          Za objavo vključi »Shrani prispevke iz obrazca« nad stranjo.
        </p>
        <button class="kb-primary" :disabled="busy || !saving || !consent">
          {{ busy ? 'Obdelujem …' : 'Objavi odgovor' }}<KnowledgeIcon name="arrow" />
        </button>
      </form>
      <p v-if="error" class="kb-error" role="alert">{{ error }}</p>
    </template>
    <template v-else-if="!loading"
      ><h2 id="thread-title">Pogovor ni na voljo</h2>
      <button class="kb-secondary" @click="load">Poskusi znova</button></template
    >
  </dialog>
</template>
