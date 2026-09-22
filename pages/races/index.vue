<script setup lang="ts">
import { races } from '~/data/races'
import type { Race, RaceCompareItem, RaceDistance, RaceType, Technicality } from '~/types'
import { effortCategory } from '~/utils/raceCategories'

useSiteSeo('Tekme', 'Raziskovalnik trail in gorskotekaških tekem z zemljevidom, koledarjem, višinskimi profili in primerjavo tras.')

type ViewMode = 'list' | 'map' | 'calendar'
const query = ref(''), month = ref('Vsi meseci'), distance = ref('Vse razdalje'), region = ref('Vse regije'), status = ref('Vsi statusi')
const raceType = ref<'Vsi tipi' | RaceType>('Vsi tipi'), effort = ref('Vsi razredi'), technicality = ref<'Vsa zahtevnost' | Technicality>('Vsa zahtevnost')
const collection = ref('vse'), view = ref<ViewMode>('list'), density = ref<'comfortable' | 'compact'>('comfortable')
const activeId = ref(races[0]?.id || ''), compareItems = ref<RaceCompareItem[]>([])
const datedRaces = races.filter(r => r.date && !Number.isNaN(new Date(r.date).getTime()))
const months = ['Vsi meseci', ...new Set(datedRaces.map(r => new Date(r.date).toLocaleDateString('sl-SI',{month:'long'})).map(v => v.charAt(0).toUpperCase()+v.slice(1)))]
// Uredniški seznam priljubljenih tekem: za spremembo samo dodaj ali odstrani slug.
const popularRaceSlugs = new Set([
  'julian-alps-trail-run-by-utmb',
  'obala-ultra-trail',
  'ultra-trail-vipava-valley',
  'soca-outdoor-festival',
  'k24-ultra-trail',
  'kocevsko-outdoor-festival'
])
const collections = [
  { id:'vse', label:'Vse tekme', description:`${races.length} slovenskih dogodkov` },
  { id:'priljubljene', label:'Najbolj priljubljene', description:'Izbor največjih dogodkov' },
  { id:'ponavljajoce', label:'Krožne preizkušnje', description:'Časovni in ponavljajoči formati' }
]
const filtered = computed(() => races.filter(race => {
  const haystack = `${race.name} ${race.location} ${race.region} ${race.country} ${race.distances.map(d=>d.name || d.label).join(' ')}`.toLowerCase()
  const monthName = race.date ? new Date(race.date).toLocaleDateString('sl-SI',{month:'long'}) : ''
  const collectionMatch = collection.value === 'vse'
    || (collection.value === 'priljubljene' && popularRaceSlugs.has(race.slug))
    || (collection.value === 'ponavljajoce' && race.distances.some(d => d.name?.toLowerCase().includes('ponavljajoča')))
  return (!query.value || haystack.includes(query.value.toLowerCase())) && (month.value === 'Vsi meseci' || monthName === month.value.toLowerCase())
    && (region.value === 'Vse regije' || race.region === region.value) && (status.value === 'Vsi statusi' || race.registrationStatus === status.value)
    && (raceType.value === 'Vsi tipi' || race.raceType === raceType.value)
    && (distance.value === 'Vse razdalje' || race.distances.some(d => distance.value === 'Do 30 km' ? d.km <= 30 : distance.value === '30–60 km' ? d.km > 30 && d.km <= 60 : d.km > 60))
    && (effort.value === 'Vsi razredi' || race.distances.some(d => effortCategory(d) === effort.value))
    && (technicality.value === 'Vsa zahtevnost' || race.distances.some(d => d.technicality === technicality.value))
    && collectionMatch
}))
const comparedKeys = computed(() => compareItems.value.map(item => `${item.race.id}:${item.index}`))
function toggleCompare(race: Race, index: number) { const found=compareItems.value.findIndex(item=>item.race.id===race.id&&item.index===index); if(found>=0)compareItems.value.splice(found,1); else if(compareItems.value.length<4)compareItems.value.push({race,distance:race.distances[index] as RaceDistance,index}) }
function resetFilters(){ query.value='';month.value='Vsi meseci';distance.value='Vse razdalje';region.value='Vse regije';status.value='Vsi statusi';raceType.value='Vsi tipi';effort.value='Vsi razredi';technicality.value='Vsa zahtevnost';collection.value='vse' }
</script>

