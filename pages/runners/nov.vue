<script setup lang="ts">
definePageMeta({ middleware: 'brain-account' })
useSiteSeo('Ustvari profil tekača', 'Predlagaj svoj tekaški profil', { noindex: true })
const { session, refresh } = await useBrainSession()
const profile = computed(() => session.value?.account?.profile)
const linked = computed(() => session.value?.account?.link?.runner_slug)
if (linked.value) await navigateTo('/runners/' + linked.value, { replace: true })
const name = ref(profile.value?.display_name || session.value?.user?.displayName || '')
const region = ref(profile.value?.region || ''),
  bio = ref(profile.value?.bio || '')
const busy = ref(false),
  error = ref(''),
  message = ref('')
async function save() {
  busy.value = true
  error.value = ''
  try {
    await $fetch('/api/brain/profile', {
      method: 'POST',
      body: { name: name.value, region: region.value, bio: bio.value },
    })
    await refresh()
    message.value =
      'Predlog profila je oddan v pregled. Po odobritvi ga skrbnik ločeno objavi med tekači.'
  } catch (e) {
    error.value = brainError(e)
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <div class="page shell runner-create-page">
    <NuxtLink to="/mozgan/racun">← Moj račun</NuxtLink>
    <header class="page-header">
      <p class="eyebrow">Tekaška skupnost</p>
      <h1>{{ profile ? 'Tvoj predlog profila' : 'Ustvari profil tekača' }}</h1>
      <p>Predlagaj svoj javni tekaški profil. Pred objavo ga pregleda skrbnik.</p>
    </header>
    <p v-if="error" role="alert">{{ error }}</p>
    <p v-if="message" role="status">{{ message }}</p>
    <p v-if="profile">
      Stanje:
      {{
        profile.status === 'pending'
          ? 'Čaka na pregled'
          : profile.status === 'approved'
            ? 'Odobren, čaka na objavo'
            : 'Zavrnjen — predlog lahko dopolniš'
      }}
    </p>
    <form @submit.prevent="save">
      <label>Ime in priimek<input v-model="name" required minlength="2" maxlength="100" /></label
      ><label>Kraj oziroma regija<input v-model="region" maxlength="100" /></label
      ><label>Predstavitev<textarea v-model="bio" rows="6" maxlength="1500" /></label>
      <p>Zasebna slika in GPX iz računa se ne objavijo samodejno.</p>
      <button class="button" :disabled="busy">
        {{ busy ? 'Pošiljam …' : 'Pošlji v pregled' }}
      </button>
    </form>
  </div>
</template>
<style scoped>
.runner-create-page {
  max-width: 760px;
  padding-top: 40px;
  padding-bottom: 60px;
}
form {
  display: grid;
  gap: 18px;
  padding: 28px;
  background: #f4f5ee;
  border: 1px solid #d9e0d0;
}
label {
  display: grid;
  gap: 8px;
  font-size: 13px;
}
input,
textarea {
  width: 100%;
  padding: 12px;
  font: inherit;
  background: white;
  border: 1px solid #cbd5c0;
}
[role='alert'] {
  color: #943e30;
}
</style>
