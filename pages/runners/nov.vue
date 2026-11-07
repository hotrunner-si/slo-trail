<script setup lang="ts">
definePageMeta({ middleware: 'brain-account' })
const { admin } = await useBrainSession()
if (!admin.value)
  throw createError({ statusCode: 403, statusMessage: 'Profile tekačev ustvarja skrbnik.' })
await navigateTo('/skrbnik/tekaci?nov=1', { replace: true })
</script>
<template><p>Odpiram obrazec …</p></template>
