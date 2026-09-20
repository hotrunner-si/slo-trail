<script setup lang="ts">withDefaults(defineProps<{ compact?: boolean; dark?: boolean }>(), { compact:false, dark:false })</script>
<template>
  <div :class="['elevation', { compact, dark }]" role="img" aria-label="Generični višinski profil trase">
    <svg viewBox="0 0 600 110" preserveAspectRatio="none" aria-hidden="true">
      <path class="elevation-fill" d="M0 104L0 91L42 88L75 68L112 76L160 35L198 51L238 20L280 62L323 70L360 46L405 54L455 25L492 62L535 53L600 88L600 104Z" />
      <path class="elevation-line" d="M0 91L42 88L75 68L112 76L160 35L198 51L238 20L280 62L323 70L360 46L405 54L455 25L492 62L535 53L600 88" />
    </svg>
    <div class="elevation-scale"><span>0 KM</span><span>VRH</span><span>CILJ</span></div>
  </div>
</template>
