<script setup lang="ts">
defineProps<{ locked: boolean }>()
defineEmits<{ reset: []; toggle: [] }>()
</script>

<template>
  <div class="map-gesture-actions" aria-label="Upravljanje zemljevida">
    <button type="button" aria-label="Ponastavi pogled" title="Ponastavi pogled" @click="$emit('reset')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
      </svg>
    </button>
    <button type="button" :aria-label="locked ? 'Odkleni premikanje zemljevida z enim prstom' : 'Zakleni premikanje zemljevida z enim prstom'" :title="locked ? 'Odkleni zemljevid' : 'Zakleni zemljevid'" :aria-pressed="!locked" @click="$emit('toggle')">
      <svg v-if="locked" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="5" y="10" width="14" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </svg>
      <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="5" y="10" width="14" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 7.5-2" />
      </svg>
    </button>
  </div>
</template>
