<script setup lang="ts">
import type { BrainSource, BrainChatResult } from '~/types/brain'
import { brainChatHistory, type BrainChatMessage } from '~/utils/brainChat'

const { session } = await useBrainSession()
const text = ref('')
const busy = ref(false)
const error = ref('')
const history = ref<HTMLElement | null>(null)
const input = ref<HTMLTextAreaElement | null>(null)
const { data: suggestions, refresh: refreshSuggestions } = await useAsyncData(
  'brain-chat-prompts',
  () => $fetch('/api/brain/prompts'),
)
const messages = ref<
  (BrainChatMessage & {
    citations?: BrainSource[]
    mode?: BrainChatResult['mode']
    searchSuggestionsHtml?: string | null
  })[]
>([])
const defaultNote =
  'Zaseben klepet ostane v tem zavihku. V bazo se shrani samo posnetek, ki ga izrecno potrdiš za deljenje. Odgovore pripravlja Google Gemini; po potrebi uporabi Google Search.'
const note = ref(defaultNote)
const modeLabels = {
  database: 'Iz trail zbirke',
  general: 'Splošno znanje',
  web: 'Spletni viri',
  missing: 'Podatka še nimamo',
}

function reset() {
  if (busy.value) return
  messages.value = []
  text.value = ''
  error.value = ''
  note.value = defaultNote
  void refreshSuggestions()
}
watch(
  () => session.value?.user?.id,
  (next, previous) => {
    if (previous && previous !== next) reset()
  },
)
async function scrollToLatest() {
  await nextTick()
  if (history.value) history.value.scrollTop = history.value.scrollHeight
}
async function send(retry = false) {
  if (busy.value || !session.value?.aiAvailable) return
  if (!retry) {
    const question = text.value.trim()
    if (!question) return
    // Replace a failed unsent turn, rather than accumulating duplicate user messages.
    if (error.value && messages.value.at(-1)?.role === 'user') messages.value.pop()
    messages.value.push({ role: 'user', text: question })
    text.value = ''
  } else if (messages.value.at(-1)?.role !== 'user') return
  error.value = ''
  busy.value = true
  await scrollToLatest()
  try {
    const result = await $fetch('/api/brain/chat', {
      method: 'POST',
      body: {
        messages: brainChatHistory(messages.value.map(({ role, text }) => ({ role, text }))),
        save: false,
      },
    })
    messages.value.push({
      role: 'assistant',
      text: result.answer,
      citations: result.citations,
      mode: result.mode,
      searchSuggestionsHtml: result.searchSuggestionsHtml,
    })
    note.value = result.note
  } catch (e) {
    error.value = brainError(e)
  } finally {
    busy.value = false
    await scrollToLatest()
    input.value?.focus()
  }
}
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault()
    void send()
  }
}
function suggest(question: string) {
  text.value = question
  input.value?.focus()
}
</script>

