import type { TrailRoute } from '~/types'
import { runners } from './runners'

export const trailRoutes: TrailRoute[] = [
  { id:'t1', slug:'velika-planina-loop', name:'Velika planina Loop', region:'Kamniško-Savinjske Alpe', distance:27.4, elevationGain:1640, elevationLoss:1640, highPoint:1666, estimatedTime:'4–6 h', difficulty:'Zahtevna', recommendedBy:runners[0].name, runnerSlug:runners[0].slug, description:'Razgiban krog čez planino, tihe gozdne prehode in razgledne robove. Najlepši je zgodaj zjutraj, ko so poti še prazne.', quote:'', image:'/images/kv01.jpg' },
  { id:'t2', slug:'stol-grebenska-linija', name:'Stol — grebenska linija', region:'Karavanke', distance:21.8, elevationGain:1810, elevationLoss:1810, highPoint:2236, estimatedTime:'4–5 h', difficulty:'Zelo zahtevna', recommendedBy:runners[0].name, runnerSlug:runners[0].slug, description:'Direktna in tehnična linija na najvišji vrh Karavank.', quote:'' },
  { id:'t3', slug:'nanos-krozna', name:'Nanos krožna', region:'Primorska', distance:18.6, elevationGain:1120, elevationLoss:1120, highPoint:1262, estimatedTime:'3–4 h', difficulty:'Zahtevna', recommendedBy:runners[0].name, runnerSlug:runners[0].slug, description:'Kraški teren, burja in hiter spust z roba planote.', quote:'' },
  { id:'t4', slug:'pohorje-tiha-pot', name:'Pohorje — tiha pot', region:'Pohorje', distance:32.2, elevationGain:1380, elevationLoss:1380, highPoint:1450, estimatedTime:'4–6 h', difficulty:'Zmerna', recommendedBy:runners[0].name, runnerSlug:runners[0].slug, description:'Mehke poti, barja in dolg tekoč teren za vzdržljivost.', quote:'' },
  { id:'t5', slug:'tolminski-grebeni', name:'Tolminski grebeni', region:'Posočje', distance:34.7, elevationGain:2450, elevationLoss:2450, highPoint:1958, estimatedTime:'6–8 h', difficulty:'Zelo zahtevna', recommendedBy:runners[0].name, runnerSlug:runners[0].slug, description:'Odmaknjena visokogorska tura z dolgimi izpostavljenimi odseki.', quote:'' },
  { id:'t6', slug:'slivnica-jutranji-krog', name:'Slivnica — jutranji krog', region:'Notranjska', distance:15.3, elevationGain:760, elevationLoss:760, highPoint:1114, estimatedTime:'2–3 h', difficulty:'Zmerna', recommendedBy:runners[0].name, runnerSlug:runners[0].slug, description:'Kompakten krog nad Cerkniškim jezerom.', quote:'' }
]

export const getTrailRoute = (slug: string) => trailRoutes.find(route => route.slug === slug)
