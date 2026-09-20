<script setup lang="ts">
import type { RaceCompareItem } from '~/types'
import { effortCategory, effortKm } from '~/utils/raceCategories'
defineProps<{ items: RaceCompareItem[] }>()
const emit = defineEmits<{ remove:[index:number]; clear:[] }>()
</script>
<template><aside v-if="items.length" class="compare-tray" aria-label="Primerjava tras"><header><div><span class="mono">PRIMERJAVA</span><strong>{{ items.length }}/4 trase</strong></div><button @click="emit('clear')">Počisti</button></header><div class="compare-grid"><article v-for="(item,index) in items" :key="`${item.race.id}-${item.index}`"><button class="compare-remove" :aria-label="`Odstrani ${item.race.name}`" @click="emit('remove',index)">×</button><p>{{ item.race.name }}</p><h3>{{ item.distance.label }}</h3><RaceElevationMini :distance="item.distance" :race-id="item.race.id"/><dl><div><dt>Razdalja</dt><dd>{{ item.distance.km }} km</dd></div><div><dt>Vzpon</dt><dd>{{ item.distance.elevation.toLocaleString('sl-SI') }} m+</dd></div><div><dt>Effort</dt><dd>{{ effortKm(item.distance) }} · {{ effortCategory(item.distance) }}</dd></div><div><dt>Tehničnost</dt><dd>{{ item.distance.technicality || 'Ni podatka' }}</dd></div></dl></article></div></aside></template>
