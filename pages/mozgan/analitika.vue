<script setup lang="ts">
const { copy, plot, races, coverage } = await useBrainData()
const { signedIn } = await useBrainSession()
import { publicPreviewEnabled } from '~/utils/siteAccess'
useSiteSeo(copy.analytics.title, copy.analytics.description, { noindex: true })
</script>
<template>
  <div class="analytics-screen">
    <div class="analytics-grid">
      <BrainScatter
        :points="plot"
        :title="copy.charts.scatterTitle"
        :note="copy.charts.scatterNote"
      /><BrainDistanceHistogram
        :points="plot"
        :title="copy.charts.bucketsTitle"
        :note="copy.charts.bucketsNote"
      /><BrainSeasonCalendar :races="races" /><BrainBars
        v-if="signedIn || publicPreviewEnabled"
        :rows="coverage"
        :title="copy.analytics.coverageTitle"
        :note="copy.analytics.coverageNote"
      />
    </div>
    <BrainCategoryPies :points="plot" />
    <BrainTrailInsights :points="plot" />
  </div>
</template>
