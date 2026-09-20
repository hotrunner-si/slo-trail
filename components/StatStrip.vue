<script setup lang="ts">defineProps<{ items: { value: string; label: string }[] }>()</script>
<template><dl class="stat-strip"><div v-for="item in items" :key="item.label"><dt>{{ item.label }}</dt><dd>{{ item.value }}</dd></div></dl></template>