<template>
  <section
    class="brain-chat"
    :class="{ 'is-empty': !messages.length }"
    aria-label="Klepet z Možganom"
  >
    <div class="chat-stage">
      <div v-if="messages.length" class="chat-topbar-actions chat-conversation-actions">
        <BrainChatShare v-if="messages.length" :messages="messages" :busy="busy" />
        <button
          v-if="messages.length"
          class="chat-reset"
          type="button"
          :disabled="busy"
          @click="reset"
        >
          <span aria-hidden="true">＋</span> Nov pogovor
        </button>
      </div>
      <div
        v-if="messages.length"
        ref="history"
        class="chat-history"
        role="log"
        aria-label="Pogovor z Možganom"
        aria-live="polite"
        :aria-busy="busy"
      >
        <div class="chat-history-inner">
          <article
            v-for="(message, index) in messages"
            :key="index"
            :class="['chat-message', message.role]"
          >
            <div class="chat-message-label">
              <strong>{{ message.role === 'user' ? 'Ti' : 'Možgan' }}</strong
              ><span v-if="message.mode">{{ modeLabels[message.mode] }}</span>
            </div>
            <p>{{ message.text }}</p>
            <ol v-if="message.citations?.length" class="chat-citations">
              <li v-for="source in message.citations" :key="source.id">
                <NuxtLink v-if="source.url?.startsWith('/')" :to="source.url">{{
                  source.title
                }}</NuxtLink>
                <a
                  v-else-if="source.url && /^https?:\/\//i.test(source.url)"
                  :href="source.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  >{{ source.title }}</a
                >
                <span v-else>{{ source.title }}</span
                ><small>
                  ·
                  {{
                    source.origin === 'web'
                      ? 'spletni vir'
                      : source.origin === 'conversation'
                        ? 'deljen pogovor · nepreverjeno'
                        : source.origin === 'official'
                          ? 'uradni vir'
                          : 'uredniški podatek'
                  }}<template v-if="source.verified_at">
                    · {{ source.verified_at.slice(0, 10) }}</template
                  ></small
                >
              </li>
            </ol>
            <BrainSearchSuggestions
              v-if="message.searchSuggestionsHtml"
              :html="message.searchSuggestionsHtml"
            />
          </article>
          <div v-if="busy" class="chat-thinking" role="status">
            <BrainIcon class="chat-thinking-icon" /> Pripravljam odgovor<span aria-hidden="true"> …</span>
          </div>
        </div>
      </div>
      <div class="chat-bottom">
        <div class="chat-composer-wrap">
          <div v-if="!messages.length" class="chat-welcome">
            <BrainIcon class="chat-welcome-mark" />
            <h2>Kaj te zanima?</h2>
            <p>O trailu, poteh in vsem vmes.</p>
          </div>
          <div v-if="error" class="chat-failure" role="alert">
            <p>{{ error }}</p>
            <button type="button" :disabled="busy" @click="send(true)">Poskusi znova ↻</button>
          </div>
          <p v-if="!session?.aiAvailable" class="chat-unavailable" role="status">
            AI pomočnik trenutno ni na voljo.
          </p>
          <form class="chat-input-box" @submit.prevent="send()">
            <label for="brain-query" class="sr-only">Vprašanje za Možgana</label>
            <textarea
              id="brain-query"
              ref="input"
              v-model="text"
              maxlength="3000"
              rows="2"
              placeholder="Vprašaj Možgana …"
              :disabled="busy"
              aria-describedby="chat-input-hint"
              @keydown="onKeydown"
            />
            <button
              type="submit"
              :disabled="busy || !session?.aiAvailable || !text.trim()"
              aria-label="Pošlji vprašanje"
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 19V5m-6 6 6-6 6 6"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          </form>
          <div v-if="!messages.length" class="chat-suggestions" aria-label="Predloga vprašanj">
            <button
              v-for="suggestion in suggestions"
              :key="suggestion.id"
              type="button"
              :disabled="busy"
              @click="suggest(suggestion.prompt)"
            >
              <span>{{ suggestion.prompt }}</span
              ><span class="chat-suggestion-arrow" aria-hidden="true">↗</span>
            </button>
          </div>
          <div class="chat-footnote">
            <p id="chat-input-hint">AI se lahko zmoti. Pomembne podatke preveri pri viru.</p>
            <details class="chat-privacy">
              <summary>Zasebnost</summary>
              <p>{{ note }}</p>
            </details>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.brain-chat {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #fcfcfa;
  color: #243830;
}
.chat-topbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.chat-topbar-actions {
  gap: 22px;
  flex-wrap: wrap;
  justify-content: flex-end;
  min-width: 0;
}
.chat-conversation-actions {
  flex: none;
  padding: 12px 24px 0;
}
.chat-account {
  color: #68736b;
  font-size: 12px;
}
.chat-account span {
  margin-left: 7px;
}
.chat-reset {
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid #dce2da;
  border-radius: 8px;
  background: transparent;
  padding: 8px 12px;
  font-size: 12px;
  cursor: pointer;
}
.chat-reset:hover {
  background: #f0f3ed;
}
.chat-reset:disabled {
  opacity: 0.5;
}
.chat-stage {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.is-empty .chat-stage {
  justify-content: center;
  padding-bottom: clamp(16px, 8dvh, 90px);
  overflow-y: auto;
}
.chat-history {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: #ccd4ca transparent;
}
.chat-history-inner,
.chat-composer-wrap {
  width: min(760px, calc(100% - 64px));
  margin-inline: auto;
}
.chat-history-inner {
  padding-block: 30px 40px;
}
.chat-message {
  margin-bottom: 34px;
  overflow-wrap: anywhere;
}
.chat-message-label {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 10px;
  font-size: 12px;
}
.chat-message-label strong {
  font-weight: 600;
}
.chat-message-label > span {
  color: #81907e;
  font-size: 10px;
}
.chat-message p {
  white-space: pre-wrap;
  font-size: 14px;
  line-height: 1.9;
  color: #2c3b32;
  margin: 0;
}
.chat-message.user {
  margin-left: auto;
  width: fit-content;
  max-width: 86%;
  padding: 14px 20px;
  background: #edf1e9;
  border-radius: 18px 18px 4px 18px;
}
.chat-message.user .chat-message-label {
  margin-bottom: 3px;
  color: #71816c;
  font-size: 10px;
}
.chat-message.user p {
  line-height: 1.7;
}
.chat-citations {
  margin: 20px 0 0;
  padding: 14px 0 0 20px;
  border-top: 1px solid #e4e8e1;
  font-size: 11px;
  line-height: 1.9;
}
.chat-citations a {
  text-decoration: underline;
  text-underline-offset: 3px;
}
.chat-citations small {
  color: #7b8877;
  font-size: 10px;
}
.chat-thinking {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #71816a;
  font-size: 12px;
  padding-block: 8px;
}
.chat-thinking-icon {
  color: #557456;
  width: 21px;
  height: 21px;
}
.chat-bottom {
  flex: none;
  padding: 12px 0 20px;
}
.chat-welcome {
  text-align: center;
  margin-bottom: 30px;
}
.chat-welcome-mark {
  display: inline-block;
  width: 42px;
  height: 42px;
  color: #64805b;
  margin-bottom: 20px;
}
.chat-welcome h2 {
  font-size: clamp(28px, 3vw, 38px);
  font-weight: 500;
  line-height: 1.2;
  letter-spacing: -0.06em;
  margin: 0 0 10px;
}
.chat-welcome p {
  color: #8a9486;
  font-size: 13px;
  margin: 0;
}
.chat-input-box {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  padding: 17px 16px 16px 22px;
  border: 1px solid #dce2d6;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 3px 14px #263c2310;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}
.chat-input-box:focus-within {
  border-color: #9caf91;
  box-shadow: 0 3px 18px #263c2315;
}
.chat-input-box textarea {
  font: 14px/1.7 var(--sans);
  color: #263b2c;
  -webkit-text-fill-color: #263b2c;
  flex: 1;
  min-width: 0;
  resize: vertical;
  min-height: 62px;
  max-height: 150px;
  border: 0;
  padding: 0;
  background: transparent;
  outline: none;
}
.chat-input-box textarea::placeholder {
  color: #939e8d;
  -webkit-text-fill-color: #939e8d;
  opacity: 1;
}
.chat-input-box > button {
  flex: none;
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 12px;
  background: #284b36;
  color: #fff;
  cursor: pointer;
  transition: background 0.15s;
}
.chat-input-box > button svg {
  width: 20px;
  height: 20px;
}
.chat-input-box > button:hover:enabled {
  background: #3d6447;
}
.chat-input-box > button:disabled {
  background: #e9eee5;
  color: #aab7a1;
}
.chat-suggestions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 18px;
}
.chat-suggestions > button {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 18px;
  text-align: left;
  border: 1px solid #e2e7dd;
  border-radius: 12px;
  padding: 15px 17px;
  background: transparent;
  color: #697960;
  font-size: 12px;
  line-height: 1.7;
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s;
}
.chat-suggestions > button:hover {
  background: #f1f5ec;
  border-color: #c8d6be;
}
.chat-suggestion-arrow {
  color: #8b9d7f;
  font-size: 17px;
  line-height: 1.3;
}
.chat-footnote {
  display: flex;
  align-items: start;
  justify-content: center;
  flex-wrap: wrap;
  gap: 6px 16px;
  margin-top: 14px;
}
.chat-footnote > p {
  font-size: 10px;
  line-height: 1.6;
  color: #959e90;
  margin: 0;
}
.chat-privacy {
  position: relative;
  color: #959e90;
  font-size: 10px;
}
.chat-privacy summary {
  cursor: pointer;
  list-style: none;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.chat-privacy summary::-webkit-details-marker {
  display: none;
}
.chat-privacy p {
  position: absolute;
  z-index: 2;
  bottom: 20px;
  right: 0;
  width: 270px;
  padding: 15px;
  background: #fff;
  border: 1px solid #dce2d6;
  border-radius: 10px;
  box-shadow: 0 5px 20px #20301812;
  font-size: 11px;
  line-height: 1.7;
}
.chat-failure {
  padding: 14px 16px;
  margin-bottom: 14px;
  border: 1px solid #e9d9cc;
  border-radius: 12px;
  background: #fcf5ef;
}
.chat-failure p,
.chat-unavailable {
  font-size: 12px;
  line-height: 1.7;
  color: #92553d;
  margin: 0 0 8px;
}
.chat-failure button {
  padding: 0;
  background: none;
  border: 0;
  font-size: 11px;
  text-decoration: underline;
  cursor: pointer;
}
.brain-chat button:focus-visible,
.brain-chat summary:focus-visible {
  outline: 2px solid #71975c;
  outline-offset: 3px;
}
@media (max-width: 700px) {
  .chat-conversation-actions { padding: 10px 16px 0; }
  .chat-topbar-actions {
    gap: 12px;
  }
  .chat-reset {
    padding: 7px 9px;
    font-size: 10px;
  }
  .chat-account {
    font-size: 11px;
  }
  .chat-history-inner,
  .chat-composer-wrap {
    width: calc(100% - 32px);
  }
  .chat-welcome {
    margin-bottom: 26px;
  }
  .chat-welcome-mark {
    margin-bottom: 14px;
    width: 34px;
    height: 34px;
  }
  .chat-welcome p {
    font-size: 12px;
  }
  .chat-input-box {
    border-radius: 17px;
    padding: 15px;
  }
  .chat-input-box textarea {
    font-size: 16px;
    min-height: 60px;
  }
  .chat-suggestions {
    grid-template-columns: 1fr;
    gap: 9px;
    margin-top: 14px;
  }
  .chat-suggestions > button {
    padding: 12px 14px;
    font-size: 11px;
  }
  .chat-bottom {
    padding-bottom: 14px;
  }
  .chat-history-inner {
    padding-block: 20px;
  }
  .chat-message {
    margin-bottom: 28px;
  }
  .chat-message p {
    font-size: 14px;
  }
  .chat-message.user {
    max-width: 93%;
    padding: 12px 16px;
  }
  .is-empty .chat-stage {
    padding-bottom: 20px;
    justify-content: safe center;
  }
}
@media (prefers-reduced-motion: reduce) {
  .brain-chat * {
    transition: none;
  }
}
</style>
