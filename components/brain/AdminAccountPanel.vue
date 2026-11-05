<script setup lang="ts">
const request = useRequestFetch()
const { data, error } = await useAsyncData('brain-admin-summary', () =>
  request('/api/brain/admin-summary'),
)
</script>
<template>
  <section class="account-admin-panel" aria-labelledby="admin-panel-title">
    <span class="account-eyebrow">SKRBNIŠKO OKOLJE</span>
    <h3 id="admin-panel-title">Upravljanje Trail Slovenija</h3>
    <p>Preglej nove profile, potrdi povezave in urejaj vire znanja.</p>
    <p v-if="error" role="status">
      Števila čakajočih zahtev trenutno ni mogoče prikazati. Preglede lahko odpreš spodaj.
    </p>
    <div class="account-admin-cards">
      <NuxtLink to="/mozgan/skrbnik?tab=reviews"
        ><strong
          >Profili in povezave <span aria-hidden="true"><IconArrowUpRight /></span></strong
        ><span
          >{{ data?.profiles ?? '—' }} novih profilov · {{ data?.links ?? '—' }} zahtev za
          povezavo</span
        ><small>{{ data?.publish ?? '—' }} odobrenih profilov čaka na objavo</small></NuxtLink
      >
      <NuxtLink to="/mozgan/skrbnik?tab=editorial"
        ><strong
          >Uredniške nastavitve <span aria-hidden="true"><IconArrowUpRight /></span></strong
        ><span>Dodajanje virov in moderacija znanja</span
        ><small>{{ data?.sources ?? '—' }} sledljivih virov v zbirki</small></NuxtLink
      >
      <NuxtLink to="/mozgan/skrbnik?tab=routes"
        ><strong
          >Pregled tras <span aria-hidden="true"><IconArrowUpRight /></span></strong
        ><span>{{ data?.routes ?? '—' }} tras čaka na pregled</span
        ><small>Zasebni GPX in predogled geometrije</small></NuxtLink
      >
    </div>
  </section>
</template>
