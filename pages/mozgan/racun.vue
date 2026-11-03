<script setup lang="ts">
import '~/assets/css/account.css'
import BrainPasswordRequirements from '~/components/brain/PasswordRequirements.vue'
import AdminAccountPanel from '~/components/brain/AdminAccountPanel.vue'
import { validAccountPassword, accountPasswordIssues } from '~/utils/account-password'
useSiteSeo('Račun · Možgan', 'Profil, zasebne datoteke in povzetki', { noindex: true })
const { session, signedIn, admin, refresh, saving } = await useBrainSession()
const route = useRoute(),
  router = useRouter()
const email = ref(''),
  accountName = ref(session.value?.user?.displayName || ''),
  linkOpen = ref(false)
const authMode = ref<'login' | 'register' | 'recover'>('login')
const password = ref(''),
  repeatPassword = ref(''),
  currentPassword = ref('')
const recovery = computed(() => session.value?.recovery === true)
const accountView = computed(() =>
  recovery.value
    ? 'settings'
    : ['edit', 'settings'].includes(String(route.query.view))
      ? String(route.query.view)
      : 'profile',
)
const linkedRunner = computed(() => session.value?.account?.link?.runner_slug || '')
const newEmail = ref(''),
  emailPassword = ref('')
const confirmUnlink = ref(false)
async function unlinkRunner() {
  const result = await action(
    '/api/brain/unlink',
    {},
    'Povezava je odstranjena. Javni profil ostane; tvoje objavljene datoteke so umaknjene.',
  )
  if (result) {
    await refreshSiteContent()
    confirmUnlink.value = false
  }
}
const displayName = computed(() => session.value?.user?.displayName || 'Tvoj račun')
const initials = computed(() =>
  displayName.value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => Array.from(s)[0])
    .join('')
    .toLocaleUpperCase('sl'),
)
function resetDraft() {
  accountName.value = session.value?.user?.displayName || ''
}
async function setView(view: string) {
  resetDraft()
  password.value = repeatPassword.value = currentPassword.value = emailPassword.value = ''
  newEmail.value = ''
  message.value = error.value = ''
  await router.push({ path: '/mozgan/racun', query: view === 'profile' ? {} : { view } })
}
watch(accountView, () => {
  password.value = repeatPassword.value = currentPassword.value = emailPassword.value = ''
})
const callbackPending = ref(typeof route.query.code === 'string')
function changeMode(mode: 'login' | 'register' | 'recover') {
  authMode.value = mode
  password.value = repeatPassword.value = ''
  message.value = error.value = ''
}
const message = ref(''),
  error = ref(''),
  busy = ref(false),
  runner = ref(''),
  note = ref('')
