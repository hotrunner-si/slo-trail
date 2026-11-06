<script setup lang="ts">
import { runnerNavigation } from '~/utils/runnerNavigation'
const { siteContent } = await useSiteContent()
const route = useRoute()
const open = ref(false)
const nav = siteContent.site.navigation.filter(
  (item) => item.to !== '/routes' && item.to !== '/runners/routes',
)
const runnersOpen = ref(false)

watch(
  () => route.fullPath,
  () => {
    open.value = false
  },
)
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
    <aside
      id="mobile-public-sidebar"
      class="mobile-nav-sidebar"
      :class="{ open }"
      :inert="!open"
      aria-label="Navigacija po straneh"
    >
      <div class="mobile-nav-sidebar-head">
        <span class="mono">Trail Slovenija</span>
        <button type="button" aria-label="Zapri navigacijo" @click="open = false">×</button>
      </div>
      <nav aria-label="Mobilna navigacija">
        <template v-for="item in nav" :key="item.to">
          <template v-if="item.to === '/runners'">
            <button
              class="mobile-runners-toggle"
              type="button"
              :aria-expanded="runnersOpen"
              aria-controls="mobile-runners-submenu"
              @click="runnersOpen = !runnersOpen"
            >
              {{ item.label }} <span aria-hidden="true">{{ runnersOpen ? '−' : '+' }}</span>
            </button>
            <div v-if="runnersOpen" id="mobile-runners-submenu" class="mobile-runners-submenu">
              <NuxtLink v-for="child in runnerNavigation" :key="child.to" :to="child.to">{{
                child.label
              }}</NuxtLink>
            </div>
          </template>
          <NuxtLink v-else :to="item.to">{{ item.label }}</NuxtLink>
        </template>
      </nav>
    </aside>
    <nav class="mobile-bottom-nav" aria-label="Hitra navigacija">
      <NuxtLink to="/mozgan" aria-label="Možgan">
        <BrainIcon class="mobile-bottom-icon" /><span>Možgan</span>
      </NuxtLink>
      <button
        type="button"
        :aria-expanded="open"
        aria-controls="mobile-public-sidebar"
        @click="open = !open"
      >
        <span class="mobile-hamburger" aria-hidden="true"><i /><i /><i /></span><span>Meni</span>
      </button>
      <NuxtLink to="/profil" aria-label="Uporabniški profil">
        <svg
          class="mobile-bottom-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.7"
          aria-hidden="true"
        >
          <circle cx="12" cy="8" r="3.5" />
          <path d="M4.5 20c.4-4.1 3.1-6.2 7.5-6.2s7.1 2.1 7.5 6.2" /></svg
        ><span>Moj profil</span>
      </NuxtLink>
    </nav>
  </div>
</template>

<style scoped>
.mobile-runners-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 15px 2px;
  border: 0;
  border-bottom: 1px solid var(--line);
  background: transparent;
  font: inherit;
  font-size: 1.05rem;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
}
.mobile-runners-submenu {
  display: grid;
  padding-left: 18px;
}
.mobile-runners-submenu a {
  font-size: 0.9rem !important;
}
</style>
