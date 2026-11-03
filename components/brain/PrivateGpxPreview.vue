<script setup lang="ts">
import type { BrainFile } from '~/types/brain'
import type { GpxData } from '~/types/gpx'
const props = defineProps<{ file: BrainFile }>()
const opened = ref(false),
  busy = ref(false),
  error = ref('')
const data = shallowRef<GpxData | null>(null)
const activeDistanceKm = ref(0)
async function toggle() {
  opened.value = !opened.value
  if (!opened.value || data.value || busy.value) return
  busy.value = true
  error.value = ''
  try {
    data.value = await $fetch<GpxData>(`/api/brain/files/${props.file.id}`, {
      query: { variant: 'detail.json', v: props.file.path },
    })
  } catch {
    error.value = 'Predogleda ni bilo mogoče naložiti. Poskusi znova.'
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <div class="private-gpx-preview">
    <template v-if="file.details?.processingVersion">
      <p role="status">
        GPX je obdelan · {{ file.details.distanceKm }} km<template
          v-if="file.details.elevationGain != null"
        >
          · {{ file.details.elevationGain }} m vzpona</template
        >
      </p>
      <p v-if="!file.details.elevationsComplete">
        Višinski podatki manjkajo ali niso popolni. Višinski profil in skupni vzpon nista na voljo.
      </p>
      <button type="button" :aria-expanded="opened" @click="toggle">
        {{ opened ? 'Zapri predogled' : 'Zasebni predogled GPX' }}
      </button>
      <div v-if="opened">
        <p v-if="busy" role="status">Nalagam predogled …</p>
        <p v-if="error" role="alert">{{ error }}</p>
        <template v-if="data">
          <RunnerGpxProfile
            v-if="data.detailedProfile?.length"
            :profile="data.detailedProfile"
            :active-distance-km="activeDistanceKm"
            color="#315736"
            :label="file.name"
            @distance-change="activeDistanceKm = $event"
          />
          <RunnerGpxMap
            :data="data"
            :active-distance-km="activeDistanceKm"
            color="#315736"
            :title="file.name"
            @distance-change="activeDistanceKm = $event"
          />
        </template>
      </div>
    </template>
    <p v-else>Za pripravo zemljevida in višinskega profila ponovno naloži ta GPX.</p>
  </div>
</template>
