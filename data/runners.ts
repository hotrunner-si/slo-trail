import type { Runner } from '~/types'

export const runners: Runner[] = [
  { id:'u1', slug:'nika-koren', name:'Nika Koren', location:'Kamnik', favouriteDistance:'50–80 km', bio:'Gorska tekačica, ki najraje povezuje dolge alpske vzpone in tehnične spuste. Demo profil za prikaz prihodnje baze tekačev.', quote:'Najboljša trasa je tista, ki jo želiš takoj ponoviti.', image:'/images/monaco01.jpg', favouriteRouteSlugs:['velika-planina-loop','pohorje-tiha-pot','slivnica-jutranji-krog'] },
  { id:'u2', slug:'luka-berden', name:'Luka Berden', location:'Radovljica', favouriteDistance:'80–120 km', bio:'Vzdržljivostni tekač in ljubitelj dolgih, tehničnih dni v gorah. Vsi dosežki in podatki na profilu so demonstracijski.', quote:'Na ultra razdalji odloča potrpežljivost.', image:'/images/monaco01.jpg', favouriteRouteSlugs:['stol-grebenska-linija','tolminski-grebeni','velika-planina-loop'] },
  { id:'u3', slug:'tina-marolt', name:'Tina Marolt', location:'Postojna', favouriteDistance:'20–45 km', bio:'Trail tekačica, ki išče hitre, razgledne linije med Krasom in Notranjsko. Gre za fiktivno osebo.', quote:'Dober spust je najlepša nagrada za vzpon.', image:'/images/monaco01.jpg', favouriteRouteSlugs:['nanos-krozna','slivnica-jutranji-krog','pohorje-tiha-pot'] }
]

export const getRunner = (slug: string) => runners.find(runner => runner.slug === slug)
