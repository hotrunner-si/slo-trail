# Razširitev baze znanja vseh tekem — 7. november 2026

V živo potrjenih **784 novih zapisov**: 300 vsebinskih in 484 zapisov rezultatov. Vsaka od 39 tekem ima skupaj najmanj 5 zapisov z virom in datumom preverjanja. GO4Trail je bil že dovolj pokrit; novega osnovnega opisa nismo podvajali.

Manjkajoči vektorji tega uvoza ob preverjanju: **0**.

## Obseg in metoda

- Razreda S in A sta uporabnikova uredniška razdelitev; zapis v scope.json. Javnega kataloga priljubljenosti nismo spreminjali.
- S/A: do prvih 10 po spolu in trasi; ostale: do prvih 3. En zapis vsebuje celotno preverjeno razvrstitev ene trase, leta in spola. Uradna deljena mesta so ohranjena.
- Prijavni seznami, DNS, DNF, diskvalifikacije in še neizvedene tekme niso uvoženi kot uvrstitve. Otroške in netekmovalne razvrstitve so izpuščene.
- Vsi novi zapisi imajo URL, datum preverjanja in izvor official. Povzetki so uredniško parafrazirani; oznaka official pomeni izvor dokazila, ne dobesednega citata.
- Letni zapisi so povezani z entitetami edition in relacijo edition_of ter letnim intervalom veljavnosti. Datumi 2027 so napovedi organizatorja, ne že izvedene tekme.
- Številke v imenih rezultatnih tras so uradne oznake; niso samodejno obravnavane kot natančne GPX meritve. Npr. Kočevsko ima v starih imenih rezultatnih tabel tudi očitno neskladne podatke.
- Shranjeni so pregledani izvlečki dokazil in surove javne rezultatne tabele. Ključi legacy_key omogočajo ponovljiv dodaten uvoz brez prepisovanja drugih zapisov.

## Pokritost

| Tekma | Razred | Novi zapisi | Vsi preverjeni zapisi | Leta novih rezultatov |
| --- | --- | ---: | ---: | --- |
| 6 ur Španovega vrha | ostale | 6 | 6 | — |
| 7 ur Slivnice | ostale | 5 | 5 | — |
| 8 ur Sv. Ane | ostale | 6 | 6 | — |
| Čaven run | ostale | 6 | 6 | — |
| GO4Trail | ostale | 0 | 24 | — |
| Haloze trail | ostale | 9 | 9 | 2026 |
| HG Trail Idrija | ostale | 8 | 8 | — |
| Hrastnik trail | ostale | 6 | 6 | — |
| Julian Alps Trail Run by UTMB | S | 100 | 100 | 2021, 2022, 2023, 2024, 2025, 2026 |
| K24 Ultra trail | A | 34 | 34 | 2024, 2025, 2026 |
| KBK trail | ostale | 6 | 6 | — |
| Knap Trail | A | 25 | 25 | 2025, 2026 |
| Kočevsko Outdoor Festival | A | 52 | 52 | 2023, 2024, 2025, 2026 |
| Kras Trail | ostale | 7 | 7 | — |
| Kriška gora Trail | A | 21 | 21 | 2025, 2026 |
| Lahinja Trail | ostale | 6 | 13 | 2025 |
| Lončarija teče | ostale | 25 | 25 | 2022, 2023, 2024, 2025, 2026 |
| Lotmerški trail tek | ostale | 5 | 5 | — |
| Obala Ultra trail | S | 40 | 67 | 2022, 2023, 2024, 2025 |
| Podbrdo Trail Running Festival | A | 48 | 48 | 2024, 2025, 2026 |
| Pol šihta na Farbanco | ostale | 6 | 6 | — |
| Ponikva4trail | ostale | 6 | 6 | — |
| Postojnski tek | ostale | 5 | 5 | — |
| Ribnica trail | ostale | 30 | 30 | 2023, 2024, 2025, 2026 |
| Rožnik trail | ostale | 5 | 5 | — |
| Savinjski K6 Trail | ostale | 5 | 5 | — |
| Slovenski gozdarski trail | ostale | 13 | 13 | 2025, 2026 |
| Šmarješki tek | ostale | 13 | 13 | 2025 |
| Snežnik trails | ostale | 9 | 9 | — |
| Soča Outdoor Festival | S | 106 | 107 | 2021, 2022, 2023, 2024, 2025, 2026 |
| Tek na Šmarno goro | ostale | 9 | 9 | — |
| Trail po kraških klancih | ostale | 5 | 5 | — |
| Trail tek Zelene doline | ostale | 5 | 5 | — |
| Trail Velika Planina | ostale | 5 | 5 | — |
| Triglav Trail Run | ostale | 45 | 45 | 2022, 2023, 2024, 2025, 2026 |
| Ultra Trail Vipava Valley | S | 77 | 77 | 2021, 2022, 2023, 2024, 2025, 2026 |
| Velenje trail | ostale | 14 | 14 | 2024, 2025 |
| Zaplana Trail | ostale | 5 | 5 | — |
| Zimski trail tek Bohinj | ostale | 6 | 6 | — |

