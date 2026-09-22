# GPX trase

Izvorne datoteke so v mapi posamezne tekme. Ime sledi vzorcu
`slug-tekme-id-trase-razdalja.gpx`, na primer:

```text
public/gpx/hg-trail-idrija/hg-trail-idrija-berkmandlc-27km.gpx
```

Razdalja v imenu je uradna razdalja trase iz `data/races.ts`. Kadar je ta
neznana, se uporabi dolžina iz GPX datoteke. Če ID trase že vsebuje isto
razdaljo, se ponovljeni del iz imena izpusti.

Po dodajanju novih GPX datotek zaženi `npm run gpx:import-all`. Uvoz ustvari
lahke predoglede in podrobne podatke `.json`, posodobi `data/gpxManifest.ts`
ter poveže izvorne datoteke z gumbi za prenos na straneh tekem.
