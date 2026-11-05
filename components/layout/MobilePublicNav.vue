<script setup lang="ts">
const { siteContent } = await useSiteContent()
const route = useRoute()
const open = ref(false)
const nav = siteContent.site.navigation

watch(() => route.fullPath, () => { open.value = false })
watch(open, (value) => {
  if (import.meta.client) document.body.style.overflow = value ? 'hidden' : ''
})
onUnmounted(() => {
  if (import.meta.client) document.body.style.overflow = ''
})
</script>

<template>
  <div class="mobile-public-navigation">
    <div v-if="open" class="mobile-nav-backdrop" @click="open = false" />
    <aside id="mobile-public-sidebar" class="mobile-nav-sidebar" :class="{ open }" :inert="!open" aria-label="Navigacija po straneh">
      <div class="mobile-nav-sidebar-head">
        <span class="mono">Trail Slovenija</span>
        <button type="button" aria-label="Zapri navigacijo" @click="open = false">×</button>
      </div>
      <nav aria-label="Mobilna navigacija">
        <NuxtLink v-for="item in nav" :key="item.to" :to="item.to">{{ item.label }}</NuxtLink>
      </nav>
    </aside>
    <nav class="mobile-bottom-nav" aria-label="Hitra navigacija">
      <NuxtLink to="/mozgan" aria-label="Možgan">
        <BrainIcon class="mobile-bottom-icon" /><span>Možgan</span>
      </NuxtLink>
      <button type="button" :aria-expanded="open" aria-controls="mobile-public-sidebar" @click="open = !open">
        <span class="mobile-hamburger" aria-hidden="true"><i /><i /><i /></span><span>Meni</span>
      </button>
      <NuxtLink to="/profil" aria-label="Uporabniški profil">
        <svg class="mobile-bottom-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c.4-4.1 3.1-6.2 7.5-6.2s7.1 2.1 7.5 6.2"/></svg><span>Profil</span>
      </NuxtLink>
    </nav>
  </div>
</template>
