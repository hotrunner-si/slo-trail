<script setup lang="ts">
const route = useRoute()
const { data } = await useAsyncData(`shared-chat-${route.params.id}`, () =>
  $fetch(`/api/brain/shared/${route.params.id}`),
)
if (!data.value)
  throw createError({ statusCode: 404, statusMessage: 'Pogovor ni deljen ali je bil umaknjen.' })
useSiteSeo(
  'Deljen pogovor · Možgan',
  'Uporabniško deljen pogovor, ki lahko vsebuje nepreverjene odgovore AI.',
  { noindex: true },
)
</script>
<template>
  <section class="shared-conversation">
    <NuxtLink to="/mozgan">← Chat</NuxtLink>
    <p class="shared-label">Deljen pogovor · nepreverjeno gradivo</p>
    <h2>{{ data?.title }}</h2>
    <p>
      Vsebino je uporabnik izrecno delil. Lahko vsebuje odgovore AI; ti niso potrjena dejstva ali
      dokaz osebne izkušnje.
    </p>
    <pre>{{ data?.content }}</pre>
  </section>
</template>
<style scoped>
.shared-conversation {
  max-width: 800px;
  margin: 30px auto;
  padding: 28px;
  background: #fff;
  border: 1px solid #dce3d5;
  border-radius: 14px;
}
.shared-label {
  margin: 25px 0 12px;
  font-size: 11px;
}
.shared-conversation h2 {
  font-size: 24px;
  margin-bottom: 20px;
}
.shared-conversation p {
  line-height: 1.8;
}
.shared-conversation pre {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font: 14px/1.9 var(--sans);
  margin-top: 30px;
}
</style>
