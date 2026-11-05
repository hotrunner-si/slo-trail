<script setup lang="ts">
import type { BrainChatMessage } from '~/utils/brainChat'
import { brainShareDraft } from '~/utils/brainShare'
const props = defineProps<{ messages: BrainChatMessage[]; busy: boolean }>()
const { signedIn, refresh } = await useBrainSession()
const dialog = ref<HTMLDialogElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)
const sharedId = ref<string | null>(null)
const visibility = ref<'private' | 'shared'>('private')
const draft = reactive({ title: '', content: '' })
const consent = ref(false),
  working = ref(false),
  error = ref('')
function open() {
  Object.assign(draft, brainShareDraft(props.messages))
  consent.value = false
  error.value = ''
  visibility.value = sharedId.value ? 'shared' : 'private'
  dialog.value?.showModal()
}
function close() {
  dialog.value?.close()
  trigger.value?.focus()
}
async function submit() {
  working.value = true
  error.value = ''
  try {
    if (visibility.value === 'private') {
      if (sharedId.value)
        await $fetch('/api/brain/shared', { method: 'DELETE', body: { id: sharedId.value } })
      sharedId.value = null
      close()
      return
    }
    if (sharedId.value) {
      close()
      return
    }
    if (!signedIn.value || !consent.value) return
    const result = await $fetch('/api/brain/shared', {
      method: 'POST',
      body: { ...draft, consent: true },
    })
    sharedId.value = result.id
    close()
  } catch (e) {
    error.value = brainError(e)
  } finally {
    working.value = false
  }
}
</script>
<template>
  <div class="chat-sharing">
    <button
      ref="trigger"
      class="chat-sharing-trigger"
      type="button"
      :disabled="busy"
      aria-haspopup="dialog"
      @click="open"
    >
      <span aria-hidden="true">{{ sharedId ? '↗' : '◉' }}</span>
      {{ sharedId ? 'Deljen posnetek' : 'Zaseben pogovor' }} <span aria-hidden="true">⌄</span>
    </button>
    <dialog
      ref="dialog"
      class="chat-share-dialog"
      aria-labelledby="chat-share-title"
      @cancel.prevent="!working && close()"
    >
      <form @submit.prevent="submit">
        <header>
          <div>
            <p>Zasebnost pogovora</p>
            <h2 id="chat-share-title">Tvoja izbira.</h2>
          </div>
          <button
            type="button"
            class="share-close"
            aria-label="Zapri nastavitve deljenja"
            :disabled="working"
            @click="close"
          >
            ×
          </button>
        </header>
        <fieldset class="share-choices" :disabled="working">
          <legend class="sr-only">Izberi vidnost pogovora</legend>
          <label
            ><input v-model="visibility" type="radio" value="private" /><span
              ><strong>Zaseben pogovor</strong
              ><small>Ne prispeva v skupno bazo znanja.</small></span
            ></label
          ><label
            ><input v-model="visibility" type="radio" value="shared" /><span
              ><strong>Deli v bazo znanja</strong
              ><small>Izbrani posnetek postane dostopen drugim.</small></span
            ></label
          >
        </fieldset>
        <div v-if="visibility === 'shared' && sharedId" class="share-preview">
          <p>
            V bazi je posnetek ob zadnjem deljenju. Nova sporočila ostanejo zasebna. Če želiš deliti
            novejši posnetek, najprej umakni deljenje z izbiro »Zaseben pogovor«.
          </p>
          <NuxtLink :to="`/mozgan/pogovor/${sharedId}`" target="_blank"
            >Odpri deljeni posnetek ↗</NuxtLink
          >
        </div>
        <div v-else-if="visibility === 'shared'" class="share-preview">
          <p>
            Preglej in po potrebi uredi posnetek. Odstrani imena, kontakte in druge osebne podatke.
            Odgovori AI bodo ostali označeni kot nepreverjeno gradivo.
          </p>
          <label
            >Naslov<input
              v-model="draft.title"
              minlength="3"
              maxlength="160"
              required
              :disabled="working"
          /></label>
          <label
            >Vsebina za deljenje<textarea
              v-model="draft.content"
              rows="9"
              minlength="20"
              maxlength="11000"
              required
              :disabled="working"
            />
          </label>
          <label v-if="signedIn" class="share-consent"
            ><input v-model="consent" type="checkbox" :disabled="working" required /><span
              >Pregledal sem vsebino in želim ta posnetek deliti z drugimi ter dovoliti njegovo
              uporabo v bazi znanja.</span
            ></label
          >
          <div v-else class="share-login">
            <p>
              Za deljenje se prijavi. Prijava se odpre v novem zavihku, da ta pogovor ostane odprt.
            </p>
            <a href="/profil" target="_blank" rel="noopener noreferrer">Odpri prijavo ↗</a
            ><button type="button" @click="refresh()">Prijavil sem se — preveri prijavo</button>
          </div>
          <p class="share-small">
            Deliš samo vsebino tega predogleda. Nova sporočila ostanejo zasebna. Deljenje lahko
            pozneje umakneš tudi v svojem računu.
          </p>
        </div>
        <p v-else class="share-explanation">
          {{
            sharedId
              ? 'Posnetek bomo umaknili iz skupne baze in njegova povezava ne bo več dostopna. Že prebranih kopij ali prejšnjih odgovorov drugih uporabnikov ni mogoče umakniti.'
              : 'V našo bazo ne shranjujemo prepisa tega zasebnega pogovora. Gemini sporočila še vedno obdeluje za pripravo odgovorov.'
          }}
        </p>
        <p v-if="error" class="share-error" role="alert">{{ error }}</p>
        <footer>
          <button type="button" class="share-cancel" :disabled="working" @click="close">
            Prekliči</button
          ><button
            type="submit"
            class="share-submit"
            :disabled="working || (visibility === 'shared' && !sharedId && (!signedIn || !consent))"
          >
            {{
              working
                ? 'Shranjujem …'
                : visibility === 'private'
                  ? sharedId
                    ? 'Umakni deljenje'
                    : 'Ostani zaseben'
                  : sharedId
                    ? 'Zapri'
                    : 'Deli v bazo znanja'
            }}
          </button>
        </footer>
      </form>
    </dialog>
  </div>
