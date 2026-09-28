# GPX podatki

Izvorne datoteke so v `public/gpx/<dogodek>/` oziroma
`public/gpx/runners/<tekac>/`. Uvoz jih ne spreminja.

Za vsako traso uvoz ustvari štiri samostojne izhode:

| Datoteka                   | Vsebina                                        | Namen                        |
| -------------------------- | ---------------------------------------------- | ---------------------------- |
| `<id>.route.simple.json`   | Poenostavljena trasa, do 80 koordinat          | Kartice in skupni zemljevidi |
| `<id>.route.full.json`     | Vse veljavne izvorne koordinate brez vzorčenja | Polna geometrija             |
| `<id>.profile.simple.json` | Do 64 višinskih točk                           | Majhni višinski profili      |
| `<id>.profile.full.json`   | Višina in razdalja za vsako izvorno točko      | Poln višinski profil         |

Koordinate so vedno `[latitude, longitude]`; Mapbox jih pri izrisu obrne.
Poln profil ohrani `null`, kadar v GPX manjka višina. Manjkajoče višine
se ne pretvarjajo v ničle in se ne uporabljajo za izmišljene profile.

Za obstoječe prikaze ostajata dva združena izhoda:

- `<id>.json`: metapodatki + poenostavljena trasa + majhen profil.
- `<id>.detail.json`: metapodatki + trasa in profil z isto kilometrino,
  vzorčena na 75 m. Zemljevid podrobnosti tekme in premikanje po profilu
  uporabljata ta par, zato ostane povezava med točkama usklajena.

Podrobni prikaz na 75 m ni polna izvorna različica; ta je vedno v datotekah
`.route.full.json` in `.profile.full.json`.

Predogledi tekem so v `public/gpx`. Predogledi tekačev so samo v
`data/gpx/<tekac>`, od koder jih uvozijo strani. Oboji nastanejo z istim
uvoznikom, zato jih ne urejamo ročno.

## Uvoz

### Tek na Šmarno goro

V `public/gpx/tek-na-smarno-goro/` dodaj:

- `rekord-smarne-gore.gpx` — Rekord Šmarne gore, 1,8 km / 360 m vzpona.
- `tek-na-smarno-goro.gpx` — Tek na Šmarno goro, 10 km / 705 m vzpona.

Nato zaženi `npm run gpx:import-all`. Imeni se samodejno povežeta z obema
preizkušnjama; uvoz pripravi vse štiri izhode, predogled, podrobni prikaz
in povezavo za prenos izvornega GPX. Dogodek je že v katalogu tekem.

```sh
npm run gpx:import-all
npm run gpx:import-runners
npm run gpx:import -- public/gpx/runners/nejc-ursic/moja-tura.gpx runners/nejc-ursic moja-tura
```

Novim tekaškim turam nato dodamo naslov, opis, datum ISO in podatke tekača
v `data/runnerGpxRoutes.ts`. Prikazane razdalje in vzponi tekača ostanejo
ločeni od izračunanih GPX statistik. Barve km-effort uporabljajo prikazane
podatke, oblika trase in profila pa izvorni GPX.

`useGpxData` združuje enake zahteve za podrobne podatke v okviru enega
Nuxt okolja. Ne vpisuje velikih tras v stanje, ki se pošilja v HTML.
