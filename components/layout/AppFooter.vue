<script setup lang="ts">
const appConfig = useAppConfig()
const { siteContent } = await useSiteContent()
</script>
<template>
  <footer class="site-footer">
    <div class="shell footer-grid">
      <div>
        <p class="wordmark footer-wordmark">{{ appConfig.site.name }}</p>
        <p>{{ siteContent.site.footerDescription }}</p>
      </div>
      <div class="footer-links">
        <NuxtLink to="/races">Tekme</NuxtLink><NuxtLink to="/runners">Tekači</NuxtLink
        ><NuxtLink to="/runners/routes">Ture</NuxtLink><NuxtLink to="/journal">Journal</NuxtLink>
      </div>
      <div>
        <p>Slovenija · {{ new Date().getFullYear() }}</p>
        <p class="footer-note">
          Avtor:
          <a :href="siteContent.site.authorUrl" target="_blank" rel="noopener noreferrer">{{
            siteContent.site.authorName
          }}</a>
        </p>
      </div>
    </div>
  </footer>
</template>
