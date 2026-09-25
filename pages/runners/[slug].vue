<script setup lang="ts">
import { getRunner } from '~/data/runners'
const pageRoute=useRoute(); const runner=computed(()=>getRunner(pageRoute.params.slug as string)); if(!runner.value) throw createError({statusCode:404,statusMessage:'Tekač ni najden'})
useSiteSeo(() => runner.value?.name, () => runner.value ? `${runner.value.name}: trail tekač in član KGT Papež. Oglej si profil, UTMB Index in njegove GPX ture.` : undefined, { type: 'profile', image: () => runner.value?.image, imageAlt: () => runner.value ? `${runner.value.name}, trail tekač` : undefined })
useHead({ script: [{ type: 'application/ld+json', innerHTML: () => JSON.stringify({
  '@context': 'https://schema.org', '@type': 'Person', name: runner.value?.name,
  url: `https://trail-slovenija.netlify.app/runners/${runner.value?.slug}`,
  image: runner.value?.image ? `https://trail-slovenija.netlify.app${runner.value.image}` : undefined,
  sameAs: runner.value?.slug === 'nejc-ursic' ? [
    'https://utmb.world/runner/2586047.nejc.ursic',
    'https://www.strava.com/athletes/65016800'
  ] : undefined
}) }] })
</script>
<template><div v-if="runner" class="detail-page"><header class="runner-hero shell"><div class="runner-portrait"><img :src="runner.image" :alt="`Fotografija profila ${runner.name}`"></div><div><p class="eyebrow">{{ runner.location }} · KGT Papež</p><h1>{{ runner.name }}</h1><p class="runner-intro">{{ runner.bio }}</p><dl class="runner-facts"><div><dt>UTMB Index</dt><dd>{{ runner.utmbIndex }}</dd></div><div><dt>20K / 50K / 100K</dt><dd>{{ runner.utmb20k }} / {{ runner.utmb50k }} / {{ runner.utmb100k }}</dd></div><div><dt>Najboljši UTMB rezultat</dt><dd>{{ runner.bestUtmbScore }}</dd></div><div><dt>Zaključene tekme</dt><dd>{{ runner.finishedRaces }}</dd></div></dl><div class="runner-social-links"><a class="button secondary" href="https://utmb.world/runner/2586047.nejc.ursic" target="_blank" rel="noopener noreferrer">Odpri UTMB profil ↗</a><a class="button secondary" href="https://www.strava.com/athletes/65016800" target="_blank" rel="noopener noreferrer">Odpri STRAVA profil ↗</a></div></div></header><RunnerGpxRoutes :runner-slug="runner.slug" /></div></template>
