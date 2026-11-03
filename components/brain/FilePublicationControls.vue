<script setup lang="ts">
import type { BrainFile } from '~/types/brain'
const props = defineProps<{ file: BrainFile }>()
const { session, refresh } = await useBrainSession()
const linked = computed(() => session.value?.account?.link?.runner_slug)
const published = computed(() =>
  session.value?.account?.publications?.find((p) => p.file_id === props.file.id),
)
const approved = computed(() =>
  session.value?.account?.routes?.some(
    (r) => r.file_path === props.file.path && r.status === 'approved',
  ),
)
const review = computed(() =>
  session.value?.account?.routes?.find((r) => r.file_path === props.file.path),
)
const consent = ref(false),
  busy = ref(false),
  error = ref(''),
  message = ref(''),
  confirmDelete = ref(false)
const title = ref(props.file.name.replace(/\.gpx$/i, '')),
  location = ref(''),
  description = ref(''),
  date = ref('')
async function act(action: 'publish' | 'unpublish' | 'delete') {
  busy.value = true
  error.value = ''
  message.value = ''
  try {
    await $fetch(
      `/api/brain/${action === 'publish' ? 'publication' : action === 'delete' ? 'delete-file' : 'unpublish'}`,
      {
        method: 'POST',
        body:
          action === 'publish'
            ? {
                file: props.file.id,
                expected: props.file.path,
                consent: consent.value,
                title: title.value,
                location: location.value,
                description: description.value,
                date: date.value,
              }
            : action === 'delete'
              ? { id: props.file.id, expected: props.file.path }
              : { id: published.value?.id },
      },
    )
    await refresh()
    await refreshSiteContent()
    consent.value = false
    message.value =
      action === 'publish'
        ? 'Objavljeno na tvojem tekaškem profilu.'
        : action === 'unpublish'
          ? 'Javna objava je umaknjena. Zasebna datoteka je ohranjena.'
          : 'Datoteka in njena javna objava sta odstranjeni.'
  } catch (e) {
    error.value = brainError(e)
  } finally {
    busy.value = false
    confirmDelete.value = false
  }
}
</script>
<template>
  <div class="file-publication-controls">
    <p v-if="published" class="publication-state">
      Javno objavljeno<template v-if="published.source_path !== file.path">
        · prejšnja različica datoteke</template
      >. <NuxtLink :to="'/runners/' + published.runner_slug">Odpri profil ↗</NuxtLink>
    </p>
    <p v-else>Zasebno · na tekaškem profilu še ni objavljeno.</p>
    <p v-if="file.kind === 'gpx' && review">
      Pregled GPX:
      {{
        review.status === 'approved'
          ? 'odobren'
          : review.status === 'rejected'
            ? 'zavrnjen — lahko ga ponovno pošlješ'
            : review.status === 'pending'
              ? 'čaka na pregled'
              : 'datoteka je zamenjana'
      }}.
    </p>
    <form
      v-if="
        linked &&
        (file.kind === 'image' || approved) &&
        (!published || published.source_path !== file.path)
      "
      @submit.prevent="act('publish')"
    >
      <template v-if="file.kind === 'gpx'">
        <label>Naslov ture<input v-model="title" required minlength="2" maxlength="150" /></label>
        <label>Kraj oziroma območje<input v-model="location" maxlength="150" /></label>
        <label>Opis ture<textarea v-model="description" rows="3" maxlength="1500" /></label>
        <label>Datum ture<input v-model="date" type="date" /></label>
      </template>
      <label class="publication-consent"
        ><input v-model="consent" type="checkbox" required /> Želim javno objaviti
        {{
          file.kind === 'image'
            ? 'to sliko na svojem tekaškem profilu'
            : 'to turo, zemljevid in izvirni GPX za prenos'
        }}.</label
      >
      <p v-if="file.kind === 'gpx'" class="publication-help">
        Pred objavo preveri, da sled ne razkriva zasebnih lokacij. Objavljeno datoteko lahko drugi
        prenesejo.
      </p>
      <button :disabled="busy || !consent">
        {{
          busy ? 'Objavljam …' : published ? 'Objavi novo različico' : 'Objavi na tekaškem profilu'
        }}
      </button>
    </form>
    <p v-else-if="!linked">Za javno objavo najprej poveži račun s tekaškim profilom.</p>
    <p v-else-if="file.kind === 'gpx' && !approved">
      Za objavo pošlji GPX v pregled in počakaj na odobritev skrbnika.
    </p>
    <button v-if="published" type="button" :disabled="busy" @click="act('unpublish')">
      Umakni javno objavo
    </button>
    <button
      v-if="!confirmDelete"
      type="button"
      class="file-remove-button"
      :disabled="busy"
      @click="confirmDelete = true"
    >
      Izbriši datoteko
    </button>
    <div v-else class="file-delete-confirmation">
      <p>
        Odstranili bomo zasebno datoteko in njeno morebitno javno objavo. Tekaški profil ostane.
      </p>
      <button type="button" :disabled="busy" @click="act('delete')">Potrdi izbris</button>
      <button type="button" :disabled="busy" @click="confirmDelete = false">Prekliči</button>
    </div>
    <p v-if="message" role="status">{{ message }}</p>
    <p v-if="error" role="alert">{{ error }}</p>
  </div>
</template>
<style scoped>
.file-publication-controls {
  display: grid;
  gap: 12px;
  border-top: 1px solid #d4ddcd;
  margin-top: 18px;
  padding-top: 16px;
}
.file-publication-controls form {
  display: grid;
  gap: 12px;
}
.file-publication-controls label {
  display: grid;
  gap: 6px;
}
.file-publication-controls .publication-consent {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.publication-consent input {
  width: auto;
  flex: none;
  margin-top: 3px;
}
.publication-state {
  color: #315736;
  font-weight: 600;
}
.file-publication-controls .file-remove-button {
  background: transparent;
  color: #823e32;
  border: 1px solid #c8a69d;
}
.file-publication-controls [role='alert'] {
  color: #943e30;
}
.publication-help {
  font-size: 12px;
  line-height: 1.6;
}
</style>
