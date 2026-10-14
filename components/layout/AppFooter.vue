<script setup lang="ts">
const appConfig = useAppConfig()
</script>
<template>
  <footer class="site-footer">
    <div class="shell footer-grid">
      <div>
        <p class="wordmark footer-wordmark">{{ appConfig.site.name }}</p>
        <p>Osrednja točka slovenskega trail teka — v nastajanju.</p>
      </div>
      <div class="footer-links">
        <NuxtLink to="/races">Tekme</NuxtLink><NuxtLink to="/runners">Tekači</NuxtLink
        ><NuxtLink to="/routes">Ture</NuxtLink><NuxtLink to="/journal">Journal</NuxtLink>
      </div>
      <div>
      <p>Slovenija · {{ new Date().getFullYear() }}</p>
      <p class="footer-note">
        Avtor:
        <a href="https://nejc-ursic.netlify.app" target="_blank" rel="noopener noreferrer"
          >Nejc Uršič</a
        >
      </p>
      </div>
    </div>
  </footer>
</template>
