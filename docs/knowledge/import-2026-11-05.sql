begin;

insert into public.brain_entities(kind,title,race_slug,year,legacy_key,metadata)
select 'edition', title || ' 2026', race_slug, 2026, 'edition:go4trail:2026', '{"research_batch":"2026-11-05"}'::jsonb
from public.brain_entities where legacy_key='race:go4trail'
on conflict(legacy_key) do nothing;

insert into public.brain_relations(subject_id,object_id,relation)
select e.id,r.id,'edition_of' from public.brain_entities e cross join public.brain_entities r
where e.legacy_key='edition:go4trail:2026' and r.legacy_key='race:go4trail' on conflict do nothing;

insert into public.brain_sources(entity_id,title,excerpt,url,origin,verified_at,valid_from,valid_until,legacy_key)
select id,'GO4Trail 2026 – datum in prizorišče','GO4Trail – Tek treh vrhov bo v soboto, 7. novembra 2026. To je deveta izvedba. Prizorišče, štart in cilj so v Kajak centru Solkan pri Novi Gorici. Dogodek ponuja GO Ultra, GO3V in prenovljeni GO Trim Škabrijel.','https://go4trail.si/','official','2026-11-05'::timestamptz,null,'2026-12-31'::date,'research:go4trail:2026:01'
from public.brain_entities where legacy_key='edition:go4trail:2026'
on conflict(legacy_key) do update set title=excluded.title,excerpt=excluded.excerpt,url=excluded.url,origin=excluded.origin,verified_at=excluded.verified_at,valid_from=excluded.valid_from,valid_until=excluded.valid_until,
embedding=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding else null end,
embedding_model=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding_model else null end;

insert into public.brain_sources(entity_id,title,excerpt,url,origin,verified_at,valid_from,valid_until,legacy_key)
select id,'GO4Trail 2026 – petkov prevzem številk','Prevzem štartnih številk in paketov je v petek, 6. novembra 2026, med 16.00 in 20.00 v Kajak centru Solkan. Organizator priporoča petkov prevzem. Na uradni naslovnici je povezava na program 2026; sobotni termini prevzema v tem pregledanem besedilu niso navedeni.','https://go4trail.si/','official','2026-11-05'::timestamptz,null,'2026-12-31'::date,'research:go4trail:2026:02'
from public.brain_entities where legacy_key='edition:go4trail:2026'
on conflict(legacy_key) do update set title=excluded.title,excerpt=excluded.excerpt,url=excluded.url,origin=excluded.origin,verified_at=excluded.verified_at,valid_from=excluded.valid_from,valid_until=excluded.valid_until,
embedding=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding else null end,
embedding_model=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding_model else null end;

insert into public.brain_sources(entity_id,title,excerpt,url,origin,verified_at,valid_from,valid_until,legacy_key)
select id,'GO4Trail 2026 – organizator in rezultati','Organizator je Javni zavod za šport Nova Gorica, Bazoviška 4, Nova Gorica. Uradna informacijska stran za leto 2026 potrjuje štarte: Ultra 7.30, GO3V 9.30 in GO Trim 10.30. Rezultati naj bi bili dostopni na spletni strani dogodka in pri partnerju PROTIME na my.raceresult.com. To ni potrditev, da so rezultati 2026 že objavljeni.','https://go4trail.si/sl/info','official','2026-11-05'::timestamptz,null,'2026-12-31'::date,'research:go4trail:2026:03'
from public.brain_entities where legacy_key='edition:go4trail:2026'
on conflict(legacy_key) do update set title=excluded.title,excerpt=excluded.excerpt,url=excluded.url,origin=excluded.origin,verified_at=excluded.verified_at,valid_from=excluded.valid_from,valid_until=excluded.valid_until,
embedding=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding else null end,
embedding_model=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding_model else null end;

insert into public.brain_sources(entity_id,title,excerpt,url,origin,verified_at,valid_from,valid_until,legacy_key)
select id,'GO Trim Škabrijel 2026 – razdalja in zahtevnost','GO Trim Škabrijel 2026: 13,13 km, 814 m vzpona, najvišje Škabrijel 646 m. Štart 7. novembra ob 10.30, Kajak center Solkan. Kratka trasa vključuje strme vzpone in tehničen kamnit ter koreninast spust; ob mokrem je lahko spolzka. Približno kilometer je asfalten.','https://go4trail.si/sl/proge/go-trim','official','2026-11-05'::timestamptz,null,'2026-12-31'::date,'research:go4trail:2026:04'
from public.brain_entities where legacy_key='edition:go4trail:2026'
on conflict(legacy_key) do update set title=excluded.title,excerpt=excluded.excerpt,url=excluded.url,origin=excluded.origin,verified_at=excluded.verified_at,valid_from=excluded.valid_from,valid_until=excluded.valid_until,
embedding=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding else null end,
embedding_model=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding_model else null end;

insert into public.brain_sources(entity_id,title,excerpt,url,origin,verified_at,valid_from,valid_until,legacy_key)
select id,'GO Trim Škabrijel 2026 – okrepčevalnice in limit','Okrepčevalnici GO Trim: Vratca pri 5,7 km in TCS Belvedere pri 9,5 km. Uradna stran navaja, da časovnega limita ni. Pot vodi iz Solkana na Škabrijel, proti Prevalu in Belvederu ter mimo Primule nazaj v Kajak center.','https://go4trail.si/sl/proge/go-trim','official','2026-11-05'::timestamptz,null,'2026-12-31'::date,'research:go4trail:2026:05'
from public.brain_entities where legacy_key='edition:go4trail:2026'
on conflict(legacy_key) do update set title=excluded.title,excerpt=excluded.excerpt,url=excluded.url,origin=excluded.origin,verified_at=excluded.verified_at,valid_from=excluded.valid_from,valid_until=excluded.valid_until,
embedding=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding else null end,
embedding_model=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding_model else null end;

