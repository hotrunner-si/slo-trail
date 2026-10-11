<script setup lang="ts">
import { getRunner } from '~/data/runners'
const pageRoute = useRoute()
const runner = computed(() => getRunner(pageRoute.params.slug as string))
if (!runner.value) throw createError({ statusCode: 404, statusMessage: 'Tekač ni najden' })
useSiteSeo(
  () => runner.value?.name,
  () => (runner.value ? `${runner.value.name}: profil gorskega tekača in GPX ture.` : undefined),
  {
    type: 'profile',
    image: () => runner.value?.image,
    imageAlt: () => (runner.value ? `${runner.value.name}, trail tekač` : undefined),
  },
)
useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: () =>
        JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: runner.value?.name,
          url: `https://trail-slovenija.netlify.app/runners/${runner.value?.slug}`,
          image: runner.value?.image
            ? `https://trail-slovenija.netlify.app${runner.value.image}`
            : undefined,
          sameAs: runner.value?.utmbUrl
            ? [
                runner.value.utmbUrl,
                ...(runner.value.slug === 'nejc-ursic'
                  ? ['https://www.strava.com/athletes/65016800']
                  : []),
              ]
            : undefined,
        }),
    },
  ],
})
</script>
<template>
  <div v-if="runner" class="detail-page">
    <header class="runner-hero shell">
      <div class="runner-portrait">
        <img :src="runner.image" :alt="`Fotografija profila ${runner.name}`" />
      </div>
      <div>
        <p class="eyebrow">
          {{ runner.location }}<template v-if="runner.club"> · {{ runner.club }}</template>
        </p>
        <h1>{{ runner.name }}</h1>
        <p class="runner-intro">{{ runner.bio }}</p>
        <p class="runner-description">{{ runner.longDescription }}</p>
        <dl v-if="runner.utmbIndex !== undefined" class="runner-facts">
          <div>
            <dt>UTMB General Index</dt>
            <dd>{{ runner.utmbIndex }}</dd>
          </div>
        </dl>
        <div class="runner-social-links">
          <a
            class="button secondary"
            :href="runner.utmbUrl"
            target="_blank"
            rel="noopener noreferrer"
            >UTMB <span aria-hidden="true"><IconArrowUpRight /></span></a
          ><a
            v-if="runner.slug === 'nejc-ursic'"
            class="button secondary"
            href="https://www.strava.com/athletes/65016800"
            target="_blank"
            rel="noopener noreferrer"
            >Strava <span aria-hidden="true"><IconArrowUpRight /></span></a
          ><a
            v-if="runner.slug === 'nejc-ursic'"
            class="button secondary"
            href="https://nejc-ursic.netlify.app"
            target="_blank"
            rel="noopener noreferrer"
            >Spletna stran <span aria-hidden="true"><IconArrowUpRight /></span
          ></a>
        </div>
      </div>
    </header>
    <RunnerGpxRoutes :runner-slug="runner.slug" />
  </div>
</template>
