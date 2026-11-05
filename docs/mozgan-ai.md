# Možgan: Gemini klepet in trail znanje

## Zagon

Za klepet lokalno zadošča obstoječi strežniški `GEMINI_API_KEY` v `.env` in delujoča vsebinska povezava strani. Po spremembi `.env` ponovno zaženi razvojni strežnik. Privzeti model je `gemini-3.6-flash`, preverjen z dejanskim ključem. Po želji nastavi `GEMINI_MODEL` na drug tekstovni model, ki podpira `generateContent`, strukturiran JSON odgovor in Google Search. Preveri tudi kvoto za spletno iskanje: isti ključ lahko uspešno odgovarja iz baze, a za iskanje dobi napako 429.

Ključ ne sme imeti predpone `NUXT_PUBLIC_`. Koda ga bere pri strežniški zahtevi. Ni del javne konfiguracije, brskalnika ali gradnje. Za objavo nastavi `GEMINI_API_KEY` tudi v okolju gostovanja (Netlify); lokalna `.env` se tja ne prenaša. Google projekt mora imeti dostop do modela in zadostno kvoto. Za javno uporabo v EGP preveri zahtevo Google za plačljive storitve: https://ai.google.dev/gemini-api/terms.

OpenAI ključ, embeddings, vektorski indeks in `BRAIN_AI_ZERO_RETENTION` niso potrebni za ta klepet. Te nastavitve še vedno pripadajo ločenima obstoječima postopkoma anonimizacije zasebnih prispevkov in pomenskega indeksiranja. Navaden Gemini ključ ne dokazuje ničelne hrambe pri ponudniku; te oznake ne vključi samo zato, da bi omogočil klepet.

## Obnašanje

- Splošna vprašanja: Gemini odgovori tudi brez zadetkov v trail zbirki.
- Nadaljevalna vprašanja: pošlje se zadnjih največ 12 sporočil z omejitvijo velikosti. Zgodovina ostane v pomnilniku komponente, brez localStorage ali shranjevanja prepisov v bazo. Nov pogovor, odhod s strani ali sprememba računa jo počistijo.
- Trail vprašanja: najprej se poiščejo relevantni javni zapisi iz trenutnega kataloga (tekme, tekači, članki, ture) ter uradni in uredniški viri iz `brain_sources`. Viri iz prejšnjih uporabniških vprašanj pomagajo nadaljevanju pogovora. Dropdown za izbiro teme je odstranjen.
- Odgovor ima citate samo iz dovoljenega nabora virov. Povezave in datumi preverjanja se prikažejo ob posameznem odgovoru. Uredniški podatki niso označeni kot ponovno preverjeni uradni podatki.
- Zasebne datoteke, profili računov, povzetki, čakajoče izkušnje in nepreverjeni skupnostni zapisi niso gradivo klepeta.
- Pri težavah z zbirko splošni klepet ostane na voljo, opozorilo pa pove, da je del trail znanja nedosegljiv.
- Pomenski podagent presodi, ali baza vsebuje dovolj aktualnih dokazov. Izbere `database` (odgovor iz virov), `general` (običajna razlaga), `search` (javno preverljiv manjkajoč ali zastarel podatek) ali `missing` (nezbrane osebne izkušnje, zasebni/neobjavljeni podatki, premalo določeno vprašanje). Pri dovolj dobrem odgovoru iz baze ni dodatne spletne zahteve.
- Spletna stopnja dobi samo jedrnato javno vprašanje, brez celotnega prepisa. Uporabi orodje Google Search in vrne odgovor s povezavami iz dejanskih `groundingMetadata`, ne s povezavami, ki bi si jih izmislil model. Če ni dokazljivega spletnega vira, se odgovor ne predstavi kot preverjeno iskanje. Napake kvote ostanejo napake ponudnika, ne dokaz odsotnosti znanja.
- Vmesnik označi odgovor iz trail zbirke, splošnega znanja ali spleta. Googlov prikaz predlogov iskanja ostane ob spletnem odgovoru v izoliranem iframe brez dovoljenj za skripte ali dostop do aplikacije. Odgovori AI ne zagotavljajo pravilnosti podatkov.

## Predlogi vprašanj