insert into public.brain_sources(entity_id,title,excerpt,url,origin,verified_at,valid_from,valid_until,legacy_key)
select id,'GO Trim Škabrijel 2026 – obvezna oprema','Obvezno za GO Trim: vidna štartna številka, posoda za najmanj 500 ml vode, lasten lonček in delujoč utišan telefon. Na okrepčevalnicah ni plastičnih lončkov. Morebitna dodatna vremenska priporočila organizator objavlja pred štartom na svoji Facebook strani.','https://go4trail.si/sl/proge/go-trim','official','2026-11-05'::timestamptz,null,'2026-12-31'::date,'research:go4trail:2026:06'
from public.brain_entities where legacy_key='edition:go4trail:2026'
on conflict(legacy_key) do update set title=excluded.title,excerpt=excluded.excerpt,url=excluded.url,origin=excluded.origin,verified_at=excluded.verified_at,valid_from=excluded.valid_from,valid_until=excluded.valid_until,
embedding=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding else null end,
embedding_model=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding_model else null end;

insert into public.brain_sources(entity_id,title,excerpt,url,origin,verified_at,valid_from,valid_until,legacy_key)
select id,'GO Trim Škabrijel 2026 – prijavnina','Cenik GO Trim 2026: zgodnja prijava 30 €, naslednje obdobje 35 €, redna do 2. novembra 40 €, na dan dogodka 50 €. Obstoj cenika ne potrjuje prostih mest. Palice so dovoljene. Stran omogoča povezavo do GPX in PDF trase 2026.','https://go4trail.si/sl/proge/go-trim','official','2026-11-05'::timestamptz,null,'2026-12-31'::date,'research:go4trail:2026:07'
from public.brain_entities where legacy_key='edition:go4trail:2026'
on conflict(legacy_key) do update set title=excluded.title,excerpt=excluded.excerpt,url=excluded.url,origin=excluded.origin,verified_at=excluded.verified_at,valid_from=excluded.valid_from,valid_until=excluded.valid_until,
embedding=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding else null end,
embedding_model=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding_model else null end;

insert into public.brain_sources(entity_id,title,excerpt,url,origin,verified_at,valid_from,valid_until,legacy_key)
select id,'GO3V 2026 – razdalja in trasa','GO3V 2026: 28,02 km, 1.626 m vzpona, najvišje Skalnica 681 m. Štart 7. novembra ob 9.30 v Kajak centru Solkan. Trasa povezuje Škabrijel, Sveto Goro in Sabotin, vključuje 280-metrsko kaverno, prečkanje Soče z raftom in zaključek čez brv.','https://go4trail.si/sl/proge/go-v3','official','2026-11-05'::timestamptz,null,'2026-12-31'::date,'research:go4trail:2026:08'
from public.brain_entities where legacy_key='edition:go4trail:2026'
on conflict(legacy_key) do update set title=excluded.title,excerpt=excluded.excerpt,url=excluded.url,origin=excluded.origin,verified_at=excluded.verified_at,valid_from=excluded.valid_from,valid_until=excluded.valid_until,
embedding=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding else null end,
embedding_model=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding_model else null end;

insert into public.brain_sources(entity_id,title,excerpt,url,origin,verified_at,valid_from,valid_until,legacy_key)
select id,'GO3V 2026 – okrepčevalnice in časovne zapore','GO3V okrepčevalnice: Vratca 5,7 km, TCS Belvedere 9,5 km, Preški vrh 13 km, Rafti 19 km, koča Sabotin 24 km, cilj 28 km. Zapora pred raftom je ob 14.30, zaključek merjenja časov ob 17.00.','https://go4trail.si/sl/proge/go-v3','official','2026-11-05'::timestamptz,null,'2026-12-31'::date,'research:go4trail:2026:09'
from public.brain_entities where legacy_key='edition:go4trail:2026'
on conflict(legacy_key) do update set title=excluded.title,excerpt=excluded.excerpt,url=excluded.url,origin=excluded.origin,verified_at=excluded.verified_at,valid_from=excluded.valid_from,valid_until=excluded.valid_until,
embedding=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding else null end,
embedding_model=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding_model else null end;

insert into public.brain_sources(entity_id,title,excerpt,url,origin,verified_at,valid_from,valid_until,legacy_key)
select id,'GO3V 2026 – obvezna oprema','Za GO3V so obvezni vidna številka, čelna svetilka, najmanj 500-ml posoda za vodo, hrana, primerno obuvalo, astrofolija, prva pomoč, vetrna jakna, lasten lonček in delujoč utišan telefon. Palice so dovoljene. Mlajši od 18 let ne smejo tekmovati.','https://go4trail.si/sl/proge/go-v3','official','2026-11-05'::timestamptz,null,'2026-12-31'::date,'research:go4trail:2026:10'
from public.brain_entities where legacy_key='edition:go4trail:2026'
on conflict(legacy_key) do update set title=excluded.title,excerpt=excluded.excerpt,url=excluded.url,origin=excluded.origin,verified_at=excluded.verified_at,valid_from=excluded.valid_from,valid_until=excluded.valid_until,
embedding=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding else null end,
embedding_model=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding_model else null end;

