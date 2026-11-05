<script setup lang="ts">
import '~/assets/css/brain.css'
const route = useRoute()
const isOverview = computed(() => route.path.replace(/\/$/, '') === '/mozgan')
const { signedIn, admin, saving } = await useBrainSession()
const currentLabel = computed(() => {
  const path = route.path.replace(/\/$/, '')
  if (path === '/mozgan') return 'Chat'
  if (path.startsWith('/mozgan/analitika')) return 'Analitika'
  if (path.startsWith('/mozgan/baza')) return 'Baza znanja'
  if (path.startsWith('/mozgan/skrbnik')) return 'Skrbništvo'
  return 'Možgan'
})
</script>

<template>
  <div
    class="brain-app"
    :class="{
      'brain-admin-mode': admin,
      'brain-overview-mode': isOverview,
    }"
  >
    <div class="dashboard-workspace">
      <div v-if="!isOverview" class="brain-session-bar">
        <NuxtLink to="/profil">{{
          signedIn ? 'Prijavljen' : 'Prijava / ustvari račun'
        }}</NuxtLink>
        <NuxtLink v-if="admin" to="/mozgan/skrbnik">Skrbništvo</NuxtLink>
        <label v-if="signedIn"
          ><input v-model="saving" type="checkbox" /> Shrani prispevke iz obrazca</label
        >
        <span v-else>Obiski prispevajo samo k osnovni statistiki zanimanja.</span>
        <span v-if="signedIn && !saving">Brez shranjevanja vsebine</span>
      </div>
      <h1 class="sr-only">{{ currentLabel }}</h1>
      <div class="brain-screen"><NuxtPage /></div>
    </div>
  </div>
</template>