const { runners } = await useSiteContent()
const profile = computed(() => session.value?.account?.profile)
watch(
  () => session.value?.user?.displayName,
  (value) => {
    accountName.value = value || ''
  },
)
const statusLabels: Record<string, string> = {
  pending: 'Čaka na pregled',
  approved: 'Odobreno',
  rejected: 'Zavrnjeno',
  replaced: 'Datoteka je zamenjana',
}
function fileAt(slot: number) {
  return session.value?.account?.files?.find((f: any) => f.slot === slot)
}
const fileSlots = computed(() => [1, 2, 3, 4].map((slot) => ({ slot, file: fileAt(slot) })))
async function action(url: string, body: Record<string, unknown> | FormData, success: string) {
  error.value = ''
  message.value = ''
  busy.value = true
  try {
    const result = await $fetch<{ signedIn?: boolean; welcome?: string; pending?: boolean }>(url, {
      method: 'POST',
      body,
    })
    message.value = success
    await refresh()
    return result
  } catch (e) {
    error.value = brainError(e)
  } finally {
    busy.value = false
  }
}
async function saveProfile() {
  const result = await action(
    '/api/brain/account-name',
    { name: accountName.value },
    'Ime računa je shranjeno.',
  )
  if (result) {
    await setView('profile')
    message.value = 'Spremembe so shranjene.'
  }
}
async function changeEmail() {
  const result = await action(
    '/api/brain/email',
    { email: newEmail.value.trim(), currentPassword: emailPassword.value },
    '',
  )
  emailPassword.value = ''
  if (result) {
    message.value = result.pending
      ? 'Zahteva je poslana. Preveri novi in trenutni e-poštni predal ter sledi potrditvenim navodilom. Do potrditve uporabljaš trenutni naslov.'
      : 'E-poštni naslov je spremenjen.'
    newEmail.value = ''
  }
}
async function login() {
  if (authMode.value === 'register' && !validAccountPassword(password.value)) {
    error.value = accountPasswordIssues(password.value).join(' ')
    return
  }
  if (authMode.value === 'register' && password.value !== repeatPassword.value) {
    error.value = 'Gesli se ne ujemata.'
    return
  }
  const mode = authMode.value
  const result = await action(
    `/api/brain/${mode === 'login' ? 'login' : mode === 'register' ? 'register' : 'recover'}`,
    mode === 'recover'
      ? { email: email.value.trim() }
      : {
          email: email.value.trim(),
          password: password.value,
          repeatPassword: repeatPassword.value,
          ...(mode === 'register' ? { name: accountName.value.trim() } : {}),
        },
    mode === 'login'
      ? 'Prijavljen.'
      : mode === 'register'
        ? 'Račun je ustvarjen. Dobrodošel!'
        : 'Če je s tem naslovom povezan račun, prejmeš povezavo za novo geslo. Odpri jo v tem brskalniku.',
  )
  if (!error.value && mode === 'register' && result) {
    message.value = result.signedIn
      ? 'Račun je ustvarjen in prijavljen. Dobrodošel!'
      : 'Račun je ustvarjen. Prijavi se z e-pošto in geslom.'
    if (result.welcome !== 'sent')
      message.value += ' Pozdravna e-pošta trenutno ni bila poslana; račun lahko uporabljaš.'
  }
  password.value = repeatPassword.value = ''
  if (!error.value && signedIn.value) {
    const next = route.query.next
    if (
      typeof next === 'string' &&
      ['/mozgan/baza', '/mozgan/analitika', '/mozgan/skrbnik', '/runners/nov'].includes(next)
    )
      await navigateTo(next)
  }
}
async function changePassword() {
  if (!validAccountPassword(password.value)) {
    error.value = accountPasswordIssues(password.value).join(' ')
    return
  }
  if (password.value !== repeatPassword.value) {
    error.value = 'Gesli se ne ujemata.'
    return
  }
  await action(
    '/api/brain/password',
    {
      password: password.value,
      repeatPassword: repeatPassword.value,
      ...(!recovery.value ? { currentPassword: currentPassword.value } : {}),
    },
    'Geslo je spremenjeno. Prijavi se z novim geslom.',
  )
  password.value = repeatPassword.value = currentPassword.value = ''
  if (!error.value) {
    authMode.value = 'login'
    await router.replace('/mozgan/racun')
  }
}
async function logout() {
  await action('/api/brain/logout', {}, 'Odjavljen.')
  if (!error.value) {
    saving.value = true
    await navigateTo('/mozgan/racun', { external: true })
  }
}
async function upload(event: Event, slot: number) {
  const input = event.target as HTMLInputElement
  const f = input.files?.[0]
  if (!f) return
  const form = new FormData()
  form.append('file', f)
  form.append('slot', String(slot))
  form.append('expected', fileAt(slot)?.path || '')
  await action(
    '/api/brain/files',
    form,
    slot === 4
      ? 'Slika je naložena in pretvorjena v WebP. Shranjena je zasebno v računu.'
      : 'GPX je naložen in obdelan za zemljevid ter višinski profil. Shranjen je zasebno.',
  )
  input.value = ''
}
async function requestRoute(f: any) {
  await action(
    '/api/brain/route',
    { file: f.id, title: f.name.replace(/\.gpx$/i, '') },
    'Trasa je poslana v pregled. GPX ostaja zaseben.',
  )
}
onMounted(async () => {
  if (typeof route.query.code === 'string') {
    busy.value = true
    try {
      const next = route.query.next
      const result = await $fetch('/api/brain/callback', {
        method: 'POST',
        body: { code: route.query.code },
      })
      await refresh()
      await router.replace(
        result.recovery ? '/mozgan/racun?recovery=1' : '/mozgan/racun?view=settings',
      )
      if (next === '/mozgan/baza' && !result.recovery) await navigateTo(next)
      if (!result.recovery)
        message.value = 'Potrditvena povezava je preverjena. Podatki računa so osveženi.'
    } catch (e) {
      error.value = brainError(e)
      await router.replace('/mozgan/racun')
    } finally {
      busy.value = false
      callbackPending.value = false
    }
  }
  if (route.query.error || route.hash.includes('error')) {
    error.value = 'Povezava ni veljavna ali je potekla. Zahtevaj novo povezavo.'
    await router.replace('/mozgan/racun')
  }
})
</script>
<template>
  <div class="brain-account-screen">
    <header v-if="!signedIn">
      <h2>{{ signedIn ? 'Tvoj račun' : 'Prijava in nov račun' }}</h2>
      <p>
        Račun in javni tekaški profil sta ločena. Prispevkov ne povezujemo javno s tvojim profilom.
      </p>
    </header>
    <p v-if="message" role="status" class="brain-success">{{ message }}</p>
    <p v-if="error" role="alert" class="brain-error">{{ error }}</p>
    <p v-if="callbackPending" role="status">Preverjam povezavo …</p>
    <section v-else-if="!signedIn" class="brain-panel brain-auth-panel">
      <div class="brain-auth-tabs" aria-label="Dostop do računa">
        <button
          type="button"
          :aria-pressed="authMode === 'login'"
          :disabled="busy"
          @click="changeMode('login')"
        >
          Prijava
        </button>
        <button
          type="button"
          :aria-pressed="authMode === 'register'"
          :disabled="busy"
          @click="changeMode('register')"
        >
          Ustvari račun
        </button>
      </div>
      <h3>
        {{
          authMode === 'recover'
            ? 'Pozabljeno geslo'
            : authMode === 'register'
              ? 'Ustvari svoj račun'
              : 'Dobrodošel nazaj'
        }}
      </h3>
      <p>
        {{
          authMode === 'recover'
            ? 'Pošljemo ti časovno omejeno povezavo za nastavitev novega gesla.'
            : authMode === 'register'
              ? 'Izberi ime za svoj račun. Po registraciji ga lahko spreminjaš v nastavitvah.'
              : 'Prijavi se z e-poštnim naslovom in geslom.'
        }}
      </p>
      <form class="brain-form" @submit.prevent="login">
        <label v-if="authMode === 'register'"
          >Uporabniško ime
          <input
            v-model="accountName"
            type="text"
            autocomplete="nickname"
            required
            maxlength="80"
            placeholder="Ime Priimek, ime ali vzdevek"
          />
        </label>
        <label
          >E-pošta<input v-model="email" type="email" autocomplete="email" required maxlength="254"
        /></label>
        <label v-if="authMode !== 'recover'"
          >Geslo
          <input
            v-model="password"
            type="password"
            :autocomplete="authMode === 'register' ? 'new-password' : 'current-password'"
            required
            :minlength="authMode === 'register' ? 6 : 1"
            maxlength="128"
            :aria-describedby="authMode === 'register' ? 'password-help' : undefined"
          />
        </label>
        <BrainPasswordRequirements
          v-if="authMode === 'register'"
          id="password-help"
          :password="password"
        />
        <label v-if="authMode === 'register'"
          >Ponovi geslo
          <input
            v-model="repeatPassword"
            type="password"
            autocomplete="new-password"
            required
            minlength="6"
            maxlength="128"
          />
        </label>
        <button :disabled="busy">
          {{
            busy
              ? 'Počakaj …'
              : authMode === 'recover'
                ? 'Pošlji povezavo'
                : authMode === 'register'
                  ? 'Ustvari račun'
                  : 'Prijavi se'
          }}
        </button>
      </form>
      <button
        v-if="authMode === 'login'"
        class="brain-auth-link"
        type="button"
        :disabled="busy"
        @click="changeMode('recover')"
      >
        Pozabljeno geslo?
      </button>
      <button
        v-if="authMode === 'recover'"
        class="brain-auth-link"
        type="button"
        :disabled="busy"
        @click="changeMode('login')"
      >
        Nazaj na prijavo
      </button>
    </section>
    <template v-else>
      <section class="account-hero">
        <div class="account-avatar">
          <img
            v-if="fileAt(4)"
            :src="
              '/api/brain/files/' +
              fileAt(4)?.id +
              '?v=' +
              encodeURIComponent(fileAt(4)?.path || '')
            "
            alt=""
          /><span v-else>{{ initials }}</span>
        </div>
        <div class="account-identity">
          <span class="account-eyebrow">MOJ PROSTOR</span>
          <h2>{{ displayName }}</h2>
          <p>{{ session?.user?.email }}</p>
          <span class="brain-account-state">Prijavljen</span
          ><span v-if="admin" class="account-role">Skrbnik</span>
        </div>
        <div class="account-hero-actions">
          <button :disabled="busy" @click="setView('edit')">
            Uredi <span aria-hidden="true">↗</span></button
          ><button class="account-quiet" :disabled="busy" @click="logout">Odjava</button>
        </div>
      </section>
      <nav class="account-tabs" aria-label="Pogledi računa">
        <button
          :aria-pressed="accountView === 'profile'"
          :disabled="busy || recovery"
          @click="setView('profile')"
        >
          Profil
        </button>
        <button
          :aria-pressed="accountView === 'edit'"
          :disabled="busy || recovery"
          @click="setView('edit')"
        >
          Urejanje
        </button>
        <button
          :aria-pressed="accountView === 'settings'"
          :disabled="busy"
          @click="setView('settings')"
        >
          Nastavitve
        </button>
      </nav>
      <template v-if="accountView === 'profile'">
        <AdminAccountPanel v-if="admin" />
        <div class="account-overview-grid">
          <section class="brain-panel account-details">
            <div class="account-section-heading">
              <h3>Podatki računa</h3>
              <button class="account-text-button" :disabled="busy" @click="setView('edit')">
                Uredi
              </button>
            </div>
            <dl class="account-facts">
              <div>
                <dt>Uporabniško ime</dt>
                <dd>{{ session?.user?.displayName || 'Še ni vpisano' }}</dd>
              </div>
              <div>
                <dt>E-pošta</dt>
                <dd>{{ session?.user?.email }}</dd>
              </div>
              <div>
                <dt>Član od</dt>
                <dd>
                  {{
                    session?.user?.createdAt
                      ? new Date(session.user.createdAt).toLocaleDateString('sl-SI')
                      : '—'
                  }}
                </dd>
              </div>
              <div>
                <dt>Vrsta računa</dt>
                <dd>{{ admin ? 'Skrbniški račun' : 'Uporabniški račun' }}</dd>
              </div>
            </dl>
          </section>
          <section class="brain-panel account-runner-card">
            <span class="account-eyebrow">TEKAŠKA SKUPNOST</span>
            <h3>Tvoj profil tekača</h3>
            <p>
              Podatke tekaškega profila urejaš na njegovi strani. Povezavo z obstoječim profilom
              potrdi skrbnik.
            </p>
            <NuxtLink
              v-if="linkedRunner"
              :to="'/runners/' + linkedRunner"
              class="account-profile-link"
              >Odpri profil tekača ↗</NuxtLink
            >
            <button
              v-if="linkedRunner && !confirmUnlink"
              class="account-text-button"
              @click="confirmUnlink = true"
            >
              Prekini povezavo s profilom
            </button>
            <div v-if="linkedRunner && confirmUnlink">
              <p>
                Javni tekaški profil ostane. Tvoje objavljene datoteke bomo umaknili, pravico do
                urejanja pa odstranili. Za ponovno povezavo bo potrebna skrbniška potrditev.
              </p>
              <button :disabled="busy" @click="unlinkRunner">Potrdi prekinitev povezave</button>
              <button :disabled="busy" @click="confirmUnlink = false">Prekliči</button>
            </div>
            <NuxtLink v-if="!linkedRunner" to="/runners/nov" class="account-profile-link"
              >{{ profile ? 'Odpri predlog profila tekača' : 'Ustvari profil tekača' }} ↗</NuxtLink
            >
            <button v-if="!linkedRunner" class="account-text-button" @click="linkOpen = !linkOpen">
              Povezava z obstoječim profilom tekača
            </button>
            <p v-if="profile && !linkedRunner" class="account-muted">
              {{ statusLabels[profile.status] }}
            </p>
            <p v-for="r in session?.account?.requests" :key="r.id" class="account-muted">
              {{ r.runner_slug }} · {{ statusLabels[r.status] }}
            </p>
          </section>
        </div>
        <section v-if="linkOpen && !linkedRunner" class="brain-panel account-edit-panel">
          <h3>Povezava z obstoječim profilom tekača</h3>
          <p>Enako ime ni dokaz identitete. Zahtevo pregleda skrbnik.</p>
          <form
            class="brain-form"
            @submit.prevent="
              action('/api/brain/link', { runner, note }, 'Zahteva je oddana v pregled.')
            "
          >
            <label
              >Obstoječi profil<select v-model="runner" required>
                <option value="">Izberi tekača</option>
                <option v-for="r in runners" :key="r.slug" :value="r.slug">{{ r.name }}</option>
              </select></label
            ><label
              >Kako lahko preverimo povezavo?<textarea
                v-model="note"
                required
                minlength="10"
                maxlength="1000"
                rows="3"
              /></label
            ><button :disabled="busy">Zahtevaj povezavo</button>
          </form>
        </section>
        <section class="brain-panel">
          <div class="account-section-heading">
            <div>
              <span class="account-eyebrow">SAMO ZATE</span>
              <h3>Tvoje datoteke</h3>
            </div>
            <button class="account-text-button" :disabled="busy" @click="setView('edit')">
              Uredi datoteke
            </button>
          </div>
          <div class="account-file-overview">
            <div v-for="{ slot, file } in fileSlots" :key="slot" class="account-file-item">
              <span class="account-file-symbol" aria-hidden="true">{{
                slot === 4 ? '◉' : '↟'
              }}</span>
              <div>
                <small>{{ slot === 4 ? 'Slika računa' : 'GPX ' + slot }}</small
                ><a v-if="file" :href="'/api/brain/files/' + file.id">{{ file.name }} ↓</a
                ><span v-else>Še ni naloženo</span>
                <small
                  v-if="file && session?.account?.publications?.some((p) => p.file_id === file.id)"
                  >Javna kopija je objavljena na tekaškem profilu.</small
                >
              </div>
            </div>
          </div>
          <p class="account-muted">
            Datoteke so zasebne. Naložena slika se ne objavi samodejno na tekaškem profilu.
          </p>
        </section>
        <section class="brain-panel">
          <h3>Zadnjih pet povzetkov</h3>
          <p v-if="!session?.account?.summaries?.length">Še ni shranjenih povzetkov.</p>
          <article v-for="s in session?.account?.summaries" :key="s.id" class="brain-summary">
            <time>{{ new Date(s.created_at).toLocaleDateString('sl-SI') }}</time>
            <p>{{ s.summary }}</p>
          </article>
          <p>
            Oddana strukturirana izkušnja je do anonimizacije zasebna in ne šteje kot javna
            potrditev.
          </p>
          <p v-if="session?.account?.pending?.length">
            {{ session.account.pending.length }} izkušenj še čaka na anonimizacijo ali razjasnitev.
          </p>
          <button
            v-if="session?.aiAvailable && session?.account?.pending?.length"
            :disabled="busy"
            @click="
              action(
                '/api/brain/process',
                {},
                'Obdelava čakajočih izkušenj je zaključena. Nejasni podatki ostanejo zasebni.',
              )
            "
          >
            Obdelaj naslednjo čakajočo izkušnjo
          </button>
        </section> </template
      ><template v-else-if="accountView === 'edit'">
        <section class="brain-panel account-edit-panel">
          <span class="account-eyebrow">UREJANJE RAČUNA</span>
          <h3>Tvoji podatki</h3>
          <form class="brain-form" @submit.prevent="saveProfile">
            <label
              >Uporabniško ime<input
                v-model="accountName"
                type="text"
                autocomplete="nickname"
                required
                maxlength="80"
                placeholder="Ime, priimek ali vzdevek" /></label
            ><small>Ime računa lahko kadarkoli spremeniš. Ni nujno edinstveno.</small>
            <div class="account-form-actions">
              <button :disabled="busy">{{ busy ? 'Shranjujem …' : 'Shrani spremembe' }}</button
              ><button
                type="button"
                class="account-quiet"
                :disabled="busy"
                @click="setView('profile')"
              >
                Prekliči
              </button>
            </div>
          </form>
          <p class="account-muted">
            E-pošto in geslo spremeniš v Nastavitvah. Podatke tekača urejaš na tekaškem profilu.
          </p>
        </section>
        <section class="brain-panel">
          <h3>Zasebne datoteke</h3>
          <p>
            Največ trije GPX in ena slika, do 5 MB na datoteko. Slike JPEG, PNG ali WebP se varno
            ponovno kodirajo. Zamenjava ob uspehu odstrani staro datoteko; neuspešna ohrani
            obstoječo. GPX se ne objavijo samodejno.
          </p>
          <div class="brain-file-grid">
            <div v-for="{ slot, file } in fileSlots" :key="slot" class="brain-file">
              <strong>{{ slot === 4 ? 'Slika računa' : `GPX ${slot}` }}</strong
              ><template v-if="file"
                ><a :href="`/api/brain/files/${file.id}`">{{ file.name }} ↓</a
                ><small v-if="slot === 4" role="status">Slika je naložena · WebP</small
                ><img
                  v-if="slot === 4"
                  class="account-upload-preview"
                  :src="`/api/brain/files/${file.id}?v=${encodeURIComponent(file.path)}`"
                  alt="Naložena zasebna slika računa"
                />
                <PrivateGpxPreview v-if="slot < 4" :key="file.path" :file="file" />
                <small v-if="slot < 4">{{ file.details?.pointCount }} točk</small
                ><button
                  v-if="slot < 4"
                  :disabled="
                    busy ||
                    session?.account?.routes?.some(
                      (r: any) =>
                        r.file_path === file.path && ['pending', 'approved'].includes(r.status),
                    )
                  "
                  @click="requestRoute(file)"
                >
                  Pošlji traso v pregled
                </button></template
              ><label
                >{{ file ? 'Zamenjaj' : 'Naloži'
                }}<input
                  type="file"
                  :accept="slot === 4 ? '.png,.jpg,.jpeg,.webp' : '.gpx'"
                  :disabled="busy"
                  @change="upload($event, slot)"
              /></label>
              <FilePublicationControls v-if="file" :key="file.path" :file="file" />
            </div>
          </div>
          <p v-for="r in session?.account?.routes" :key="r.id">
            {{ r.title }} · {{ statusLabels[r.status] }}
          </p>
        </section> </template
      ><template v-else
        ><div class="account-settings-grid">
          <section class="brain-panel brain-auth-panel">
            <h3>{{ recovery ? 'Nastavi novo geslo' : 'Spremeni geslo' }}</h3>
            <p v-if="recovery">
              Povezava je preverjena. Novo geslo nastavi v desetih minutah. Če je rok potekel,
              zahtevaj novo povezavo.
            </p>
            <form class="brain-form" @submit.prevent="changePassword">
              <label v-if="!recovery"
                >Trenutno geslo<input
                  v-model="currentPassword"
                  type="password"
                  autocomplete="current-password"
                  required
                  maxlength="128"
              /></label>
              <label
                >Novo geslo<input
                  v-model="password"
                  type="password"
                  autocomplete="new-password"
                  required
                  minlength="6"
                  maxlength="128"
                  aria-describedby="new-password-help"
              /></label>
              <BrainPasswordRequirements id="new-password-help" :password="password" />
              <small>Po spremembi se znova prijavi.</small>
              <label
                >Ponovi novo geslo<input
                  v-model="repeatPassword"
                  type="password"
                  autocomplete="new-password"
                  required
                  minlength="6"
                  maxlength="128"
              /></label>
              <button :disabled="busy">Shrani novo geslo</button>
            </form>
          </section>

          <section v-if="!recovery" class="brain-panel">
            <span class="account-eyebrow">PRIJAVNI PODATKI</span>
            <h3>E-poštni naslov</h3>
            <p class="account-muted">Trenutni naslov: {{ session?.user?.email }}</p>
            <p v-if="session?.user?.pendingEmail" class="brain-success">
              Čaka na potrditev: {{ session.user.pendingEmail }}
            </p>
            <form class="brain-form" @submit.prevent="changeEmail">
              <label
                >Nov e-poštni naslov<input
                  v-model="newEmail"
                  type="email"
                  autocomplete="email"
                  required
                  maxlength="254" /></label
              ><label
                >Trenutno geslo<input
                  v-model="emailPassword"
                  type="password"
                  autocomplete="current-password"
                  required
                  maxlength="128" /></label
              ><small
                >Sprememba lahko zahteva potrditev na trenutnem in novem naslovu. Sledi navodilom v
                prejeti pošti.</small
              ><button :disabled="busy">Spremeni e-pošto</button>
            </form>
          </section>
        </div>
        <div v-if="!recovery">
          <section class="brain-panel">
            <h3>Shranjevanje in namen</h3>
            <label
              ><input v-model="saving" type="checkbox" />Shrani povzetke in prispevaj anonimizirano
              znanje</label
            >
            <p>
              Hranimo kratke povzetke in izluščene izkušnje za povezovanje znanja ter izbiro
              vprašanj. Celotnega prepisa ne hranimo. V računu vidiš zadnjih pet povzetkov; starejši
              prispevki ostanejo v ozadju. To ni samodejno treniranje modela.
            </p>
            <p>
              Ko shranjevanje izklopiš, ne shranimo vsebine, povzetka ali prispevka. Ostane le
              osnovna statistika brez vsebine. Nastavitev velja za ta odprti obisk; ob spremembi se
              začasni pogovor počisti. Za uveljavljanje pravic glede osebnih podatkov se obrni na
              upravljavca strani.
            </p>
          </section>
        </div>
        <NuxtLink v-if="admin" to="/mozgan/skrbnik">Odpri skrbniški pregled ↗</NuxtLink></template
      >
    </template>
  </div>
</template>