<template><div class="page races-page">
  <section class="race-explorer shell" aria-label="Raziskovalnik tekem">
    <div class="race-search"><label for="race-search">Išči po tekmi, kraju ali trasi</label><div><span>⌕</span><input id="race-search" v-model="query" type="search" placeholder="npr. Julijske Alpe, Bovec, 50K …"><kbd>/</kbd></div></div>
    <div class="race-collections" aria-label="Uredniške zbirke"><button v-for="item in collections" :key="item.id" :class="{active:collection===item.id}" @click="collection=item.id"><strong>{{ item.label }}</strong><span>{{ item.description }}</span></button></div>
    <details class="advanced-filters"><summary>Filtri <span class="mono">{{ filtered.length }} REZULTATOV</span></summary><div class="filters filters-seven"><label>Mesec<select v-model="month"><option v-for="item in months" :key="item">{{ item }}</option></select></label><label>Razdalja<select v-model="distance"><option>Vse razdalje</option><option>Do 30 km</option><option>30–60 km</option><option>Nad 60 km</option></select></label><label>Regija<select v-model="region"><option>Vse regije</option><option v-for="item in [...new Set(races.map(r=>r.region))]" :key="item">{{ item }}</option></select></label><label>Tip<select v-model="raceType"><option>Vsi tipi</option><option>Trail</option><option>Gorski tek</option><option>Vertikal</option></select></label><label>Effort<select v-model="effort"><option>Vsi razredi</option><option>short</option><option>20K</option><option>50K</option><option>100K</option><option>100M</option></select></label><label>Tehničnost<select v-model="technicality"><option>Vsa zahtevnost</option><option>Tekoča</option><option>Srednja</option><option>Tehnična</option></select></label><label>Prijave<select v-model="status"><option>Vsi statusi</option><option>Odprte</option><option>Kmalu</option><option>Zaprte</option><option>Ni podatka</option></select></label></div><div class="filter-actions"><button @click="resetFilters">Ponastavi filtre</button></div></details>
    <div class="race-toolbar"><div class="view-switch" aria-label="Način prikaza"><button :class="{active:view==='list'}" @click="view='list'">Seznam</button><button :class="{active:view==='map'}" @click="view='map'">Zemljevid</button><button :class="{active:view==='calendar'}" @click="view='calendar'">Koledar</button></div><div class="toolbar-right"><div class="effort-legend"><span class="effort-short">&lt;20</span><span class="effort-20k">20K</span><span class="effort-50k">50K</span><span class="effort-100k">100K</span><span class="effort-100m">100M</span><em>KM-EFFORT</em></div><button v-if="view==='list'" class="density-toggle" @click="density=density==='compact'?'comfortable':'compact'">{{ density==='compact' ? 'Razširjeno' : 'Strnjeno' }}</button></div></div>
    <template v-if="filtered.length"><RaceList v-if="view==='list'" :races="filtered" show-profile show-compare :density="density" :active-id="activeId" :compared-keys="comparedKeys" @activate="activeId=$event" @compare="toggleCompare"/><RaceMap v-else-if="view==='map'" :races="filtered" :active-id="activeId" @activate="activeId=$event"/><RaceCalendar v-else :races="filtered"/></template>
    <div v-else class="empty-state"><h2>Ni tekem za izbrane pogoje.</h2><p>Poskusi odstraniti enega od filtrov ali ponastavi celoten pogled.</p><button class="button secondary" @click="resetFilters">Ponastavi filtre</button></div>
  </section>
  <section class="data-promise shell"><div><p class="eyebrow">Zakaj zaupati podatkom</p><h2>Vsaka trasa ima vir.</h2></div><div><p>Pri vsaki tekmi bomo prikazali datum zadnjega preverjanja, uradni vir in stanje GPX datoteke. Tako bo jasno, kateri podatki so potrjeni in kateri še čakajo na osvežitev.</p><dl><div><dt>Preverjeno</dt><dd>{{ races.filter(r=>r.verifiedAt).length }}/{{ races.length }}</dd></div><div><dt>GPX pripravljen</dt><dd>{{ races.filter(r=>r.distances.some(d=>d.gpx)).length }}/{{ races.length }}</dd></div><div><dt>Dogodkov</dt><dd>{{ races.length }}</dd></div></dl></div></section>
  <RaceCompare :items="compareItems" @remove="compareItems.splice($event,1)" @clear="compareItems=[]"/>
</div></template>