insert into public.brain_sources(entity_id,title,excerpt,url,origin,verified_at,valid_from,valid_until,legacy_key)
select id,'GO3V 2026 – prijavnina in omejitve terena','Cenik GO3V: 45 €, 50 €, redna prijava do 2. novembra 60 €, na dan dogodka 70 €. Prosta mesta niso potrjena. Zahtevni so spust pod Sveto Goro, kamnite izpostavljene poti Sabotina in spolzke kaverne. Stran navaja eno ITRA točko.','https://go4trail.si/sl/proge/go-v3','official','2026-11-05'::timestamptz,null,'2026-12-31'::date,'research:go4trail:2026:11'
from public.brain_entities where legacy_key='edition:go4trail:2026'
on conflict(legacy_key) do update set title=excluded.title,excerpt=excluded.excerpt,url=excluded.url,origin=excluded.origin,verified_at=excluded.verified_at,valid_from=excluded.valid_from,valid_until=excluded.valid_until,
embedding=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding else null end,
embedding_model=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding_model else null end;

insert into public.brain_sources(entity_id,title,excerpt,url,origin,verified_at,valid_from,valid_until,legacy_key)
select id,'GO Ultra 2026 – razdalja in potek','GO Ultra 2026: 63,73 km in 2.900 m vzpona. Štart 7. novembra ob 7.30 v Kajak centru Solkan. Trasa poveže Škabrijel, Sveto Goro, Gomilo, Kuk in Sabotin; vključuje kaverno in zaključek čez brv. Najvišja točka je Kuk. Organizator navaja tri ITRA točke.','https://go4trail.si/sl/proge/go-ultra','official','2026-11-05'::timestamptz,null,'2026-12-31'::date,'research:go4trail:2026:12'
from public.brain_entities where legacy_key='edition:go4trail:2026'
on conflict(legacy_key) do update set title=excluded.title,excerpt=excluded.excerpt,url=excluded.url,origin=excluded.origin,verified_at=excluded.verified_at,valid_from=excluded.valid_from,valid_until=excluded.valid_until,
embedding=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding else null end,
embedding_model=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding_model else null end;

insert into public.brain_sources(entity_id,title,excerpt,url,origin,verified_at,valid_from,valid_until,legacy_key)
select id,'GO Ultra 2026 – okrepčevalnice in limiti','Ultra: Vratca 5,7 km, TCS Belvedere 9,5 km, Preški vrh 13 km, Zabrdo 22 km, Bate 31 km, Baske 40 km, Plave 49 km, koča Sabotin 60 km, cilj 64 km. Ciljni limit 14 ur; izločanje pri koči v Prelesju ob 17.00.','https://go4trail.si/sl/proge/go-ultra','official','2026-11-05'::timestamptz,null,'2026-12-31'::date,'research:go4trail:2026:13'
from public.brain_entities where legacy_key='edition:go4trail:2026'
on conflict(legacy_key) do update set title=excluded.title,excerpt=excluded.excerpt,url=excluded.url,origin=excluded.origin,verified_at=excluded.verified_at,valid_from=excluded.valid_from,valid_until=excluded.valid_until,
embedding=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding else null end,
embedding_model=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding_model else null end;

insert into public.brain_sources(entity_id,title,excerpt,url,origin,verified_at,valid_from,valid_until,legacy_key)
select id,'GO Ultra 2026 – obvezna oprema','Ultra zahteva vidno številko, 2 × 500-ml posodo za vodo, hrano, trail obutev, astrofolijo, prvo pomoč, vetrno jakno, flis z dolgimi rokavi, dolge hlače, lasten lonček, delujoč utišan telefon ter čelno svetilko z rezervnimi baterijami. Palice so dovoljene. Minimalna starost je 18 let.','https://go4trail.si/sl/proge/go-ultra','official','2026-11-05'::timestamptz,null,'2026-12-31'::date,'research:go4trail:2026:14'
from public.brain_entities where legacy_key='edition:go4trail:2026'
on conflict(legacy_key) do update set title=excluded.title,excerpt=excluded.excerpt,url=excluded.url,origin=excluded.origin,verified_at=excluded.verified_at,valid_from=excluded.valid_from,valid_until=excluded.valid_until,
embedding=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding else null end,
embedding_model=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding_model else null end;

insert into public.brain_sources(entity_id,title,excerpt,url,origin,verified_at,valid_from,valid_until,legacy_key)
select id,'GO Ultra 2026 – prijavnina in vključene storitve','Cenik Ultra: 70 €, 80 €, redna prijava do 2. novembra 90 €, na dan dogodka 100 €. Prostih mest ne potrjuje. Prijavnina vključuje paket z majico, okrepčevalnice, tuše in garderobe, topel obrok, medaljo, medicinsko pomoč ter meritve. Bolezen oziroma poškodba ne upravičujeta vračila.','https://go4trail.si/sl/proge/go-ultra','official','2026-11-05'::timestamptz,null,'2026-12-31'::date,'research:go4trail:2026:15'
from public.brain_entities where legacy_key='edition:go4trail:2026'
on conflict(legacy_key) do update set title=excluded.title,excerpt=excluded.excerpt,url=excluded.url,origin=excluded.origin,verified_at=excluded.verified_at,valid_from=excluded.valid_from,valid_until=excluded.valid_until,
embedding=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding else null end,
embedding_model=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding_model else null end;

