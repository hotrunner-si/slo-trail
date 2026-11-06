<script setup lang="ts">
import { publicPreviewEnabled } from '~/utils/siteAccess'
useSiteSeo('Profil', 'Stran je v izdelavi.', { noindex: true })
</script>
<template>
  <main v-if="publicPreviewEnabled" class="page shell profile-unavailable">
    <h1>Prijava še ni mogoča.</h1>
    <p>Stran je v izdelavi.</p>
  </main>
  <ProfileAccount v-else />
</template>
<style scoped>
.profile-unavailable { padding-block: 100px; min-height: 55vh; }
.profile-unavailable h1 { font-size: clamp(28px, 4vw, 48px); margin-bottom: 20px; }
</style>
