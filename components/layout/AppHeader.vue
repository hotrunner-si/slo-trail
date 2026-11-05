<script setup lang="ts">
const { siteContent } = await useSiteContent()
const route = useRoute()
const isBrain = computed(() => route.path === '/mozgan' || route.path.startsWith('/mozgan/'))
const brainNav = [
  { label: 'Chat', to: '/mozgan' },
  { label: 'Analitika', to: '/mozgan/analitika' },
  { label: 'Baza znanja', to: '/mozgan/baza' },
  { label: 'Moj profil', to: '/profil' },
]
const nav = computed(() => (isBrain.value ? brainNav : siteContent.site.navigation))
const isCurrentBrainPage = (path: string) => route.path.replace(/\/$/, '') === path
</script>

<template>
  <header class="site-header" :class="{ 'brain-header': isBrain }">
    <div class="shell header-inner">
      <NuxtLink :to="isBrain ? '/mozgan' : '/'" class="wordmark" :aria-label="isBrain ? 'Trail Možgan, klepet' : 'Trail Slovenija, domov'">
        <span class="wordmark-mark">{{ siteContent.site.shortName }}</span
        ><span>{{ isBrain ? 'Trail Možgan' : siteContent.site.name }}</span>
      </NuxtLink>
      <nav
        id="main-nav"
        class="main-nav"
        :aria-label="isBrain ? 'Navigacija Možgana' : 'Glavna navigacija'"
      >
        <NuxtLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          :class="{ 'brain-link-current': isBrain && isCurrentBrainPage(item.to) }"
          :aria-current="isBrain && isCurrentBrainPage(item.to) ? 'page' : undefined"
          >{{ item.label }}</NuxtLink
        >
        <NuxtLink
          v-if="!isBrain"
          :to="siteContent.site.navigationCta.to"
          class="newsletter-link brain-nav-link"
          >{{ siteContent.site.navigationCta.label }} <span><IconArrowUpRight /></span
        ></NuxtLink>
      </nav>
      <NuxtLink v-if="isBrain" to="/" class="newsletter-link brain-return-link"
        >Nazaj na trail <span><IconArrowUpRight /></span
      ></NuxtLink>
    </div>
  </header>
</template>

<style scoped>
.brain-header .header-inner {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 22px;
}
.brain-header .main-nav {
  display: flex;
  position: static;
  flex-direction: row;
  align-items: center;
  gap: 20px;
  padding: 0;
  border: 0;
  background: transparent;
  text-align: left;
}
.brain-header .main-nav a {
  width: auto;
  padding: 0;
  white-space: nowrap;
}
.brain-header .main-nav a:after {
  right: 100%;
}
.brain-header .main-nav a:hover:after,
.brain-header .main-nav a.brain-link-current:after {
  right: 0;
}
.brain-return-link {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  padding: 0 0 0 18px;
  border-left: 1px solid var(--line);
  width: auto;
  border-top: 0;
  font-size: 0.9rem;
  font-weight: 600;
  white-space: nowrap;
}
@media (max-width: 900px) {
  .brain-header .header-inner {
    gap: 14px;
  }
  .brain-header .main-nav {
    gap: 14px;
    font-size: 0.74rem;
  }
  .brain-return-link {
    padding-left: 14px;
    font-size: 0.74rem;
  }
}
@media (max-width: 1100px) {
  .brain-header .header-inner { height: 64px; }
  .brain-header .wordmark { gap: 8px; font-size: 0.9rem; }
  .brain-header .wordmark-mark { width: 28px; height: 28px; }
}
@media (max-width: 720px) {
  .brain-header .header-inner {
    width: calc(100% - 32px);
    height: 80px;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas: 'brand back' 'nav nav';
    gap: 4px 10px;
    padding-block: 7px;
  }
  .brain-header .wordmark {
    grid-area: brand;
    gap: 8px;
    font-size: 0.8rem;
  }
  .brain-header .wordmark-mark {
    width: 26px;
    height: 26px;
    font-size: 0.6rem;
  }
  .brain-header .main-nav {
    grid-area: nav;
    justify-content: center;
    align-self: end;
    gap: clamp(9px, 3vw, 22px);
    font-size: 0.72rem;
  }
  .brain-header .main-nav a {
    display: inline-flex;
    align-items: center;
    min-height: 28px;
    font-size: inherit;
  }
  .brain-header .main-nav a:after {
    bottom: -3px;
  }
  .brain-header .brain-return-link {
    grid-area: back;
    padding: 0;
    border: 0;
    font-size: 0.7rem;
    gap: 7px;
  }
}
.brain-nav-link.router-link-active {
  color: #266358;
}
.brain-nav-link.router-link-active:after {
  display: none;
}
</style>