insert into public.brain_sources(entity_id,title,excerpt,url,origin,verified_at,valid_from,valid_until,legacy_key)
select id,'GO4Trail 2026 – otroški tek Sabotinček','Sabotinček bo 7. novembra 2026 od 11.00; zbor je v Kajak centru Solkan. Otroci 6–9 let tečejo 500 m, otroci 10–12 let 900 m. Tek je brezplačen in brez predhodne prijave. Udeleženci prejmejo medaljo, praktično nagrado in pijačo. Organizator napoveduje tudi varstvo otrok med tekom staršev, vendar podrobnosti prijave oziroma pogojev varstva v prebranem besedilu ni.','https://go4trail.si/sl/novice/sabotincek-otroski-tek','official','2026-11-05'::timestamptz,null,'2026-12-31'::date,'research:go4trail:2026:16'
from public.brain_entities where legacy_key='edition:go4trail:2026'
on conflict(legacy_key) do update set title=excluded.title,excerpt=excluded.excerpt,url=excluded.url,origin=excluded.origin,verified_at=excluded.verified_at,valid_from=excluded.valid_from,valid_until=excluded.valid_until,
embedding=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding else null end,
embedding_model=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding_model else null end;

insert into public.brain_sources(entity_id,title,excerpt,url,origin,verified_at,valid_from,valid_until,legacy_key)
select id,'GO4Trail 2026 – zadnje obvestilo o označevanju','Uradna novica, na naslovnici datirana 4. novembra 2026, ponovno potrjuje tek 7. novembra v Kajak centru Solkan. Navaja 550 prijavljenih tekačev in pripravo oznak na trasah. Obiskovalce prosi, naj oznak ne premikajo; po dogodku jih odstrani organizator. Število 550 je časovno vezana navedba organizatorja, ne končno število štartajočih.','https://go4trail.si/sl/novice/pomembno-obvestilo-oznacevanje-tekmovalnih-tras','official','2026-11-05'::timestamptz,null,'2026-12-31'::date,'research:go4trail:2026:17'
from public.brain_entities where legacy_key='edition:go4trail:2026'
on conflict(legacy_key) do update set title=excluded.title,excerpt=excluded.excerpt,url=excluded.url,origin=excluded.origin,verified_at=excluded.verified_at,valid_from=excluded.valid_from,valid_until=excluded.valid_until,
embedding=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding else null end,
embedding_model=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding_model else null end;

insert into public.brain_entities(kind,title,race_slug,year,legacy_key,metadata)
select 'edition', title || ' 2026', race_slug, 2026, 'edition:obala-ultra-trail:2026', '{"research_batch":"2026-11-05"}'::jsonb
from public.brain_entities where legacy_key='race:obala-ultra-trail'
on conflict(legacy_key) do nothing;

insert into public.brain_relations(subject_id,object_id,relation)
select e.id,r.id,'edition_of' from public.brain_entities e cross join public.brain_entities r
where e.legacy_key='edition:obala-ultra-trail:2026' and r.legacy_key='race:obala-ultra-trail' on conflict do nothing;

insert into public.brain_sources(entity_id,title,excerpt,url,origin,verified_at,valid_from,valid_until,legacy_key)
select id,'Obala Ultra Trail 2026 — datum in razdalje','Obala Ultra Trail 2026 poteka od 6. do 8. novembra v Izoli in Slovenski Istri. Na voljo so razdalje 11, 17, 35, 64 in 108 km. Uradna domača stran navaja približno 200, 450, 1000, 2000 in 4000 višinskih metrov. Njeni časovni limiti za krajše tri razdalje se razlikujejo od podrobnih strani, zato jih brez dodatne potrditve ne obravnavamo kot enotno potrjen podatek.','https://obalaultratrail.si/','official','2026-11-05'::timestamptz,null,'2026-12-31'::date,'research:obala-ultra-trail:2026:01'
from public.brain_entities where legacy_key='edition:obala-ultra-trail:2026'
on conflict(legacy_key) do update set title=excluded.title,excerpt=excluded.excerpt,url=excluded.url,origin=excluded.origin,verified_at=excluded.verified_at,valid_from=excluded.valid_from,valid_until=excluded.valid_until,
embedding=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding else null end,
embedding_model=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding_model else null end;

insert into public.brain_sources(entity_id,title,excerpt,url,origin,verified_at,valid_from,valid_until,legacy_key)
select id,'Obala Ultra Trail 2026 — prevzem številk in briefing','Obala Ultra Trail 2026: prevzem številk je v petek 6. novembra med 12.00 in 21.00 v restavraciji San Simon Resort v Izoli. Za 108 km je prevzem dovoljen izključno v petek; uradni briefing 108 km je 19.45–20.00. Za ostale razdalje je prevzem še v soboto 7. novembra 6.00–11.30. Organizator dopušča spremembo programa do 24 ur pred dogodkom.','https://obalaultratrail.si/en/program/','official','2026-11-05'::timestamptz,null,'2026-12-31'::date,'research:obala-ultra-trail:2026:02'
from public.brain_entities where legacy_key='edition:obala-ultra-trail:2026'
on conflict(legacy_key) do update set title=excluded.title,excerpt=excluded.excerpt,url=excluded.url,origin=excluded.origin,verified_at=excluded.verified_at,valid_from=excluded.valid_from,valid_until=excluded.valid_until,
embedding=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding else null end,
embedding_model=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding_model else null end;

