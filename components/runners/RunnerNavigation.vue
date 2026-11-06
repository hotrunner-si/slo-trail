<script setup lang="ts">
import { runnerNavigation } from '~/utils/runnerNavigation'
const route = useRoute()
</script>

<template>
  <nav class="runner-section-nav" aria-label="Tekači">
    <NuxtLink
      v-for="item in runnerNavigation"
      :key="item.to"
      :to="item.to"
      :aria-current="route.path.replace(/\/$/, '') === item.to ? 'page' : undefined"
    >
      {{ item.label }}
    </NuxtLink>
  </nav>
</template>

<style scoped>
.runner-section-nav {
  display: flex;
  justify-content: flex-end;
  padding-right: 20px;
  gap: clamp(18px, 5vw, 44px);
  margin-bottom: 32px;
}
.runner-section-nav a {
  padding: 12px 0;
  font-size: 0.82rem;
  white-space: nowrap;
  border-bottom: 2px solid transparent;
}
.runner-section-nav a[aria-current='page'] {
  border-color: var(--accent);
  color: var(--accent);
  font-weight: 700;
}
@media (max-width: 480px) {
  .runner-section-nav {
    justify-content: space-between;
    padding-right: 0;
    gap: 8px;
  }
  .runner-section-nav a {
    font-size: 0.75rem;
  }
}
</style>
