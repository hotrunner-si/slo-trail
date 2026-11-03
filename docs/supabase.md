# Vsebina v Supabase

**Možgan v1 (31. 10. 2026):** računi, zasebne datoteke, povezano znanje,
RLS, iskanje in odobritve so opisani v [mozgan.md](mozgan.md).
Spodnji opis predogledov in začetne selitve je zgodovinski; za trenutne
nastavitve, meje in preskuse Možgana uporabi navedeno dokumentacijo.

Projekt: `slo-trail` (`favatadzmmqsdocrstti`).

## Kaj je preseljeno

| Tabela                  | Vsebina ob selitvi                                                                  |
| ----------------------- | ----------------------------------------------------------------------------------- |
| `races`                 | 39 tekem, skupaj z datumi, ocenami datumov, viri in metapodatki                     |
| `race_distances`        | 115 razdalj, povezave GPX in podatki tras                                           |
| `race_entrants`         | Povezave med tekačem, tekmo in razdaljo; trenutno prazno                            |
| `runners`               | 3 javni profili                                                                     |
| `runner_tours`          | 9 tur s predogledi in podatki GPX                                                   |
| `trail_routes`          | 6 demonstracijskih tras, označenih z `is_demo=true`                                 |
| `articles`              | 2 članka, povezana s tekmami, tekači ali trasami                                    |
| `article_sources`       | 6 navedb virov                                                                      |
| `article_quotes`        | 6 izjav; 2 izmišljeni izjavi imata `is_demo=true`                                   |
| `article_result_groups` | 4 skupine rezultatov                                                                |
| `article_result_rows`   | 49 posameznih rezultatov                                                            |
| `race_hero_photos`      | 39 fotografij tekem z avtorstvom in licencami                                       |
| `runner_photos`         | 20 zapisov o fotografijah tekačev in njihovih virih                                 |
| `site_content`          | Besedila naslovnice, uvodi strani, navigacija, newsletter in osnovni podatki strani |
| `media_assets`          | Inventar 1.010 datotek z velikostjo, SHA-256 in potrditvijo prenosa                 |

Datoteke so v javnem Storage bucketu `site-assets`: fotografije, zemljevidi,
GPX, profili in podrobne trase. Prenesene datoteke so bile prebrane nazaj in
preverjene s SHA-256. Inventar vključuje tudi datoteke, ki jih stran trenutno
ne uporablja. Besedila uporabniškega vmesnika (npr. gumbi filtrov) ostajajo v kodi.

## Ključi

Lokalno v korenski datoteki `.env`:

```dotenv
NUXT_PUBLIC_SUPABASE_URL=https://favatadzmmqsdocrstti.supabase.co
NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
```

Prvi dve vrednosti uporablja stran za branje javne vsebine. Skrivni ključ
uporabljajo samo lokalna orodja za prenos datotek; ni del nastavitve Nuxt in
se ne pošilja v brskalnik. `.env` in njene lokalne različice so izključene iz Git.
`.env.example` vsebuje samo vzorčne vrednosti.

Za objavo v Netlify nastavi prvi dve spremenljivki v nastavitvah okolja za
gradnjo in strežnik. Obstoječe nastavitve Mapbox ohrani. Skrivni ključ za
delovanje javne strani ni potreben.

## Branje in urejanje

`server/api/content.get.ts` bere javno funkcijo `get_site_content()` s pravicami
obiskovalca. Funkcija v eni poizvedbi sestavi povezane zapise. Strežnik hrani
odgovor največ 30 sekund; vsako novo nalaganje strani dobi skupen posnetek.
Komponente med navigacijo uporabljajo že naloženo vsebino. Za prikaz nove
vsebine v že odprti strani jo osveži.

Glavni podatki posameznega zapisa so v stolpcu `data` (JSON). Stolpci s ključi
in tujimi ključi določajo povezave, `position` ohranja vrstni red. Stolpci
`name`, `title` in `country` so izpeljani za lažji pregled; urejaš njihove
vrednosti v `data`. Primarnih identifikatorjev in ponovljenih identifikatorjev
v `data` ne spreminjaj neodvisno. Pri dodajanju povezav članka uskladi tudi
`relatedRace`, `relatedRunner` in `relatedRoute` v `data`.