insert into public.brain_sources(entity_id,title,excerpt,url,origin,verified_at,valid_from,valid_until,legacy_key)
select id,'Obala Ultra Trail 2026 — starti in sobotni prevozi','Obala Ultra Trail v soboto 7. novembra 2026: 108 km start Dekani ob 6.00, avtobus iz Izole 5.00–5.10; 64 km start Hrastovlje ob 9.00, avtobus 7.45–7.50; 35 km start San Simon ob 11.00; 17 km start pri zadružnem domu Korte ob 11.30, avtobus 10.35–10.45; 11 km start San Simon ob 12.00. Avtobusi odhajajo pri recepciji San Simon Resort. Zaključek 108 km je v nedeljo ob 7.00.','https://obalaultratrail.si/en/program/','official','2026-11-05'::timestamptz,null,'2026-12-31'::date,'research:obala-ultra-trail:2026:03'
from public.brain_entities where legacy_key='edition:obala-ultra-trail:2026'
on conflict(legacy_key) do update set title=excluded.title,excerpt=excluded.excerpt,url=excluded.url,origin=excluded.origin,verified_at=excluded.verified_at,valid_from=excluded.valid_from,valid_until=excluded.valid_until,
embedding=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding else null end,
embedding_model=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding_model else null end;

insert into public.brain_sources(entity_id,title,excerpt,url,origin,verified_at,valid_from,valid_until,legacy_key)
select id,'Obala Trail 11 km 2026 — trasa, start in oprema','Obala Trail 11 km: 7. november 2026 ob 12.00, start in cilj San Simon v Izoli, približno 200 m vzpona, ena okrepčevalnica. Pot vodi čez Belveder v Strunjan, mimo solin in skozi krajinski park nad Mesečevim zalivom nazaj v Izolo. Organizator navaja 80 % asfalta. Obvezni so vidna številka spredaj, lonček za večkratno uporabo, tekaški čevlji in telefon. Podrobna stran določa limit cilja 2 h 30 min in Strunjana 1 h 40 min; domača stran navaja 3 h, zato je limit neskladen. Prijavni limit 300, cenik 37/42/47/55 EUR do 31.3./30.6./14.9./15.10.2026.','https://obalaultratrail.si/razdalje/obala-trail-11-km/','official','2026-11-05'::timestamptz,null,'2026-12-31'::date,'research:obala-ultra-trail:2026:04'
from public.brain_entities where legacy_key='edition:obala-ultra-trail:2026'
on conflict(legacy_key) do update set title=excluded.title,excerpt=excluded.excerpt,url=excluded.url,origin=excluded.origin,verified_at=excluded.verified_at,valid_from=excluded.valid_from,valid_until=excluded.valid_until,
embedding=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding else null end,
embedding_model=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding_model else null end;

insert into public.brain_sources(entity_id,title,excerpt,url,origin,verified_at,valid_from,valid_until,legacy_key)
select id,'Obala Trail 17 km 2026 — trasa, start in oprema','Obala Trail 17 km: start Korte 7. novembra 2026 ob 11.30, cilj San Simon v Izoli, približno 450 m vzpona, ena okrepčevalnica. Trasa gre čez Cetore, Malijo, Jagodje, Malo Sevo, Strunjan in Belveder; organizator navaja 83 % makadama/gozdnih poti in 17 % asfalta. Obvezni so številka, lonček, tekaški čevlji, osnovna prva pomoč, izotermična folija, energijska hrana in telefon. Podrobna stran določa Strunjan 3 h in cilj 4 h; domača stran 5 h, zato je limit neskladen. Štartnina vključuje prevoz Izola–Korte. Prijavni limit 300, cenik 50/57/64/70 EUR do 31.3./30.6./14.9./15.10.2026.','https://obalaultratrail.si/razdalje/obala-trail-17-km/','official','2026-11-05'::timestamptz,null,'2026-12-31'::date,'research:obala-ultra-trail:2026:05'
from public.brain_entities where legacy_key='edition:obala-ultra-trail:2026'
on conflict(legacy_key) do update set title=excluded.title,excerpt=excluded.excerpt,url=excluded.url,origin=excluded.origin,verified_at=excluded.verified_at,valid_from=excluded.valid_from,valid_until=excluded.valid_until,
embedding=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding else null end,
embedding_model=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding_model else null end;

insert into public.brain_sources(entity_id,title,excerpt,url,origin,verified_at,valid_from,valid_until,legacy_key)
select id,'Obala Trail 35 km 2026 — trasa in časovni limiti','Obala Trail 35 km: start in cilj San Simon, Izola, 7. novembra 2026 ob 11.00; približno 1000 m vzpona, tri okrepčevalnice, 77 % traila in 23 % asfalta. Trasa povezuje obalo Izole, Baredi/Šared, Korte, Malijo, Jagodje, Malo Sevo, Strunjan in Belveder. Tabela postaj navaja Baredi 11 km/2:15, Malija 22 km/4:30, Strunjan 30 km/6:45; gre za objavljene časovne limite od starta. Podrobni cilj je 7 h 30 min, domača stran 8 h. Prva okrepna je v opisu Šared, v tabeli Baredi: položaj potrebuje preverjanje. Limit 500, cenik 53/60/67/75 EUR do 31.3./30.6./14.9./15.10.2026.','https://obalaultratrail.si/razdalje/obala-trail-35-km/','official','2026-11-05'::timestamptz,null,'2026-12-31'::date,'research:obala-ultra-trail:2026:06'
from public.brain_entities where legacy_key='edition:obala-ultra-trail:2026'
on conflict(legacy_key) do update set title=excluded.title,excerpt=excluded.excerpt,url=excluded.url,origin=excluded.origin,verified_at=excluded.verified_at,valid_from=excluded.valid_from,valid_until=excluded.valid_until,
embedding=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding else null end,
embedding_model=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding_model else null end;

