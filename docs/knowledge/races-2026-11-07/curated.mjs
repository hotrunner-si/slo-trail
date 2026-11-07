// Human-reviewed factual paraphrases. Evidence keys resolve to checked public URLs.
import {readFileSync,writeFileSync} from 'node:fs'
const dir='docs/knowledge/races-2026-11-07/'
const evidence=JSON.parse(readFileSync(dir+'evidence-index.json','utf8'))
const inventory=JSON.parse(readFileSync(dir+'inventory.json','utf8'))
export const records=[]
function batch(slug,key,year,items){
 const e=evidence.find(x=>x.key===key&&x.ok);if(!e)throw Error(key)
 const race=inventory.find(x=>x.slug===slug);if(!race)throw Error(slug)
 for(const [topic,text] of items){records.push({slug,year,topic,title:`${race.name}${year?' '+year:''} – ${topic}`,excerpt:`${race.name}${year?' – izvedba '+year:''}. ${text}`,url:e.finalUrl,evidenceKey:key,origin:'official',verifiedAt:'2026-11-07'})}
}
batch('6-ur-spanovega-vrha','12501a8cc2ca035f',2026,[
 ['format','Med 10. in 16. uro se je beležilo število vzponov; dogodek ni tek na eno fiksno skupno razdaljo.'],
 ['trasa','Vzpon od prireditvenega prostora v Planini pod Golico do zgornje postaje žičnice Španov vrh premaga 380 višinskih metrov.'],
 ['povezava z narcisami','Prireditev 16. maja je bila del programa Miss narcis 2026.'],
 ['prijavnina','Udeležba je bila brez štartnine; prvih 50 predprijavljenih je dobilo brezplačno majico.'],
 ['malica','Udeleženec z vsaj dvema opravljenima vzponoma je prejel bon za brezplačno malico.'],
 ['kategorije','Razglasitev ob 16.30 je zajemala osem kategorij: po spolu in starostnih skupinah do 15, 16–35, 36–49 in 50 let ali več.']
])
batch('8-ur-sv-ane','20642ee8b48065a9',null,[
 ['začetki','Organizator navaja začetek dogodka leta 2022; termin v začetku marca je namenjen preizkusu pripravljenosti pred tekaško sezono.'],
 ['pot vzpona','Dovoljena pot vodi od kozolčka v Dolenjih Lazih po označeni pohodniški poti do cerkve sv. Ane.'],
 ['kontrolne točke','Poleg kontrol pri kozolčku in cerkvi je vmesna kontrola pri Seljanu; štejejo na vrhu zabeleženi vzponi.'],
 ['časovno okno','Na predstavitvi organizator navaja štart ob 8.00 in zaključek zadnjega vzpona do 16.00. Pred prihodnjo izvedbo je treba preveriti njen razpis.'],
 ['posebni nagradi','Poleg števila vzponov dogodek nagrajuje tudi najhitrejši posamezni vzpon in spust.'],
 ['rekord vzponov','Ob preverjanju 7. novembra 2026 je organizator kot trenutni rekord navajal 12 vzponov; stran ne pripiše rekorda posameznemu letu ali tekaču.']
])
batch('hg-trail-idrija','d7ed7edeb329b70e',2026,[
 ['Laufar 50 km','Razpis navaja 50 km, 2.845 m vzpona in 12-urni limit; štart 6. junija ob 7.00 na Mestnem trgu v Idriji.'],
 ['Berkmandlc 27 km','Razpis navaja 27 km, 1.410 m vzpona in sedemurni limit; štart ob 9.00 na Mestnem trgu v Idriji.'],
 ['Čipka 14 km','Razpis navaja 14 km, 650 m vzpona in štiriurni limit; štart ob 10.30 na Mestnem trgu v Idriji.'],
 ['okrepčevalnice','Razpis zagotavlja šest postaj: štiri s hrano in pijačo ter dve s pijačo.'],
 ['idrijski obrok','V cilju je razpis kot topli obrok navedel žlikrofe, poleg vode in soka.'],
 ['kontrole','Obvezna je registracija na vsaki kontrolni točki; manjkajoča registracija pomeni diskvalifikacijo.']
])
batch('hg-trail-idrija','c759d0f5225b4d29',2025,[
 ['zgodovinske dolžine','Razpis za 10. maj 2025 navaja Laufar 50 km/+2.845 m, Berkmandlc 27 km/+1.410 m in Čipka 14 km/+650 m.'],
 ['okrepčevalnice','Razpis 2025 je navajal sedem postaj, štiri s hrano in pijačo ter tri s pijačo; tega števila ne prenašamo na izvedbo 2026.']
])
batch('hrastnik-trail','6281f85ed027cfb8',2026,[
 ['šesta izvedba','Organizator je tek 18. aprila 2026 predstavil kot šesto izvedbo Hrastnik Traila.'],
 ['Hrastkov tek','Otroška trasa Hrastkov tek, dolga 1,3 km, je bila prvič dodana leta 2024.']
])
batch('hrastnik-trail','5c31419f0d6031e5',2026,[
 ['limiti tras','Časovne omejitve so bile ena ura za Hrastkov tek, dve uri za Turističnih 6 in tri ure za Razglednih 12.'],
 ['oprema','Navodila niso predpisovala obvezne opreme; pohodne palice so bile dovoljene, uporaba GPX na uri pa priporočena.'],
 ['oskrba','Razglednih 12 je imel tri okrepčevalnice, Turističnih 6 eno; pomoč med okrepčevalnicami ni bila dovoljena.'],
 ['štartna številka','Številka je morala biti vidna na zgornjem delu telesa, ne na hrbtu ali nogi.']
])
batch('kbk-trail','525927c755ef98ad',2027,[
 ['dolžina in vzpon','Uradna predstavitev ob napovedi izvedbe 15. maja 2027 navaja 23,12 km in 1.304 m višinske razlike.']
])
batch('kbk-trail','3bd151a77d6e7004',2027,[
 ['start in organizator','Razpis za 15. maj 2027 navaja štart ob 9.00 na Hotavljah; organizira Športno društvo Marmor Hotavlje.'],
 ['kraji ob progi','Trasa povezuje Hotavlje, Slajko, Ermanovec, Kopačnico, Studor in Srednje Brdo ter se vrne na Hotavlje.'],
 ['limit','Predviden je peturen limit, do 14.00; po njem udeleženci nadaljujejo kot običajni pohodniki oziroma tekači.'],
 ['oprema in voda','Palice so dovoljene. Na postaji ni kozarčkov, zato je potreben lasten lonček in dovolj tekočine.'],
 ['Pušeljc gorskih tekov','Razpis KBK uvršča v Pušeljc skupaj z Ratitovcem, PTRF v Podbrdu in Črno prstjo.']
])
batch('knap-trail','febcc1c2d0ce5939',2027,[
 ['T kratka','Uradni seznam razdalj pri napovedi izvedbe 2027 navaja traso T\' kratka, dolgo 16 km.'],
 ['T sredna','Uradni seznam razdalj pri napovedi izvedbe 2027 navaja traso T\' sredna, dolgo 30 km.'],
 ['T douga','Uradni seznam razdalj pri napovedi izvedbe 2027 navaja traso T\' douga, dolgo 50 km.'],
 ['organizator','Kot organizator je navedeno Športno društvo Sportiva iz Trbovelj.'],
 ['značaj dogodka','Organizator Knap Trail opisuje kot zimsko tekaško prireditev po zasavskem hribovju.']
])
batch('loncarija-tece','a04998a5ce1f8649',2026,[
 ['Potičnica','Trail Potičnica je bil predstavljen z dolžino 24 km in 880 m vzpona.'],
 ['Lončar','Trasa Lončar je bila predstavljena z dolžino 10 km in 40 m vzpona.'],
 ['prizorišče','Štart in cilj tekov sta na igrišču v Dolenji vasi; osrednje dogajanje je v vaškem jedru ob bifeju in igrišču.'],
 ['tradicija društva','Športno in turistično društvo Lončar je leta 2021 praznovalo 30 let; organizator poudarja neprekinjeno delo treh generacij.'],
 ['zgodovinska Potičnica','Arhivski povzetek za leto 2021 omenja 26-kilometrski trail po enoletnem premoru. Ta dolžina se razlikuje od 24 km v predstavitvi 2026.']
])
batch('ponikva4trail','b71ef7368e2e5e41',2026,[
 ['tekmovalna trasa','Tek 10. oktobra 2026 je bil razpisan na 23 km in 1.100 m vzpona, s štartom ob 11.00 na Ponikvi pri Žalcu ter šesturnim limitom.'],
 ['pohod','Ločen pohod je imel 14,5 km in 1.100 m vzpona; štart ob 9.00 ter šesturen limit.'],
 ['obvezna oprema','Za tekače in pohodnike so bili obvezni vidna štartna številka, mala prva pomoč, zložljiv lonček in mobilni telefon. Palice in energijska hrana so bili opcijski.'],
 ['peta udeležba','Organizator je udeležencem, ki so leta 2026 prišli petič, obljubil posebno presenečenje v štartnem paketu.'],
 ['starost','Tekmovalna udeležba je bila omejena na polnoletne; mladoletni so se pohoda lahko udeležili ob spremstvu in odgovornosti staršev ali skrbnikov.'],
 ['izgubljene oznake','Če udeleženec več kot 200 m ne vidi oznake, navodila zahtevajo vrnitev do zadnje oznake in ponovno preverjanje poti.']
])
batch('ribnica-trail','403d27e1b1a05dff',2026,[
 ['Kuhavn ca','Razpis za 5. september navaja Kuhavn\'co 13 km/+600 m, štiriurni limit in štart ob 10.00 pri Ribniškem gradu; dolžina in vzpon imata toleranco ±10 %.'],
 ['Čebular ca','Razpis navaja Čebular\'co 26 km/+1.200 m, šesturen limit in štart ob 9.00 pri Ribniškem gradu; toleranca ±10 %.'],
 ['Ribež n','Razpis navaja Ribež\'n 40 km/+1.900 m, osemurni limit in štart ob 8.00 pri Ribniškem gradu; toleranca ±10 %.'],
 ['Ruk n Ančko','Posebna nagrada Ruk\'n Ančko je namenjena najhitrejšemu vzponu od štarta do cerkve sv. Ane. Za rekordni vzpon je razpisana tudi denarna nagrada.'],
 ['obvezna oprema','Obvezna sta lasten lonček oziroma zaloga tekočine za razdaljo med postajama in vključen mobilni telefon s polno baterijo ter številko organizatorja. Prva pomoč, astrofolija in anorak so navedeni kot priporočeni.'],
 ['okrepčevalnice','Kuhavn\'ca ima eno postajo pri Sv. Ani, Čebular\'ca dve pri Sv. Ani in Prdcu, Ribež\'n štiri pri Sv. Ani, Špičniku, Grmadi in Prdcu.']
])
batch('roznik-trail','9610357121fc01c4',2026,[
 ['prizorišče','Izvedba 4. junija 2026 je imela štart ob 18.00 v Mostecu v Ljubljani.'],
 ['kratka trasa','Kratka trasa je imela 5,9 km in 141 m višinske razlike.'],
 ['srednja trasa','Srednja trasa je imela 8,8 km in 225 m višinske razlike.'],
 ['dolga trasa','Dolga trasa je imela 17,6 km in 450 m višinske razlike; sestavljala sta jo dva kroga 8,8-kilometrske trase in štela je za Pokal gozdnih tekov.'],
 ['mestni park','Tek poteka po makadamskih in gozdnih poteh Krajinskega parka Tivoli, Rožnik in Šišenski hrib.']
])
batch('savinjski-k6-trail','8b87c6240a0a91a1',2026,[
 ['trasa šestih vrhov','27 km in 1.950 m višinske razlike poveže Bukovico, Gozdnik, Kal, Mrzlico, Kamnik in Hom; štart in cilj sta v letnem gledališču Limberk.'],
 ['najvišja točka','Najvišji vrh trase je Mrzlica z 1.122 m, pred njo sta Gozdnik 1.090 m in Kal 985 m.'],
 ['limit na Kalu','Na kontrolo Kal je treba priti v treh urah, do 12.00; po limitu udeleženec nadaljuje kot pohodnik, s Kala je predviden tudi prevoz.'],
 ['obvezna oprema','Obvezni so vidna štartna številka, primerni tekaški copati in posoda za vodo za samostojnost med postajama. Prva pomoč, vetrna jakna in palice so priporočeni.'],
 ['tek trojk','Štafeto sestavljajo trije člani. Predaji sta na Igrišah med Gozdnikom in Kalom ter pri okrepčevalnici Špajzer.']
])
batch('slovenski-gozdarski-trail','bb2d5c3c64e1254d',null,[
 ['prizorišče','Štart in cilj sta v Športnem centru Rogla na Pohorju.'],
 ['Bukev','Uradna predstavitev navaja 34-kilometrsko Bukev mimo Jezerske jame, Šiklarice in Ribniškega vrha.'],
 ['organizator','Organizator je Gozdarsko društvo Skupine SiDG v sodelovanju s SiDG d.o.o.'],
 ['začetni trening','Organizator objavlja 12-tedenske pripravljalne načrte za Jelko 14 km in Bukev 34 km.'],
 ['izvedba 2026','Organizatorjeva novica na naslovnici poroča o drugi izvedbi 29. avgusta 2026 in 536 tekačih.']
])
batch('smarjeski-tek','5822e282f4933e4b',2026,[
 ['30 izvedba','30. Šmarješki tek je bil napovedan za 13. junij 2026 v športnem parku Šmarješke Toplice.'],
 ['trail razdalji','Toplica 19 km in Radulja 28 km sta imeli skupni štart ob 8.45.'],
 ['Prinovec','Tek Prinovec na 8 km je imel štart ob 10.00; ob isti uri je bil predviden rekreativni tek na 2 km.'],
 ['začetki','Začetki prireditve segajo v leto 1995, ko jo je organiziralo Zdravilišče Šmarješke Toplice z zaposlenimi.'],
 ['kopanje','Organizator kot tradicionalno ugodnost štartnine navaja kopanje v zunanjih bazenih Term Krka Šmarješke Toplice.']
])
batch('sneznik-trails','9b432b09bedf0444',2027,[
 ['Snežnik trail','Za 12. junij 2027 je navedena druga izvedba Snežnik traila: 64,8 km, 2.761 m vzpona, najvišja točka Snežnik 1.796 m in sedem okrepčevalnic.'],
 ['Kozlek trail','Kozlek trail 2027 je naveden kot osma izvedba z dolžino 33 km, 1.259 m vzpona in limitom 5 ur 45 minut.'],
 ['Milanja trail','Milanja trail 2027 je naveden kot deveta izvedba z dolžino 17 km, 581 m vzpona in triurnim limitom.'],
 ['Bistrška 10 ka','Bistrška 10-ka 2027 je predstavljena z dejansko dolžino 9,7 km, 226 m vzpona in limitom uro in pol.'],
 ['kampiranje','Pri napovedi 2027 organizator ponuja brezplačno kampiranje na lokaciji dogodka na Črnih njivah pri Ilirski Bistrici.']
])
batch('sneznik-trails','9b432b09bedf0444',null,[
 ['začetki 2007','Tekaško društvo Bistrc je bilo ustanovljeno leta 2007 in istega leta izvedlo prvi Bistriški tek na 10 km.'],
 ['prvi trail 2017','Leta 2017 je bil ob deseti izvedbi dodan prvi Milanja trail na 17 in 31 km.'],
 ['preimenovanje 2024','Leta 2024 je dogodek dobil ime Snežniški teki; 10 km je postal Bistrška 10-ka, 31 km pa Kozlek trail.'],
 ['novost 2026','Organizator navaja, da je bil 65-kilometrski tek na vrh Snežnika prvič uveden leta 2026.']
])
batch('trail-velika-planina','e55ed586c031d73e',2026,[
 ['četrta izvedba','Četrta izvedba je potekala v nedeljo, 30. avgusta 2026.'],
 ['štart in cilj','Štartno-ciljni prostor je bil pri Gostišču Zeleni rob na Veliki planini.'],
 ['tekmovalne razdalje','Razpisane so bile razdalje 6,7 km, 13,5 km in 29,3 km, vse s štartom ob 10.00.'],
 ['pohod','Netekmovalna pohodniška trasa je bila dolga 6,7 km; dovoljeni so bili poljubni štarti med 8.00 in 11.00.'],
 ['dostop','Organizator je za udeležence navajal 50-odstotni popust za nihalko in parkiranje v Kranjskem Raku. Pod nihalko je bilo parkiranje brezplačno.']
])
batch('trail-tek-zelene-doline','17a6a527f94f576f',2025,[
 ['Hribar','Stran z naslovom 3. Trail tek Zelene Doline 2025 navaja Hribar 22 km, 1.200 m vzpona in peturni limit.'],
 ['Dolinar','Stran za izvedbo 2025 navaja Dolinar 13 km, 560 m vzpona in triurni limit; ista trasa je bila na voljo pohodnikom.'],
 ['prevzem številk','Številke je bilo mogoče prevzeti v registracijski sobi hotela Montis na Golteh.'],
 ['obvezna oprema','Navodila zahtevajo napolnjen telefon, osnovno prvo pomoč, najmanj 0,5 l tekočine in dodatna zaščitna oblačila glede na vreme.'],
 ['merjenje','Čas se meri s čipi; tekač mora skozi označene prehode kontrolnih točk, sicer tvega diskvalifikacijo.']
])
batch('velenje-trail','97d79ff5aceaaf6f',2026,[
 ['Mastodont','Razpis za 5. december navaja Mastodont 36 km in 2.200 m vzpona; štart ob 7.30 pri Velenjskem jezeru in osemurni limit.'],
 ['Pozoj','Pozoj je razpisan na 18 km in 800 m vzpona; štart ob 9.30 pri Velenjskem jezeru in štiriurni limit.'],
 ['družinski trail','Netekmovalni družinski trail ima 10 km in 300 m vzpona; družina šteje od dve do pet oseb, najmanj eno odraslo.'],
 ['dobrodelnost','Razpis določa, da se od vsake štartnine pet evrov nameni v dobrodelne namene.'],
 ['nosečnost','Razpis omogoča prenos štartnine v primeru nosečnosti ali poporodnega obdobja za največ dve leti.'],
 ['palice','Kdor štarta s palicami, jih mora nositi ves čas; med tekmo jih ni dovoljeno dodajati ali odvreči.']
])
batch('zaplana-trail','1e65ef1a3a2ed3e8',2027,[
 ['prizorišče','Napoved za 3. april 2027 navaja štart in cilj na naslovu Zaplana – del 58B.'],
 ['Napoleonovih 4','Napoleonovih 4 ima 4,1 km in 130 m vzpona; štart ob 10.45 ter dvourni limit.'],
 ['Rimljanskih 13','Rimljanskih 13 ima 13,5 km in 600 m vzpona; štart ob 10.00 ter štiriurni limit.'],
 ['Cankarjevih 27','Cankarjevih 27 ima 27 km in 1.500 m vzpona; štart ob 10.00 ter šesturni limit.'],
 ['osebni lonček','Med opremo je izrecno obvezen lasten lonček oziroma posoda z dovolj tekočine do naslednje postaje.']
])
batch('zimski-trail-tek-bohinj','a96eed1d0ae0d1e1',2026,[
 ['prizorišče in datum','Razpis za soboto, 7. marca 2026, navaja Soriško planino in skupni štart vseh tras ob 13.00.'],
 ['krogi','En krog ima 6 km in 310 m vzpona; na voljo so en, dva ali trije krogi, torej 6, 12 ali 18 km.'],
 ['limiti','Končni limiti so 2 uri za 6 km, 3 ure 30 minut za 12 km in 5 ur za 18 km. Za nadaljevanje je prvi krog treba končati v 1 uri 45 minut, drugi pri 18 km pa v 3 urah 15 minut.'],
 ['zimska oprema','Obvezni so primerna obutev, rokavice, kapa ali trak, astrofolija, dolgi rokavi in hlače, jakna s kapuco, lasten kozarček ter telefon.'],
 ['oskrba in navijači','Okrepčilo in navijaška cona sta na dnu smučišča, kjer se zaključi vsak krog.'],
 ['skupinski popust','Razpis omogoča 30-odstotni popust skupinam z najmanj petimi udeleženci trail teka ali turnega smučanja.']
])
batch('7-ur-slivnice','a36b23f5c8e13844',2026,[
 ['časovno okno','Razpis za 21. februar navaja tekmovanje med 8.00 in 15.00; zbirališče je pri kegljišču pod Slivnico v Cerknici.'],
 ['posamezni vzpon','Pot na Slivnico je v razpisu dolga 3,5 km in ima 500 m vzpona.'],
 ['ločene preizkušnje','Po spolu so bile razpisane nagrade za najhitrejši vzpon, najhitrejši spust in največje število vzponov.'],
 ['prevoz opreme','Organizator omogoča prevoz nahrbtnikov in oblačil do Planinskega doma na Slivnici; sprejem opreme je bil predviden približno do 13.00.'],
 ['oskrba','Obrok je bil zagotovljen v domu na vrhu, prigrizki tudi na spodnjem parkirišču; parkiranje je bilo brezplačno.']
])
batch('lotmerski-trail-tek','ebe13186e5a9a024',2026,[
 ['jubilej','Občinska napoved izvedbo 2026 predstavlja kot deseti Lotmerški trail tek.'],
 ['prizorišče','Občinska napoved navaja Park 1. slovenskega tabora v Ljutomeru, petek 18. septembra ob 16.00.'],
 ['organizator','Organizator dogodka je Športna zveza Ljutomer.'],
 ['otroški teki','Za predšolske in šoloobvezne otroke ni bilo prijavnine; vsak predšolski tekač je prejel spominsko medaljo.'],
 ['nagrade','Prvi trije v tekmovalnih kategorijah so prejeli medalje, prvi trije absolutno po spolu pokale; vsi tekači vodo in sladek prigrizek.']
])
batch('pol-sihta-na-farbanco','36befb99cccfc6d0',2026,[
 ['četrta izvedba','Četrta izvedba je bila napovedana za 24. januar 2026.'],
 ['format','Zmaga tisti, ki med 10.00 in 14.00 opravi največ vzponov; zadnji mora biti zaključen do 14.00.'],
 ['trasa','Opis vzpona navaja 1,3 km in 310 m višinske razlike; vzpon in sestop potekata po isti markirani planinski poti.'],
 ['kontrolni točki','Zgornja kontrola je pri okrepčevalnici ob domu na Farbanci, spodnja nad lesenim mostom; skupinski štart je pri brunarici.'],
 ['palačinke','Organizator poleg pijače, čaja ter sladkih in slanih prigrizkov na zgornji postaji posebej napoveduje palačinke.'],
 ['nagradni sklad','Za absolutna prva tri mesta po spolu so napovedane denarne nagrade 150, 100 in 50 evrov.']
])
batch('trail-po-kraskih-klancih','f10ddd8ea225b700',2027,[
 ['prizorišče','Četrti Trail po kraških klancih je napovedan za 7. marec 2027; prizorišče je vaški dom na naslovu Križ 2 pri Sežani.'],
 ['kratka trasa','Trasa 1 ima 12,3 km in po podrobnem opisu 174 m višinske razlike; štart ob 10.30, ena postaja približno na 5,8 km.'],
 ['dolga trasa','Trasa 2 ima 19,5 km in 390 m višinske razlike; štart ob 10.00, limit 2 uri 45 minut, postaje približno na 5, 9,6 in 13 km.'],
 ['pokal PGT','Za Primorske gorske teke 2027 šteje daljša, 19,5-kilometrska trasa.'],
 ['otroci','Otroški tek je dolg 400 m, brezplačen in netekmovalen; vsak otrok prejme medaljo. Štart je napovedan ob 9.30.']
])
batch('postojnski-tek','bfc8ea99ba896325',2026,[
 ['datum in organizator','Občinska objava ekipe Postojnskega teka za leto 2026 navaja 23. avgust in organizatorja društvo Postojna teče. Naslov in besedilo se razlikujeta pri zaporedni številki izvedbe, zato je ne potrjujemo.'],
 ['trail start','Daljši, 27-kilometrski trail je imel predviden štart ob 8.00 na Titovem trgu v Postojni.'],
 ['potek traila','Predvidena pot vodi mimo Soviča proti Studenemu ter čez Sv. Lovrenc, Špilnik in Lipovec, nato v Strmco in prek Pivke jame nazaj v Postojno.'],
 ['promet','Za tekače daljšega traila zapore cest niso bile predvidene; organizator je opozoril na previdnost do približno 13.00.'],
 ['razvoj programa','Objava poleg otroških tekov ter 5 in 10 km omenja daljši 27 km trail, ki je bil dodan leto pred objavo 2026.']
])
batch('kriska-gora-trail','344b07ed8af74279',2025,[
 ['Gams','Četrta izvedba 24. maja 2025: Gams 11 km in 990 m vzpona ter spusta, štart ob 9.00 pri Zavetišču v Gozdu.'],
 ['Muflon','Muflon 2025 je imel 21 km in 1.855 m vzpona ter spusta; štart ob 9.00 pri Zavetišču v Gozdu.'],
 ['Košuta','Košuta 2025 je imela 50 km, 2.951 m vzpona in 2.575 m spusta; štart ob 7.00 pred Paviljonom NOB v Tržiču, cilj pri Zavetišču v Gozdu.'],
 ['limiti','Gams in Muflon sta imela šesturen limit, Košuta 12 ur ter vmesno zaporo po osmih urah pri Domu pod Storžičem.'],
 ['oprema','Razpis 2025 zahteva lonček, najmanj litrski bidon, prvo pomoč ter primerno obutev in oblačila. Zaloga hrane je izrecno obvezna za 50 km; palice in anorak so priporočeni.'],
 ['najvišja točka','Tolsti vrh je naveden kot najvišja točka vseh treh tras.'],
 ['pokal','Za Tržiški pokal v rekreativnih tekih 2025 je štela samo trasa Gams 11 km.']
])
batch('triglav-trail-run','d5e28825dd86aab5',2027,[
 ['prizorišče','Pravilnik za izvedbo avgusta 2027 navaja Slovenski planinski muzej v Mojstrani kot štartno in ciljno mesto tekov.'],
 ['zahtevnost','Organizator opisuje tek okoli Triglava kot visokogorsko preizkušnjo, ki v veliki meri poteka nad 2.000 m nadmorske višine.'],
 ['kvalifikacije','Za Triglav Trail in Triglav Lakes je zahtevano dokazilo o podobno zahtevnem teku med 1. januarjem 2022 in 30. julijem 2027.'],
 ['orientacija','Za daljši trasi sta zahtevana uradni zemljevid 1 : 25.000 in uradna GPX sled; organizator se opira tudi na označene planinske poti.'],
 ['oprema daljših tras','Pravilnik med drugim zahteva telefon z gostovanjem, GPS, prvo pomoč, reševalno odejo ali bivak vrečo, piščalko, čelno svetilko, osebni dokument, najmanj litrski bidon in topla zaščitna oblačila. To je povzetek; celoten seznam je v pravilniku.'],
 ['palice','Kdor se odloči za palice, jih mora imeti skozi celotno traso.'],
 ['zunanja pomoč','Pomoč tretjih oseb zunaj oskrbovalnih točk ni dovoljena.']
])
batch('tek-na-smarno-goro','95135ec7edf80414',null,[
 ['prva izvedba','Prvi Tek na Šmarno goro je bil 18. novembra 1979; pobudnik in organizator je bil Tomo Šarf.'],
 ['sprememba 1992','Za državno prvenstvo leta 1992 so progo z zanko prek Grmade podaljšali na 9 km.'],
 ['sprememba 2010','Leta 2010 so zaradi erozije in varnosti delno spremenili progo ter jo podaljšali z 9 na 10 km.'],
 ['razlika od Rekorda','Tek na Šmarno goro in Rekord Šmarne gore sta različni tekmi. Rekord je kratka preizkušnja vzpona iz Tacna po poti Čez korenine.'],
 ['muzejska ciljna vrata','Od jeseni 2022 ciljna vrata Teka in Rekorda ostajajo na ogled obiskovalcem z informacijami o progah in rezultatih.']
])
batch('tek-na-smarno-goro','8018623a23405453',2026,[
 ['top 3 moški','Na 10 km 27. septembra 2026: 1. Lorenzo Cagnati 42:56; 2. Tiziano Moia 43:06; 3. Klemen Španring 43:36.'],
 ['top 3 ženske','Na 10 km 27. septembra 2026: 1. Klara Velepec 52:08; 2. Arianna Del Pino 53:46; 3. Kitti Posztos 55:05.'],
 ['profil glavne trase','Glavna trasa je dolga 10 km, ima 705 m vzpona in 350 m spusta; vodi prek Grmade na vrh Šmarne gore.'],
 ['prevoz garderobe','Prevzem številk in oddaja garderobe sta na stadionu Rocen ob policijski akademiji; garderoba udeležence čaka na cilju na vrhu.']
])
batch('k24-ultra-trail','4bb41f537e6cf7c8',2027,[
 ['100 km','Uradna kartica trase navaja 100 km/+5.420 m, 28-urni limit ter štart v petek 6. avgusta ob 22.00 pri Kulturnem domu v Črni na Koroškem.'],
 ['rudniški rov','Opis 100 km trase vključuje približno šest kilometrov teka po opuščenem rovu Podzemlja Pece.'],
 ['najvišja točka','Najvišja točka v opisu je Peca, 2.126 m; vzpon nanjo po izstopu iz rova obsega približno 1.500 višinskih metrov.'],
 ['izvor K24','Organizator izvor tekme povezuje s koroškim hribovskim izzivom K24, ki poteka od leta 2000.'],
 ['pozor različnim meritvam','Kartica navaja 100 km, kilometrska časovnica na isti strani pa cilj pri 94,5 km. Gre za neskladje uradnega vira, ne za potrjeno spremembo izvedene trase.'],
 ['pacemaker','Pravila prepovedujejo spremljanje tekača na trasi s pacemakerjem.'],
 ['kazni za opremo','Pravila predvidevajo eno uro pribitka za posamezen manjkajoči kos obvezne opreme; zavrnitev prikaza opreme pomeni diskvalifikacijo.']
])
batch('k24-ultra-trail','efe070ad448bfe79',2027,[
 ['50 km','Kartica 50 km trase navaja 2.550 m vzpona in spusta, 14-urni limit ter štart 7. avgusta ob 7.00 v Črni na Koroškem.'],
 ['50 km oskrba','Navedene so štiri okrepčevalnice: Pudgarsko, Dom na Smrekovcu, Križan in Mrdavs.'],
 ['50 km zanimivosti','Opis vodi mimo Najevske lipe in Črnega jezera oziroma Končnikove mlakuže ter se pri Smrekovcu združi s 100 km traso.']
])
batch('k24-ultra-trail','aa9447210ffdf9ab',2027,[
 ['24 km','Kartica 24 km trase navaja 990 m vzpona in spusta, šesturen limit ter štart 7. avgusta ob 15.00 v Črni na Koroškem.'],
 ['24 km oskrba','Navedeni sta dve okrepčevalnici: Karavla in Pikovo.']
])
batch('k24-ultra-trail','f7f75b47f2c3b629',2027,[
 ['Friday shorty','Trasa Friday shorty ima po kartici 10 km in 501 m vzpona; štart 6. avgusta ob 17.00, triurni limit.'],
 ['10 km oskrba','Edina navedena okrepčevalnica na 10 km je Pikovo pri 5,2 km.']
])
batch('podbrdo-trail-running-festival','81afe251695cdcd7',2027,[
 ['UTP 100 plus','Za 18. junij 2027 ob 23.00 je napovedan UTP 100+ s štartom pri TIC Podbrdo: 107,1 km, 6.520 m vzpona in 30-urni limit.'],
 ['UTP 100 vmesna limita','Napoved navaja 13 ur za Kopačnico pri 51,8 km in 20 ur za Železnike pri 77,1 km.'],
 ['UTP 100 oskrba','Organizator navaja deset okrepčevalnic in tople obroke v Kopačnici, Železnikih ter Hudajužni.']
])
batch('podbrdo-trail-running-festival','c38b4048b87e627f',2027,[
 ['UTP 70 plus','UTP 70+ je napovedan za 19. junij ob 7.00 pri TIC Podbrdo; 70,1 km, 3.800 m vzpona, 22-urni limit.'],
 ['UTP 70 potek','Trasa povezuje Petrovo Brdo, Porezen, Črni vrh, Blegoš, Železnike, Ratitovec, Soriško planino in Lajnar ter se vrne v Podbrdo.'],
 ['UTP 70 oskrba','Napoved navaja osem postaj; topli obroki so navedeni na Blegošu, v Železnikih in na Soriški planini.']
])
batch('podbrdo-trail-running-festival','f7bc52b1240e093e',2027,[
 ['GM4O profil','GM4O je napovedan na 40,6 km/+3.100 m s štartom 19. junija ob 8.00 pri TIC Podbrdo in deveturnim limitom.'],
 ['štiri občine','Proga Gorskega maratona štirih občin poteka po občinah Bohinj, Cerkno, Tolmin in Železniki.'],
 ['GM4O višinske skrajnosti','Opis kot najvišjo točko navaja sedlo Čez Suho pod Črno prstjo na 1.760 m, najnižjo pa Hudajužno na 361 m.'],
 ['vzpon iz Hudajužne','Opis navaja zahteven 6,5 km dolg vzpon s 1.230 m višinske razlike iz Hudajužne proti Poreznu.'],
 ['18 okrepčevalnic','Organizator za GM4O navaja 18 okrepčevalnic, med drugim Kovce, Koblo, Stržišče, Hudajužno in Porezen.'],
 ['prevoz palic','Štartnina GM4O vključuje prevoz palic v Hudajužno ter prevoz tekačev, ki tam odstopijo, nazaj v cilj.']
])
batch('podbrdo-trail-running-festival','52015d995f129156',2027,[
 ['Graparski trail','Graparski trail 20+ je napovedan na 23 km/+1.700 m s štartom 19. junija ob 8.30 in osemurnim limitom.'],
 ['Graparski vrhovi','Ključna vzpona vodita na Koblo in sedlo Suha pod Črno prstjo.'],
 ['Graparski oskrba','Predvidene so tri postaje: Kovce, sedlo Suha in Bača.']
])
batch('podbrdo-trail-running-festival','f3acfc7d7466cbc0',2027,[
 ['Rapallo profil','Rapallo trail 10+ je napovedan na 10 km/+640 m, s štartom 19. junija ob 10.00.'],
 ['Rapalska meja','Rapallo trail vodi mimo in skozi bunkerje ter kasarne nekdanje rapalske meje; glavni vzpon je do kasarne na Robarjevem griču.'],
 ['Rapallo oskrba','Predvidena je ena postaja na Petrovem Brdu pri 5 km; za tekače, ki tam odstopijo, je predviden prevoz nazaj v cilj.']
])
batch('soca-outdoor-festival','273fb568db9c5826',2027,[
 ['datum in prizorišče','Festival je napovedan za 25.–27. junij 2027 v dolini Soče s festivalskim prizoriščem na sotočju pri Tolminu.'],
 ['razdalje 5 in 10','Napoved navaja Soča 5 km z dejanskimi 5,2 km/+50 m in Continental 10 km z 11,7 km/+220 m.'],
 ['razdalje 15 in 20','Napoved navaja adidas Terrex 15 km z dejanskimi 14,6 km/+390 m in La Primafit 20 km z 22 km/+500 m.'],
 ['razdalje 30 in 40','Napoved navaja Soča 30 km z 30 km/+870 m in I feel Slovenia 40 km z 41 km/+1.550 m.'],
 ['vertikal in otroci','Napoved navaja vertikal 1,9 km/+180 m ter otroški tek 500 m/+20 m.'],
 ['Tolminka','Organizator kot značilnost ciljnega dela izpostavlja prečkanje reke Tolminke.']
])
batch('soca-outdoor-festival','3a886e9a5f4f82fd',2026,[
 ['odpoved 50 km','Poročilo o izvedbi 2026 navaja odpoved najdaljše, 50 km razdalje zaradi napovedane vročine po posvetu z GRS; prijavljeni so se pridružili 35 km.'],
 ['udeležba','Poročilo organizatorja navaja 3.400 udeležencev iz 51 držav.'],
 ['več tekačic','Organizator navaja, da so ženske prvič prehitele moške po številu prijav, v razmerju 51 : 49.'],
 ['gluhoslepota','V program je bil vključen 500-metrski tek oseb z gluhoslepoto ob podpori spremljevalcev.'],
 ['dvodnevni pohod','Leta 2026 je bil prvič dodan dvodnevni, približno 40 km pohod po Juliana Trailu iz Bovca prek Kobarida do Tolmina.'],
 ['90 letna udeleženka','Poročilo navaja 90-letno Ivano Tomulić, ki je 5 km preizkušnjo končala v 1:20:01.'],
 ['vertikal zmagovalec','Po poročilu je Luka Kovačič vertikal do gradu na Kozlovem robu zmagal s časom 9:18.']
])
batch('soca-outdoor-festival','397fe402095279f6',2026,[
 ['izziv čez Tolminko','Znotraj Continental 10 km je bil napovedan ločen časomerjen izziv od Continentalovega loka pred Tolminko do cilja, približno 20–30 m.'],
 ['nagrada na reki','Najhitrejši moški in ženska v izzivu prečkanja Tolminke sta po napovedi prejela par tekaških copat adidas; posebna prijava ni bila potrebna.']
])
batch('kocevsko-outdoor-festival','7107d3668a4b53e7',2027,[
 ['datum','Festival je napovedan za 28.–30. maj 2027.'],
 ['kratke razdalje','Kartice na naslovnici navajajo 5,9 km/+70 m, 10,2 km/+223 m in 14,1 km/+304 m.'],
 ['daljše razdalje','Kartice na naslovnici navajajo 24,5 km/+700 m, 32,2 km/+1.259 m ter 50,9 km/+1.750 m. To so napovedi, ne meritve že izvedene tekme.'],
 ['vertikal','Napoved vertikala navaja približno 1 km in 220 m vzpona na Fridrihštajn.'],
 ['pohodniški program','Napoved vsebuje tudi dvodnevni pohod na 45,7 km z 1.941 m vzpona.']
])
batch('kocevsko-outdoor-festival','6639a60c4d2182e0',2027,[
 ['Deer trail start','25 km Deer Trail je napovedan za 29. maj ob 9.30 s štartom in ciljem ob Kočevskem oziroma Rudniškem jezeru.'],
 ['Lovski vrh','Opis 25 km trase vodi prek Šalke vasi in gozdov do Lovskega vrha, njene najvišje točke.'],
 ['pari','Na razdaljah 10, 15, 25, 35 in 50 km lahko nastopijo moški, ženski ali mešani pari; oba člana pretečeta celotno razdaljo in cilj prečkata skupaj.'],
 ['otroško varstvo','Za soboto, 29. maja 2027, je v Kočevju napovedano otroško varstvo med 7.30 in 14.30.'],
 ['UTMB indeks in stones','Stran 25 km trase navaja UTMB Index, vendar ne Running Stones, ker dogodek ni del UTMB World Series.']
])
batch('julian-alps-trail-run-by-utmb','c98adcd199b7b2be',2027,[
 ['120K profil','Kartica JAT 120K navaja 122 km in 5.855 m vzpona; štart 17. septembra 2027 ob 21.00 v Radovljici, limit 32 ur in cilj v Kranjski Gori.'],
 ['120K začetek','Opis začne v Radovljici ter nadaljuje prek Jelovice in Babjega zoba proti Blejskemu jezeru.'],
 ['120K greben','Po Žirovnici opis vodi na Stol ter po grebenu proti Golici in Kleku, nato v Mojstrano.'],
 ['120K zaključek','Po Mojstrani sledi odsek proti Gozdu Martuljku, vzpon na Srednji vrh in spust v Kranjsko Goro.'],
 ['120K omejitev mest','Ob preverjanju je stran napovedovala največ 750 tekačev na 120K in doplačilo 15 evrov za prevoz iz Kranjske Gore na štart.']
])
batch('julian-alps-trail-run-by-utmb','2169c3ccf96bbc89',2027,[
 ['80K profil','Kartica Lake Bled 80K navaja 80 km/+3.866 m, štart 18. septembra ob 8.00 na Bledu, limit 21 ur in cilj v Kranjski Gori.'],
 ['80K Stol','Opis navaja približno 1.700 m vzpona od Žirovnice proti Stolu, ki dosega 2.174 m.'],
 ['80K zaključek','Po grebenu Stol–Golica–Klek se trasa spusti v Zgornjesavsko dolino; pred ciljem je še vzpon na Srednji vrh.']
])
batch('julian-alps-trail-run-by-utmb','c455f9094d20a63b',2027,[
 ['50K profil','Kartica Sky Trail 50K navaja 55 km/+2.828 m, štart 17. septembra ob 8.00 v Žirovnici in limit 13 ur 30 minut.'],
 ['50K potek','Opis vodi prek karavanškega grebena proti Golici in Kleku, s spustom v Mojstrano ter poznejšim vzponom na Srednji vrh pred ciljem v Kranjski Gori.']
])
batch('julian-alps-trail-run-by-utmb','cff358f2a9ec7311',2027,[
 ['25K profil','Kartica Kranjska Gora 25K navaja 25 km/+1.090 m, štart 19. septembra ob 8.00 in šesturen limit.'],
 ['25K krožna pot','Opis krožne trase vodi mimo Jasne, proti Gozdu Martuljku in Srednjemu vrhu; nato v Podkoren in pod Vitranc pred povratkom v Kranjsko Goro.']
])
batch('julian-alps-trail-run-by-utmb','18386357de5932b5',2026,[
 ['vreče 120K','Navodila izvedbe septembra 2026 navajajo eno tranzicijsko in eno ciljno vrečo za 120K; tranzicijska potuje na postajo v Žirovnici.'],
 ['vreče 80K in 50K','Navodila 2026 za 80K in 50K navajajo samo ciljno vrečo; oddaja je mogoča v dvorani Vitranc ali na štartu na Bledu oziroma v Žirovnici.'],
 ['palice v vrečah','V navodilih 2026 je prevoz palic v tranzicijskih oziroma ciljnih vrečah prepovedan; prevažajo se samo organizatorjeve vreče.']
])
batch('ultra-trail-vipava-valley','5c6c142076517603',2027,[
 ['datum','UTVV je napovedan za 23.–25. april 2027 v Vipavski dolini.'],
 ['Emperor','Kartica na naslovnici navaja Emperor 162 km/+6.300 m in 46-urni limit; pravilnik ima drugačne zaokrožene številke, zato podatek ostaja vezan na ta vir.'],
 ['Centurion','Kartica na naslovnici navaja Centurion 100 km/+4.300 m in 30-urni limit.'],
 ['Gladiator','Kartica na naslovnici navaja Gladiator 60 km/+2.400 m in 16-urni limit.'],
 ['Legionar','Kartica na naslovnici navaja Legionar 30 km/+1.600 m.'],
 ['Asterix','Kartica na naslovnici navaja Asterix 15 km/+250 m.'],
 ['Castra','Kartica na naslovnici navaja Castra City Run 10 km/+150 m.']
])
batch('ultra-trail-vipava-valley','942ba515fc9b8592',2027,[
 ['štartna mesta','Pravilnik vse glavne razdalje Emperor, Centurion, Gladiator, Legionar, Asterix in Castra navaja s štartom v Ajdovščini.'],
 ['palice','Kdor tek začne s palicami, jih mora nositi ves čas teka.'],
 ['podpora','Pomoč med uradnimi okrepčevalnimi postajami se po pravilniku kaznuje z eno uro pribitka.'],
 ['GPS sledilniki','Vključeni so GPS sledilniki za tekače na Emperorju in Centurionu.'],
 ['različne tranzicijske vreče','Pravilnik navaja za Emperor dve tranzicijski vreči oziroma tri za ženske, za Centurion eno oziroma dve za ženske.'],
 ['uradni vodič','Pravilnik napoveduje uradni tekaški vodič 14 dni pred dogodkom; pravila in podrobnosti je treba pred štartom znova preveriti.']
])
batch('kras-trail','e59a792cc25aca97',2027,[
 ['datum','Kras Trail je napovedan za 27. marec 2027.'],
 ['kratka trasa','10 km trasa ima po predstavitvi 200 m vzpona in limit 2 uri 30 minut.'],
 ['srednja trasa','29 km trasa ima po predstavitvi 1.100 m vzpona in limit 6 ur 30 minut.']
])
batch('kras-trail','ede6bdf886ad612b',2027,[
 ['52 km','Ultra trasa ima 52 km/+2.000 m, štart ob 7.30 pred OŠ Senožeče in cilj v Divači; limit 12 ur 30 minut.'],
 ['ultra prevoz','Štartnina za 52 km vključuje avtobusni prevoz iz Divače v Senožeče.'],
 ['dvakrat Vremščica','Opis 52 km vodi čez Vremščico, kraške vasi in območje Škocjanskih jam ter se pred ciljem še enkrat vrne na Vremščico.'],
 ['ultra oskrba','Predvidene so štiri postaje: Vremščica pri 8 km, Vatovlje pri 22 km, Škocjanske jame pri 33 km in Vremščica pri 45 km.']
])
batch('haloze-trail','web-haloze-regulations-2026',2026,[
 ['kratka trasa','Razpis za 22. avgust navaja 5 km/+150 m in štart ob 9.15.'],
 ['srednja trasa','Razpis navaja 16 km/+500 m, štart ob 9.00 in limit 4 ure 30 minut.'],
 ['dolga trasa','Razpis navaja 27 km/+1.100 m, štart ob 9.00 in limit 4 ure 30 minut.'],
 ['štart in cilj','Štart je v športnem parku Majšperk, cilj je zaradi varnosti pred KPC Majšperk.'],
 ['haloški vrhovi','Daljša trasa vključuje vzpona na Janški vrh in Bolfenk; srednja vodi prek Ptujske Gore in ob Dravinji.']
])
batch('caven-run','web-caven-current-2026',2026,[
 ['prestavitev','Zaradi napovedanega dežja, snega in burje je organizator po posvetu z gorskimi reševalci datum prestavil s 24. oktobra na 21. november 2026.'],
 ['17 km','Posodobljena uradna stran navaja Čaven Trail 17 km/+1.355 m, štart ob 9.30 v Lokavcu in šesturen limit.'],
 ['24 km','Dodana trasa Čaven 24 ima 24 km/+1.734 m; štart ob 9.00, osemurni limit, štart in cilj v Lokavcu.'],
 ['vertikal','Posodobljena stran navaja Čaven Vertikal 4,3 km/+1.081 m, štart ob 11.00 v Lokavcu in cilj pri Koči Antona Bavčerja.'],
 ['oprema','Obvezna sta telefon in lasten lonček oziroma bidon; ob slabem vremenu je lahko zahtevana dodatna oprema.'],
 ['prevoz opreme','Prevoz nahrbtnika do koče je vključen v prijavnino; sedež na prevozu tekmovalcev stane dodatnih sedem evrov.']
])
batch('knap-trail','6f8f12570f9fb141',2027,[
 ['urnik in vzponi','Razpis za 9. januar navaja 16 km/+990 m s štartom ob 10.30, 30 km/+1.550 m ob 9.00 in 50 km/+2.620 m ob 7.00.'],
 ['obvezna zimska oprema','Vse tri razdalje zahtevajo vsaj liter pijače, astrofolijo, prvo pomoč, ekolonček, dežno jakno, piščalko, telefon, zimska oblačila in energijsko hrano ter štartno številko.'],
 ['čelna svetilka','Za 50 km je čelna svetilka obvezna, za 30 km priporočena; za 16 km je seznam ne zahteva.'],
 ['dvojice','Dvojice so razpisane samo na 16 km. Člana nastopata pod isto številko in morata biti skupaj zabeležena na vseh kontrolah.'],
 ['tranzicijska vreča','Tranzicijska vreča je vključena samo pri najdaljši, 50 km razdalji.'],
 ['prevzem','Prevzem dan pred dogodkom je v Domu Svobode, Trg Franca Fakina 4 v Trbovljah, med 17.00 in 19.00. Vsak udeleženec mora številko prevzeti osebno.'],
 ['Sv Planina','Za 50 km je na Sv. Planini pri 24 km v razpisu navedena časovna omejitev 5,5 ure.'],
 ['število mest','Skupna omejitev razpisa je 700 tekmovalcev na vseh treh razdaljah.']
])
batch('soca-outdoor-festival','ef2cb6a77d6f7d63',2020,[
 ['odpoved','Uradna zgodovina navaja odpoved uradnega tekaškega tekmovanja 2020 zaradi covida-19. Samostojni teki in virtualni izziv niso uradna razvrstitev festivala.']
])
batch('soca-outdoor-festival','ef2cb6a77d6f7d63',2021,[
 ['omejena izvedba','Organizator navaja izvedbo 2021 z omejitvami PCT, maskami pri prijavah in na štartih ter varnostno razdaljo.']
])
batch('soca-outdoor-festival','ef2cb6a77d6f7d63',2022,[
 ['prvi Parafestival','Uradna zgodovina za 2022 navaja prvi Parafestival in 1.800 tekačev iz 15 držav.'],
 ['zaroka v reki','Organizator za leto 2022 opisuje tekaško zaroko v strugi Tolminke tik pred ciljem.']
])
batch('soca-outdoor-festival','ef2cb6a77d6f7d63',2023,[
 ['prva 35 km','Ob deseti obletnici je bila prvič dodana 35-kilometrska preizkušnja.'],
 ['brezpapirne prijave','Organizator navaja prvo izvedbo prijav brez tiskanega papirja in prihranek približno 14.000 listov.']
])
batch('soca-outdoor-festival','ef2cb6a77d6f7d63',2024,[
 ['dvodnevni tekaški program','Za manjšo obremenitev stezic je organizator teke razdelil med soboto za daljše in nedeljo za krajše razdalje.'],
 ['prva petka','V program je bila prvič dodana 5 km razdalja; prvi petkov večerni vertikal je vodil na Kolovrat.']
])
batch('soca-outdoor-festival','ef2cb6a77d6f7d63',2025,[
 ['obrnjena smer','Na daljših tekih od 25 do 50 km so obrnili smer, da so tekači Tolminska korita prečkali zgodaj pred večjim obiskom.'],
 ['tatu za štartnino','Uradna zgodovina navaja tri tekače, ki so si vtetovirali Soča Outdoor motiv in dobili doživljenjsko brezplačno štartnino.'],
 ['klubsko tekmovanje','V letu 2025 je bilo dodano tekmovanje tekaških klubov, organizator pa je prvič pridobil certifikat Good Events.']
])
batch('soca-outdoor-festival','ef2cb6a77d6f7d63',null,[
 ['začetki 2013','Prvi festival je potekal septembra 2013 Na Logu pri Tolminu; tekaški preizkušnji sta imeli 12 in 15 km, pokali pa so bili iz soških prodnikov.'],
 ['selitev 2014','Leta 2014 se je festival preselil na sotočje Soče in Tolminke.'],
 ['nova dolga 2016','Leta 2016 je bila poleg 10 in 15 km prvič izvedena 46 km preizkušnja.'],
 ['nova 25 km leta 2017','Leta 2017 so dotedanjim 10, 15 in 45 km dodali 25 km ter prvič izvedli 500-metrski otroški tek.'],
 ['trajna pot 2018','V sodelovanju s Continentalom in lokalno skupnostjo je bil leta 2018 trajno označen Tolminka trail, dostopen vse leto.'],
 ['brez kozarčkov od 2019','Leta 2019 so na okrepnih postajah prvič ukinili lončke za enkratno uporabo in udeležencem brezplačno razdelili lončke za večkratno uporabo.']
])
batch('julian-alps-trail-run-by-utmb','2010a3f02d48ad77',2020,[
 ['odpoved','Uradna zgodovina navaja odpoved izvedbe 2020 zaradi covida-19.']
])
batch('julian-alps-trail-run-by-utmb','2010a3f02d48ad77',2021,[
 ['zgodovinske razdalje','Uradni zgodovinski pregled za leto 2021 navaja razdalje 10, 15, 30, 60, 110 in 170 km ter 1.200 tekačev. Številke so nazivi razdalj, ne neodvisne meritve.']
])
batch('julian-alps-trail-run-by-utmb','2010a3f02d48ad77',2022,[
 ['170 km odpovedana','V programu so bile razdalje 10, 15, 30, 60, 110 in 170 km, vendar je bila najdaljša odpovedana zaradi poplav in plazov.'],
 ['vstop v UTMB','Dogodek je postal del UTMB World Series leta 2022, ob začetku serije.']
])
batch('julian-alps-trail-run-by-utmb','2010a3f02d48ad77',2023,[
 ['zgodovinske razdalje','Zgodovina za 2023 navaja razdalje 10, 15, 25, 60, 100 in 170 km ter 3.000 tekačev.']
])
batch('julian-alps-trail-run-by-utmb','2010a3f02d48ad77',2024,[
 ['sprememba programa','Zgodovina za 2024 navaja program 10, 15, 25, 50, 80 in 120 km, ki se razlikuje od programa 2023.']
])
batch('julian-alps-trail-run-by-utmb','2010a3f02d48ad77',2025,[
 ['udeležba in program','Zgodovinski pregled navaja 5.000 tekačev in razdalje 10, 15, 25, 50, 80 ter 120 km.']
])
batch('julian-alps-trail-run-by-utmb','1d39bdf5aff30a27',null,[
 ['120K oprema','Seznam ob preverjanju 7. novembra 2026 za 120K med drugim zahteva GPS sledilnik organizatorja, telefon z gostovanjem in LiveTrail, lonček najmanj 15 cl, najmanj liter vode, dve delujoči čelni svetilki z rezervnimi baterijami, piščalko, hrano, reševalno folijo, nepremočljivo jakno s kapuco, prvo pomoč, dolge hlače, dodatno toplo plast in rokavice. Celoten veljavni seznam je na povezavi.'],
 ['80K oprema','Seznam ob preverjanju 7. novembra 2026 za 80K zahteva GPS sledilnik organizatorja, vključen telefon, najmanj liter vode, dve delujoči čelni svetilki z rezervnimi baterijami in toplo dodatno plast ter zaščitna oblačila. Obvezni so tudi lonček, piščalka, hrana, reševalna folija in prva pomoč. Celoten seznam je na povezavi.'],
 ['50K oprema','Seznam ob preverjanju 7. novembra 2026 za 50K zahteva najmanj liter vode, eno delujočo čelno svetilko z rezervnimi baterijami, telefon, lonček, piščalko, hrano, reševalno folijo, jakno s kapuco, prvo pomoč in dolge hlače oziroma popolno prekritje nog. Celoten seznam je na povezavi.'],
 ['25K oprema','Seznam ob preverjanju 7. novembra 2026 za 25K med drugim zahteva tekaški nahrbtnik, trail obutev, telefon, vidno štartno številko, lonček najmanj 15 cl, najmanj 0,5 l vode, piščalko in reševalno folijo. Pred nastopom je treba preveriti morebitno dodatno vremensko opremo.'],
 ['15K oprema','Seznam ob preverjanju 7. novembra 2026 za 15K navaja trail obutev, telefon z delujočim gostovanjem in LiveTrail, vidno štartno številko, lonček najmanj 15 cl, piščalko ter reševalno folijo.'],
 ['pravila telefona in lončka','V pregledanih seznamih opreme mora telefon ostati vključen in dosegljiv, letalski način ni dovoljen; shranjene morajo biti varnostne številke organizatorja. Lonček mora imeti najmanj 15 cl; zaprte steklenice in bidoni ga po izrecnem navodilu ne nadomestijo.']
])
writeFileSync(dir+'curated.json',JSON.stringify(records,null,2)+'\n')
console.log(JSON.stringify({records:records.length,races:new Set(records.map(x=>x.slug)).size}))
