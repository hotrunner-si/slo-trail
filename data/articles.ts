import type { Article } from '~/types'

export const articles: Article[] = [
  {
    id: 'a4',
    slug: 'rekord-smarne-gore-2026-rezultati',
    title: 'Moia in Velepec najhitrejša na jubilejnem Rekordu Šmarne gore',
    subtitle:
      'Tiziano Moia je zmagal med moškimi, Klara Velepec pa med ženskami in izboljšala osebni rekord proge.',
    description:
      'Rezultati 30. Rekorda Šmarne gore 2026: moški top 20, vseh devet uvrščenih žensk in demo izjave tekačev.',
    category: 'Rezultati',
    publishedAt: '2026-10-10',
    image: '/images/race-heroes/tek-na-smarno-goro.jpg',
    body: [
      'Rekord Šmarne gore je 26. septembra 2026 dočakal jubilejno, 30. izvedbo. Tekače je iz Tacna na vrh čakalo približno 1,8 kilometra poti in 360 metrov vzpona.',
      'Med moškimi je zmagal Italijan Tiziano Moia s časom 11:07. Klemen Španring je bil najhitrejši Slovenec na drugem mestu (11:20), tretji pa Rok Bratina (11:30). Moia je za rekordom proge, ki ga je leta 2025 postavil Richard Atuya s časom 10:33, zaostal 34 sekund.',
      'Žensko konkurenco je dobila Klara Velepec s časom 13:36. S tem je izboljšala svoj osebni rekord za približno minuto. Uradni zapisnik navaja devet uvrščenih tekmovalk, zato so spodaj objavljeni vsi njihovi rezultati.',
    ],
    results: [
      {
        heading: 'Moški — najboljših 20',
        rows: [
          { place: 1, name: 'Tiziano Moia', time: '11:07' },
          { place: 2, name: 'Klemen Španring', time: '11:20' },
          { place: 3, name: 'Rok Bratina', time: '11:30' },
          { place: 4, name: 'Sándor Szabo', time: '11:34' },
          { place: 5, name: 'Maj Pritržnik', time: '11:41' },
          { place: 6, name: 'Martin Nilsson', time: '11:49' },
          { place: 7, name: 'Jaka Bostner', time: '12:05' },
          { place: 8, name: 'Jaka Marinko', time: '12:10' },
          { place: 9, name: 'Tomaž Oblak', time: '12:38' },
          { place: 10, name: 'Žiga Jan Novak', time: '12:40' },
          { place: 11, name: 'Tadej Serdinšek', time: '12:45' },
          { place: 12, name: 'Anže Mošnik', time: '13:04' },
          { place: 13, name: 'Matej Letojne', time: '13:13' },
          { place: 14, name: 'Blaž Marinč', time: '13:31' },
          { place: 15, name: 'Nejc Uršič', time: '13:35' },
          { place: 16, name: 'David Vogrin', time: '13:44' },
          { place: 17, name: 'Simon Novak', time: '13:58' },
          { place: 18, name: 'Miha Schaffer', time: '14:02' },
          { place: 19, name: 'Denis Končar', time: '14:04' },
          { place: 20, name: 'Tone Šušteršič', time: '14:13' },
        ],
      },
      {
        heading: 'Ženske — uradno uvrščenih devet',
        rows: [
          { place: 1, name: 'Klara Velepec', time: '13:36' },
          { place: 2, name: 'Arianna Del Pino', time: '14:38' },
          { place: 3, name: 'Kitti Posztos', time: '14:56' },
          { place: 4, name: 'Ana Hernandez', time: '15:46' },
          { place: 5, name: 'Sara Bilban', time: '16:23' },
          { place: 6, name: 'Vesna Pavlovič', time: '18:17' },
          { place: 7, name: 'Urška Trobec', time: '19:37' },
          { place: 8, name: 'Ivica Žlogar', time: '20:45' },
          { place: 9, name: 'Dragica Cvišić', time: '22:20' },
        ],
      },
    ],
    editorialNote:
      'Demo vsebina: izjave spodaj so izmišljene ponazoritvene predloge, ne dejanske izjave tekačev. Pred uporabo jih zamenjajte s potrjenimi izjavami.',
    quotes: [
      {
        attribution: 'Klemen Španring — izmišljena demo-izjava',
        text: 'Na startu sem se počutil dobro pripravljenega, vendar sem vedel, da bo treba od začetka držati visok ritem. Prvi del sem odtekel odločno, v strmini pa sem se osredotočil na vsak naslednji korak. V cilj sem prišel povsem izpraznjen, a zadovoljen, ker sem iz sebe iztisnil največ. Drugo mesto in čas 11:20 sta zame lep rezultat, čeprav si vedno želiš še kakšno sekundo manj. Ta tek mi daje dobro izhodišče za naslednje nastope.',
      },
      {
        attribution: 'Klara Velepec — izmišljena demo-izjava',
        text: 'Na start sem šla z željo, da odtečem po občutku in ne razmišljam preveč o času. Že spodaj sem začutila, da imam dober dan, zato sem lahko vzdrževala močan ritem. Zadnji del je bil zelo naporen, toda osredotočila sem se na cilj in nadaljevala do vrha. Z zmago in časom 13:36 sem zelo zadovoljna, še posebej, ker sem izboljšala svoj osebni rekord. Lepo je, ko se trening in trud pokažeta prav na domači tekmi.',
      },
      {
        attribution: 'Tomaž Oblak — izmišljena demo-izjava',
        text: 'Tako kratka proga te prisili, da začneš zbrano in hitro poiščeš pravi ritem. Med vzponom sem se trudil razporediti moči, čeprav je bilo najtežje ostati miren v strmejšem delu. V cilju sem bil utrujen, hkrati pa vesel, da sem tek opravil brez večjih težav. Deveto mesto in čas 12:38 sta lep rezultat, s katerim sem zadovoljen. Zdaj imam še nekaj idej, kaj lahko pri naslednjem poskusu naredim bolje.',
      },
      {
        attribution: 'Avtor članka — izmišljena demo-izjava',
        text: 'Na start sem prišel z jasnim ciljem, a sem vedel, da je vzpon kratek in da ne dopušča veliko popravnih poskusov. Ko je postalo najtežje, sem se osredotočil na ritem in na naslednjih nekaj korakov. V cilju sem bil izčrpan, vendar vesel, da sem dal vse od sebe. Z doseženim rezultatom sem zadovoljen, ker sem uspel izpeljati načrt in tek končati z občutkom, da sem pustil vse na progi. Ta nastop mi je pokazal, kaj želim izboljšati do naslednjega leta.',
      },
    ],
    sources: [
      {
        label: 'Uradni rezultati moških — TIMING Ljubljana',
        url: 'https://timingljubljana.si/rezultati.aspx?disc=M&embed=&idTekme=7065&tip=B',
      },
      {
        label: 'Uradni rezultati žensk — TIMING Ljubljana',
        url: 'https://timingljubljana.si/rezultati.aspx?disc=Z&embed=&idTekme=7065&tip=B',
      },
      {
        label: 'Podatki in poročilo organizatorja',
        url: 'https://www.smarnogorski-teki.si/sl/rekord-sg',
      },
    ],
  },
  {
    id: 'a1',
    slug: 'julijske-alpe-80k-preview',
    title: 'Julian Alps 80K: kje se bo tekma odločila',
    subtitle: 'Demo uredniška vsebina',
    description: 'Pet odsekov, ki bodo oblikovali ritem dolgega alpskega dne.',
    category: 'Tekme',
    publishedAt: '2026-09-17',
    image: '/images/verbier03.jpg',
    relatedRace: 'julian-alps-trail-run',
    body: [
      'Prvih dvajset kilometrov je varljivih. Profil še ne pokaže svoje prave teže, zato bo nadzor ritma pomembnejši od položaja v skupini.',
      'Osrednji vzpon je dolg in izpostavljen. Tu se začne prava tekma: ne z napadom, ampak z odločitvijo, koliko energije pustiti za zadnji spust.',
      'Zadnjih dvanajst kilometrov nagradi tekače, ki ostanejo zbrani. Tehnično niso najtežji, so pa po osmih urah dovolj zahtevni, da hitro kaznujejo napake.',
    ],
  },
  {
    id: 'a2',
    slug: 'kako-brati-visinski-profil',
    title: 'Kako brati višinski profil, preden stopiš na start',
    subtitle: 'Demo uredniška vsebina',
    description: 'Naklon je le začetek. Pomembni so dolžina, teren in položaj vzpona v tekmi.',
    category: 'Trening',
    publishedAt: '2026-09-13',
    image: '/images/kv01.jpg',
    relatedRoute: 'velika-planina-loop',
    body: [
      'Skupni višinski metri povedo malo o ritmu trase. En sam dolg vzpon zahteva drugačno razporeditev moči kot deset kratkih, ostrih ponovitev.',
      'Poglej, kje so vzponi, kako dolgi so in kakšen spust jim sledi. Šele kombinacija teh podatkov opiše resnično zahtevnost.',
      'Profil nato prevedi v načrt: kje boš hodil, kje jedel in kje lahko brez tveganja dvigneš tempo.',
    ],
  },
  {
    id: 'a3',
    slug: 'nejc-ursic-trail-profil',
    title: 'Nejc Uršič: hitrost na stezah in vzdržljivost v gorah',
    subtitle: 'Demo uredniška vsebina',
    description: 'UTMB Index, rezultati in trail izkušnje Nejca Uršiča.',
    category: 'Ljudje',
    publishedAt: '2026-09-08',
    image: '/images/monaco01.jpg',
    relatedRunner: 'nejc-ursic',
    body: [
      'Nejc Uršič tekmuje za KGT Papež. Njegov UTMB profil navaja aktualni indeks 758, z indeksi po kategorijah 20K 759, 50K 642 in 100K 604.',
      'Med njegovimi rezultati so 50-kilometrska Sky Trail preizkušnja Julian Alps Trail Run by UTMB leta 2025 ter nastopi na UTVV in Soča Outdoor Festivalu.',
      'Podatki o indeksu in rezultatih se spreminjajo. Aktualni profil in dosežke si oglejte na njegovem UTMB profilu.',
    ],
  },
]

export const getArticle = (slug: string) => articles.find((article) => article.slug === slug)
