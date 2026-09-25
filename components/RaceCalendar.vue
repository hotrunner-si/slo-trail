<script setup lang="ts">
import type { Race } from '~/types'
const props = defineProps<{ races: Race[] }>()
const weekdays=['Pon','Tor','Sre','Čet','Pet','Sob','Ned']
const validDate=(race:Race)=>Boolean(race.dateStatus !== 'estimated' && race.date && !Number.isNaN(new Date(`${race.date}T12:00:00`).getTime()))
const calendars=computed(()=>{
  const months=new Map<string,{year:number;month:number;races:Race[]}>()
  for(const race of props.races.filter(validDate)){const date=new Date(`${race.date}T12:00:00`),key=`${date.getFullYear()}-${date.getMonth()}`;if(!months.has(key))months.set(key,{year:date.getFullYear(),month:date.getMonth(),races:[]});months.get(key)!.races.push(race)}
  return [...months.values()].sort((a,b)=>a.year-b.year||a.month-b.month).map(item=>{const first=new Date(item.year,item.month,1),days=new Date(item.year,item.month+1,0).getDate(),offset=(first.getDay()+6)%7,cells=Array.from<number|null>({length:offset+days},(_,index)=>index<offset?null:index-offset+1);while(cells.length%7)cells.push(null);const byDay=new Map<number,Race[]>();for(const race of item.races){const day=new Date(`${race.date}T12:00:00`).getDate();byDay.set(day,[...(byDay.get(day)||[]),race])}return{...item,cells,byDay,label:first.toLocaleDateString('sl-SI',{month:'long',year:'numeric'})}})
})
const undated=computed(()=>props.races.filter(race=>!validDate(race)))
</script>
<template><div class="race-calendar-grid-view"><section v-for="calendar in calendars" :key="`${calendar.year}-${calendar.month}`" class="calendar-month"><header><h2>{{ calendar.label }}</h2><span class="mono">{{ calendar.races.length }} {{ calendar.races.length===1?'DOGODEK':'DOGODKOV' }}</span></header><div class="calendar-weekdays" aria-hidden="true"><span v-for="day in weekdays" :key="day">{{ day }}</span></div><div class="calendar-days"><div v-for="(day,index) in calendar.cells" :key="index" :class="['calendar-day',{empty:!day,'has-events':day&&calendar.byDay.has(day)}]"><template v-if="day"><span class="calendar-date mono">{{ day }}</span><div v-if="calendar.byDay.has(day)" class="calendar-events"><NuxtLink v-for="race in calendar.byDay.get(day)" :key="race.id" :to="`/races/${race.slug}`" :title="`${race.name} — ${race.location}`"><i/><b>{{ race.name }}</b></NuxtLink></div></template></div></div></section><section v-if="undated.length" class="calendar-undated"><header><h2>Datum še ni objavljen</h2></header><div><NuxtLink v-for="race in undated" :key="race.id" :to="`/races/${race.slug}`">{{ race.name }} <span>↗</span></NuxtLink></div></section></div></template>
