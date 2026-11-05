# Možgan v1 — delovanje in vključitev

## Dopolnitev 2. 11. 2026: lastništvo in nalaganje

- Edini vir pravic do tekaškega profila je `brain_runner_links`: en račun ima
  največ en profil, en profil največ en lastniški račun. Objava novega profila
  vzpostavi isto povezavo kot potrjena zahteva za obstoječega tekača. Polje
  `brain_profiles.public_runner_slug` hrani le izvor objave; sestavljeni tuji
  ključ in sprožilec zagotavljata skladnost. Skrbniška vloga ne daje lastništva.
- Migracija `20261102195830_unified_runner_ownership.sql` ohrani obstoječe
  povezave, dopolni lastništvo že objavljenih profilov in se ob konfliktih ustavi.
- Slike se ob nalaganju ponovno kodirajo v WebP, pravilno zasukajo in omejijo
  na 1600 × 1600. Ime datoteke in shranjene dimenzije opisujejo končni WebP.
  Urejanje računa pokaže predogled ter trajno potrditev naložene slike.
- GPX se ob nalaganju preveri in pripravi šest zasebnih izhodov:
  `preview.json`, `detail.json`, `route.simple.json`, `route.full.json`,
  `profile.simple.json` in `profile.full.json`. Izvirnik ostane za prenos.
  Predogled je majhen, podrobni zemljevid in profil se naložita ob odprtju.
  Ločeni odseki ne prispevajo izmišljene razdalje med seboj; zemljevid jih
  izriše ločeno. Če višine manjkajo, ni izmišljenega vzpona ali višinskega profila.
- Izpeljanke se shranijo pred potrditvijo nove datoteke. Ob neuspehu ostane
  stara datoteka aktivna; uspešna zamenjava odstrani tudi stare izpeljanke.
  Dostop poteka skozi zaščiteni API in ne uporablja javnega predpomnilnika.
- Obstoječe zasebne GPX brez izpeljank je treba ponovno naložiti. Obdelava ne
  pomeni javne objave: javna slika in objava GPX med tekačeve ture ostajata
  ločen uredniški korak; predogledi kartic s podlago Mapbox niso del zasebnega nalaganja.
- Preverjanje: `node --test tests/file-processing.test.mjs tests/brain-safety.test.mjs`,
  SQL `supabase/tests/unified_runner_owner.sql` in `runner_owner.sql` (rollback),
  ter `scripts/test-file-processing-live.mjs --project=favatadzmmqsdocrstti --origin=http://localhost:3000`.
  Živi test uporablja začasna računa brez pošiljanja e-pošte in odstrani svoje datoteke.

Stanje: 31. 10. 2026. Koda je lokalna in ni objavljena. Baza je dopolnjena v
projektu **slo-trail**, `favatadzmmqsdocrstti`; prvotna selitev ni bila ponovljena.

## Delujoči sklopi

- Ločena običajni lastnikov račun in račun Admin; ob prestavitvi prijavnega
  naslova običajnega računa je ohranjen njegov UUID, geslo in vsi povezani
  podatki. Povezavo s tekačem je izrecno odredil lastnik projekta, ne algoritem
  po ujemanju imena. Admin nima te tekaške povezave.
- Skrbniški račun ima na `/profil` rumeno-oranžno temo in zaščitene
  povzetke čakajočih zahtev. `/mozgan/skrbnik?tab=reviews` vsebuje nove profile,
  ločeno objavo odobrenih profilov in zahtevke za povezavo. `?tab=editorial`
  odpre vire in moderacijo, `?tab=routes` pa zasebne predloge tras.
  Običajni uporabnik novih skrbniških podatkov ne more pridobiti prek API.
  Vloga izvira samo iz `brain_admins`, ne iz naslova ali imena v uporabniških
  metapodatkih. Začetno geslo ni shranjeno v repozitoriju; zamenja se v računu.

- Račun `/profil`: pregled podatkov, zasebne datoteke in zadnjih pet
  povzetkov; Uredi odpre `?view=edit`, Nastavitve pa `?view=settings`.
  Nastavitve vsebujejo geslo, e-pošto (zahteva trenutno geslo) in zasebnost.
- Račun ne ureja tekaških podatkov. Nov profil se predlaga na `/runners/nov`
  in ostane zaseben do skrbniške odobritve ter ločene objave. Obstoječi profil
  se poveže z računom šele po potrditvi zahteve.