Tabela `public.brain_chat_prompts` vsebuje natanko 10 uporabnikovih potrjenih predlogov. Migracija `brain_chat_prompts` vključi RLS ter dovoli obiskovalcem in prijavljenim samo branje aktivnih vprašanj. Urejanje iz brskalnika ni dovoljeno.

`GET /api/brain/prompts` izbere dve različni vrstici z naključnim premešanjem `crypto.randomInt`. Odgovor se ne predpomni. Prvi prikaz uporabi isti SSR rezultat tudi ob hidraciji, »Nov pogovor« pa naloži nov par. Nov par je lahko po naključju enak prejšnjemu. Predlogi so shranjeni ločeno od raziskovalnih vprašanj `brain_questions` in nikoli ne štejejo kot dokaz.

## Dodajanje trail znanja

Obstoječi skrbniški tok za `brain_sources` že omogoča dodajanje gradiva. Za uporaben zapis določi predmet (`brain_entities`), naslov, vsebinski izvleček, URL, izvor (`official` ali `editorial`), datum preverjanja in obdobje veljavnosti. Dodani relevantni viri se lahko uporabijo pri naslednjem vprašanju; za začetno različico ni treba učiti modela ali ustvarjati dodatne baze.

Daljše dokumente je smiselno razdeliti na krajše odlomke z isto povezavo do vira. Trenutna različica išče po besedah; za večjo zbirko in boljše razumevanje sklonov, sopomenk ter posrednih vprašanj je naslednji korak hibridno pomensko iskanje z embeddings in preverjenim modelom za indeks. To ni pogoj za splošni chatbot.

Odgovori AI se nikoli samodejno ne dodajo v znanje. Obstoječi API za strukturirane prispevke ostaja ločen od deljenja pogovorov. Stikalo »Shrani prispevke iz obrazca« ne upravlja prepisa klepeta.

## Zaseben ali deljen pogovor

Pogovor je privzeto zaseben in prepis ni shranjen v naši bazi. Po prvem sporočilu gumb »Zaseben pogovor« odpre izbiro vidnosti. Deljenje zahteva prijavljen račun, predogled naslova in besedila ter izrecno potrditev. Predogled jasno loči uporabniška sporočila od odgovorov AI, odstrani prepoznavne e-poštne naslove in telefone ter omeji velikost. Uporabnik mora pregledati in odstraniti tudi druge osebne podatke; to ni jamstvo popolne anonimizacije.

Shrani se samo potrjeni posnetek v `brain_shared_conversations`; nadaljnja sporočila ostanejo zasebna. Deljeni posnetek ima javno stran `/mozgan/pogovor/:id`, javni API pa ne razkrije avtorjevega računa. Pogovori so v iskanju označeni z `origin: conversation`, kot nepreverjena razprava, nikoli kot uradna dejstva ali neodvisne potrditve.

Lastnik lahko posnetek umakne v Chatu ali v »Moji deljeni pogovori« v računu. Umik odstrani vrstico, javna povezava vrne 404 in naslednja iskanja tega posnetka ne vključijo. Že prebranih kopij in že ustvarjenih odgovorov drugih uporabnikov ni mogoče preklicati. Drugi računi nimajo pravice upravljati tujega posnetka. RLS dovoljuje samo lastnikovo branje, izrecni vnos in umik; javna projekcija se izvaja na strežniku brez identitete avtorja.

Možgan uporablja skupno zgornjo navigacijo strani: »Chat«, »Analitika« in »Baza znanja«. Povezava »Nazaj na trail« vodi na domačo stran. Sidebar in njegovi gumbi so odstranjeni; račun ostaja dostopen prek prijavne povezave, skrbništvo pa prijavljenemu skrbniku prek računa oziroma vrstice seje.

## Preverjanje

`npm run test:brain`, `npm run typecheck`, `npm run build`.

Ročno preveri splošno vprašanje, nadaljevanje iste teme, konkretno tekmo z navedbo vira, neznan lokalni podatek, nov pogovor in napako ponudnika. Ob `429` preveri kvoto/obračun; ob `403` ključ in dovoljenja; ob `404` model; ob `503` začasno dosegljivost. Nikoli ne izpisuj ključa, prepisov ali surovih napak ponudnika.
