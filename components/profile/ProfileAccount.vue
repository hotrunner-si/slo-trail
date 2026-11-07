<script setup lang="ts">
import '~/assets/css/account.css'
import '~/assets/css/brain.css'
import BrainPasswordRequirements from '~/components/brain/PasswordRequirements.vue'
import AdminAccountPanel from '~/components/brain/AdminAccountPanel.vue'
import { validAccountPassword, accountPasswordIssues } from '~/utils/account-password'
useSiteSeo('Račun · Možgan', 'Profil, zasebne datoteke in povzetki', { noindex: true })
const { session, signedIn, admin, refresh, saving } = await useBrainSession()
const route = useRoute(),
  router = useRouter()
const email = ref(''),
  accountName = ref(session.value?.user?.displayName || '')
const authMode = ref<'login' | 'recover'>('login')
const firstLoginDialog = ref<HTMLDialogElement | null>(null)
const registrationEmail = ref('')
const registrationPassword = ref('')
const registrationError = ref('')
const password = ref(''),
  repeatPassword = ref(''),
  currentPassword = ref('')
const recovery = computed(() => session.value?.recovery === true)
const accountView = computed(() =>
  recovery.value
    ? 'settings'
    : route.query.view === 'edit'
      ? 'settings'
      : ['settings', 'runner'].includes(String(route.query.view))
        ? String(route.query.view)
        : 'profile',
)
const linkOpen = ref(false),
  runner = ref('')