- Gumb Uredi na `/runners/:slug` se odjemalcu pokaže samo ob potrjeni povezavi
  ali lastnem že objavljenem profilu. RPC `brain_runner_edit` neodvisno preveri
  isto lastništvo v bazi in dovoljuje spremembo predstavitvenih podatkov ter
  Strava povezave. Objavljen lastni profil se pri urejanju posodobi neposredno.
  Slug, rezultati, UTMB polja, fotografije in GPX povezave niso del tega obrazca.
  Zasebni podatki računa niso vključeni v javni katalog; lastniški obrazec se
  naloži samo v brskalniku. Javna vsebina ima obstoječ 30-sekundni predpomnilnik,
  trenutni odjemalec pa po shranjevanju takoj osveži javne podatke tekača.

- Prijava z e-pošto in geslom, registracija z imenom računa brez potrditvene povezave (zahteva izklop Confirm email v Supabase), ponastavitev ter sprememba gesla, strežniška seja in odjava.
- Prosto ime računa (1–80 znakov) v zasebnih Auth metapodatkih, spremenljivo v nastavitvah. Ime ni edinstven prijavni identifikator in ne daje dovoljenj ali objavi tekaškega profila.
- Zaseben predlog profila, ročna odobritev in ločena objava na `/runners`.
- Zahteva za povezavo z obstoječim tekačem; enako ime ni dokaz identitete.
- Tri zasebna mesta za GPX in eno za sliko, varna zamenjava in zaščiten prenos.
- Strukturirana izkušnja, razjasnitev leta/razmer/neposredne izkušnje, zasebni
  povzetki in vrsta za anonimizacijo. V računu je vidnih največ pet povzetkov.
- Preverjanje anonimiziranih ugotovitev pri drugih računih in preprečevanje
  podvojenih glasov. Različnih računov ne predstavljamo kot dokazano različnih oseb.
- Pregled, javni in razširjeni prikazi Analitike, zaščitena Baza z besednim
  iskanjem, filtri, izbiro zapisa, izvorom in povezanimi zapisi.
- Pripravljena AI integracija za razlago, dodatna vprašanja in anonimizirane
  ugotovitve ter integracija pomenskega iskanja prek 1536-dimenzijskih vektorjev.
- `/mozgan/skrbnik`: profili, povezave, pregled GPX, dodajanje virov, izdelava
  vektorjev in skrivanje neprimernih skupnostnih ugotovitev.

Začetni posnetek: **157 predmetov, 154 uredniških virov in 115 vprašanj** za
manjkajoče izkušnje. Ni ustvarjenih uporabniških izkušenj ali zgodovinskih
izvedb. Demo trase, izmišljene izjave in članki s `contains_demo` niso dokazi.
Datumov, indeksov in rezultatov ta izvedba ni ponovno preverila.

## 1. Prijava z geslom (posodobitev 2. 11. 2026)