</template>
<style scoped>
.chat-sharing-trigger {
  display: flex;
  align-items: center;
  gap: 7px;
  background: transparent;
  border: 1px solid #e0e6dc;
  border-radius: 8px;
  padding: 7px 10px;
  color: #708167;
  font-size: 11px;
  cursor: pointer;
}
.chat-sharing-trigger:disabled {
  opacity: 0.5;
}
.chat-share-dialog {
  width: min(620px, calc(100% - 32px));
  max-height: calc(100dvh - 48px);
  padding: 28px;
  border: 1px solid #dce3d5;
  border-radius: 18px;
  color: #2b3e31;
  box-shadow: 0 20px 100px #17291e33;
  overflow: auto;
}
.chat-share-dialog::backdrop {
  background: #13251c66;
  backdrop-filter: blur(3px);
}
.chat-share-dialog header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  margin-bottom: 24px;
}
.chat-share-dialog header p {
  font-size: 11px;
  margin: 0 0 7px;
  color: #87947e;
}
.chat-share-dialog h2 {
  font-size: 27px;
  font-weight: 500;
  letter-spacing: -0.05em;
  margin: 0;
}
.share-close {
  background: none;
  border: 0;
  font-size: 25px;
  cursor: pointer;
}
.share-choices {
  border: 0;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin: 0 0 22px;
}
.share-choices label {
  display: flex;
  gap: 10px;
  border: 1px solid #dfe6d9;
  padding: 14px;
  border-radius: 10px;
  cursor: pointer;
}
.share-choices label:has(input:checked) {
  border-color: #87a673;
  background: #f0f5eb;
}
.share-choices input {
  accent-color: #4e713d;
}
.share-choices strong {
  display: block;
  font-size: 12px;
  margin-bottom: 6px;
}
.share-choices small {
  font-size: 10px;
  line-height: 1.6;
  color: #829077;
}
.share-preview > p,
.share-explanation {
  font-size: 12px;
  line-height: 1.8;
  color: #77866e;
}
.share-preview > label:not(.share-consent) {
  display: grid;
  gap: 7px;
  font-size: 11px;
  margin-top: 14px;
}
.share-preview input:not([type='checkbox']),
.share-preview textarea {
  width: 100%;
  border: 1px solid #d4decc;
  border-radius: 8px;
  padding: 10px;
  font: 12px/1.7 var(--sans);
  color: #33492d;
  background: #fafcf7;
}
.share-preview textarea {
  resize: vertical;
}
.share-consent {
  display: flex;
  align-items: start;
  gap: 9px;
  margin: 18px 0;
  font-size: 11px;
  line-height: 1.7;
}
.share-consent input {
  margin-top: 4px;
  accent-color: #4e713d;
}
.share-preview .share-small {
  font-size: 10px;
  color: #8b9784;
}
.share-preview > a {
  font-size: 11px;
  text-decoration: underline;
}
.share-login {
  padding: 14px;
  background: #f0f4e9;
  border-radius: 8px;
  margin-top: 16px;
}
.share-login p {
  font-size: 11px;
  line-height: 1.7;
}
.share-login a,
.share-login button {
  font-size: 11px;
  text-decoration: underline;
  background: none;
  border: 0;
  cursor: pointer;
  margin: 8px 15px 0 0;
  padding: 0;
}
.chat-share-dialog footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 22px;
}
.chat-share-dialog footer button {
  border-radius: 8px;
  padding: 11px 16px;
  font-size: 12px;
  cursor: pointer;
}
.share-cancel {
  background: none;
  border: 1px solid #dce3d5;
}
.share-submit {
  background: #31563a;
  color: white;
  border: 1px solid #31563a;
}
.share-submit:disabled {
  opacity: 0.4;
}
.share-error {
  background: #fff0e7;
  padding: 12px;
  font-size: 11px;
  color: #9b5235;
  border-radius: 8px;
}
.chat-share-dialog button:focus-visible,
.chat-sharing-trigger:focus-visible {
  outline: 2px solid #71975c;
  outline-offset: 3px;
}
@media (max-width: 620px) {
  .chat-share-dialog {
    padding: 20px;
  }
  .share-choices {
    grid-template-columns: 1fr;
  }
  .chat-sharing-trigger {
    font-size: 10px;
    padding: 6px 8px;
  }
}
</style>