insert into public.brain_sources(entity_id,title,excerpt,url,origin,verified_at,valid_from,valid_until,legacy_key)
select id,'Obala Trail 35 km 2026 — obvezna oprema','Obala Trail 35 km 2026 zahteva številko spredaj, lonček, tekaške čevlje, prvo pomoč, primerna oblačila, izotermično folijo, energijsko hrano, nahrbtnik z dvema 500 ml bidonoma, piščalko, telefon in vetrovko. Čelna svetilka je obvezna pri več kot petih urah na trasi. Palice so priporočene. Opremo preverjajo tudi ob prevzemu številke.','https://obalaultratrail.si/razdalje/obala-trail-35-km/','official','2026-11-05'::timestamptz,null,'2026-12-31'::date,'research:obala-ultra-trail:2026:07'
from public.brain_entities where legacy_key='edition:obala-ultra-trail:2026'
on conflict(legacy_key) do update set title=excluded.title,excerpt=excluded.excerpt,url=excluded.url,origin=excluded.origin,verified_at=excluded.verified_at,valid_from=excluded.valid_from,valid_until=excluded.valid_until,
embedding=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding else null end,
embedding_model=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding_model else null end;

insert into public.brain_sources(entity_id,title,excerpt,url,origin,verified_at,valid_from,valid_until,legacy_key)
select id,'Obala Ultra Trail 64 km 2026 — start, trasa in postaje','Obala Ultra Trail 64 km 2026 starta 7. novembra ob 9.00 v Hrastovljah, cilj San Simon Izola, približno 2000 m vzpona, limit 15 h, pet okrepčevalnic. Pot: Kubed, Boršt, dolina Dragonje, Koštabona, Puče, Šmarje, Korte, Malija, Strunjan, Belveder. Postaje in objavljeni limiti od starta: Boršt 17 km/3:45, Puče 28 km/6:30, Šmarje 40 km/9:00, Malija 51 km/11:45, Strunjan 59 km/13:45. Prijavni limit je 300. Cenik: 80/92/105/120 EUR do 31.3./30.6./14.9./15.10.2026. Vključuje avtobus Izola–Hrastovlje. Seštevek vzpona v tabeli se razlikuje od naslovne vrednosti; 2000 m je organizatorjeva približna navedba.','https://obalaultratrail.si/razdalje/obala-ultra-trail-64-km/','official','2026-11-05'::timestamptz,null,'2026-12-31'::date,'research:obala-ultra-trail:2026:08'
from public.brain_entities where legacy_key='edition:obala-ultra-trail:2026'
on conflict(legacy_key) do update set title=excluded.title,excerpt=excluded.excerpt,url=excluded.url,origin=excluded.origin,verified_at=excluded.verified_at,valid_from=excluded.valid_from,valid_until=excluded.valid_until,
embedding=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding else null end,
embedding_model=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding_model else null end;

insert into public.brain_sources(entity_id,title,excerpt,url,origin,verified_at,valid_from,valid_until,legacy_key)
select id,'Obala Ultra Trail 64 km 2026 — oprema','Obala Ultra Trail 64 km 2026: obvezni so vidna številka, lonček, tekaški čevlji, komplet prve pomoči, primerna oblačila, izotermična folija, hrana, nahrbtnik z 2×500 ml, piščalka, telefon, vetrovka, kapa/bandana, rokavice in čelna svetilka z dodatno baterijo ali rezervno svetilko. Palice so priporočene. Temperaturne in vetrne zahteve na podrobni strani se razlikujejo od skupne strani opreme; preveriti zadnje organizatorjevo obvestilo.','https://obalaultratrail.si/razdalje/obala-ultra-trail-64-km/','official','2026-11-05'::timestamptz,null,'2026-12-31'::date,'research:obala-ultra-trail:2026:09'
from public.brain_entities where legacy_key='edition:obala-ultra-trail:2026'
on conflict(legacy_key) do update set title=excluded.title,excerpt=excluded.excerpt,url=excluded.url,origin=excluded.origin,verified_at=excluded.verified_at,valid_from=excluded.valid_from,valid_until=excluded.valid_until,
embedding=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding else null end,
embedding_model=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding_model else null end;

