<script setup lang="ts">
import '~/assets/css/brain.css'
const { siteContent } = await useSiteContent()
const route = useRoute()
const workspace = siteContent.mozgan.workspace
const { session, signedIn, admin, saving } = await useBrainSession()
const current = computed(
  () =>
    workspace.navigation.find((item) => item.to === route.path.replace(/\/$/, '')) || {
      label: route.path.startsWith('/mozgan/skrbnik')
        ? 'Odobritve'
        : route.path.startsWith('/mozgan/racun')
          ? 'Račun'
          : 'Možgan',
    },
)
</script>

<template>
  <div
    class="brain-app"
    :class="{
      'brain-admin-mode': admin,
      'brain-admin-account': admin && route.path === '/mozgan/racun',
    }"
  >
    <aside class="brain-sidebar" aria-label="Navigacija Možgana">
      <div class="brain-brand">
        <span aria-hidden="true">✳</span>
        <div><strong>Možgan</strong><small>Trail Slovenija</small></div>
      </div>
      <nav class="brain-nav">
        <NuxtLink
          v-for="item in workspace.navigation"
          :key="item.to"
          :to="item.to"
          :class="{ selected: route.path.replace(/\/$/, '') === item.to }"
          :aria-current="route.path.replace(/\/$/, '') === item.to ? 'page' : undefined"
          ><span aria-hidden="true">{{ item.symbol }}</span
          >{{ item.label }}</NuxtLink
        >
        <NuxtLink to="/mozgan/racun" :class="{ selected: route.path === '/mozgan/racun' }"
          ><span aria-hidden="true">◎</span>Račun
          <small v-if="signedIn" class="brain-account-state">Prijavljen</small></NuxtLink
        >
        <NuxtLink v-if="admin" to="/mozgan/skrbnik"><span>✓</span>Skrbništvo</NuxtLink>
      </nav>
      <div class="brain-sidebar-foot">
        <span class="live-dot" />Slovenija <span>SI</span>
        <p>Baza znanja o trail teku</p>
        <small class="workspace-preview-label">Prva različica · povezano znanje</small>
      </div>
    </aside>
    <div class="dashboard-workspace">
      <div class="brain-session-bar">
        <NuxtLink to="/mozgan/racun">{{
          signedIn ? 'Prijavljen' : 'Prijava / ustvari račun'
        }}</NuxtLink>
        <label v-if="signedIn"
          ><input v-model="saving" type="checkbox" /> Shrani povzetek in znanje</label
        >
        <span v-else>Obiski prispevajo samo k osnovni statistiki zanimanja.</span>
        <span v-if="signedIn && !saving">Brez shranjevanja vsebine</span>
      </div>
      <h1 class="sr-only">{{ current.label }}</h1>
      <div class="brain-screen"><NuxtPage /></div>
    </div>
  </div>
</template>
