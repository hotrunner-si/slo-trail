<script setup lang="ts">import type { Runner } from '~/types'; defineProps<{ runner: Runner; index?: number }>()</script>
<template>
  <NuxtLink :to="`/runners/${runner.slug}`" class="runner-card">
    <div class="runner-image-wrap"><img :src="runner.image" :alt="`Atmosferski placeholder za profil ${runner.name}`" loading="lazy"><span class="runner-index">0{{ (index ?? 0) + 1 }}</span></div>
    <p class="eyebrow">{{ runner.location }} · {{ runner.favouriteDistance }}</p><h3>{{ runner.name }}</h3><p>{{ runner.bio }}</p><span class="text-link">Profil tekača ↗</span>
  </NuxtLink>
</template>
