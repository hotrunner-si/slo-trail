# Začasni javni dostop

`utils/siteAccess.ts` vsebuje `publicPreviewEnabled = true`.

V tem načinu navadne strani ne zahtevajo prijave. `/profil` prikazuje »Prijava še ni mogoča. Stran je v izdelavi.« Obstoječa implementacija računa je ohranjena v `components/profile/ProfileAccount.vue`.

Skrbniški strani `/journal/predogled` in `/mozgan/skrbnik` ter njuni API-ji ostajajo zaščiteni. Neprijavljenim baza znanja in iskanje vrneta le uradne in uredniške vire. Zasebni računi, datoteke in operacije pisanja ostajajo zaščiteni; podatkovne politike in prijavni podatki niso spremenjeni.

Za vrnitev prejšnjega načina nastavi `publicPreviewEnabled = false`. S tem se znova prikaže obstoječa stran računa, middleware in bralni API-ji pa spet zahtevajo prijavo. Trenutne prijavljene seje niso odjavljene.