Obiskovalci lahko berejo vsebinske tabele, ne morejo pa jih spreminjati.
Vse imajo RLS. Pisanje poteka prek zaupanega strežniškega orodja ali Supabase
urejevalnika. Te tabele vsebujejo obstoječo javno vsebino; zasebnih odgovorov
anket se pozneje ne sme dodajati pod ista pravila javnega branja.

`is_demo` in `contains_demo` preprečujeta, da bi pri poznejši gradnji baze
znanja demonstracijsko vsebino obravnavali kot dejstva. Selitev ni novo
preverjanje točnosti datumov, indeksov, rezultatov ali izjav.

Možgan ima tri statične poglede: `/mozgan` (Pregled), `/mozgan/analitika`
(knjižnica prikazov) in `/mozgan/baza` (zapisi in iskalnik virov).
Pregled deli vsebino navpično 40 : 60; zgornja vrstica je razdeljena 60 : 40
med AI pogovor na levi in vprašanje za dopolnjevanje baze na desni.
Njena besedila so v `site_content` pod ključem `mozgan`; začetni posnetek je
`supabase/mozgan.seed.json`, besedila nadzorne plošče pa so pod `mozgan.dashboard`
in v `supabase/mozgan-dashboard.seed.json`. Povezavo v glavi določa `site.navigationCta`.
Aktualna besedila treh pogledov in njihova navigacija so pod `mozgan.workspace`
in v `supabase/mozgan-workspace.seed.json`. Skupna stran `pages/mozgan.vue`
prikazuje podstrani iz `pages/mozgan/`; skupni slog je v `assets/css/brain.css`.
Graf razdalj in vzponov ter števila zbirk uporabljajo dejanske podatke.
Shema povezav je ponazoritev načrtovane zasnove.
Iskalnik in anketa še ne izvajata poizvedb ali shranjujeta odgovorov.
Pomočnik v Pregledu je zasnovan za povezovanje virov in analiz ter sklepanje.
Pomočnik v Bazi je omejen na iskanje izvornih informacij, ne na interpretacijo.

## Gradnja in preverjanje

```text
npm run build
npm run content:verify
node scripts/check-content-pages.mjs
```

Za objavo uporabi Nuxt strežniško gradnjo (`npm run build`). Stran potrebuje
strežniški `/api/content`; zgolj statična objava z `npm run generate` ni prava
pot za sprotno branje iz baze. Spremembe kode še niso objavljene v Netlify.

Preverjanje `content:verify` primerja vse zbirke z izvirnim lokalnim posnetkom
in preveri zavrnitev javnega pisanja. Po kasnejših namernih spremembah v bazi
ujemanja s tem posnetkom ne pričakujemo več.

## Izvirniki in ponovljivost selitve

`data/` in `public/` za zdaj ostajata lokalna varnostna kopija ter vhod v
orodja za pripravo GPX. Stran ju ne uporablja več za kataloge ali vsebinske
fotografije. Urejanje `data/races.ts`, `data/runners.ts` ali člankov zato ne
spremeni objavljene vsebine. Obstoječa orodja in navodila za dodajanje tekačev
še opisujejo pripravo lokalnih datotek: pred objavo novih vsebin je potreben
tudi zapis v Supabase in prenos novih datotek.

`npm run content:export` ustvari izvirni posnetek, vrstične podatke in SQL v
ignorirani mapi `.data/`. Izvoz zajame izvršene koledarske popravke in povezave
GPX, ne samo začetnih vrednosti v datotekah. SQL je namenjen začetnemu uvozu;
obstoječih vrstic ne prepisuje. Ne uporabljaj ga kot sinhronizacijo po začetku
urejanja v Supabase.

`npm run content:upload-assets` prenese manjkajoče ali spremenjene datoteke iz
inventarja `.data/content-assets.json`. Po uspehu vseh datotek omogoči Storage
povezave prek `site_content.assets.ready`. Ponoven prenos lokalno spremenjenih
datotek na istih poteh jih nadomesti v Storage. To je namensko orodje za
upravljavca, ne obiskovalce.

`supabase/schema.sql` je pregledni posnetek začetne sheme; oddaljena zgodovina
selitev je v Supabase. `supabase/security.sql` beleži omejitev dostopa do internih
sprožilnih funkcij, uporabljeno po začetni selitvi. `site-content.seed.json` hrani začetne uredniške nastavitve,
ne predstavlja sprotnega vira podatkov. Vektorska baza in ankete še niso del
te selitve.
