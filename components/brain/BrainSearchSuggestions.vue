<script setup lang="ts">
const props = defineProps<{ html: string }>()
// Provider attribution is isolated from the application: no scripts, forms or same-origin access.
const document = computed(
  () =>
    `<!doctype html><html lang="sl"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src https: data:; font-src https: data:; script-src 'none'; form-action 'none'; base-uri 'none'"><base target="_blank"><style>body{margin:0;font:12px Arial,sans-serif;overflow-wrap:anywhere}</style></head><body>${props.html}</body></html>`,
)
</script>
<template>
  <iframe
    class="brain-search-suggestions"
    title="Predlogi iskanja Google"
    :srcdoc="document"
    sandbox="allow-popups allow-popups-to-escape-sandbox"
    referrerpolicy="no-referrer"
  />
</template>
<style scoped>
.brain-search-suggestions {
  width: 100%;
  height: 140px;
  border: 0;
  margin-top: 16px;
  background: white;
  border-radius: 6px;
}
</style>