const { runners } = await useSiteContent()
const pendingLink = computed(() =>
  session.value?.account?.requests?.find((r) => r.status === 'pending'),
)
function cancelRunnerLink() {
  linkOpen.value = false
  runner.value = ''
}
async function requestRunnerLink() {
  const result = await action(
    '/api/brain/link',
    { runner: runner.value },
    'Prošnja je poslana. Povezavo bo pregledal skrbnik.',
  )
  if (result) {
    linkOpen.value = false
    runner.value = ''
  }
}
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
  await router.push({ path: '/profil', query: view === 'profile' ? {} : { view } })
}
watch(accountView, () => {
  password.value = repeatPassword.value = currentPassword.value = emailPassword.value = ''
})
const callbackPending = ref(typeof route.query.code === 'string')
function changeMode(mode: 'login' | 'recover') {
  authMode.value = mode
  password.value = repeatPassword.value = ''
  message.value = error.value = ''
}
const message = ref(''),
  error = ref(''),
  busy = ref(false)
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
    const result = await $fetch<{
      signedIn?: boolean
      welcome?: string
      pending?: boolean
      firstLogin?: boolean
    }>(url, {
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
    await setView('settings')
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
async function goAfterLogin() {
  const next = route.query.next
  if (
    signedIn.value &&
    typeof next === 'string' &&
    ['/mozgan/baza', '/mozgan/analitika', '/mozgan/skrbnik', '/runners/nov'].includes(next)
  )
    await navigateTo(next)
}
function closeFirstLogin() {
  if (busy.value) return
  firstLoginDialog.value?.close()
  registrationPassword.value = repeatPassword.value = password.value = ''
  registrationEmail.value = registrationError.value = ''
}
async function login() {
  const recovering = authMode.value === 'recover'
  const result = await action(
    recovering ? '/api/brain/recover' : '/api/brain/login',
    recovering
      ? { email: email.value.trim() }
      : { email: email.value.trim(), password: password.value },
    recovering
      ? 'Če je s tem naslovom povezan račun, prejmeš povezavo za novo geslo. Odpri jo v tem brskalniku.'
      : 'Prijavljen.',
  )
  if (result?.firstLogin) {
    message.value = ''
    registrationEmail.value = email.value.trim()
    registrationPassword.value = password.value
    repeatPassword.value = ''
    registrationError.value = ''
    firstLoginDialog.value?.showModal()
  }
  password.value = ''
  if (!error.value) await goAfterLogin()
}
async function confirmFirstLogin() {
  registrationError.value = ''
  if (!validAccountPassword(registrationPassword.value)) {
    registrationError.value = accountPasswordIssues(registrationPassword.value).join(' ')
    return
  }
  if (registrationPassword.value !== repeatPassword.value) {
    registrationError.value = 'Gesli se ne ujemata.'
    return
  }
  const name = registrationEmail.value.split('@')[0]!.slice(0, 80)
  const result = await action(
    '/api/brain/register',
    {
      email: registrationEmail.value,
      password: registrationPassword.value,
      repeatPassword: repeatPassword.value,
      name,
    },
    '',
  )
  if (!result) {
    registrationError.value = error.value
    error.value = ''
    return
  }
  closeFirstLogin()
  message.value = result.signedIn
    ? 'Prijava je uspela. Dobrodošel!'
    : 'Preveri e-poštni predal in potrdi račun s povezavo. Odpri jo v tem brskalniku.'
  await goAfterLogin()
}
async function googleLogin() {
  busy.value = true
  error.value = message.value = ''
  try {
    const result = await $fetch('/api/brain/google', {
      method: 'POST',
      body: { next: typeof route.query.next === 'string' ? route.query.next : undefined },
    })
    await navigateTo(result.url, { external: true })
  } catch (e) {
    error.value = brainError(e)
    busy.value = false
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
    await router.replace('/profil')
  }
}
async function logout() {
  await action('/api/brain/logout', {}, 'Odjavljen.')
  if (!error.value) {
    saving.value = true
    await navigateTo('/profil', { external: true })
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
      await router.replace(result.recovery ? '/profil?recovery=1' : '/profil')
      if (
        typeof next === 'string' &&
        ['/mozgan/baza', '/mozgan/analitika', '/mozgan/skrbnik', '/runners/nov'].includes(next) &&
        !result.recovery
      )
        await navigateTo(next)
      if (!result.recovery) message.value = 'Prijava je uspela. Podatki računa so osveženi.'
    } catch (e) {
      error.value = brainError(e)
      await router.replace('/profil')
    } finally {
      busy.value = false
      callbackPending.value = false
    }
  }
  if (route.query.error || route.hash.includes('error')) {
    error.value = 'Povezava ni veljavna ali je potekla. Zahtevaj novo povezavo.'
    await router.replace('/profil')
  }
})
</script>
<template>
  <div class="brain-app" :class="{ 'brain-admin-mode brain-admin-account': admin }">
    <div class="dashboard-workspace">
      <div class="brain-screen">
        <div class="brain-account-screen">
          <header v-if="!signedIn">
            <h2>{{ signedIn ? 'Tvoj račun' : 'Prijava' }}</h2>
            <p>
              Račun in javni tekaški profil sta ločena. Prispevkov ne povezujemo javno s tvojim
              profilom.
            </p>
          </header>
          <p v-if="message" role="status" class="brain-success">{{ message }}</p>
          <p v-if="error" role="alert" class="brain-error">{{ error }}</p>
          <p v-if="callbackPending" role="status">Preverjam povezavo …</p>
          <section v-else-if="!signedIn" class="brain-panel brain-auth-panel">
            <h3>{{ authMode === 'recover' ? 'Pozabljeno geslo' : 'Dobrodošel na Slo-Trail' }}</h3>
            <p>
              {{
                authMode === 'recover'
                  ? 'Pošljemo ti časovno omejeno povezavo za nastavitev novega gesla.'
                  : 'Prijavi se z Googlom ali e-pošto. Ob prvi prijavi z e-pošto si izbereš geslo.'
              }}
            </p>
            <p>
              Kako obdelujemo podatke pri prijavi in uporabi strani, preberi v
              <NuxtLink to="/zasebnost">politiki zasebnosti</NuxtLink>.
            </p>
            <div v-if="authMode !== 'recover'" class="account-google-login">
              <button type="button" :disabled="busy" @click="googleLogin">
                Nadaljuj z Googlom
              </button>
              <p>ali uporabi e-pošto in geslo</p>
            </div>
            <form class="brain-form" @submit.prevent="login">
              <label
                >E-pošta<input
                  v-model="email"
                  type="email"
                  autocomplete="email"
                  required
                  maxlength="254"
              /></label>
              <label v-if="authMode !== 'recover'"
                >Geslo
                <input
                  v-model="password"
                  type="password"
                  autocomplete="current-password"
                  required
                  maxlength="128"
                />
              </label>
              <button :disabled="busy">
                {{ busy ? 'Počakaj …' : authMode === 'recover' ? 'Pošlji povezavo' : 'Prijavi se' }}
              </button>
            </form>
            <dialog
              ref="firstLoginDialog"
              class="account-first-login"
              aria-labelledby="first-login-title"
              @cancel.prevent="closeFirstLogin"
            >
              <h3 id="first-login-title">Prva prijava</h3>
              <p>
                To je vaša prva prijava na spletni strani Slo-Trail, ponovno vnesite svoje geslo in
                si ga zapomnite!
              </p>
              <p>{{ registrationEmail }}</p>
              <p v-if="registrationError" role="alert" class="brain-error">
                {{ registrationError }}
              </p>
              <form class="brain-form" @submit.prevent="confirmFirstLogin">
                <label
                  >Geslo
                  <input
                    v-model="registrationPassword"
                    type="password"
                    autocomplete="new-password"
                    required
                    minlength="6"
                    maxlength="128"
                  />
                </label>
                <BrainPasswordRequirements
                  id="first-login-password-help"
                  :password="registrationPassword"
                />
                <label
                  >Ponovi geslo
                  <input
                    v-model="repeatPassword"
                    type="password"
                    autocomplete="new-password"
                    aria-describedby="first-login-password-help"
                    required
                    minlength="6"
                    maxlength="128"
                    autofocus
                  />
                </label>
                <button :disabled="busy">{{ busy ? 'Počakaj …' : 'Potrdi in nadaljuj' }}</button>
                <button type="button" :disabled="busy" @click="closeFirstLogin">Prekliči</button>
              </form>
            </dialog>
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
                <button :disabled="busy" @click="setView('settings')">
                  Uredi <span aria-hidden="true"><IconArrowUpRight /></span></button
                ><button class="account-quiet" :disabled="busy" @click="logout">Odjava</button>
              </div>
            </section>
            <nav class="account-tabs" aria-label="Pogledi računa">
              <button
                :aria-pressed="accountView === 'profile'"
                :disabled="busy || recovery"
                @click="setView('profile')"
              >
                Uporabniški račun
              </button>
              <button
                :aria-pressed="accountView === 'runner'"
                :disabled="busy || recovery"
                @click="setView('runner')"
              >
                Profil tekača
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
                    <button
                      class="account-text-button"
                      :disabled="busy"
                      @click="setView('settings')"
                    >
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
                <section v-if="linkedRunner" class="brain-panel account-runner-card">
                  <span class="account-eyebrow">TEKAŠKA SKUPNOST</span>
                  <h3>Tvoj profil tekača</h3>
                  <p>
                    Podatke tekaškega profila urejaš v zavihku Profil tekača.
                    {{
                      admin
                        ? 'Povezavo z obstoječim profilom potrdi skrbnik.'
                        : 'Povezavo z obstoječim profilom že imaš.'
                    }}
                  </p>
                  <NuxtLink
                    v-if="linkedRunner"
                    :to="'/runners/' + linkedRunner"
                    class="account-profile-link"
                    >Odpri profil tekača <IconArrowUpRight
                  /></NuxtLink>
                  <button
                    v-if="linkedRunner && !confirmUnlink"
                    class="account-text-button"
                    @click="confirmUnlink = true"
                  >
                    Prekini povezavo s profilom
                  </button>
                  <div v-if="linkedRunner && confirmUnlink">
                    <p>
                      Javni tekaški profil ostane. Tvoje objavljene datoteke bomo umaknili, pravico
                      do urejanja pa odstranili. Za ponovno povezavo bo potrebna skrbniška
                      potrditev.
                    </p>
                    <button :disabled="busy" @click="unlinkRunner">
                      Potrdi prekinitev povezave
                    </button>
                    <button :disabled="busy" @click="confirmUnlink = false">Prekliči</button>
                  </div>
                  <p v-for="r in session?.account?.requests" :key="r.id" class="account-muted">
                    {{ r.runner_slug }} · {{ statusLabels[r.status] }}
                  </p>
                </section>
              </div>

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
                  {{ session.account.pending.length }} izkušenj še čaka na anonimizacijo ali
                  razjasnitev.
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
            ><template v-else-if="accountView === 'runner'">
              <RunnerAccountEditor v-if="linkedRunner" owner-mode />
              <section v-else class="brain-panel account-link-request">
                <h3>Poveži račun s profilom tekača</h3>
                <p>
                  Tvoj uporabniški račun še ni povezan s profilom tekača. Če profil že obstaja na
                  strani Tekači, lahko zaprosiš za povezavo.
                </p>
                <p v-if="pendingLink" role="status">
                  Prošnja za povezavo s profilom
                  <strong>{{
                    runners.find((r) => r.slug === pendingLink?.runner_slug)?.name ||
                    pendingLink.runner_slug
                  }}</strong>
                  čaka na pregled skrbnika.
                </p>
                <button v-else-if="!linkOpen" :disabled="busy" @click="linkOpen = true">
                  Izberi tekača
                </button>
                <form v-else class="brain-form" @submit.prevent="requestRunnerLink">
                  <label
                    >Izberi tekača<select v-model="runner" required :disabled="busy">
                      <option value="">Izberi profil tekača</option>
                      <option v-for="r in runners" :key="r.slug" :value="r.slug">
                        {{ r.name }}
                      </option>
                    </select></label
                  >
                  <div class="account-form-actions">
                    <button :disabled="busy || !runner">{{ busy ? 'Pošiljam …' : 'Pošlji' }}</button
                    ><button type="button" :disabled="busy" @click="cancelRunnerLink">
                      Prekliči
                    </button>
                  </div>
                </form>
                <p>
                  Še nimate profila tekača na strani Tekači? Pošlji prošnjo po e-pošti
                  <a href="mailto:team.slotrail@gmail.com">team.slotrail@gmail.com</a>
                </p>
              </section> </template
            ><template v-else
              ><div
                class="account-settings-grid"
                :class="{ 'account-settings-recovery': recovery }"
              >
                <div v-if="!recovery" class="account-settings-column">
                  <section v-if="!recovery" class="brain-panel account-edit-panel">
                    <span class="account-eyebrow">UREJANJE RAČUNA</span>
                    <h3>Tvoji podatki - Ime</h3>
                    <form class="brain-form" @submit.prevent="saveProfile">
                      <label
                        >Ime<input
                          v-model="accountName"
                          type="text"
                          autocomplete="nickname"
                          required
                          maxlength="80"
                          placeholder="Ime, priimek ali vzdevek" /></label
                      ><small>Ime računa lahko kadarkoli spremeniš. Ni nujno edinstveno.</small>
                      <div class="account-form-actions">
                        <button :disabled="busy">
                          {{ busy ? 'Shranjujem …' : 'Shrani spremembe' }}</button
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
                        >Sprememba lahko zahteva potrditev na trenutnem in novem naslovu. Sledi
                        navodilom v prejeti pošti.</small
                      ><button :disabled="busy">Spremeni e-pošto</button>
                    </form>
                  </section>
                  <BrainSharedConversations />
                </div>
                <div class="account-settings-column">
                  <section class="brain-panel brain-auth-panel">
                    <h3>{{ recovery ? 'Nastavi novo geslo' : 'Spremeni geslo' }}</h3>
                    <p v-if="recovery">
                      Povezava je preverjena. Novo geslo nastavi v desetih minutah. Če je rok
                      potekel, zahtevaj novo povezavo.
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
                    <h3>Shranjevanje in namen</h3>
                    <label
                      ><input v-model="saving" type="checkbox" />Shrani povzetke in prispevaj
                      anonimizirano znanje</label
                    >
                    <p>
                      Hranimo kratke povzetke in izluščene izkušnje za povezovanje znanja ter izbiro
                      vprašanj. Celotnih prepisov ne hranimo samodejno. Izjema so posnetki, ki jih
                      izrecno deliš z gumbom v Chatu. V računu vidiš zadnjih pet povzetkov; starejši
                      prispevki ostanejo v ozadju. To ni samodejno treniranje modela.
                    </p>
                    <p>
                      Ko shranjevanje izklopiš, ne shranimo vsebine, povzetka ali prispevka. Ostane
                      le osnovna statistika brez vsebine. Nastavitev velja za prispevke iz obrazcev
                      v tem obisku. Deljenje pogovora upravljaš ločeno v Chatu ali pod Moji deljeni
                      pogovori. Za uveljavljanje pravic glede osebnih podatkov se obrni na
                      upravljavca strani.
                    </p>
                  </section>
                </div>
              </div>
              <NuxtLink v-if="admin" to="/mozgan/skrbnik"
                >Odpri skrbniški pregled <IconArrowUpRight /></NuxtLink
            ></template>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