## Vrzeli in neskladja

- Cilj raziskave je obdobje od 2020 dalje, vendar popolna zgodovinska pokritost ni dosežena. Leta brez dostopnega dokaza niso zapolnjena z ugibanjem. Preglednica zgoraj izrecno kaže najdena leta rezultatov.
- Soča in Julian Alps 2020: potrjena odpoved zaradi covida-19. Julian Alps 170 km 2022: potrjena odpoved zaradi poplav in plazov. Soča 50 km 2026: potrjena odpoved zaradi vročine.
- K24 2023: najden časomerilski dogodek, vendar brez prepoznane objavljene končne razvrstitve. To samo po sebi ne dokazuje razloga odpovedi.
- Za K24 2020–2022, Knap pred 2025, Kriško goro pred 2025 in Podbrdo pred 2024 popolne top 10 razvrstitve še niso vključene. Pri Podbrdu so ohranjene povezave do PDF arhiva 2021 v evidence-index.json.
- Obala 2026 in Lahinja 2026: ob raziskavi še nista bili potrjeni kot zaključeni končni razvrstitvi; rezultati niso uvoženi.
- Nekateri stari prikazi pri časomerilcu vrnejo 404 ali imajo drugačno strukturo stolpcev. Izpuščeni primeri in vzroki so v result-table-index.json ter result-review.json. Brez jasnega končnega časa in razvrstitve po spolu ni samodejnega uvoza.
- Nekatere uradne strani mešajo različne letnice in podatke: K24 100 km proti 94,5 km v časovnici, UTVV različni vzponi na karticah in v pravilniku, stare oznake Ribnice ter prestavljeni Čaven. Uvoz uporablja imenovani vir in leto ter ne spreminja javnega kataloga.
- Polni podatki o opremi niso prepisani za vsako tekmo; kratki povzetki povezujejo na pravila. Pred nastopom je treba preveriti aktualno izdajo.

## Preverjanje

- V živi bazi preverjeni število uvoženih vrstic, vsi URL-ji in datumi, povezave na tekme in minimalna pokritost 39/39. Brez natančnih dvojnikov znotraj uvoza.
- Tri žive poizvedbe pomenskega iskanja so vrnile relevantno tekmo med najbližjimi zapisi; podrobnosti v verification.json.
- Google prijava, pravice in shema podatkovne baze v tem delu niso spreminjani.

## Ponovitev in nadaljevanje

1. Raziskava: scripts/research-race-knowledge.mjs in evidence-index.json.
2. Pregled in priprava: curated.mjs ter scripts/prepare-race-result-records.mjs.
3. Dodaten uvoz: node --env-file=.env scripts/import-race-knowledge.mjs --write --project=favatadzmmqsdocrstti.
4. Vektorji: node --env-file=.env scripts/index-race-knowledge-batch.mjs --write --project=favatadzmmqsdocrstti.
5. Preverjanje: node --env-file=.env scripts/verify-race-knowledge.mjs --search.

Podrobni JSON zapisi in dokazila so v isti mapi. API skrivnosti niso del raziskovalnih datotek.
