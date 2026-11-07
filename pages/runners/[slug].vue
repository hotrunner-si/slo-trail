<script setup lang="ts">
import type { Runner } from '~/types'
const { getRunner } = await useSiteContent()
const asset = useContentAsset()
const pageRoute = useRoute()
const editedRunner = ref<Runner | null>(null)
watch(
  () => pageRoute.params.slug,
  () => {
    editedRunner.value = null
  },
)
const runner = computed(() => editedRunner.value || getRunner(pageRoute.params.slug as string))
function runnerSaved(updated: Runner) {
  editedRunner.value = updated
  const shared = getRunner(updated.slug)
  if (shared) Object.assign(shared, updated)
}
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
            ? new URL(asset(runner.value.image), 'https://trail-slovenija.netlify.app').toString()
            : undefined,
          sameAs: [runner.value?.utmbUrl, runner.value?.stravaUrl, runner.value?.websiteUrl].filter(
            Boolean,
          ),
        }).replace(/</g, '\\u003c'),
    },
  ],
})
</script>
<template>
  <div v-if="runner" class="detail-page">
    <header class="runner-hero shell">
      <div class="runner-portrait">
        <RunnerPortrait :image="runner.image" :name="runner.name" />
      </div>
      <div>
        <p class="eyebrow">
          {{ runner.location }}<template v-if="runner.club">{{ runner.location ? ' · ' : '' }}{{ runner.club }}</template>
        </p>
        <h1>{{ runner.name }}</h1>
        <p v-if="runner.bio" class="runner-intro">{{ runner.bio }}</p>
        <p v-if="runner.longDescription" class="runner-description">{{ runner.longDescription }}</p>
        <p v-if="runner.favouriteDistance" class="runner-favourite-distance">
          Najljubša razdalja: {{ runner.favouriteDistance }}
        </p>
        <blockquote v-if="runner.quote">{{ runner.quote }}</blockquote>
        <dl v-if="runner.utmbIndex !== undefined" class="runner-facts">
          <div>
            <dt>UTMB Index</dt>
            <dd>{{ runner.utmbIndex }}</dd>
          </div>
        </dl>
        <div class="runner-social-links">
          <a
            v-if="runner.utmbUrl"
            class="button secondary"
            :href="runner.utmbUrl"
            target="_blank"
            rel="noopener noreferrer"
            >UTMB <span aria-hidden="true"><IconArrowUpRight /></span></a
          ><a
            v-if="runner.stravaUrl"
            class="button secondary"
            :href="runner.stravaUrl"
            target="_blank"
            rel="noopener noreferrer"
            >Strava <span aria-hidden="true"><IconArrowUpRight /></span></a
          ><a
            v-if="runner.websiteUrl"
            class="button secondary"
            :href="runner.websiteUrl"
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
