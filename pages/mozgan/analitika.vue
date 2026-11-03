<script setup lang="ts">
const { copy, plot, buckets, calendar, coverage } = await useBrainData()
const { signedIn } = await useBrainSession()
const request = useRequestFetch()
const { data: knowledge } = await useAsyncData('brain-analytics', () =>
  signedIn.value ? request('/api/brain/analytics') : Promise.resolve(null),
)
useSiteSeo(copy.analytics.title, copy.analytics.description, { noindex: true })
</script>
<template>
  <div class="analytics-screen">
    <div class="screen-intro">
      <div>
        <p>{{ copy.analytics.note }}</p>
      </div>
      <span class="muted-chip">{{ signedIn ? 'Razširjeni prikazi' : 'Javni izbor' }}</span>
    </div>
    <div class="analytics-grid">
      <BrainScatter
        :points="plot"
        :title="copy.charts.scatterTitle"
        :note="copy.charts.scatterNote"
      /><BrainBars
        :rows="buckets"
        :title="copy.charts.bucketsTitle"
        :note="copy.charts.bucketsNote"
      /><BrainBars
        v-if="signedIn"
        :rows="calendar"
        :title="copy.analytics.calendarTitle"
        :note="copy.analytics.calendarNote"
      /><BrainBars
        v-if="signedIn"
        :rows="coverage"
        :title="copy.analytics.coverageTitle"
        :note="copy.analytics.coverageNote"
      />
    </div>
    <BrainTrailInsights :points="plot" />
    <p v-if="knowledge" class="brain-notice">
      {{ knowledge.sources }} virov · {{ knowledge.verifiedSources }} z datumom preverjanja ·
      {{ knowledge.claims }} skupnostnih ugotovitev. {{ knowledge.note }}
    </p>
    <p v-else class="brain-notice">
      <NuxtLink to="/mozgan/racun">Prijavi se</NuxtLink> za dodatne prikaze koledarja, pokritosti in
      rasti znanja.
    </p>
  </div>
</template>
