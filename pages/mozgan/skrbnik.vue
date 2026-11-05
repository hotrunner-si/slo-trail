<script setup lang="ts">
definePageMeta({ middleware: 'brain-account' })
useSiteSeo('Odobritve · Možgan', 'Zaščiten pregled', { noindex: true })
const { admin, session } = await useBrainSession()
const route = useRoute()
const tab = computed(() =>
  ['editorial', 'routes'].includes(String(route.query.tab)) ? String(route.query.tab) : 'reviews',
)
const showAllProfiles = ref(false)
if (!admin.value)
  throw createError({ statusCode: 403, statusMessage: 'Potrebuješ skrbniški dostop.' })
const request = useRequestFetch()
const { data, refresh } = await useAsyncData('brain-admin', () => request('/api/brain/admin'))
const reviewProfiles = computed(
  () =>
    data.value?.profiles?.filter(
      (p) =>
        showAllProfiles.value ||
        p.status === 'pending' ||
        (p.status === 'approved' && !p.public_runner_slug),
    ) || [],
)
const busy = ref(false),
  error = ref(''),
  message = ref('')
const source = reactive({
  entity: '',
  title: '',
  excerpt: '',
  url: '',
  origin: 'unverified',
  verified: '',
  from: '',
  until: '',
})
async function indexSources() {
  busy.value = true
  error.value = ''
  try {
    const r = await $fetch('/api/brain/index-sources', { method: 'POST' })
    message.value = `Obdelanih virov: ${r.processed}. Preostalih: ${r.remaining}.`
  } catch (e) {
    error.value = brainError(e)
  } finally {
    busy.value = false
  }
}
async function addSource() {
  busy.value = true
  error.value = ''
  try {
    await $fetch('/api/brain/source', {
      method: 'POST',
      body: {
        ...source,
        verified: source.verified || null,
        from: source.from || null,
        until: source.until || null,
      },
    })
    message.value = 'Vir je dodan. Nov zapis še nima pomenskega vektorja.'
    source.title = ''
    source.excerpt = ''
    source.url = ''
  } catch (e) {
    error.value = brainError(e)
  } finally {
    busy.value = false
  }
}
async function act(kind: string, id: string, action: string) {
  busy.value = true
  error.value = ''
  try {
    await $fetch('/api/brain/admin', { method: 'POST', body: { kind, id, action } })
    await refresh()
    message.value = 'Sprememba je shranjena.'
  } catch (e) {
    error.value = brainError(e)
  } finally {
    busy.value = false
  }
}
function routeFile(id: string) {
  return data.value?.files?.find((f: any) => f.id === id)
}
async function moderateClaim(id: string, hidden: boolean) {
  busy.value = true
  error.value = ''
  try {
    await $fetch('/api/brain/moderate-claim', { method: 'POST', body: { id, hidden } })
    await refresh()
  } catch (e) {
    error.value = brainError(e)
  } finally {
    busy.value = false
  }
}
function points(id: string) {
  const p = routeFile(id)?.details?.preview || []
  if (!p.length) return ''
  const xs = p.map((x) => x[1]),
    ys = p.map((x) => x[0])
  const minX = Math.min(...xs),
    minY = Math.min(...ys),
    dx = Math.max(...xs) - minX || 1,
    dy = Math.max(...ys) - minY || 1
  return p
    .map((x) => `${10 + ((x[1] - minX) / dx) * 280},${150 - ((x[0] - minY) / dy) * 140}`)
    .join(' ')
}
</script>
<template>
  <div class="brain-account-screen">
    <header>
      <h2>
        {{
          tab === 'editorial'
            ? 'Uredniške nastavitve'
            : tab === 'routes'
              ? 'Pregled tras'
              : 'Profili in povezave'
        }}
      </h2>
      <p>
        Odobritev profila je ločena od javne objave. Po odobritvi GPX uporabnik sam izrecno potrdi
        javno objavo.
      </p>
    </header>
    <nav class="admin-review-tabs" aria-label="Skrbniški pregledi">
      <NuxtLink to="/profil">← Moj račun</NuxtLink>
      <NuxtLink
        to="/mozgan/skrbnik?tab=reviews"
        :aria-current="tab === 'reviews' ? 'page' : undefined"
        >Profili in povezave</NuxtLink
      >
      <NuxtLink
        to="/mozgan/skrbnik?tab=editorial"
        :aria-current="tab === 'editorial' ? 'page' : undefined"
        >Uredništvo</NuxtLink
      >
      <NuxtLink
        to="/mozgan/skrbnik?tab=routes"
        :aria-current="tab === 'routes' ? 'page' : undefined"
        >Trase</NuxtLink
      >
    </nav>
    <p v-if="error" class="brain-error" role="alert">{{ error }}</p>
    <p v-if="message" role="status">{{ message }}</p>
    <section v-if="tab === 'reviews'" class="brain-panel">
      <h3>Novi profili tekačev</h3>
      <label
        ><input v-model="showAllProfiles" type="checkbox" /> Pokaži tudi že obravnavane
        profile</label
      >
      <p v-if="!reviewProfiles.length">Ni novih profilov za pregled.</p>
      <article v-for="p in reviewProfiles" :key="p.user_id" class="brain-summary">
        <h4>{{ p.display_name }} · {{ p.status }}</h4>
        <p>{{ p.region }} · {{ p.bio }}</p>
        <div class="brain-account-actions">
          <button
            v-if="p.status === 'pending'"
            :disabled="busy"
            @click="act('profile', p.user_id, 'approve')"
          >
            Odobri profil</button
          ><button
            v-if="p.status === 'approved' && !p.public_runner_slug"
            :disabled="busy"
            @click="act('profile', p.user_id, 'publish')"
          >
            Objavi na /runners</button
          ><button
            v-if="p.status === 'pending'"
            :disabled="busy"
            @click="act('profile', p.user_id, 'reject')"
          >
            Zavrni</button
          ><span v-if="p.public_runner_slug">Javno objavljen</span>
        </div>
      </article>
    </section>
    <section v-if="tab === 'reviews'" class="brain-panel">
      <h3>Zahtevki za povezavo z obstoječim profilom</h3>
      <p v-if="!data?.links?.length">Ni zahtev.</p>
      <article v-for="l in data?.links" :key="l.id" class="brain-summary">
        <h4>{{ l.runner_slug }}</h4>
        <p>{{ l.note }}</p>
        <small>Račun: {{ l.user_id }}</small>
        <div class="brain-account-actions">
          <button :disabled="busy" @click="act('link', l.id, 'approve')">
            Potrdi preverjeno povezavo</button
          ><button :disabled="busy" @click="act('link', l.id, 'reject')">Zavrni</button>
        </div>
      </article>
    </section>
    <section v-if="tab === 'routes'" class="brain-panel">
      <h3>Trase</h3>
      <p v-if="!data?.routes?.length">Ni tras za pregled.</p>
      <article v-for="r in data?.routes" :key="r.id" class="brain-summary">
        <h4>{{ r.title }}</h4>
        <svg
          viewBox="0 0 300 160"
          role="img"
          :aria-label="`Predogled trase ${r.title}`"
          class="brain-route-preview"
        >
          <polyline :points="points(r.file_id)" fill="none" stroke="#315736" stroke-width="2" />
        </svg>
        <p>
          {{ routeFile(r.file_id)?.details?.pointCount }} točk · geometrijski predogled; ni dokaz
          prehodnosti ali pravilnosti trase.
        </p>
        <a :href="`/api/brain/files/${r.file_id}`">Prenesi zasebni GPX za pregled ↓</a>
        <div class="brain-account-actions">
          <button :disabled="busy" @click="act('route', r.id, 'approve')">
            Odobri pregled trase</button
          ><button :disabled="busy" @click="act('route', r.id, 'reject')">Zavrni</button>
        </div>
      </article>
    </section>
    <section v-if="tab === 'editorial'" class="brain-panel">
      <h3>Dodaj sledljiv vir</h3>
      <p>
        Vnesi dejansko preverjen izsek. Sama povezava ne dokazuje uradnosti ali aktualnosti. Viri so
        vidni prijavljenim in jih pomočnik lahko navede tudi obiskovalcem; ne dodajaj zasebnih
        podatkov.
      </p>
      <form class="brain-form" @submit.prevent="addSource">
        <label
          >Predmet<select v-model="source.entity" required>
            <option value="">Izberi</option>
            <option v-for="e in data?.entities" :key="e.id" :value="e.id">{{ e.title }}</option>
          </select></label
        ><label>Naslov<input v-model="source.title" required minlength="3" maxlength="200" /></label
        ><label>Povezava<input v-model="source.url" type="url" required /></label
        ><label
          >Izsek / podatki<textarea
            v-model="source.excerpt"
            required
            minlength="10"
            maxlength="8000"
            rows="4"
          />
        </label>
        <div class="brain-inline-fields">
          <label
            >Izvor<select v-model="source.origin">
              <option value="unverified">Še nepreverjen</option>
              <option value="editorial">Uredniški</option>
              <option value="official">Uradni vir</option>
            </select></label
          ><label>Datum dejanskega preverjanja<input v-model="source.verified" type="date" /></label
          ><label>Velja od<input v-model="source.from" type="date" /></label
          ><label>Velja do<input v-model="source.until" type="date" /></label>
        </div>
        <button :disabled="busy">Dodaj vir</button>
      </form>
      <button :disabled="busy || !session?.semanticAvailable" @click="indexSources">
        Izdelaj vektorje naslednjih 15 virov
      </button>
      <p v-if="!session?.semanticAvailable">Pomensko indeksiranje trenutno ni nastavljeno.</p>
      <p>
        To uporabi nastavljeni AI ključ in lahko povzroči strošek ponudnika. Ponovi do nič
        preostalih virov.
      </p>
    </section>
    <section v-if="tab === 'editorial'" class="brain-panel">
      <h3>Moderacija skupnostnih ugotovitev</h3>
      <p v-if="!data?.claims?.length">Ni ugotovitev.</p>
      <article v-for="claim in data?.claims" :key="claim.id" class="brain-summary">
        <p>{{ claim.statement }}</p>
        <p>
          {{ claim.year }} ·
          {{
            claim.conditions === 'wet'
              ? 'mokro'
              : claim.conditions === 'dry'
                ? 'suho'
                : 'razmere niso znane'
          }}
          · {{ claim.status === 'active' ? 'v preverjanju' : 'skrito' }}
        </p>
        <button :disabled="busy" @click="moderateClaim(claim.id, claim.status === 'active')">
          {{ claim.status === 'active' ? 'Skrij ugotovitev' : 'Ponovno omogoči preverjanje' }}
        </button>
      </article>
    </section>
  </div>
</template>
