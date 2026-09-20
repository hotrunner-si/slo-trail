<script setup lang="ts">defineProps<{ eyebrow?: string; title: string; linkLabel?: string; to?: string }>()</script>
<template><div class="section-head"><div><p v-if="eyebrow" class="eyebrow">{{ eyebrow }}</p><h2>{{ title }}</h2></div><NuxtLink v-if="to" :to="to" class="text-link">{{ linkLabel }} <span>↗</span></NuxtLink></div></template>
