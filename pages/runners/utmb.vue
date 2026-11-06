<script setup lang="ts">
useSiteSeo(
  'UTMB lestvica',
  'Svetovni top 25 in slovenski top 100 tekačev in tekačic. Razvrsti po generalnem UTMB indeksu ter indeksih 20K, 50K, 100K in 100M.',
)
</script>

<template>
  <div class="page shell utmb-page">
    <RunnerNavigation />
    <header class="page-header">
      <p class="eyebrow">Tekači · UTMB Index</p>
      <h1>UTMB lestvica</h1>
      <p>Svetovni vrh in najboljši slovenski tekači.</p>
    </header>
    <p class="utmb-intro">
      Vir:
      <a href="https://utmb.world/utmb-index" target="_blank" rel="noopener noreferrer"
        >UTMB Index</a
      >
    </p>
    <UtmbRankingTable />
  </div>
</template>

<style scoped>
.utmb-intro {
  font-size: 0.82rem;
  color: var(--muted);
  line-height: 1.7;
}
.utmb-intro a {
  text-decoration: underline;
}
</style>
