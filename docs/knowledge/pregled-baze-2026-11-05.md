# Pregled baze znanja — 5. november 2026

Preverjeno z neposrednimi poizvedbami v projektu Supabase `favatadzmmqsdocrstti` in pregledom lokalne strežniške kode. Številke spodaj so stanje **pred prvim raziskovalnim uvozom**.

## Trenutna vsebina

| Podatek | Število |
| --- | ---: |
| Tekme v javnem katalogu | 39 |
| Razdalje v javnem katalogu | 115 |
| Javni tekači | 3 |
| Članki | 2 |
| Predmeti znanja | 157 (39 tekem, 115 razdalj, 3 tekači) |
| Viri znanja | 155, vsi `editorial` |
| Viri s povezavo URL | 40 |
| Viri z datumom preverjanja | 1 |
| Viri z iztekom veljavnosti | 0 |
| Viri z vektorjem za pomensko iskanje | 0 |
| Povezave med predmeti | 115 |
| Raziskovalna vprašanja | 115 |
| Skupnostne ugotovitve / prispevki | 0 / 0 |
| Deljeni pogovori | 0 |

Ni natančnih podvojitev kombinacije predmet + URL + naslov. 37 izvlečkov je krajših od 100 znakov; 3 predmeti nimajo svojega vira. V izvlečkih ni zadetkov za »demo« ali »izmišljen«; to ni dokaz, da so vsi podatki preverjeni. Vseh 5 pregledanih tabel znanja/skupnosti ima vključeno RLS; to ni celovit varnostni pregled vseh politik.

GO4Trail je imel pred uvozom samo kratek uredniški zapis z datumom in tri zapise razdalj; Obala en tak zapis in pet razdalj. Zapisi razdalj so predvsem besedilni izvozi JSON kataloga brez neposredne povezave do uradnega vira. Opisi pravil, opreme, logistike in okrepčevalnic so manjkali.

## Kako so podatki shranjeni

1. **Javni katalog:** tabele `races`, `race_distances`, `runners`, `articles`, `trail_routes`, `runner_tours` in povezane tabele. Vrstice vsebujejo identifikatorje in strukturirani `data` JSONB. `site_content` hrani vsebinske/nastavitvene sklope, ne vseh tekem. Funkcija `get_site_content()` sestavi javni odziv za stran. API ga predpomni za 30 sekund.
2. **Predmeti znanja:** `brain_entities` identificira tekmo, razdaljo, letno izvedbo, traso, odsek, tekača, rezultat itd. Tipi za izvedbe že obstajajo, vendar pred tem uvozom nobena izvedba še ni bila vnesena. `brain_relations` povezuje npr. izvedbo s tekmo (`edition_of`) in razdaljo s tekmo (`distance_of`).
3. **Dokazni viri:** `brain_sources` vsebuje predmet, naslov, vsebinski izvleček, URL, izvor (`official`, `editorial`, `unverified`, `community`), datum preverjanja in časovno veljavnost. `legacy_key` omogoča stabilen ključ za ponovljiv uvoz. Indeks `search` se samodejno izračuna iz naslova in izvlečka. Vektor in ime modela sta ločeni, trenutno prazni polji.
4. **Izkušnje:** `brain_claims`, `brain_contributions`, `brain_questions`, `brain_answers`. Izkušnja ima leto in razmere; potrditve računov so ločene od uradnih dokazov. Zasebni povzetki, datoteke in čakajoči prispevki niso javno gradivo klepeta.
5. **Deljeni pogovori:** `brain_shared_conversations` hrani izrecno deljeni posnetek. Klepet ga lahko najde kot nepreverjeno razpravo; odgovor AI ni uradno dejstvo.

Klepet sproti bere javni katalog in uradne/uredniške vire. Ločena stran Baza uporablja iskanje prek podatkovne funkcije; pomensko iskanje potrebuje posebej izdelane vektorje. Trenutno deluje besedno iskanje. Dodajanje vira ne pomeni učenja modela.

## Kako bomo shranjevali nove podatke

