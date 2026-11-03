<script setup lang="ts">
import type { Runner } from '~/types'
const asset = useContentAsset()
defineProps<{ runner: Runner; index?: number }>()
</script>
<template>
  <NuxtLink :to="`/runners/${runner.slug}`" class="runner-card">
    <div class="runner-image-wrap">
      <RunnerPortrait :image="runner.image" :name="runner.name"/><span class="runner-index">0{{ (index ?? 0) + 1 }}</span>
    </div>
    <p class="eyebrow">
      {{ runner.location
      }}<template v-if="runner.favouriteDistance"> · {{ runner.favouriteDistance }}</template>
    </p>
    <h3>{{ runner.name }}</h3>
    <p>{{ runner.bio }}</p>
    <span class="text-link">Profil tekača <IconArrowUpRight /></span>
  </NuxtLink>
</template>
