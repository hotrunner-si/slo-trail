<script setup lang="ts">
withDefaults(defineProps<{ variant?: number; label?: string; dark?: boolean }>(), { variant: 1, label: 'Predogled ture', dark: false })
const paths = [
  'M18 118 C50 90 60 32 105 44 S162 132 206 93 S262 40 308 61 S350 103 382 30',
  'M15 98 C48 28 92 122 132 72 S208 18 240 83 S322 132 384 48',
  'M20 48 C78 19 75 126 142 103 S208 23 254 55 S323 118 382 82'
]
</script>
<template>
  <div :class="['route-visual', { dark }]" role="img" :aria-label="label">
    <svg viewBox="0 0 400 150" fill="none" aria-hidden="true">
      <path class="contour" d="M-20 25C55 65 93-15 170 30s120 8 250-18M-10 65c75 40 119-32 190 4s115 24 240-15M-20 112c87 30 125-29 196 2s115 15 244-10" />
      <path class="route-line" :d="paths[(variant - 1) % paths.length]" />
      <circle class="route-point" cx="18" :cy="variant === 3 ? 48 : variant === 2 ? 98 : 118" r="4" />
    </svg>
    <span class="visual-tag">GPX / 0{{ variant }}</span>
  </div>
</template>
