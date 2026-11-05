<script setup lang="ts">
import type { Runner } from '~/types'
const props = defineProps<{ runner: Runner }>()
const emit = defineEmits<{ saved: [runner: Runner] }>()
const { session, signedIn } = await useBrainSession()
const canEdit = computed(
  () => signedIn.value && session.value?.account?.link?.runner_slug === props.runner.slug,
)
const editing = ref(false),
  busy = ref(false),
  error = ref(''),
  message = ref('')
const draft = reactive({
  name: '',
  location: '',
  club: '',
  favouriteDistance: '',
  bio: '',
  longDescription: '',
  quote: '',
  stravaUrl: '',
  utmbUrl: '',
  websiteUrl: '',
})
function open() {
  for (const key of Object.keys(draft) as (keyof typeof draft)[])
    draft[key] = props.runner[key] || ''
  editing.value = true
  message.value = error.value = ''
}
async function save() {
  busy.value = true
  error.value = ''
  try {
    const result = await $fetch<{ runner: Runner }>('/api/brain/runner/' + props.runner.slug, {
      method: 'POST',
      body: draft,
    })
    emit('saved', result.runner)
    editing.value = false
    message.value = 'Tekaški profil je shranjen.'
  } catch (e) {
    error.value = brainError(e)
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <div v-if="canEdit" class="runner-owner-editor">
    <div class="runner-owner-actions">
      <button v-if="!editing" class="button runner-edit-button" @click="open">
        Uredi profil <span aria-hidden="true">↗</span>
      </button>
    </div>
    <p v-if="message" role="status">{{ message }}</p>
    <form v-if="editing" class="runner-owner-form" @submit.prevent="save">
      <h2>Uredi svoj tekaški profil</h2>
      <p>Ti podatki bodo javno vidni na tekaškem profilu. Zasebnih datotek tu ne objavljamo.</p>
      <p>
        <NuxtLink to="/profil?view=edit"
          >Sliko in objave GPX upravljaj v svojem računu ↗</NuxtLink
        >
      </p>
      <p v-if="error" role="alert">{{ error }}</p>
      <label
        >Ime in priimek<input v-model="draft.name" required minlength="2" maxlength="100"
      /></label>
      <label>Kraj oziroma regija<input v-model="draft.location" maxlength="100" /></label>
      <label>Klub<input v-model="draft.club" maxlength="100" /></label>
      <label>Najljubša razdalja<input v-model="draft.favouriteDistance" maxlength="100" /></label>
      <label>Kratka predstavitev<textarea v-model="draft.bio" rows="3" maxlength="1500" /></label>
      <label
        >Več o meni<textarea v-model="draft.longDescription" rows="5" maxlength="5000" />
      </label>
      <label>Misel ali citat<textarea v-model="draft.quote" rows="2" maxlength="500" /></label>
      <label
        >Strava povezava<input
          v-model="draft.stravaUrl"
          type="url"
          maxlength="500"
          placeholder="https://…"
      /></label>
      <label
        >UTMB povezava<input
          v-model="draft.utmbUrl"
          type="url"
          maxlength="500"
          placeholder="https://utmb.world/…"
      /></label>
      <label
        >Spletna stran<input
          v-model="draft.websiteUrl"
          type="url"
          maxlength="500"
          placeholder="https://…"
      /></label>
      <div>
        <button class="button" :disabled="busy">
          {{ busy ? 'Shranjujem …' : 'Shrani spremembe' }}</button
        ><button type="button" class="button secondary" :disabled="busy" @click="editing = false">
          Prekliči
        </button>
      </div>
    </form>
  </div>
</template>
<style scoped>
.runner-owner-editor {
  margin-bottom: 20px;
}
.runner-owner-actions {
  display: flex;
  justify-content: flex-end;
}
.runner-edit-button {
  background: #315736;
  border: 1px solid #315736;
  color: white;
  padding: 13px 22px;
  font-size: 14px;
  font-weight: 700;
  gap: 16px;
}
.runner-edit-button:hover {
  background: #234227;
  border-color: #234227;
  color: white;
}
.runner-edit-button:focus-visible {
  outline: 3px solid #96b975;
  outline-offset: 4px;
}
.runner-owner-form {
  display: grid;
  gap: 16px;
  padding: 24px;
  margin-top: 16px;
  background: #f4f5ee;
  border: 1px solid #d9e0d0;
  max-width: 700px;
}
.runner-owner-form label {
  display: grid;
  gap: 7px;
  font-size: 12px;
}
.runner-owner-form input,
.runner-owner-form textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #cbd5c0;
  background: #fff;
  font: inherit;
}
.runner-owner-form > div {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.runner-owner-form [role='alert'] {
  color: #943e30;
}
</style>
