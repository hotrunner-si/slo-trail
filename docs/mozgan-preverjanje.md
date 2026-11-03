# Možgan v1 — zapis preverjanja

Datum: 31. 10. 2026. Projekt: `slo-trail` / `favatadzmmqsdocrstti`.
Koda ni bila objavljena. Obstoječe lokalne spremembe so ohranjene; ni bilo
ponovne začetne selitve, ponastavitve Git ali prepisa javnega kataloga.

## Opravljeni preskusi

| Preskus                                | Rezultat                                                                                                                                                                                                                 |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run typecheck`                    | Uspeh. Usklajeni so tudi stari tipi koledarja, varovala indeksov in nastavitve izrisa zemljevidov.                                                                                                                       |
| `npm run build`                        | Strežniška gradnja uspešna. Ostajajo neblokirajoča opozorila o velikih paketih za zemljevide.                                                                                                                            |
| `npm run test:brain`                   | 3 preskusi uspešni: veljaven GPX, zavrnitev nevarnega/neveljavnega GPX, zavrnitev nedovoljenih AI povezav/izhodov/kontaktov in prihodnjih izkušenj.                                                                      |
| `node scripts/check-content-pages.mjs` | 58 strani uspešno izrisanih, 4 pričakovane napake 404; zaščitena Baza preusmeri neprijavljenega, zasebni API-ji zavrnejo dostop. Storage povezave so ohranjene. Skrivnega Supabase ključa ni v HTML ali build datotekah. |
| Živi HTTP preskus                      | 9 skupin uspešnih na končni strežniški gradnji z dvema začasnima računoma. Podrobnosti spodaj.                                                                                                                           |
| `supabase/tests/brain_access.sql`      | Uspeh v oddaljeni bazi. Vsi testni zapisi in javna objava profila so bili v isti transakciji razveljavljeni.                                                                                                             |
| Brskalnik                              | Pregled, Analitika in Baza pregledani na namizju ter pri širini 390 px. Preverjeni še dodatna vprašanja, izklop shranjevanja, prehod na drugo vprašanje brez zapisa ter zasebni povzetek v Računu.                       |
| Git                                    | `git diff --check` uspešen; brez commita, pusha ali objave.                                                                                                                                                              |

## Živi HTTP preskus

Ukaz (lokalni strežnik mora delovati):

```text
node --env-file=.env scripts/test-brain-live.mjs --project=favatadzmmqsdocrstti --origin=http://127.0.0.1:3013
```

Preverjeno:

1. Email ponudnik je omogočen; sintetična potrjena seja deluje.
2. Zavrnitve za obiskovalca, ločitev računa in skrbnika, neposredno odpiranje
   zaščitene Baze ter odzivi `private, no-store`.
3. Drugi račun ne vidi tujega profila; neposredna samoodobritev ni dovoljena.
   Skrbniška odobritev ne objavi profila samodejno.
4. Izklop shranjevanja ne ustvari odgovora, povzetka ali znanja.
5. Ponovljen odgovor istega računa se zavrne brez dodatnega zapisa.
6. Strukturirana izkušnja brez AI ostane zasebna v čakalni vrsti; račun dobi
   največ pet povzetkov, drugi račun nobenega; neposredno branje tabele je zavrnjeno.
7. Tri mesta GPX in eno za sliko; neveljavne datoteke in dodatno mesto so
   zavrnjeni. Lastnik in skrbnik lahko preneseta GPX, drugi račun ne.
   Neposredno nalaganje v Storage je zavrnjeno. Skrbnik odobri pregled trase;
   zamenjava nato označi pregled kot zastarel. Neuspela zamenjava ohrani staro
   datoteko, uspešna odstrani staro iz Storage. Preverjen tudi zastarel pričakovani ključ.
8. Iskanje, filtriranje razdalj in podrobnosti povezanega zapisa delujejo na
   dejanskih uredniških podatkih. Avtorjev ni v rezultatih. Javni katalog ostane dostopen.
9. Odjava odstrani dostop do zasebnih poti.

Transakcijski SQL preskus dodatno preveri eksplicitno objavo profila, odobritev
povezave z obstoječim tekačem, podpiranje in nasprotovanje pri drugih računih,
pravilno štetje računov, preprečevanje podvojenih potrditev, ločevanje mokrih
in suhih razmer ter skrivanje ugotovitev in blokado odgovorov na skrito vprašanje.
Preverjena je tudi neposredna sled od prispevka do zasebnega povzetka oziroma
odgovora ter dokončanje čakalne vrste z ohranjeno povezavo na oboje.

## Odstranitev testnih podatkov

Po preverjanju je dejansko stanje:

| Podatek                                                 |         Število |
| ------------------------------------------------------- | --------------: |
| Auth računi in skrbniki                                 |               0 |
| Zasebni povzetki, datoteke in objekti v `brain-private` |               0 |
| Skupnostne ugotovitve                                   |               0 |
| Obstoječi javni tekači                                  |               3 |
| Predmeti / viri / začetna vprašanja                     | 157 / 154 / 115 |

Ni ostankov izmišljenih izkušenj ali testnih javnih profilov. Osnovni agregatni
števči uporabe vključujejo tudi razvojne preskuse in niso meritev obiska produkcije.

## Varnostni pregledi in meje

- Nove tabele imajo RLS. Pregled Supabase ne javlja manjkajočih RLS pravil,
  izpostavljenih definerskih funkcij ali manjkajočih indeksov tujih ključev.
- Zaključni pregled varnosti Supabase je vrnil prazen seznam opozoril.
- Med preverjanjem začasnih računov je bilo prikazano opozorilo Auth glede
  izključene zaščite pred kompromitiranimi gesli.
  Aplikacija uporablja prijavno povezavo, ne obrazca za geslo. Če bo projekt
  dovoljeval tudi gesla, preveri [nastavitev zaščite gesel](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
- Pregled zmogljivosti javlja neuporabljene indekse, pričakovano pri novi in majhni zbirki.
- Združljive varnostne posodobitve so odpravile zaznana visoka/kritična opozorila,
  vključno z Nuxt napako razvojnega strežnika glede zasebnih nastavitev.
  Zadnji pregled odvisnosti še poroča o 14 opozorilih (2 nizki in 12 srednjih).
  Ni bila uporabljena prisilna nadgradnja vseh posrednih odvisnosti.
- Dostava prijavne e-pošte na resničen naslov in dejanski PKCE povratek iz te
  e-pošte nista bila potrjena. Sintetična seja ni dokaz delujočega SMTP.
- AI ključa, modela in potrjene ponudnikove hrambe ni bilo. Zato pravi AI
  pogovor, anonimizacija pri ponudniku ter pomensko iskanje z dejanskimi
  vektorji **niso bili izvedeni ali preverjeni od začetka do konca**.
  Preverjeni so lokalni validatorji in nadaljnji podatkovni prehodi z rollback preskusom.
- Odseki, letne izvedbe in rezultati so podprti v shemi; brez dokazov niso napolnjeni.

Natančni koraki za vključitev so v [mozgan.md](mozgan.md).
# Prijava z geslom — 2. 11. 2026

Ločitev lastnikovih računov je izvedena po izrecnem navodilu. Običajni račun
je ohranil identiteto in geslo, dobil novi prijavni naslov ter izrecno odobreno
povezavo s tekačem. Nov ločen Admin ima članstvo v `brain_admins`; prijava
z določenim začetnim geslom in skrbniški RPC sta dejansko preverjena, testna
prijavna seja pa odjavljena. Pričakovani skrbniški/običajni vlogi sta potrjeni
z branjem baze brez izpisovanja identifikatorjev, naslovov ali gesel.

12 skupin živega HTTP preskusa je uspešnih, vključno z zavrnitvijo gostujočega
in običajnega dostopa do `admin-summary` ter dostopom začasnega skrbnika.
Rumeno-oranžni račun, tri skrbniške sekcije in mobilna širina 390 px so
preverjeni v brskalniku z ločenim začasnim skrbnikom, brez spreminjanja vsebine.
Uredniški pregled ohrani dodajanje virov in moderacijo. Pomensko indeksiranje
je onemogočeno, dokler dejanska povezava za vektorje ni na voljo.

Prenova računa: pregled, urejanje in nastavitve so preverjeni na namizju in
pri širini 390 px, vključno z urejanjem imena in odjavo. Mobilna navigacija
se prelomi brez vodoravnega pomika. Tekaški obrazci so odstranjeni iz računa;
nova stran `/runners/nov` je zaščitena in izključena iz zemljevida strani.
Gumb Uredi je v brskalniku preverjen na povezanem profilu, odsoten na drugem
profilu in pri gostu. Pri preizkusu gumba ni bila spremenjena javna vsebina.

Migracija `20261102164200_runner_owner_edit.sql` je uporabljena v pravilnem
projektu. `supabase/tests/runner_owner.sql` je prestal transakcijski preizkus
lastništva, zavrnitve tujega/gostujočega dostopa in zaščite dodatnih polj;
vse testne spremembe javnih zapisov so razveljavljene z rollback.
Živi HTTP preskus: 12 skupin uspešnih, vključno z obveznim trenutnim geslom
pri spremembi e-pošte. Nobena potrditvena pošta ni bila poslana. Celoten tok
spremembe naslova je treba še preveriti z dejanskim naslovom in SMTP dostavo.
Začasni testni računi/datoteke in zasebna QA povezava so odstranjeni.
Typecheck in strežniška gradnja sta uspešna. Produkcija ni objavljena.

Supabase advisor ne poroča o novi napaki sheme; ostaja obstoječe opozorilo
[Leaked Password Protection Disabled](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

Prosto ime uporabniškega računa: preverjenih 11 skupin živega preskusa,
vključno z lastnim shranjevanjem/spreminjanjem imena, zavrnitvijo gostov in
praznega imena, ločitvijo drugega računa, javnega profila in skrbniške vloge.
Testna računa in datoteke so odstranjeni. Ime je v Auth uporabniških metapodatkih,
ki se ne uporabljajo za dovoljenja. Ni bilo spremembe sheme.
Pozdravna pošta je preverjena z lokalnim JSON transportom brez pošiljanja:
dogovorjeno besedilo, brez povezav ali žetonov. Dejanska dostava čaka na
strežniški MAIL_SMTP_USER/MAIL_SMTP_PASSWORD. Novi tok registracije čaka na
uporabnikov izklop Confirm email v nadzorni plošči; aplikacija do takrat
registracijo ustavi pred klicem signUp, da ne pošlje potrditvene povezave.

Poznejši dejanski poskus registracije: Auth dnevniki pokažejo
`unexpected_failure`/500 pri SMTP in DNS napako `no such host`.
To ni zavrnitev lokalnih pravil gesla. Preveriti je treba SMTP Host
(`smtp.gmail.com`) v nadzorni plošči. Napake registracije so zdaj ločene
po kodi ponudnika (SMTP/storitev, omejitev pošiljanja, pravila gesla,
onemogočena registracija); surovih podrobnosti ponudnika ne vračamo.

Lokalno dodani prijava z geslom, registracija, obnovitev s PKCE in sprememba
gesla. Produkcija ni objavljena; shema in vloge niso spremenjene.

`scripts/test-brain-live.mjs` je uspešno zaključil 10 skupin v projektu
`favatadzmmqsdocrstti` proti lokalnemu strežniku. Dodani preskusi potrdijo
prijavo z geslom, zavrnitev neusklajenih gesel, neprijavljenega dostopa ter
manjkajočega/napačnega trenutnega gesla, uspešno spremembo, odjavo in
neveljavnost starega gesla. Začasni računi/datoteke so odstranjeni.
Gostovani Auth ni zavrnil napačnega `current_password`, zato aplikacija
trenutno geslo dodatno preveri z ločenim začasnim Auth odjemalcem.

Preverjeni obrazci v brskalniku na namizju in širini 390 px.
Dejanska registracija s potrditvenim sporočilom in celoten obnovitveni PKCE
tok še zahtevata nastavitev SMTP ter preskus dejansko prejetih povezav.
Teh tokov ne štejemo za potrjeno dostavljive. Google račun za pošiljanje
pripravlja uporabnik; gesla za aplikacijo ne hranimo v dokumentaciji.

