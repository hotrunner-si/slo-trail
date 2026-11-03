<script setup lang="ts">
const open = ref(false)
const { siteContent } = await useSiteContent()
const route = useRoute()
watch(
  () => route.fullPath,
  () => {
    open.value = false
  },
)
const nav = siteContent.site.navigation
</script>

<template>
  <header class="site-header">
    <div class="shell header-inner">
      <NuxtLink to="/" class="wordmark" aria-label="Trail Slovenija, domov">
        <span class="wordmark-mark">{{ siteContent.site.shortName }}</span
        ><span>{{ siteContent.site.name }}</span>
      </NuxtLink>
      <button
        class="menu-button"
        :aria-expanded="open"
        aria-controls="main-nav"
        @click="open = !open"
      >
        <span>{{ open ? 'Zapri' : 'Meni' }}</span
        ><i aria-hidden="true" />
      </button>
      <nav id="main-nav" :class="['main-nav', { open }]" aria-label="Glavna navigacija">
        <NuxtLink v-for="item in nav" :key="item.to" :to="item.to">{{ item.label }}</NuxtLink>
        <NuxtLink :to="siteContent.site.navigationCta.to" class="newsletter-link brain-nav-link"
          >{{ siteContent.site.navigationCta.label }} <span><IconArrowUpRight /></span
        ></NuxtLink>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.brain-nav-link.router-link-active {
  color: #266358;
}
.brain-nav-link.router-link-active:after {
  display: none;
}
</style>