insert into public.brain_sources(entity_id,title,excerpt,url,origin,verified_at,valid_from,valid_until,legacy_key)
select id,'Obala Ultra Trail 108 km 2026 — start, trasa in limiti','Obala Ultra Trail 108 km 2026: 7. november ob 6.00 iz Dekanov, cilj Izola San Simon, približno 4000 m vzpona, 25 h, devet okrepčevalnic. Trasa med drugim prečka Socerb, Slavnik, Zazid, Kubed, Boršt, Puče, Šmarje, Malijo in Strunjan. Objavljene postaje km/limit od starta: Socerb 10/2:15, Slavnik 24/5:30, Zazid 39/9:00, Kubed 49/11:30, Boršt 61/13:45, Puče 72/16:15, Šmarje 83/19:45, Malija 93/22:00, Strunjan 102/23:45. Tabela označuje tranzicijo v Kubedu. Limit prijav 300; cenik 115/130/150/170 EUR do 31.3./30.6./14.9./15.10.2026.','https://obalaultratrail.si/en/distances/obala-ultra-trail-108-km/','official','2026-11-05'::timestamptz,null,'2026-12-31'::date,'research:obala-ultra-trail:2026:10'
from public.brain_entities where legacy_key='edition:obala-ultra-trail:2026'
on conflict(legacy_key) do update set title=excluded.title,excerpt=excluded.excerpt,url=excluded.url,origin=excluded.origin,verified_at=excluded.verified_at,valid_from=excluded.valid_from,valid_until=excluded.valid_until,
embedding=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding else null end,
embedding_model=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding_model else null end;

insert into public.brain_sources(entity_id,title,excerpt,url,origin,verified_at,valid_from,valid_until,legacy_key)
select id,'Obala Ultra Trail 108 km 2026 — oprema','Obala Ultra Trail 108 km 2026 zahteva številko, lonček, trail čevlje, prvo pomoč, oblačila, izotermično folijo, hrano, nahrbtnik z 2×500 ml, piščalko, telefon, vetrovko, kapo/bandano, rokavice ter čelno svetilko z rezervno baterijo ali drugo svetilko. Palice so priporočene. Zahteve za temperaturo/veter se med uradnimi stranmi razlikujejo; zadnja navodila organizatorja imajo prednost.','https://obalaultratrail.si/en/distances/obala-ultra-trail-108-km/','official','2026-11-05'::timestamptz,null,'2026-12-31'::date,'research:obala-ultra-trail:2026:11'
from public.brain_entities where legacy_key='edition:obala-ultra-trail:2026'
on conflict(legacy_key) do update set title=excluded.title,excerpt=excluded.excerpt,url=excluded.url,origin=excluded.origin,verified_at=excluded.verified_at,valid_from=excluded.valid_from,valid_until=excluded.valid_until,
embedding=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding else null end,
embedding_model=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding_model else null end;

insert into public.brain_sources(entity_id,title,excerpt,url,origin,verified_at,valid_from,valid_until,legacy_key)
select id,'Obala Ultra Trail 2026 — splošna pravila opreme in spremembe','Obala Ultra Trail zahteva nošenje obvezne opreme ves čas tekme. Organizator lahko zaradi vremena doda zahteve za vročino ali mraz in spremembe objavi pred prevzemom številk na Facebooku in Instagramu. Skupna stran za ultra opremo navaja oblačila za -5 do 20 °C in veter nad 100 km/h, medtem ko strani 64/108 km navajajo 5 do 20 °C in nad 50 km/h. Gre za neskladje uradnih virov, ne za vremensko napoved ali potrjeno spremembo pravil. Pred startom je treba preveriti zadnja organizatorjeva navodila.','https://obalaultratrail.si/tekaci/obvezna-oprema/','official','2026-11-05'::timestamptz,null,'2026-12-31'::date,'research:obala-ultra-trail:2026:12'
from public.brain_entities where legacy_key='edition:obala-ultra-trail:2026'
on conflict(legacy_key) do update set title=excluded.title,excerpt=excluded.excerpt,url=excluded.url,origin=excluded.origin,verified_at=excluded.verified_at,valid_from=excluded.valid_from,valid_until=excluded.valid_until,
embedding=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding else null end,
embedding_model=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding_model else null end;

insert into public.brain_sources(entity_id,title,excerpt,url,origin,verified_at,valid_from,valid_until,legacy_key)
select id,'Obala Ultra Trail — pravila udeležbe in odstopa','Obala Ultra Trail: za 108, 64 in 35 km pravilnik zahteva starost nad 18 let. Za 17 km dovoljuje 15–18 let s pisnim soglasjem in spremstvom starša/skrbnika, za 11 km prepoveduje mlajše od 12 let ter zahteva soglasje in spremstvo za 12–15 let. Tekač sledi označeni trasi; GPS je le pomoč. Odstop je treba javiti organizatorju na kontrolni točki ali okrepčevalnici, izven nje samo v nuji. Zunanja pomoč je omejena na dovoljene postaje, pacing in neregistrirano spremstvo sta prepovedana. Prepovedano je odmetavanje smeti in nastop pod tujim imenom. Pritožba: pisno v 30 min po cilju, varščina 50 EUR. Stran nima izrecne letnice pravilnika.','https://obalaultratrail.si/tekaci/uradni-pravilnik/','official','2026-11-05'::timestamptz,null,null,'research:obala-ultra-trail:2026:13'
from public.brain_entities where legacy_key='race:obala-ultra-trail'
on conflict(legacy_key) do update set title=excluded.title,excerpt=excluded.excerpt,url=excluded.url,origin=excluded.origin,verified_at=excluded.verified_at,valid_from=excluded.valid_from,valid_until=excluded.valid_until,
embedding=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding else null end,
embedding_model=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding_model else null end;

