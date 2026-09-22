<script setup lang="ts">
import type { TrailRoute } from '~/types'
const props=defineProps<{tour:TrailRoute;index?:number}>()
const zoom=ref(1)
const x=ref(0),y=ref(0),drag=ref<{x:number;y:number;ox:number;oy:number}|null>(null)
const paths=['M18 118C50 90 60 32 105 44S162 132 206 93S262 40 308 61S350 103 382 30','M15 98C48 28 92 122 132 72S208 18 240 83S322 132 384 48','M20 48C78 19 75 126 142 103S208 23 254 55S323 118 382 82']
function reset(){zoom.value=1;x.value=0;y.value=0}
function start(event:PointerEvent){drag.value={x:event.clientX,y:event.clientY,ox:x.value,oy:y.value};(event.currentTarget as Element).setPointerCapture(event.pointerId)}
function move(event:PointerEvent){if(!drag.value)return;x.value=drag.value.ox+(event.clientX-drag.value.x);y.value=drag.value.oy+(event.clientY-drag.value.y)}
</script>
<template><div class="tour-map-preview" role="application" :aria-label="`Interaktivni predogled ture ${tour.name}`"><svg viewBox="0 0 400 190" @pointerdown="start" @pointermove="move" @pointerup="drag=null" @pointercancel="drag=null"><g :style="{transform:`translate(${x}px,${y}px) scale(${zoom})`,transformOrigin:'center'}"><path class="contour" d="M-20 25C55 65 93-15 170 30s120 8 250-18M-10 65c75 40 119-32 190 4s115 24 240-15M-20 142c87 30 125-29 196 2s115 15 244-10"/><path class="route-line" :d="paths[(props.index||0)%paths.length]"/></g></svg><div class="tour-map-controls"><button type="button" aria-label="Približaj" @click="zoom=Math.min(2.4,zoom+.25)">+</button><button type="button" aria-label="Oddalji" @click="zoom=Math.max(.8,zoom-.25)">−</button><button type="button" @click="reset">Ponastavi</button></div></div></template>
