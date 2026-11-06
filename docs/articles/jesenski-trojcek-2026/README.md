# Obala / GO4Trail / Lahinja – uredniški paket

## Urejanje besedila

Trenutni uredniški dogovor: nadaljnje spremembe se pripravljajo samo v predogledu. Ukaza za objavo z `--write` ne zaganjaj do izrecne zahteve za končni prenos v objavljeni članek.

Besedilo, naslov in podnaslov urejaj v **`article.md`**. To je izvorni uredniški dokument. `clanek.md` je samodejno ustvarjen izvoz z vstavljenimi tabelami in se ob naslednji izdelavi prepiše. `article-view.json`, `published-article.json` in `preview.html` so prav tako izpeljane datoteke.

Za prenos sprememb na objavljeni članek iz korena projekta zaženi po vrsti:

```powershell
node scripts/render-autumn-trail-article.mjs
node scripts/prepare-autumn-trail-publication.mjs
node scripts/publish-autumn-trail-article.mjs --write
```

Prva dva ukaza samo pripravita datoteke. Tretji posodobi besedilo, naslov in podnaslov v bazi ter preveri zapis. Ohrani trenutno sliko, kategorijo in podatke grafov; ob zaznani sočasni spremembi objave ne prepiše. Objavljena stran bere bazo, zato samo shranjevanje `article.md` še ne spremeni objave. Predpomnilnik vsebine lahko osvežitev odloži do 30 sekund.

Pripravljeno 6. novembra 2026 za napoved tekem 7. novembra. Po odobritvi uporabnika je članek vstavljen v javno vsebinsko bazo `articles`, kategorija **Tekme**, slug `obala-go4trail-lahinja-2026-primerjava`, in je dostopen pod `/journal/obala-go4trail-lahinja-2026-primerjava`. Nova programska podpora za bogati interaktivni prikaz je lokalna; nova izdaja aplikacije na Netlify ni bila izvedena.

- `clanek.md`: ustvarjen izvoz s tabelami in arhivom zmagovalcev; ureja se `article.md`.
- `preview.html`: samostojen predogled s primerjalnim grafom in 11 razširljivimi profili GPX.
- Enotni skrbniški predogled `/journal/predogled` prikaže trenutni članek iz `server/data/journal-draft.json`. Na `/journal` je administratorju viden z rahlo oranžno kartico. API in stran zahtevata skrbniški dostop; predogled ima noindex in ni v zemljevidu strani. Stara stran `/predogled/jesenski-trojcek` je odstranjena. Samostojni HTML ima statično različico grafa z istim merilom in barvami.
- `trase-v-primerjavi.svg` in `.png`: graf za objavo.
- `results.json`: 82 zapisov zmagovalcev po spolu; 80 potrjenih časov. Nominalna razdalja in vir sta shranjena ob vsakem rezultatu.
- `routes.json`: uradne razdalje/vzponi 2026 in ločeno profili GPX z navedbo njihove veljavnosti.
- `knowledge-sources.json` in `import.sql`: sledljiv paket za bazo.
- `sources/`: preneseni uradni PDF rezultati Obale, njihove besedilne pretvorbe, javni izpisi RaceResult za Lahinjo ter uradni GPX GO4Trail 2026.

## Baza

Uvoz v projekt Supabase `favatadzmmqsdocrstti` je bil izveden in preverjen:

- 24 novih zapisov `brain_sources`, vsi s semantičnim vektorjem obstoječega modela.
- 82 strukturiranih zmagovalcev v `brain_entities.metadata.historicalWinners` pri 11 letnih izvedbah. To niso novi profili tekačev.
- Popravljene uradne vrednosti v `race_distances`: GO Trim 13,13 km/+814 m; GO 3V 28,02 km/+1626 m; GO Ultra 63,73 km/+2900 m; Republikanka 31,12 km/+546 m. Reference GPX in drugo gradivo so ohranjeni. Enake vrednosti so v lokalnem rezervnem viru `data/races.ts`.
- Članek je v javni tabeli `articles`; `trailAnalysis` vsebuje HTML pred in za grafom ter podatke za 11 tras. Za nadaljnje urejanje je vir ta zapis v bazi. `published-article.json` je lokalni posnetek objave. Starejši prikaz aplikacije ima tudi besedilno vsebino in statični graf v `sideImages`. Graf PNG je naložen v obstoječi `site-assets`, prenos je preverjen s SHA-256.
- Pogled `Najvišja točka` v skupnem komponentnem grafu zaokroža prikazane vrednosti na cele metre; izvorne višine in razvrščanje ostajajo nespremenjeni.

## Meje raziskave

Obala: 2021–2025, vseh pet razdalj in oba spola. Imena tras in razdalje se spreminjajo. GO4Trail: 2022–2025; Ultra od 2023; za kratko traso 2022 sta potrjeni imeni, časa v poročilu manjkata. Za 2021 rezultati niso potrjeni. Lahinja: oba spola za 2024–2025; prva izvedba 2023 je bila na 8,3 km, zmagovalec in čas v pregledanem poročilu nista navedena. To ni dokaz, da rezultati ne obstajajo.

GO4Trail: podatki zmagovalcev iz uradnih poročil za posamezno leto. Vsebina 2025 je bila dostopna prek uradne angleške različice, medtem ko je slovenska občasno vračala 429. Obala: neposredne povezave PDF so pridobljene iz uradnega arhiva organizatorja, čeprav jih tekstovni spletni bralnik ni prikazal. Lahinja: javni API istega RaceResult seznama, ki je vgrajen na Protime; izvlečena absolutna zmagovalca posameznega spola, ne starostnih kategorij ali skupnega pokala.

Profili GO4Trail so preneseni uradni GPX 2026. Obala in Lahinja uporabljata arhivske GPX projekta; končna skladnost za 2026 ni ponovno potrjena. Višina v GPX ni nujno enaka organizatorjevi navedbi. Uradnih skupnih vzponov nismo zamenjali s surovim seštevkom vseh nihanj višin.

Izvedena preverjanja: uspešen Nuxt typecheck, git diff check, preverjanje števila in unikatnosti rezultatov, ponovni SQL-pregled uvoza ter vizualni pregled lokalnega članka in preklopa grafa na najvišjo točko in nazaj. Pregledana tudi izvozna slika grafa.

## Ponovna izdelava

`node scripts/prepare-autumn-trail-article.mjs` izdela podatke in SQL iz shranjenih virov, ne spreminja baze. `node scripts/render-autumn-trail-article.mjs` izdela Markdown, HTML, SVG in podatke predogleda. PNG se izdela iz SVG z obstoječim paketom Sharp. Uvoz SQL in indeksiranje sta ločena izrecna koraka.
