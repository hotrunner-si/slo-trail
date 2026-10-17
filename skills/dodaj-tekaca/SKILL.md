---
name: dodaj-tekaca
description: Dodaj ali dopolni profil tekača na spletni strani Trail Slovenija, skupaj s fotografijo, preverjenimi podatki in po potrebi turami, poiskanimi po datumu v uporabnikovi Stravi ter obdelanimi iz GPX. Uporabi za delo s profili tekačev v tem projektu, ne za splošno urejanje tekem ali člankov.
---

# Dodaj tekača — Trail Slovenija

Delaj v korenu projekta `slo-trail`. Pred spremembami preglej trenutne datoteke in `git status`; ohrani nepovezane uporabnikove spremembe. Profil šteje kot dodan šele, ko je njegov vpis aktiven v `data/runners.ts` in se stran `/runners/<slug>` odpre. Samo kopiranje slik ali GPX datotek ni dovolj.

## Vhodni podatki in viri

- Iz naročila zberi ime tekača, morebitne datume, nazive in kraje aktivnosti, profilne podatke, povezave, fotografije in GPX datoteke. Preveri, ali tekač že obstaja; ohrani njegov slug in ID, če ga dopolnjuješ.
- Dejavnosti in dosežke preveri na razpoložljivih izvornih straneh ali v podatkih, ki jih je dal uporabnik. Ne izmišljaj biografije, kluba, rezultatov, citatov, UTMB Indexa, razdalje ali vzpona. Če manjka podatek, uporabi krajši preverjen opis ali izpusti neobvezno polje, kadar to dopušča prikaz.
- Za predlagano fotografijo preveri vir in pravico do uporabe. Najprej jo prikaži uporabniku v tem pogovoru skupaj z virom in počakaj na njegovo izrecno potrditev izbire. Pred potrditvijo fotografije ne prenašaj ali kopiraj v projekt in je ne vpisuj v podatkovne datoteke. Če uporabnik predlog zavrne, poišči drugo fotografijo in jo ponovno pokaži. V `data/runnerPhotos.json` dodaj izvor, URL in avtorja šele po potrditvi, kadar je ta evidenca smiselna; ta datoteka sama trenutno ne ustvari galerije na profilu.
- Profil je lahko brez tur: `RunnerGpxRoutes.vue` tedaj ne prikaže razdelka. V `pages/runners/[slug].vue` je gumb UTMB trenutno brez pogoja; če UTMB povezave ni, dodaj pogojni prikaz, da ne nastane nedelujoč gumb.

## Iskanje aktivnosti v Stravi

Kadar uporabnik navede datum ali obdobje ture, sam poišči ustrezno aktivnost v njegovi dostopni Stravi. Uporabi povezano aplikacijo, že prijavljeno sejo ali drug dostop, ki ga je uporabnik omogočil. Ne zahtevaj gesla, ne obidi omejitev dostopa in ne objavljaj zasebnih podatkov ali žetonov.

1. Išči po lokalnem datumu aktivnosti, pri mejnih primerih preveri časovni pas, nato primerjaj naslov, kraj, šport, razdaljo in približen vzpon. Za več aktivnosti istega dne ne izberi prvega zadetka na slepo.
2. Preveri, da aktivnost res ustreza naročeni turi in tekaču. Aktivnost na uporabnikovem računu ni samodejno aktivnost novega tekača. Če je lastništvo ali ujemanje nejasno, ture ne pripiši tekaču kot dejstva.
3. Zapiši povezavo ali ID uporabljene aktivnosti med delom. Če dostop dovoljuje izvoz, prenesi GPX v `public/gpx/runners/<slug>/` z razumljivim, enoličnim imenom. Preveri, da datoteka vsebuje veljavne koordinate in da pot ustreza izbrani aktivnosti. Ne nadomesti manjkajočega GPX z GPX druge osebe ali zgolj z načrtovano traso tekme.
4. Če Strava ni povezana, aktivnosti ni mogoče zanesljivo prepoznati ali izvoz ni na voljo, nadaljuj z ostalimi preverjenimi deli profila. Uporabi GPX, ki ga je uporabnik že priložil, samo če ustreza turi; sicer ture ne dodaj v javni katalog. V končnem poročilu natančno povej, kaj je manjkalo in kaj si uporabil namesto tega.

