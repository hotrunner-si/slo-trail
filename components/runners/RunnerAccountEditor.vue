<script setup lang="ts">
import type { Runner } from '~/types'
import type { RunnerGpxRoute } from '~/types/gpx'
interface RunnerRecord {
  slug: string
  data: Runner
  updated_at: string
}
interface RunnerEditorRecord extends RunnerRecord {
  tours: { id: string; data: RunnerGpxRoute }[]
  linkedEmail: string
}
const props = withDefaults(defineProps<{ ownerMode?: boolean }>(), { ownerMode: false })
const { admin, session } = await useBrainSession()
if (!props.ownerMode && !admin.value)
  throw createError({ statusCode: 403, statusMessage: 'Potrebuješ skrbniški dostop.' })
if (props.ownerMode && !session.value?.account?.link?.runner_slug)
  throw createError({
    statusCode: 403,
    statusMessage: 'Za urejanje potrebuješ povezavo s tekačem.',
  })
const route = useRoute(),
  router = useRouter(),
  request = useRequestFetch()
const {
  data: catalog,
  refresh: refreshList,
  error: listError,
} = await useAsyncData(props.ownerMode ? 'owner-runner-list' : 'admin-runners', () =>
  props.ownerMode
    ? Promise.resolve({ runners: [] as RunnerRecord[] })
    : request<{ runners: RunnerRecord[] }>('/api/brain/admin-runners'),
)
const search = ref('')
const rows = computed(() =>
  (catalog.value?.runners || []).filter((r) =>
    String(r.data.name || '')
      .toLocaleLowerCase('sl')
      .includes(search.value.toLocaleLowerCase('sl')),
  ),
)
const selected = computed(() =>
  props.ownerMode
    ? session.value?.account?.link?.runner_slug || ''
    : typeof route.query.tekač === 'string'
      ? route.query.tekač
      : '',
)
const runnerApi = (slug: string) =>
  props.ownerMode ? '/api/brain/my-runner' : '/api/brain/admin-runners/' + encodeURIComponent(slug)
const creating = computed(() => !props.ownerMode && route.query.nov === '1')
const formOpen = computed(() => creating.value || !!selected.value)
const slug = ref(''),
  updatedAt = ref(''),
  imageUrl = ref(''),
  linkedEmail = ref(''),
  linkEmail = ref('')
const busy = ref(false),
  loading = ref(false),
  error = ref(''),
  message = ref('')
const draft = reactive({
  name: '',
  location: '',
  club: '',
  favouriteDistance: '',
  bio: '',
  longDescription: '',
  quote: '',
  stravaUrl: '',
  utmbUrl: '',
  websiteUrl: '',
})
const tours = ref<RunnerGpxRoute[]>([])
const tourIndex = ref(0)
const deleteTourDialog = ref<HTMLDialogElement | null>(null)
const deleteTourTarget = ref<{ id: string; title: string } | null>(null)
function askDeleteTour(tour: RunnerGpxRoute) {
  deleteTourTarget.value = { id: tour.id, title: tour.title }
  deleteTourDialog.value?.showModal()
}
function cancelDeleteTour() {
  if (busy.value) return
  deleteTourDialog.value?.close()
  deleteTourTarget.value = null
}
async function deleteTour() {
  if (!deleteTourTarget.value || busy.value) return
  const id = deleteTourTarget.value.id
  busy.value = true
  error.value = message.value = ''
  try {
    await $fetch(runnerApi(selected.value) + '/tour-delete', {
      method: 'POST',
      body: { id, confirm: true },
    })
    tours.value = tours.value.filter((tour) => tour.id !== id)
    tourIndex.value = Math.max(0, Math.min(tourIndex.value, tours.value.length - 1))
    deleteTourDialog.value?.close()
    deleteTourTarget.value = null
    message.value = 'Tura je izbrisana.'
    await refreshSiteContent()
  } catch (e) {
    error.value = brainError(e)
  } finally {
    busy.value = false
  }
}
const activeTour = computed(() => tours.value[tourIndex.value])
function changeTour(direction: number) {
  tourIndex.value = Math.max(0, Math.min(tours.value.length - 1, tourIndex.value + direction))
}
const image = shallowRef<File | null>(null),
  gpxFiles = shallowRef<File[]>([])