- Raziskovalni paket ostane v repozitoriju kot JSON z URL-ji, kratkimi povzetki, letom in odprtimi vprašanji. Besedilo je povzetek dejstev, ne kopija celotnega spletnega mesta.
- Vsaka tekma obdrži obstoječi predmet; potrjena letna izvedba dobi svoj predmet, leto ter povezavo `edition_of`. Podatki, veljavni samo za določeno izvedbo, sodijo k njej.
- Vir razdelimo po uporabnih temah: datum, posamezna trasa, oprema, urnik, prevzem številk, prevoz, pravila, rezultati. Naslov in izvleček vsebujeta ime tekme ter leto, da sta najdljiva tudi brez izbrane teme.
- Zabeležimo datum dejanskega pregleda, uradni URL in obseg veljavnosti. Datum pregleda ni datum objave dokumenta in ne jamstvo pravilnosti. Neletno označena stran se ne spremeni samodejno v dokaz za leto 2026.
- Neskladja v uradnih virih so izrecno zapisana. Če ne moremo določiti veljavne različice, ne izberemo številke po občutku. Kritične manjkajoče podatke usmeri odgovor na najnovejša navodila organizatorja.
- Uvoz uporablja stabilne ključe. Ponovitev istega paketa posodobi iste zapise; naslednje leto dobi nove ključe in izvedbo, da se zgodovina ne prepiše. Pri spremembi besedila se vektor razveljavi in pozneje ponovno izdela.
- Dodajanje v `brain_sources` **ne posodobi samodejno javnega kataloga**. Spremembe razdalj, datumov ali vzponov v `races`/`race_distances` zahtevajo ločeno, preverjeno uskladitev. Pri prvem paketu najprej ohranimo izvor in odkrijemo razlike.
- Pred ponovnim uvozom ne izvajamo starega začetnega seeda čez živo bazo. Uvoz je transakcijski, omejen na lastne ključe in po njem preverimo število zapisov ter iskanje.

## Vrstni red

1. GO4Trail in Obala Ultra Trail — podrobna prva paketa.
2. Lahinja Trail, Čaven run, Knap Trail, Pol šihta na Farbanco — najprej preverjanje terminov in izvedb.
3. Najbolj priljubljene tekme — izbor po uredniških priljubljenih; to še ni lestvica dejanske obiskanosti.

Pri širitvi bo treba nadgraditi upravljanje različic, samodejno zaznavanje zastarelosti ter usklajevanje javnega kataloga z dokazi. Trenutna časovna polja sama po sebi niso mehanizem samodejnega umika ali osveževanja.

## Izvedeni prvi uvoz

V živo bazo je bilo transakcijsko dodanih **34 virov**: 17 za GO4Trail (vsi uradni) in 17 za Obalo (16 uradnih, 1 uredniški povzetek organizatorjeve objave pri STO). Baza ima zdaj **189 virov in 159 predmetov**, vključno z dvema izvedbama 2026 in njunima povezavama `edition_of`. Neposredna poizvedba je potrdila število ter najdljivost novih zapisov po besedah.

Zapisi z izrecno letnico imajo `valid_until = 2026-12-31`, kot uredniško omejitev uporabe za to izdajo, ne kot organizatorjev datum izteka pravil. `valid_from` je prazen, ker začetka veljavnosti nismo dokazali. Tri neletno označene strani Obale so povezane s samo tekmo, brez izmišljene letnice ali veljavnosti. Uvoz ne vključuje neprebranih priponk kot dokazov; njihove povezave in status so v raziskovalnih JSON datotekah.

Pomembne odprte točke:

- GO4Trail: uradna trasa GO Trim Škabrijel ima 13,13 km/+814 m; v javnem katalogu je še 13 km/+640 m. GO3V uradno 28,02 km/+1626 m (katalog 28/+1700), Ultra 63,73 km/+2900 m (katalog 64/+3060). Katalog in lokalni GPX še nista usklajena; starega GPX ne obravnavamo kot preverjeno traso 2026.
- Obala: neskladni ciljni limiti 11/17/35 km, ime prve okrepne 35 km in temperaturne/vetrne zahteve opreme. Opozorila so vključena neposredno v izvlečkih, ki jih prejme klepet.
- Uradna vodnika PDF in vsebine GPX še niso analizirani; posamezne povezave so zbrane. Zadnja vremenska obvestila družbenih omrežij niso potrjena. Rezultatov 2026 pred dogodkoma nismo ustvarili.

Lokalna koda iskanja zdaj razvrsti do 80 kandidatov pred izborom največ 12 virov. Upošteva relevantnost, izrecno leto, uradni izvor pri izenačenju ter datum preverjanja. Ta sprememba še ni objavljena na gostovanju. Preverjanje: 14 testov Možgana in TypeScript sta uspešna. Pomenski indeks ostaja prazen; ni bil potreben za ta uvoz.

Datoteke paketa: `go4trail-research-2026-11-05.json`, `obala-research-2026-11-05.json`, `import-2026-11-05.sql`; priprava SQL prek `node scripts/prepare-brain-knowledge-import.mjs`. Generator samo pripravi datoteko in ne spreminja baze. Ohraniti vrstni red virov in obstoječe ključe tega prvega paketa; nove teme naj se dodajo na konec oziroma dobijo trajno namensko oznako pri naslednji nadgradnji uvoznika.
