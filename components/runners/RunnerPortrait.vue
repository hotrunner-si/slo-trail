<script setup lang="ts">
const props = defineProps<{ image?: string; name: string }>()
const asset = useContentAsset()
const initials = computed(() =>
  props.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join(''),
)
</script>
<template>
  <img v-if="image" :src="asset(image)" :alt="`Fotografija profila ${name}`" loading="lazy" />
  <div v-else class="runner-avatar" :aria-label="`Profil ${name} brez javne fotografije`">
    {{ initials }}
  </div>
</template>
<style scoped>
.runner-avatar {
  width: 100%;
  height: 100%;
  min-height: 180px;
  display: grid;
  place-items: center;
  background: #dfe7d2;
  color: #31533b;
  font-size: clamp(40px, 7vw, 90px);
  font-weight: 600;
  letter-spacing: -0.06em;
}
</style>