const uploadKey = ref(0)
function reset() {
  for (const key of Object.keys(draft) as (keyof typeof draft)[]) draft[key] = ''
  slug.value = updatedAt.value = imageUrl.value = linkedEmail.value = linkEmail.value = ''
  image.value = null
  gpxFiles.value = []
  tours.value = []
  tourIndex.value = 0
  uploadKey.value++
}
async function load() {
  reset()
  if (!selected.value) return
  loading.value = true
  try {
    const result = await request<RunnerEditorRecord>(runnerApi(selected.value))
    slug.value = result.slug
    updatedAt.value = result.updated_at
    imageUrl.value = result.data.image || ''
    linkedEmail.value = result.linkedEmail
    linkEmail.value = result.linkedEmail
    for (const key of Object.keys(draft) as (keyof typeof draft)[])
      draft[key] = result.data[key] || ''
    tours.value = result.tours.map((t) => t.data as RunnerGpxRoute)
  } catch (e) {
    error.value = brainError(e)
  } finally {
    loading.value = false
  }
}
await load()
watch(
  () => [selected.value, creating.value],
  () => {
    if (!busy.value) {
      error.value = message.value = ''
      void load()
    }
  },
)
watch(
  () => draft.name,
  (name) => {
    if (creating.value)
      slug.value = name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 120)
  },
)
function chooseImage(event: Event) {
  image.value = (event.target as HTMLInputElement).files?.[0] || null
}
function chooseGpx(event: Event) {
  gpxFiles.value = Array.from((event.target as HTMLInputElement).files || [])
}
async function uploadFile(target: string, file: File) {
  const form = new FormData()
  form.append('file', file)
  if (/\.gpx$/i.test(file.name))
    form.append('title', file.name.replace(/\.gpx$/i, '').slice(0, 150))
  await $fetch(runnerApi(target) + '/media', { method: 'POST', body: form })
}
async function save() {
  busy.value = true
  error.value = message.value = ''
  let target = selected.value
  let profileSaved = false
  try {
    if (creating.value) {
      const result = await $fetch<RunnerRecord>('/api/brain/admin-runners', {
        method: 'POST',
        body: { slug: slug.value, data: draft },
      })
      target = result!.slug
      // Move to the saved profile before uploading so a failed upload cannot create a duplicate.
      const pendingImage = image.value,
        pendingGpx = gpxFiles.value
      await router.replace({ path: '/skrbnik/tekaci', query: { tekač: target } })
      await load()
      image.value = pendingImage
      gpxFiles.value = pendingGpx
    } else {
      const result = await $fetch<RunnerRecord>(runnerApi(target), {
        method: 'POST',
        body: { data: draft, updatedAt: updatedAt.value },
      })
      updatedAt.value = result.updated_at
    }
    profileSaved = true
    if (image.value) {
      await uploadFile(target, image.value)
      image.value = null
    }
    while (gpxFiles.value.length) {
      await uploadFile(target, gpxFiles.value[0]!)
      gpxFiles.value = gpxFiles.value.slice(1)
    }
    await load()
    await refreshList()
    await refreshSiteContent()
    message.value = 'Profil in izbrane datoteke so shranjeni ter javno objavljeni.'
  } catch (e) {
    error.value = brainError(e)
    if (target && profileSaved) {
      const latest = await $fetch<RunnerEditorRecord>(runnerApi(target)).catch(() => null)
      if (latest) updatedAt.value = latest.updated_at
      await refreshList()
    }
  } finally {
    busy.value = false
  }
}
async function connect() {
  busy.value = true
  error.value = message.value = ''
  try {
    await $fetch('/api/brain/admin-runners/' + selected.value + '/link', {
      method: 'POST',
      body: { email: linkEmail.value.trim() },
    })
    linkedEmail.value = linkEmail.value.trim()
    message.value = 'Račun je povezan s tekačem.'
  } catch (e) {
    error.value = brainError(e)
  } finally {
    busy.value = false
  }
}
async function saveTour(tour: RunnerGpxRoute) {
  busy.value = true
  error.value = message.value = ''
  try {
    await $fetch(runnerApi(selected.value) + '/tour', {
      method: 'POST',
      body: {
        id: tour.id,
        title: tour.title,
        location: tour.location || '',
        description: tour.description || '',
        dateIso: tour.dateIso || '',
        distanceKm: tour.distanceKm,
        elevationGain:
          tour.elevationGain === null ||
          tour.elevationGain === undefined ||
          String(tour.elevationGain) === ''
            ? null
            : tour.elevationGain,
      },
    })
    await refreshSiteContent()
    message.value = 'Podatki ture so shranjeni.'
  } catch (e) {
    error.value = brainError(e)
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <main class="admin-runners" :class="ownerMode ? 'runner-owner-account' : 'page shell'">
    <NuxtLink v-if="!ownerMode" to="/profil">Moj skrbniški profil</NuxtLink>
    <header class="page-header">
      <p v-if="!ownerMode" class="eyebrow">Skrbniško okolje</p>
      <h1>
        {{
          ownerMode
            ? 'Profil tekača'
            : creating
              ? 'Ustvari nov profil tekača'
              : selected
                ? 'Uredi profil tekača'
                : 'Profili tekačev'
        }}
      </h1>
      <p>Podatki, slike in ture, ki jih shraniš tukaj, so javno objavljeni.</p>
    </header>
    <p v-if="error" role="alert">{{ error }}</p>
    <p v-if="message" role="status">{{ message }}</p>
    <p v-if="listError" role="alert">
      Seznama tekačev ni mogoče naložiti. <button @click="refreshList()">Poskusi znova</button>
    </p>
    <nav v-if="!ownerMode" class="actions">
      <NuxtLink v-if="formOpen" to="/skrbnik/tekaci">Vsi tekači</NuxtLink>
      <NuxtLink v-if="!creating" to="/skrbnik/tekaci?nov=1">Ustvari nov profil tekača</NuxtLink>
      <NuxtLink v-if="selected" :to="'/runners/' + selected">Odpri javni profil</NuxtLink>
    </nav>
    <template v-if="!formOpen">
      <label>Poišči tekača<input v-model="search" type="search" placeholder="Ime tekača" /></label>
      <ul class="runner-list">
        <li v-for="row in rows" :key="row.slug">
          <NuxtLink :to="{ path: '/skrbnik/tekaci', query: { tekač: row.slug } }"
            ><strong>{{ row.data.name }}</strong
            ><span>{{ row.data.location }}</span
            ><span>Uredi <IconArrowUpRight /></span
          ></NuxtLink>
        </li>
      </ul>
      <p v-if="!rows.length">Ni profilov za ta izbor.</p>
    </template>
    <p v-else-if="loading" role="status">Nalagam profil …</p>
    <template v-else-if="creating || updatedAt">
      <div class="editor profile-editor">
        <form id="runner-profile-form" class="runner-personal-form" @submit.prevent="save">
          <fieldset :disabled="busy">
            <legend>Podatki tekača</legend>
            <label
              >Ime in priimek<input v-model="draft.name" required minlength="2" maxlength="100"
            /></label>
            <label v-if="creating"
              >Naslov profila<input
                v-model="slug"
                required
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                maxlength="120"
              /><small>/runners/{{ slug }}</small></label
            >
            <label>Kraj oziroma regija<input v-model="draft.location" maxlength="100" /></label>
            <label>Klub<input v-model="draft.club" maxlength="100" /></label>
            <label
              >Najljubša razdalja<input v-model="draft.favouriteDistance" maxlength="100"
            /></label>
            <label
              >Kratka predstavitev<textarea v-model="draft.bio" rows="3" maxlength="1500" />
            </label>
            <label
              >Daljša predstavitev<textarea
                v-model="draft.longDescription"
                rows="6"
                maxlength="5000"
              />
            </label>
            <label
              >Misel ali citat<textarea v-model="draft.quote" rows="2" maxlength="500" />
            </label>
            <label
              >Strava<input
                v-model="draft.stravaUrl"
                type="url"
                maxlength="500"
                placeholder="https://…"
            /></label>
            <label
              >UTMB<input
                v-model="draft.utmbUrl"
                type="url"
                maxlength="500"
                placeholder="https://…"
            /></label>
            <label
              >Spletna stran<input
                v-model="draft.websiteUrl"
                type="url"
                maxlength="500"
                placeholder="https://…"
            /></label>
          </fieldset>
        </form>
        <div class="profile-media-column">
          <section v-if="selected && !ownerMode" class="runner-account-link">
            <h2>Povezava z uporabniškim računom</h2>
            <p v-if="linkedEmail">Povezani račun: {{ linkedEmail }}</p>
            <form v-else @submit.prevent="connect">
              <label
                >E-pošta obstoječega računa<input
                  v-model="linkEmail"
                  type="email"
                  required
                  maxlength="254" /></label
              ><button class="button" :disabled="busy">Poveži račun s tekačem</button>
            </form>
          </section>
          <fieldset :disabled="busy">
            <legend>Slika in GPX</legend>
            <img v-if="imageUrl" :src="imageUrl" alt="Trenutna slika tekača" class="portrait" />
            <div :key="uploadKey">
              <label
                >{{ imageUrl ? 'Zamenjaj sliko' : 'Slika tekača'
                }}<input type="file" accept=".jpg,.jpeg,.png,.webp" @change="chooseImage"
              /></label>
              <label
                >Dodaj GPX datoteke<input type="file" accept=".gpx" multiple @change="chooseGpx"
              /></label>
            </div>
            <small
              >Največ 5 MB na datoteko. Iz GPX se pripravita zemljevid in višinski profil. Naslove
              tur lahko po shranjevanju urediš spodaj.</small
            >
            <p v-if="image">Izbrana slika: {{ image.name }}</p>
            <p v-for="file in gpxFiles" :key="file.name">GPX za nalaganje: {{ file.name }}</p>
            <button class="button" type="submit" form="runner-profile-form">
              {{
                busy
                  ? 'Shranjujem …'
                  : creating
                    ? 'Ustvari in objavi profil'
                    : 'Shrani in objavi spremembe'
              }}
            </button>
          </fieldset>
          <section v-if="selected" class="runner-tour-editor">
            <div class="tour-heading">
              <h2>GPX ture</h2>
              <nav
                v-if="tours.length"
                class="tour-pagination"
                aria-label="Preklapljanje med turami"
              >
                <button
                  type="button"
                  :disabled="busy || tourIndex === 0"
                  aria-label="Prejšnja tura"
                  @click="changeTour(-1)"
                >
                  <IconArrowUpRight class="tour-arrow-previous" aria-hidden="true" />
                </button>
                <span aria-live="polite">{{ tourIndex + 1 }}/{{ tours.length }}</span>
                <button
                  type="button"
                  :disabled="busy || tourIndex >= tours.length - 1"
                  aria-label="Naslednja tura"
                  @click="changeTour(1)"
                >
                  <IconArrowUpRight class="tour-arrow-next" aria-hidden="true" />
                </button>
              </nav>
            </div>
            <p v-if="!tours.length">Ta tekač še nima tur.</p>
            <form
              v-if="activeTour"
              :key="activeTour.id"
              class="tour"
              @submit.prevent="saveTour(activeTour)"
            >
              <label
                >Naslov ture<input
                  v-model="activeTour.title"
                  required
                  minlength="2"
                  maxlength="150"
              /></label>
              <label>Kraj<input v-model="activeTour.location" maxlength="150" /></label>
              <label>Datum<input v-model="activeTour.dateIso" type="date" /></label>
              <label
                >Opis<textarea v-model="activeTour.description" rows="3" maxlength="1500" />
              </label>
              <div class="tour-metrics">
                <label
                  >Razdalja (km)<input
                    v-model.number="activeTour.distanceKm"
                    type="number"
                    min="0.001"
                    max="10000"
                    step="any"
                    required
                /></label>
                <label
                  >Vzpon (m)<input
                    v-model.number="activeTour.elevationGain"
                    type="number"
                    min="0"
                    max="1000000"
                    step="any"
                /></label>
              </div>
              <small>Vneseni vrednosti imata prednost pred izračunom iz GPX datoteke.</small>
              <a v-if="activeTour.downloadUrl" :href="activeTour.downloadUrl">Prenesi GPX</a>
              <button class="button" :disabled="busy">Shrani podatke ture</button>
              <button
                type="button"
                class="button delete-tour-button"
                :disabled="busy"
                @click="askDeleteTour(activeTour)"
              >
                Izbriši turo
              </button>
            </form>
          </section>
        </div>
      </div>
    </template>
    <dialog
      ref="deleteTourDialog"
      class="delete-tour-dialog"
      aria-labelledby="delete-tour-title"
      @cancel.prevent="cancelDeleteTour"
    >
      <h2 id="delete-tour-title">Izbriši turo?</h2>
      <p v-if="error" role="alert">{{ error }}</p>
      <p>
        Ali res želiš izbrisati turo »{{ deleteTourTarget?.title }}«? Tura bo odstranjena z javnega
        profila tekača. Izbrisa ni mogoče razveljaviti.
      </p>
      <div class="actions">
        <button
          type="button"
          class="button secondary"
          :disabled="busy"
          autofocus
          @click="cancelDeleteTour"
        >
          Prekliči
        </button>
        <button
          type="button"
          class="button delete-tour-button"
          :disabled="busy"
          @click="deleteTour"
        >
          {{ busy ? 'Brišem …' : 'Da, izbriši turo' }}
        </button>
      </div>
    </dialog>
  </main>
</template>
<style scoped>
.delete-tour-dialog {
  width: min(480px, calc(100% - 32px));
  margin: auto;
  padding: 28px;
  border: 1px solid #cbd5c0;
  border-radius: 12px;
  background: #fffdf5;
}
.delete-tour-dialog::backdrop {
  background: rgb(0 0 0 / 45%);
}
.delete-tour-button {
  color: #943e30;
  background: #fff;
  border: 1px solid #943e30;
}
.admin-runners.runner-owner-account {
  width: 100%;
  padding: 0;
  max-width: none;
}
.admin-runners {
  max-width: 1280px;
  padding-block: 40px 80px;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  margin-block: 24px;
}
.editor {
  padding: 28px;
  background: #f4f5ee;
  border: 1px solid #d9e0d0;
  margin-block: 24px;
}
.profile-editor {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 36px;
  align-items: start;
}
.profile-media-column {
  display: grid;
  gap: 32px;
  min-width: 0;
}
.runner-account-link,
.runner-tour-editor {
  border-bottom: 1px solid #cbd5c0;
  padding-bottom: 24px;
}
.tour-heading,
.tour-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.tour-pagination button {
  width: 38px;
  height: 38px;
  border: 1px solid #cbd5c0;
  background: white;
  font-size: 20px;
  cursor: pointer;
}
.tour-pagination button:disabled {
  opacity: 0.35;
  cursor: default;
}
.tour-arrow-previous {
  transform: rotate(225deg);
}
.tour-arrow-next {
  transform: rotate(45deg);
}
.tour-pagination button {
  display: grid;
  place-items: center;
}
.tour-pagination span {
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.tour-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}
fieldset {
  border: 0;
  padding: 0;
  min-width: 0;
}
fieldset,
.editor form,
.tour {
  display: grid;
  gap: 18px;
}
.admin-runners h2,
legend {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.3;
}
legend {
  margin-bottom: 20px;
}
label {
  display: grid;
  gap: 8px;
  margin-block: 8px;
  font-size: 14px;
}
input,
textarea {
  width: 100%;
  min-width: 0;
  padding: 12px;
  background: white;
  border: 1px solid #cbd5c0;
  font: inherit;
}
.runner-list {
  list-style: none;
  padding: 0;
}
.runner-list a {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid #d9e0d0;
}
.tour {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #cbd5c0;
}
.portrait {
  max-width: 200px;
  max-height: 220px;
  object-fit: cover;
}
[role='alert'] {
  color: #943e30;
}
@media (max-width: 800px) {
  .profile-editor {
    grid-template-columns: minmax(0, 1fr);
  }
}
@media (max-width: 600px) {
  .editor {
    padding: 18px;
  }
}
</style>
