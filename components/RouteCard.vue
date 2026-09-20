<script setup lang="ts">import type { TrailRoute } from '~/types'; defineProps<{ route: TrailRoute; index?: number }>()</script>
<template>
  <NuxtLink :to="`/routes/${route.slug}`" class="route-card">
    <RouteVisual :variant="((index ?? 0) % 3) + 1" :label="`Trasa ${route.name}`" />
    <div class="route-card-body"><p class="eyebrow">{{ route.region }} · {{ route.difficulty }}</p><h3>{{ route.name }}</h3><div class="route-card-stats mono"><span>{{ route.distance.toLocaleString('sl-SI') }} KM</span><span>{{ route.elevationGain.toLocaleString('sl-SI') }} M+</span></div><p>Priporoča {{ route.recommendedBy }}</p></div>
  </NuxtLink>
</template>