1. Odpri [Auth → URL Configuration](https://supabase.com/dashboard/project/favatadzmmqsdocrstti/auth/url-configuration).
2. Dodaj dovoljeni Redirect URL `http://127.0.0.1:3012/profil`.
   Če uporabljaš drugo ime ali vrata, dodaj natanko tisto različico, npr.
   `http://localhost:3000/profil`. Pred objavo dodaj tudi ustrezni URL domene.
3. Site URL naj kaže na glavno okolje, ki ga dejansko nameravaš uporabljati.
4. V Auth → Sign In / Providers → Email omogoči prijavo po e-pošti in **izklopi Confirm email**.
   Aplikacija pred registracijo preveri `mailer_autoconfirm` in ob vključeni
   potrditvi registracijo ustavi, da ne pošlje neželene potrditvene povezave.
   Predloga Reset password ohrani `{{ .ConfirmationURL }}`.
   Varnostne nastavitve gesel: najmanj 6 znakov, zahtevani samo črke in številke
   (brez zahteve po velikih črkah ali simbolih). Aplikacija pri registraciji,
   obnovitvi in spremembi zahteva vsaj eno črko in eno številko; dolžina 6–128.
   Pri obnovitvi gesla uporabljamo PKCE:
   povezavo odpri v istem brskalniku, kjer je bila zahtevana.
5. Za običajno uporabo nastavi svoj SMTP in potrjenega pošiljatelja v Auth → Email / SMTP.
   Privzeti Supabase pošiljatelj ima omejitve in ni dokaz dostavljivosti.
6. Zaženi `npm run dev -- --host 127.0.0.1 --port 3012`, odpri `/profil`,
   izberi Ustvari račun, vnesi ime računa, naslov in dvakrat geslo.
   Ob izklopljeni potrditvi se račun prijavi takoj. Preveri še odjavo in prijavo z geslom.
7. Preveri Pozabljeno geslo: odpri novo povezavo v istem brskalniku, nastavi
   novo geslo (v desetih minutah po potrditvi povezave) in se znova prijavi.
   Sprememba gesla v nastavitvah zahteva trenutno geslo. Povezava za obnovitev
   po uspešni PKCE izmenjavi dobi kratkotrajen podpisan HttpOnly piškotek,
   vezan na račun. Parametri URL sami ne omogočijo spremembe gesla.
   Gesel in kod ne zapisujemo v aplikacijske dnevnike. Pri zunanjem beleženju
   zahtev izključi telesa teh POST zahtev in vrednosti parametrov povratnih URL.

Netlify gosti aplikacijo; povezave za obnovitev pošlje Supabase Auth prek SMTP.
Pozdravno sporočilo po uspešni registraciji pošlje strežniška aplikacija prek
Nodemailer. Supabase ob izklopljeni potrditvi naslova ne pošlje pozdravne pošte.
Za pozdrav nastavi na strežniku (lokalno `.env`, po objavi v Netlify za Functions):
`MAIL_SMTP_USER`, `MAIL_SMTP_PASSWORD` (Gmail geslo za aplikacijo),
`MAIL_SMTP_HOST=smtp.gmail.com`, `MAIL_SMTP_PORT=465`.
Te vrednosti nimajo javne predpone in se ne vgradijo v gradnjo.
Supabase svojega shranjenega SMTP gesla aplikaciji ne razkrije.
Pozdrav ima naslov »Dobrodošli na slovensko digitalno trail središče.« in besedilo
»Veseli smo, da ste se nam pridružili.« Brez povezav, kod ali gesel.
Če pošiljanje manjka ali odpove, račun ostane ustvarjen/prijavljen, uporabnik pa
vidi, da pošta ni bila poslana. Samodejne vrste ponovnih poskusov za zdaj ni.
Lastna domena strani ni nujna za začetni Gmail SMTP: ločen Gmail račun,
dvostopenjsko preverjanje in posebno geslo za aplikacijo (če je možnost pri
računu na voljo), `smtp.gmail.com`, TLS 465 (v tem projektu preverjeno deluje), uporabnik in pošiljatelj
sta isti Gmail naslov. Geslo za aplikacijo vnesi samo v strežniške nastavitve in Supabase Custom SMTP,
ne v odjemalca ali klepet. Gmail ima omejitve in ni namenska storitev za večji
obseg transakcijske pošte. Resend za splošno dostavo zahteva lastno potrjeno
domeno; `slo-trail.netlify.app` temu ne zadostuje.

Email je v projektu omogočen. Seje so bile preverjene s sintetičnimi potrjenimi
računi brez pošiljanja e-pošte. Dostava na tvoj naslov in pravilnost vseh dovoljenih
preusmeritev zato še zahtevata ta dejanski preskus.

## 2. Tvoja skrbniška vloga

Najprej se prijavi. V Supabase → Authentication → Users kopiraj svoj **User UID**.
Kot lastnik baze v SQL Editorju izvedi:

```sql
insert into public.brain_admins(user_id)
values ('SEM_PRILEPI_SVOJ_USER_UID'::uuid)
on conflict do nothing;
```

Osveži Račun; pojavi se povezava **Odobritve**. Vloga ne izhaja iz uporabniško
uredivih `user_metadata`. Preverja se neposredno v bazi pri vsaki odobritvi.
Pri profilu najprej izberi **Odobri profil**, nato posebej **Objavi na /runners**.
Javni naključni identifikator ne vsebuje Auth UID. Zasebna slika in GPX se
ne kopirajo v javni bucket; profil brez javne slike pokaže inicialke.

## 3. Strežniške nastavitve

Ohrani `NUXT_PUBLIC_SUPABASE_URL` in `NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
Možganov strežnik potrebuje tudi `SUPABASE_SECRET_KEY`, ki lokalno že obstaja.
Pri poznejšem gostovanju ga nastavi za **delovanje strežnika**, ne samo za build.
Nikoli mu ne dodaj predpone `NUXT_PUBLIC_`. Podprta je tudi runtime nastavitev
`NUXT_SUPABASE_SECRET_KEY`.

Skrivnosti se berejo med zahtevo; niso zapečene v build. Javni `/api/content`
ostaja ločen, s 30-sekundnim skupnim predpomnilnikom in brez zasebnih podatkov.
Možganove poti imajo `private, no-store` in preverjajo dostop na strežniku.

## 4. AI in pomensko iskanje

AI ključa in modela v okolju ni bilo. Zato niso bili ustvarjeni pravi AI odgovori,
anonimizacije ali vektorji. UI to izrecno pove; besedno iskanje in zasebne
strukturirane oddaje delujejo tudi brez AI.

1. Uredi AI račun in preveri **Zero Data Retention**. Sam `store: false` ne
   zagotavlja odsotnosti vsebine v ponudnikovih dnevnikih nadzora zlorab.
2. Strežniško nastavi vrednosti iz `.env.example`:

   ```dotenv
   OPENAI_API_KEY=...
   BRAIN_AI_MODEL=...
   BRAIN_EMBEDDING_MODEL=...
   BRAIN_AI_ZERO_RETENTION=true
   ```

   Model pogovora mora podpirati Responses in strogi JSON Schema. Model vektorjev
   mora podpirati **1536 dimenzij**, npr. `text-embedding-3-small`. Zastavico
   hrambe vključi šele po potrditvi pogojev pri ponudniku. Aplikacija sama
   ne more preveriti pogodbenega statusa tvojega AI računa.

3. Ponovno zaženi strežnik; Pregled mora pokazati **AI pomočnik**.
4. V Odobritvah izberi **Izdelaj vektorje naslednjih 15 virov** do nič preostalih.
   To pošilja vsebino virov ponudniku in lahko povzroči strošek.
5. V Bazi vključi **Tudi po pomenu**. Če storitev ali indeks nista na voljo,
   je vrnitev na besedno iskanje jasno označena. Podobnost ni ocena resničnosti.
6. Uporabnik lahko v Računu izbere **Obdelaj naslednjo čakajočo izkušnjo**. Nove oddaje
   se ob nastavljenem AI anonimizirajo samodejno, brez tvoje odobritve vsakega
   povzetka. Nejasni vnosi ostanejo zasebni in ne štejejo kot potrditve.
7. Pred širšo uporabo opravi pravi pogovor, dodatno vprašanje, povzetek in
   preverjanje nastale ugotovitve pri drugem svojem testnem računu.

Reference: [prijava brez gesla](https://supabase.com/docs/guides/auth/auth-email-passwordless),
[strukturirani izhodi](https://developers.openai.com/api/docs/guides/structured-outputs),
[hramba pri AI ponudniku](https://developers.openai.com/api/docs/guides/your-data).

## Shema, povezave in pravice

Sledljive dopolnitve so v `supabase/migrations/20261031*_brain_*.sql`.
`supabase/schema.sql` ostaja posnetek prvotne javne vsebine.

| Sklop                | Tabele                                                                             |
| -------------------- | ---------------------------------------------------------------------------------- |
| Povezana osnova      | `brain_entities`, `brain_relations`, `brain_sources`                               |
| Računi               | `brain_profiles`, `brain_link_requests`, `brain_runner_links`                      |
| Zasebne datoteke     | `brain_files`, `brain_route_reviews`, `brain_file_cleanup`; bucket `brain-private` |
| Skupnostno znanje    | `brain_claims`, `brain_contributions`, `brain_categories`                          |
| Preverjanje          | `brain_questions`, `brain_answers`                                                 |
| Zasebni povzetki     | `brain_summaries`, `brain_pending_experiences`                                     |
| Uporaba brez vsebine | `brain_usage`                                                                      |
| Skrbniška vloga      | `brain_admins`                                                                     |

Predmeti podpirajo tekmo, letno izvedbo, razdaljo, traso, odsek, tekača, udeležbo,
rezultat in članek. Povezave so `edition_of`, `distance_of`, `version_of`,
`segment_of`, `participated_in`, `result_of` in `source_for`. Tuji ključi
`race_slug`, `distance_id`, `runner_slug` in `article_slug` povezujejo staro vsebino.
Izvedbe, rezultati in odseki se dodajo šele z dejansko podlago. Uporabniška
izkušnja ima predmet, notranjega avtorja, leto, razmere in neposrednost; iz nje
nastaneta ugotovitev in vprašanje za preverjanje. Podpora in nasprotovanje
sta ločena od virov. Skupnost ne spreminja uradnih ali uredniških podatkov.

Vse nove tabele imajo RLS in preklicano neposredno pisanje računov. Ozke
funkcije preverijo identiteto, lastništvo in prehode. Funkcije s povišanimi
pravicami so v neizpostavljeni shemi `brain_private`; javni ovoji uporabljajo
pravice klicatelja. Skrbniške funkcije še same preverijo vlogo.
Prispevki imajo neposredni povezavi `summary_id` in `answer_id`, zato je njihov
izvor sledljiv tudi po tem, ko povzetek ni več med zadnjimi petimi v računu.
Surova tabela povzetkov ni dostopna niti lastniku prek REST; namenska funkcija
vrne največ pet zadnjih. Skupno iskanje ne vrača identitete avtorjev prispevkov.

Kategorije so ena izkušnja, več neodvisnih potrditev računov, nasprotujoče
izkušnje in premalo podatkov. Glasovi in kategorija se pri vprašanju pokažejo
šele po odgovoru. En račun ne poveča števila neodvisnih potrditev s ponovitvami.

## Datoteke

Mesta 1–3 dovoljujejo GPX, mesto 4 sliko; omejitev velja tudi v bazi. Največ
5 MB, GPX največ 100.000 točk. Preverjamo XML, zavračamo DTD, entitete, skripte,
zunanje stile in neveljavne koordinate. GPX se nikoli ne izvede kot HTML.
Slike JPEG/PNG/WebP se dekodirajo z omejitvijo 25 milijonov pik, odstranijo se
metapodatki in slika se ponovno kodira v WebP.

Nov naključni objekt se naloži pred transakcijsko zamenjavo aktivnega zapisa.
Ključavnica računa in preverjanje pričakovane stare poti preprečita izgubo pri
sočasni zamenjavi. Neuspeh ohrani staro datoteko. Ob uspehu gre stara pot v
trajno vrsto in se odstrani iz Storage; začasna napaka odstranitve se ponovi
ob naslednjem uspešnem nalaganju. Skupnega `site-assets` ne brišemo.
Pregled zamenjanega GPX dobi status **Datoteka je zamenjana**. Odobritev trase
pomeni opravljen pregled, ne samodejne javne objave zasebnega GPX.

## Zasebnost in preostale omejitve

- Pogovor ostane v pomnilniku odprte strani. Za AI gre na strežnik največ
  12 začasnih sporočil po 3000 znakov. Ni tabele prepisov, trajne shrambe
  pogovora v brskalniku ali ponudnikovih shranjenih pogovornih verig.
- Pri izklopu ne nastanejo odgovor, povzetek ali prispevek. Preskoki ostanejo
  le v pomnilniku. Ob polni ponovni naložitvi se nastavitev vrne na vključeno;
  UI to pove. Statistika vsebuje samo dan, vrsto dogodka, obiskovalec/račun
  in število, brez vsebine, IP, e-pošte ali identitete računa.
- Brez AI opis ostane zaseben povzetek v čakalni vrsti. Naknadno urejanje
  nejasnih povzetkov in splošen uporabniški izbris znanja še nista v UI.
  To ne izključuje zakonskih pravic glede osebnih podatkov.
- Preverjanje AI izhodov zagotavlja strukturo, dovoljene povezave/citate in
  osnovno zavrnitev kontaktov, ne dokazuje resničnosti ali popolnosti
  anonimizacije. Skrbnik lahko skrije neprimerne ugotovitve.
- AI nima SQL, orodij, spletnega zajemanja ali pravic za odobritve. Njegov
  izhod se ne izvrši kot koda. Prejšnji odgovor AI ni uporabniški dokaz.
- Izbira vprašanj uporablja pregledna pravila, ne treniranja modela.
- Omejitev sunkov zahtev je na strežniški proces. Pred širšo uporabo na več
  instancah dodaj skupno omejevanje; Auth ima še omejitve Supabase.
- Bodočih uredniških sprememb ne sinhroniziramo samodejno. Ob spremembi
  kataloga uskladi ustrezni `brain_sources` in ponovno izdelaj njegov vektor.
- Javna slika novega profila, urejanje že objavljenega profila in objava
  pregledanih tras ostajajo ločeni uredniški postopki.

## Preverjanje

```text
npm run test:brain
npm run build
node scripts/check-content-pages.mjs
node --env-file=.env scripts/test-brain-live.mjs --project=favatadzmmqsdocrstti
```

Živi preskus pričakuje strežnik na `http://127.0.0.1:3012` ali `BRAIN_TEST_ORIGIN`.
Ustvari in odstrani začasna računa ter zasebne datoteke. Ne pošilja e-pošte,
ne kliče AI in ne objavlja profilov ali znanja. Dodatni preskus
`supabase/tests/brain_access.sql` se v celoti razveljavi, tudi test javne objave.

`scripts/brain-browser-qa.mjs` je samo lokalni testni most za sintetični račun,
ni aplikacijska pot. Ne izpisuje poverilnic; ob koncu prekine sejo in odstrani
račun, varovalo je tudi iztek po 30 minutah. Ne nameščaj ga kot spletno storitev.

Dejanski rezultati in meje so v [mozgan-preverjanje.md](mozgan-preverjanje.md).
