# Struktura projekta

Komponente so razvrščene po področjih:

- `layout`: skupna glava in noga strani.
- `shared`: skupni gradniki, vključno z majhnim GPX višinskim profilom.
- `races`: seznam, koledar, primerjava in zemljevidi tekem.
- `runners`: kartice tekačev, njihove ture in podrobni zemljevid.
- `routes`: skupni Mapbox zemljevid tur tekačev.
- `journal`: kartice člankov.
- `demo`: izrecno demonstracijske ilustracije, ki ostajajo v demo vsebini.

Nuxt uporablja `pathPrefix: false`, zato selitev komponent v podmape ne
spremeni imen v predlogah. Imena datotek morajo biti enolična. Zemljevidne
komponente uporabljajo pripono `.client.vue`, ker potrebujejo brskalnik.

Posebnosti različnih strani ostajajo v področnih komponentah. Skupna sta
nalaganje podatkov (`useGpxData`) in preprečevanje ustvarjanja zemljevidov
po zaprtju komponente (`useComponentLifetime`).

`utils/gpx.ts` skrbi za pretvorbo koordinat v SVG in obliko majhnega profila.
`utils/formatDate.ts` oblikuje datum ISO za prikaz. Modeli GPX in tekaških
tur so v `types/gpx.ts`.

Kodo oblikujemo z `npm run format`. Generiranih GPX datotek ne oblikujemo
ročno; ostanejo kompaktne. Podrobnosti izhodov so v [gpx.md](gpx.md).
