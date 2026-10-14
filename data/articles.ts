import type { Article } from '~/types'

export const articles: Article[] = [
  {
    id: 'a1',
    slug: 'julian-alps-trail-run-2026-rezultati',
    title: 'Klara Velepec zmagala na 25 km, Tomaž Oblak deseti na 50 km',
    subtitle:
      'Najboljših deset žensk na Kranjska Gora 25K in najboljših deset moških na Sky Trail 50K.',
    description:
      'Rezultati Julian Alps Trail Run by UTMB 2026: najboljših deset žensk na 25 km in moških na 50 km ter izjava Klare Velepec.',
    category: 'Rezultati',
    publishedAt: '2026-09-25',
    image: '/images/julian-alps-2026/julian-alps-sunset.webp',
    sideImages: [
      {
        src: '/images/runners/klara-velepec/klara-jatr-cilj.jpg',
        alt: 'Pogled na Mojstrano in okoliške vrhove Julijskih Alp ob sončnem zahodu',
        sourceUrl: '',
        caption: 'Klara kot prva ženska na 25 km',
      },
      {
        src: '/images/runners/klara-velepec/klara-jatr-top3.jpg',
        alt: 'Pogled na Mojstrano in okoliške vrhove Julijskih Alp ob sončnem zahodu',
        sourceUrl: '',
        caption: 'Prve tri ženske v cilju',
      },
      {
        src: '/images/julian-alps-2026/greben-golica.jpg',
        alt: 'Pogled na Mojstrano in okoliške vrhove Julijskih Alp ob sončnem zahodu',
        sourceUrl: '',
        caption: 'Golica in Julijci v ozadju',
      },
    ],
    body: [
      'Na Julian Alps Trail Run by UTMB 2026 je Klara Velepec zmagala med ženskami na preizkušnji Kranjska Gora 25K s časom 2:00:36. V moški konkurenci Sky Trail 50K je Tomaž Oblak zasedel deseto mesto s časom 5:13:52.',
      'Spodaj sta najboljši deseterici po uradni lestvici UTMB. Oznaka 50K je ime preizkušnje; objavljena dolžina trase je 55 kilometrov.',
      'Stolpec UTMB score prikazuje oceno dosežka na tej tekmi. Vrednosti so bile posredovane za objavo; javna lestvica UTMB jih prikaže šele po prijavi.',
    ],
    results: [
      {
        heading: 'Ženske — Kranjska Gora 25K',
        participantLabel: 'Tekačica',
        showUtmbScore: true,
        rows: [
          { place: 1, name: 'Klara Velepec', time: '2:00:36', utmbScore: 731 },
          { place: 2, name: 'Linda Meridio', time: '2:11:46', utmbScore: 669 },
          { place: 3, name: 'Nuša Mali', time: '2:13:21', utmbScore: 661 },
          { place: 4, name: 'Silvia Álvarez Marqués', time: '2:14:27', utmbScore: 656 },
          { place: 5, name: 'Sophie Lechner', time: '2:15:05', utmbScore: 653 },
          { place: 6, name: 'Jolanta Papiór', time: '2:15:27', utmbScore: 651 },
          { place: 7, name: 'Dominika Duczmal', time: '2:17:04', utmbScore: 643 },
          { place: 8, name: 'Caterina Bellina', time: '2:18:11', utmbScore: 638 },
          { place: 9, name: 'Dorina Ruzsovics', time: '2:20:50', utmbScore: 626 },
          { place: 10, name: 'Klara Malikova', time: '2:21:11', utmbScore: 624 },
        ],
      },
      {
        heading: 'Moški — Sky Trail 50K',
        participantLabel: 'Tekač',
        showUtmbScore: true,
        rows: [
          { place: 1, name: 'Dominik Hohenleitner', time: '4:38:05', utmbScore: 885 },
          { place: 2, name: 'Loic Rolland', time: '4:43:07', utmbScore: 870 },
          { place: 3, name: 'Aleksandar Stojkoski', time: '4:48:35', utmbScore: 853 },
          { place: 4, name: 'Johannes Dörr', time: '4:48:44', utmbScore: 853 },
          { place: 5, name: 'Josip Meštrić', time: '4:54:36', utmbScore: 836 },
          { place: 6, name: 'Wendelin Mörtendorfer', time: '4:56:44', utmbScore: 830 },
          { place: 7, name: 'George Foster', time: '5:05:00', utmbScore: 807 },
          { place: 8, name: 'Loris Kaufmann', time: '5:09:49', utmbScore: 795 },
          { place: 9, name: 'Dario Moitoso', time: '5:10:00', utmbScore: 794 },
          { place: 10, name: 'Tomaž Oblak', time: '5:13:52', utmbScore: 785 },
        ],
      },
    ],
    editorialNote:
      'Izjavo Klare Velepec je posredovala za objavo. Izjava Tomaža Oblaka je izmišljena demo predloga in ni njegova resnična izjava.',
    quotes: [
      {
        attribution: 'Klara Velepec',
        runnerSlug: 'klara-velepec',
        text: [
          'Julian Alps sem odtekla res odlično, točno po načrtu, ki sva ga zastavila s Klemenom. Vedela sem, da sem lahko hitra v klanec, prijetno pa sem presenetila samo sebe tudi na ravninskih delih, kjer nisem pričakovala, da lahko tečem tako hitro. Ves čas sem imela ob sebi tekmovalca, kar je bilo super, saj sva drug drugega spodbujala in si pomagala držati tempo.',
          'Ko sem se na zadnjem klancu na progi proti Vitrancu začela zavedati, da bo končni čas okoli dveh ur, sem si potihem zaželela, da bi ciljno črto prečkala pod to mejo. Žal so me v zadnjem kilometru nekoliko ustavili krči, tako da bom čas pod dvema urama lovila v prihodnjih letih.',
          'S svojim nastopom sem zelo zadovoljna, čas pa me ni presenetil, saj je pravzaprav odraz vsega dela, ki ga vlagam v treninge. Za to treniram in lepo je videti, da se trud na koncu pokaže tudi na tekmi.',
          'Koledarja za prihodnje leto še nimam sestavljenega, a če se vrnem na Julian Alps, bom verjetno ostala na isti razdalji. Za za daljše preizkušnje imam še čas.',
        ].join('\n\n'),
      },
      {
        attribution: 'Tomaž Oblak — izmišljena demo-izjava',
        text: 'Na daljši trasi sem si želel predvsem enakomerno razporediti moči. Zadovoljen sem, da sem prišel v cilj med najboljšo deseterico. Takšna tekma mi da veliko izkušenj in motivacije za naslednje izzive.',
      },
    ],
    sources: [
      {
        label: 'Uradni rezultati žensk — Kranjska Gora 25K (UTMB)',
        url: 'https://utmb.world/utmb-index/races/24707.julianalpstrailrunbyutmbkranjskagora25k.2026',
      },
      {
        label: 'Uradni rezultati žensk — nadaljevanje lestvice (UTMB)',
        url: 'https://utmb.world/utmb-index/races/24707.julianalpstrailrunbyutmbkranjskagora25k.2026?page=2',
      },
      {
        label: 'Uradni rezultati moških — Sky Trail 50K (UTMB)',
        url: 'https://utmb.world/utmb-index/races/24705.julianalpstrailrunbyutmbskytrail50k.2026',
      },
    ],
    relatedRace: 'julian-alps-trail-run-by-utmb',
    relatedRunner: 'klara-velepec',
  },
  {
    id: 'a2',
    slug: 'rekord-smarne-gore-2026-rezultati',
    title: 'Moia in Velepec najhitrejša na jubilejnem 30. Rekordu Šmarne gore',
    subtitle:
      'Tiziano Moia je zmagal med moškimi, Klara Velepec pa med ženskami in izboljšala osebni rekord proge.',
    description:
      'Rezultati 30. Rekorda Šmarne gore 2026: moški top 20, vseh devet uvrščenih žensk in izjave tekačev.',
    category: 'Rezultati',
    publishedAt: '2026-10-01',
    image: '/images/rekord-smarne-gore-2026/rekord-naslovna.webp',
    sideImages: [
      {
        src: '/images/rekord-smarne-gore-2026/Rekord-start-moski.webp',
        alt: 'Moški tekači na startu Rekorda Šmarne gore 2026',
        sourceUrl: '/images/rekord-smarne-gore-2026/Rekord-start-moski.webp',
        caption: 'Start moške tekme.',
      },
      {
        src: '/images/rekord-smarne-gore-2026/Rekord-Smarne-gore-2026-0152.webp',
        alt: 'Utrinek s tekme Rekord Šmarne gore 2026',
        sourceUrl: '/images/rekord-smarne-gore-2026/Rekord-Smarne-gore-2026-0152.webp',
        caption: 'Boj za drugo mesto.',
      },
      {
        src: '/images/rekord-smarne-gore-2026/Rekord-Smarne-gore-2026-0145.webp',
        alt: 'Utrinek s tekme Rekord Šmarne gore 2026',
        sourceUrl: '/images/rekord-smarne-gore-2026/Rekord-Smarne-gore-2026-0145.webp',
        caption: 'Tiziano Moia.',
      },
      {
        src: '/images/rekord-smarne-gore-2026/Rekord-Smarne-gore-2026-0023.webp',
        alt: 'Utrinek s tekme Rekord Šmarne gore 2026',
        sourceUrl: '/images/rekord-smarne-gore-2026/Rekord-Smarne-gore-2026-0023.webp',
        caption: 'Klara Velepac.',
      },
      {
        src: '/images/rekord-smarne-gore-2026/Rekord-Smarne-gore-2026-0037.webp',
        alt: 'Utrinek s tekme Rekord Šmarne gore 2026',
        sourceUrl: '/images/rekord-smarne-gore-2026/Rekord-Smarne-gore-2026-0037.webp',
        caption: 'Arianna Del Pino.',
      },
      {
        src: '/images/rekord-smarne-gore-2026/Rekord-Smarne-gore-2026-0041.webp',
        alt: 'Utrinek s tekme Rekord Šmarne gore 2026',
        sourceUrl: '/images/rekord-smarne-gore-2026/Rekord-Smarne-gore-2026-0041.webp',
        caption: 'Kitti Poztos.',
      },
      {
        src: '/images/rekord-smarne-gore-2026/Rekord-Smarne-gore-2026-92.webp',
        alt: 'Tekač v cilju Rekorda Šmarne gore 2026',
        sourceUrl: '/images/rekord-smarne-gore-2026/Rekord-Smarne-gore-2026-92.webp',
        caption: 'Klemen Španring.',
      },
      {
        src: '/images/rekord-smarne-gore-2026/Rekord-Smarne-gore-2026-68.webp',
        alt: 'Tekmovalka v cilju Rekorda Šmarne gore 2026',
        sourceUrl: '/images/rekord-smarne-gore-2026/Rekord-Smarne-gore-2026-68.webp',
        caption: 'Dragica Cvišič za KGT Papež.',
      },
      {
        src: '/images/rekord-smarne-gore-2026/Rekord-Smarne-gore-2026-0305.webp',
        alt: 'Utrinek s cilja Rekorda Šmarne gore 2026',
        sourceUrl: '/images/rekord-smarne-gore-2026/Rekord-Smarne-gore-2026-0305.webp',
        caption: 'Utrujeni tekmovalci.',
      },
      {
        src: '/images/rekord-smarne-gore-2026/Rekord-Smarne-gore-2026-zenske-zmagovalke.webp',
        alt: 'Zmagovalke Rekorda Šmarne gore 2026 na podelitvi',
        sourceUrl: '/images/rekord-smarne-gore-2026/Rekord-Smarne-gore-2026-zenske-zmagovalke.webp',
        caption: 'Ženske zmagovalke.',
      },
      {
        src: '/images/rekord-smarne-gore-2026/Rekord-Smarne-gore-2026-moski-zmagovalci.webp',
        alt: 'Zmagovalci moške tekme Rekorda Šmarne gore 2026',
        sourceUrl: '/images/rekord-smarne-gore-2026/Rekord-Smarne-gore-2026-moski-zmagovalci.webp',
        caption: 'Moški zmagovalci.',
      },
    ],
    body: [
      'Rekord Šmarne gore je 26. septembra 2026 dočakal jubilejno, 30. izvedbo. Tekače je iz Tacna na vrh čakalo približno 1,8 kilometra poti in 360 metrov vzpona.',
      'Med moškimi je zmagal Italijan Tiziano Moia s časom 11:07. Klemen Španring je bil najhitrejši Slovenec na drugem mestu (11:20), tretji pa Rok Bratina (11:30). Moia je za rekordom proge, ki ga je leta 2025 postavil Richard Atuya s časom 10:33, zaostal 34 sekund.',
      'Žensko tekmo je dobila Klara Velepec s časom 13:36. S tem je izboljšala svoj osebni rekord za približno minuto. Drugouvrščeno Arianno Del Pino je premagala za več kot minuto in tretjeuvrščeno Kitti Poztos za 1 minuto in 20 sekund.',
    ],
    results: [
      {
        heading: 'Ženske — vseh 9',
        participantLabel: 'Tekačica',
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
      {
        heading: 'Moški — najboljših 20',
        participantLabel: 'Tekač',
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
    ],
    editorialNote:
      'Izjavi Klare Velepec in Klemna Španringa sta bili posredovani za objavo. Izjava Tomaža Oblaka pa je izmišljena demo predloga.',
    quotes: [
      {
        attribution: 'Klemen Španring',
        runnerSlug: 'klemen-spanring',
        text: [
          'Letošnja priprava na Rekord je bila nekoliko drugačna kot prejšnja leta, saj sem se letos posvetil predvsem daljšim tekmam na 50 km in več. Tako v pripravi nisem opravil nobenega hitrejšega treninga, na katerem bi treniral pri laktatu.',
          'Načrt za tekmo je bil zato začeti pametno in v drugi polovici pridobivati. Roka in Szaba sem ujel šele na sedlu, a ker sem do tja prišel malenkost bolj svež, sem ju lahko hitro pustil za sabo. Moia pa je bil malenkost premočan zame, zato ga nisem uspel ujeti.',
          'Prav tako mi ni uspelo izboljšati osebnega rekorda, ki še vedno znaša 11:12. Cilj je, da ga v prihodnje še izboljšam in pridem pod 11 minut, kar pa se mi ob pravi pripravi ne zdi tako nemogoče.',
        ].join('\n\n'),
      },
      {
        attribution: 'Klara Velepec',
        runnerSlug: 'klara-velepec',
        text: [
          'S svojim letošnjim časom 13:36 sem res zelo zadovoljna, saj sem osebni rekord izboljšala za skoraj minuto, česar iskreno nisem pričakovala. Med tekmo namreč nisem imela občutka, da tečem toliko hitreje kot prejšnja leta, zato me je končni rezultat še toliko bolj razveselil.',
          'Verjamem, da bi ob močnejši konkurenci lahko tekla še hitreje, saj v zadnjem delu proge nisem dala čisto vsega od sebe, saj za mano ni bilo nobene tekmovalke, naslednji dan pa me je čakala še ena tekma. ',
          'Kljub temu mi rezultat veliko pomeni, ker potrjuje mojo dobro pripravljenost in je trenutno drugi najboljši slovenski čas. Po letošnjem rezultatu se mi tudi slovenski rekord ne zdi več tako oddaljen kot nekoč. Potihoma pa si želim tudi nekoč poseči po rekordu Andree Mayr, ki znaša 12.36min. To je za zdaj še oddaljen cilj, a prav takšni cilji me motivirajo, da še naprej napredujem in premikam svoje meje.',
        ].join('\n\n'),
      },
      {
        attribution: 'Tomaž Oblak — izmišljena demo-izjava',
        text: 'Tako kratka proga te prisili, da začneš zbrano in hitro poiščeš pravi ritem. Med vzponom sem se trudil razporediti moči, čeprav je bilo najtežje ostati miren v strmejšem delu. V cilju sem bil utrujen, hkrati pa vesel, da sem tek opravil brez večjih težav. Deveto mesto in čas 12:38 sta lep rezultat, s katerim sem zadovoljen. Zdaj imam še nekaj idej, kaj lahko pri naslednjem poskusu naredim bolje.',
      },
      {
        attribution: 'Nejc Uršič',
        runnerSlug: 'nejc-ursic',
        text: [
          'Šmarnogorski teki so letos zame pomenili zaključek tekmovalne sezone. Končal bi jo že prej, ampak mi je zelo všeč trasa nedeljskega teka in celotna organizacija.',
          'Od sobotnega Rekorda nisem pričakoval veliko, ker mi ta format tekme ni ravno všeč. Vseeno pa je del dogodka in zelo dober pokazatelj forme in pozicije med najboljšimi slovenskimi tekači. Dosegel sem 15. mesto, kar sem tudi nekako pričakoval.',
          'Želel sem podreti svoj rekord, kar mi je s časom 13.35 uspelo za 32 sekund. Rad pa bi natreniral in izboljašal svoj čas za vsaj še minuto. Nekoč pa bi raz tekel pod 11.59.',
        ].join('\n\n'),
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
]

export const getArticle = (slug: string) => articles.find((article) => article.slug === slug)
