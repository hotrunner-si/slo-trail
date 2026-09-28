<script setup lang="ts">
const loadGpx = useGpxData()
import type { GpxData } from '~/types/gpx'
import type { RaceDistance } from '~/types'
import { effortCategory, effortKm, effortLabel } from '~/utils/raceCategories'

const props = defineProps<{ distance: RaceDistance; raceId: string }>()
const category = computed(() => effortCategory(props.distance))
const gpx = ref<GpxData | null>(null)
let loadVersion = 0
onMounted(() =>
  watch(
    () => props.distance.gpx?.file,
    async (file) => {
      const version = ++loadVersion
      gpx.value = null
      if (props.distance.gpx?.profile || !file) return
      try {
        const loaded = await loadGpx<GpxData>(file)
        if (version === loadVersion) gpx.value = loaded
      } catch {
        /* Show an unavailable state instead of invented elevations. */
      }
    },
    { immediate: true },
  ),
)
const profile = computed(() => props.distance.gpx?.profile || gpx.value?.profile || [])
</script>

<template>
  <div
    :class="['race-mini-profile', `effort-${category.toLowerCase()}`]"
    :aria-label="`Višinski profil ${distance.km} km, ${distance.elevation} metrov vzpona`"
  >
    <div class="mini-profile-meta">
      <span>{{ effortLabel(distance) }}</span
      ><strong>{{ effortKm(distance).toLocaleString('sl-SI') }} EFF</strong>
    </div>
    <p v-if="!profile.length" class="profile-unavailable">Profil ni na voljo</p>
    <GpxMiniProfile
      v-else
      :profile="profile"
      :width="180"
      :height="72"
      :top="10"
      :bottom="6"
      :label="`Višinski profil ${distance.km} km`"
    />
  </div>
</template>