insert into public.brain_sources(entity_id,title,excerpt,url,origin,verified_at,valid_from,valid_until,legacy_key)
select id,'Obala Ultra Trail — brezplačni prevozi na starte','Obala Ultra Trail organizira brezplačne avtobuse iz glavnega zbirnega mesta v Izoli do startov v Dekanih za 108 km, Hrastovljah za 64 km in Kortah za 17 km. Osebni avtomobil na startu ni potreben. Natančne ure za izvedbo 2026 so objavljene ločeno v programu. Stran transporta sama nima izrecne letnice.','https://obalaultratrail.si/tekaci/transport/','official','2026-11-05'::timestamptz,null,null,'research:obala-ultra-trail:2026:14'
from public.brain_entities where legacy_key='race:obala-ultra-trail'
on conflict(legacy_key) do update set title=excluded.title,excerpt=excluded.excerpt,url=excluded.url,origin=excluded.origin,verified_at=excluded.verified_at,valid_from=excluded.valid_from,valid_until=excluded.valid_until,
embedding=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding else null end,
embedding_model=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding_model else null end;

insert into public.brain_sources(entity_id,title,excerpt,url,origin,verified_at,valid_from,valid_until,legacy_key)
select id,'Obala Ultra Trail 2026 — prijave, menjave in osebni prevzem','Obala Ultra Trail 2026: FAQ določa konec prijav 15.10.2026 ob 23.59. Menjava tekača in razdalje sta mogoči najpozneje do 22.10.2026 oziroma prej, če je dosežen limit. Za menjave 15.9.–22.10. je navedena pristojbina 15 EUR. Ob osebnem prevzemu številke mora tekač predložiti osebni dokument s fotografijo, podpisati izjavo in opraviti pregled opreme. Drug udeleženec številke ne more prevzeti. Organizator prijavnine ob osebni odpovedi ne vrača; izbirno zavarovanje se uveljavlja pri zavarovalnici. Prenos zaradi poškodbe v naslednje leto ni omogočen. Na okrepnih ni plastičnih lončkov, zato je potreben lasten lonček ali bidon. Dovoljene podporne postaje je treba preveriti v vodniku.','https://obalaultratrail.si/vec-informacij/','official','2026-11-05'::timestamptz,null,'2026-12-31'::date,'research:obala-ultra-trail:2026:15'
from public.brain_entities where legacy_key='edition:obala-ultra-trail:2026'
on conflict(legacy_key) do update set title=excluded.title,excerpt=excluded.excerpt,url=excluded.url,origin=excluded.origin,verified_at=excluded.verified_at,valid_from=excluded.valid_from,valid_until=excluded.valid_until,
embedding=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding else null end,
embedding_model=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding_model else null end;

insert into public.brain_sources(entity_id,title,excerpt,url,origin,verified_at,valid_from,valid_until,legacy_key)
select id,'Obala Ultra Trail 2026 — napoved udeležbe in stanje prijav','Objava Slovenske turistične organizacije z dne 3.11.2026, z navedenim virom organizatorjem IDILA TRAIL ADVENTURES, opisuje šesto izvedbo Obala Ultra Trail 6.–8. novembra 2026 kot razprodano. Napoveduje 1650 tekačev iz več kot 43 držav, pet razdalj in GPS-sledenje na najdaljših preizkušnjah. Napovedana udeležba ni število dejanskih startov ali finišerjev. Gre za sporočilo organizatorja, objavljeno pri STO, ne za rezultate tekme.','https://www.slovenia.info/sl/novinarsko-sredisce/novice/40456-obala-ultra-trail-powered-by-i-feel-slovenia-2026-bo-povezal-1-650-tekacev-iz-vec-kot-43-drzav','editorial','2026-11-05'::timestamptz,null,'2026-12-31'::date,'research:obala-ultra-trail:2026:16'
from public.brain_entities where legacy_key='edition:obala-ultra-trail:2026'
on conflict(legacy_key) do update set title=excluded.title,excerpt=excluded.excerpt,url=excluded.url,origin=excluded.origin,verified_at=excluded.verified_at,valid_from=excluded.valid_from,valid_until=excluded.valid_until,
embedding=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding else null end,
embedding_model=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding_model else null end;

insert into public.brain_sources(entity_id,title,excerpt,url,origin,verified_at,valid_from,valid_until,legacy_key)
select id,'Obala Ultra Trail — strani za rezultate in arhiv','Uradni arhiv Obala Ultra Trail vsebuje naslove za rezultate 2021–2025, vendar v pregledanem besedilnem prikazu niso bili dostopni dejanski rezultati ali ciljna povezava do merilca časa. Iz te strani ni mogoče potrditi zmagovalcev, časov ali števila finišerjev. Rezultate bo treba pridobiti iz konkretnega rezultatskega vira in jih vezati na leto ter razdaljo.','https://obalaultratrail.si/rezultati/arhiv-rezultatov-iz-prejsnjih-let/','official','2026-11-05'::timestamptz,null,null,'research:obala-ultra-trail:2026:17'
from public.brain_entities where legacy_key='race:obala-ultra-trail'
on conflict(legacy_key) do update set title=excluded.title,excerpt=excluded.excerpt,url=excluded.url,origin=excluded.origin,verified_at=excluded.verified_at,valid_from=excluded.valid_from,valid_until=excluded.valid_until,
embedding=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding else null end,
embedding_model=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding_model else null end;

do $$ begin
if (select count(*) from public.brain_sources where legacy_key like 'research:go4trail:2026:%' or legacy_key like 'research:obala-ultra-trail:2026:%') <> 34
then raise exception 'Knowledge package count mismatch'; end if;
end $$;

commit;
