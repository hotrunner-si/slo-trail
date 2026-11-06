<script setup lang="ts">
const route = useRoute()
await navigateTo(
  { path: '/runners/routes', query: route.query, hash: route.hash },
  { redirectCode: 301 },
)
</script>
<template><div /></template>