## Profil in fotografija

- Druge podatke in GPX lahko pripravljaš med čakanjem na odgovor o fotografiji. Po uporabnikovi potrditvi shrani izbrano fotografijo v `public/images/runners/<slug>/` in preveri, da je primerna za kartico in portret. Če je prikaz fotografije v pogovoru tehnično nemogoč, to jasno povej in ne shrani slike brez potrditve.
- Ko je fotografija potrjena in shranjena, v `data/runners.ts` dodaj aktiven vpis z enoličnima `id` in `slug`, pravilno zapisanima imenom in krajem, kratkim `bio`, daljšim `longDescription` in veljavno potjo `image`. `Runner` v `types/index.ts` določa obvezna in neobvezna polja; trenutni obvezni polji `quote` in `favouriteRouteSlugs` sta lahko prazni. UTMB in Strava URL ter UTMB Index dodaj le, ko so potrjeni; zunanje povezave preveri.
- Obstoječo zasnovo kartic in strani ohrani. Seznam `/runners` ter domača stran se napajata iz `runners`; vrstni red imenika se ob osvežitvi naključno premeša. V člankih se imena rezultatov povežejo s profilom le ob natančnem ujemanju imena.

## GPX obdelava in prikaz ture

- Za vsako potrjeno turo izberi enoličen ID in zaženi `npm run gpx:import -- public/gpx/runners/<slug>/<datoteka.gpx> runners/<slug> <id>`. Uvoznik ustvari predogled v `data/gpx/<slug>/<id>.json` ter podrobno traso, profil in druge izpeljane datoteke v `public/gpx/runners/<slug>/`. Izhodnih JSON datotek ne popravljaj ročno. Podrobnosti so v `docs/gpx.md`.
- V `data/runnerGpxRoutes.ts` uvozi predogled in dodaj aktiven vpis pod pravilnim slugom: `id`, `title`, preverjen `dateIso`, `location`, `description`, prikazani `distanceKm` in `elevationGain` ter `preview`. Prikazane številke so lahko podatki tekača, medtem ko karta in profil izvirata iz GPX; ob razliki to razloži in ne predstavljaj ene meritve kot druge.
- Aktivna tura se samodejno pojavi na profilu, `/routes` in v izboru za »Turo tedna«. Preden jo aktiviraš, pripravi oba statična zemljevida v `public/images/tour-maps/`: `<slug>-<id>.png` in `<slug>-<id>-portrait.png`. Uporabi `npm run gpx:maps -- <slug>/<id>` in preveri celotno geometrijo ter varen odmik od robov. Za ta ukaz sta potrebna `NUXT_PUBLIC_MAPBOX_TOKEN` in omrežni dostop. Če slik ni mogoče ustvariti, ne pusti aktivne ture z razbitima slikama; dokončaj ostale dele in jasno prijavi omejitev.
- Preveri odpiranje ture, višinski profil, zemljevid in prenos izvornega GPX. Manjkajočih višin ne spreminjaj v ničle in ne izdeluj navideznega profila.

## Preverjanje in poročilo

- Preveri obstoj vseh navedenih datotek in povezav. Za spremenjene datoteke zaženi `npx prettier --check <datoteke>` in `git diff --check`; po posegu v podatke, ki vplivajo na več strani, še `npm run build`, če je izvedljivo. Če build odpove zaradi dovoljenj ali omrežja, loči to od napake v aplikaciji.
- Vizualno preveri kartico tekača, profil in vsako novo turo v brskalniku, če je mogoče. Če resnične naprave nisi preizkusil, to povej.
- Na koncu naštej dodane ali spremenjene dele, vir vsake aktivnosti in GPX, opravljena preverjanja ter vsako nedostopno ali nepotrjeno informacijo. Za vsako vrzel povej, ali si uporabil preverjeno nadomestilo, izpustil polje ali pustil turo neaktivno. Ne trdi, da je delo v celoti končano, če so aktivacija profila, zahtevane ture ali obvezne slike ostale odprte.
