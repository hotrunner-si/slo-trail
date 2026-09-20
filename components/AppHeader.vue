<script setup lang="ts">
const open = ref(false)
const route = useRoute()
watch(() => route.fullPath, () => { open.value = false })
const nav = [
  { label: 'Domov', to: '/' }, { label: 'Tekme', to: '/races' }, { label: 'Tekači', to: '/runners' },
  { label: 'Trase', to: '/routes' }, { label: 'Journal', to: '/journal' }
]
</script>

<template>
  <header class="site-header">
    <div class="shell header-inner">
      <NuxtLink to="/" class="wordmark" aria-label="Trail Slovenija, domov">
        <span class="wordmark-mark">TS</span><span>Trail Slovenija</span>
      </NuxtLink>
      <button class="menu-button" :aria-expanded="open" aria-controls="main-nav" @click="open = !open">
        <span>{{ open ? 'Zapri' : 'Meni' }}</span><i aria-hidden="true" />
      </button>
      <nav id="main-nav" :class="['main-nav', { open }]" aria-label="Glavna navigacija">
        <NuxtLink v-for="item in nav" :key="item.to" :to="item.to">{{ item.label }}</NuxtLink>
        <NuxtLink to="/#newsletter" class="newsletter-link">Newsletter <span>↗</span></NuxtLink>
      </nav>
    </div>
  </header>
</template>
