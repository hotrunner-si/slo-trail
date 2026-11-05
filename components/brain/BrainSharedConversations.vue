<script setup lang="ts">
const { session } = await useBrainSession()
const request = useRequestFetch()
const key = computed(() => 'my-shared-conversations-' + (session.value?.user?.id || 'guest'))
const { data, refresh } = await useAsyncData(key, () => request('/api/brain/shared'))
const error = ref(''),
  busy = ref<string | null>(null)
async function withdraw(id: string) {
  busy.value = id
  error.value = ''
  try {
    await $fetch('/api/brain/shared', { method: 'DELETE', body: { id } })
    await refresh()
  } catch (e) {
    error.value = brainError(e)
  } finally {
    busy.value = null
  }
}
</script>
<template>
  <section class="brain-panel my-shared-chats">
    <h3>Moji deljeni pogovori</h3>
    <p>
      Samo posnetki, ki si jih izrecno delil. Z umikom prenehajo biti dostopni na povezavi in v
      skupni bazi znanja.
    </p>
    <p v-if="!data?.length">Nobenega pogovora še nisi delil.</p>
    <ul v-else>
      <li v-for="item in data" :key="item.id">
        <NuxtLink :to="`/mozgan/pogovor/${item.id}`">{{ item.title }}</NuxtLink
        ><button :disabled="!!busy" @click="withdraw(item.id)">
          {{ busy === item.id ? 'Umikam …' : 'Umakni iz baze' }}
        </button>
      </li>
    </ul>
    <p v-if="error" role="alert">{{ error }}</p>
  </section>
</template>
<style scoped>
.my-shared-chats {
  margin-top: 20px;
}
.my-shared-chats p {
  font-size: 12px;
  line-height: 1.7;
}
.my-shared-chats ul {
  padding: 0;
  list-style: none;
}
.my-shared-chats li {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  border-top: 1px solid #dce3d5;
  padding: 15px 0;
}
.my-shared-chats a {
  font-size: 12px;
}
.my-shared-chats button {
  font-size: 11px;
  white-space: nowrap;
  border: 1px solid #dce3d5;
  border-radius: 7px;
  background: transparent;
  padding: 7px 10px;
  cursor: pointer;
}
@media (max-width: 620px) {
  .my-shared-chats li {
    flex-direction: column;
    gap: 10px;
  }
  .my-shared-chats button {
    align-self: start;
  }
}
</style>
