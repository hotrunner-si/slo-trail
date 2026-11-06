<script setup lang="ts">
const { runners, siteContent } = await useSiteContent()

const shuffledRunners = ref([...runners])

onMounted(() => {
  const items = [...runners]
  for (let i = items.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1))
    ;[items[i], items[randomIndex]] = [items[randomIndex]!, items[i]!]
  }
  shuffledRunners.value = items
})

useSiteSeo(siteContent.runners.title, siteContent.runners.description)
</script>
<template>
  <div class="page shell runners-page">
    <RunnerNavigation />
    <header class="page-header">
      <p class="eyebrow">Skupnost</p>
      <h1>{{ siteContent.runners.title }}</h1>
      <p></p>
    </header>
    <div class="runner-grid runner-directory">
      <RunnerCard
        v-for="(runner, index) in shuffledRunners"
        :key="runner.id"
        :runner="runner"
        :index="index"
      />
    </div>
  </div>
</template>
