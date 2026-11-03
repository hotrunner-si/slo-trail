<script setup lang="ts">
const { copy, plot, buckets, races } = await useBrainData()
useSiteSeo(copy.overview.title, copy.overview.description, { noindex: true })
const sampleRaces = [...races].sort((a, b) => a.name.localeCompare(b.name, 'sl')).slice(0, 6)
</script>
<template>
  <div class="overview-screen">
    <div class="overview-top"><BrainChat /><BrainQuestion /></div>
    <section class="overview-visuals" aria-labelledby="visuals-title">
      <header class="visuals-heading">
        <h2 id="visuals-title">Podatki v zbirki</h2>
        <NuxtLink to="/mozgan/analitika">Vsi prikazi ↗</NuxtLink>
      </header>
      <div class="overview-charts">
        <BrainScatter
          :points="plot"
          :title="copy.charts.scatterTitle"
          :note="copy.charts.scatterNote"
        />
        <BrainBars
          :rows="buckets"
          :title="copy.charts.bucketsTitle"
          :note="copy.charts.bucketsNote"
        />
        <section class="brain-panel race-table-panel">
          <header class="panel-head">
            <h2>Tekme v katalogu</h2>
            <span>{{ races.length }}</span>
          </header>
          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Tekma</th>
                  <th>Razdalje</th>
                  <th>Vir</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="race in sampleRaces" :key="race.slug">
                  <td>
                    <NuxtLink :to="`/races/${race.slug}`">{{ race.name }}</NuxtLink>
                  </td>
                  <td>{{ race.distances.length }}</td>
                  <td>
                    <a
                      v-if="race.sourceUrl"
                      :href="race.sourceUrl"
                      target="_blank"
                      rel="noopener noreferrer"
                      :aria-label="`Vir za ${race.name}`"
                      >↗</a
                    ><span v-else>—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="chart-note">
            Uredniški podatki niso ponovno preverjeni uradni podatki. Sledljivost ne dokazuje
            točnosti.
          </p>
        </section>
      </div>
    </section>
  </div>
</template>
