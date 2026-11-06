# UTMB lestvice

Podatki so trajno shranjeni v Supabase tabeli `public.utmb_rankings_cache`.
Do nje in funkcij za osvežitev lahko dostopa samo strežnik s secret/service-role
ključem. Brskalnik uporablja `/api/utmb/rankings`.

Prva zahteva za posamezno lestvico po torku ali soboti ob 04:00
(`Europe/Ljubljana`, s poletnim časom) jo osveži iz UTMB. Ni cron opravila,
GitHub Actions urnika ali šesturnega predpomnilnika. Če ni obiskov, ni prenosa.
Zamujeni termini ne sprožijo dodatnih prenosov za nazaj.

Supabase z atomarnim dvominutnim zaklepom prepreči hkratne prenose iste lestvice
iz različnih Netlify instanc. Uspešna osvežitev zamenja celoten rezultat in označi
termin kot opravljen. Ob napaki ostanejo zadnji uspešni podatki; ponoven poskus je
mogoč po poteku zaklepa. Drug obisk med osveževanjem dobi prejšnji rezultat.

Za Netlify nastavi obstoječe runtime spremenljivke `NUXT_PUBLIC_SUPABASE_URL`,
`NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` ter `NUXT_SUPABASE_SECRET_KEY` ali
`SUPABASE_SECRET_KEY`. Skrivni ključ mora ostati na strežniku. Baza in zaklepi
preživijo nove deploye in hladne zagone. Delovanje na dejanskem Netlify gostovanju
je treba preveriti po objavi; lokalna koda sama ne objavi sprememb na Netlify.

Lokalna datoteka `data/utmb-rankings.json` je zasilni prikaz ob nedosegljivi bazi.
`node --env-file=.env scripts/seed-utmb-cache.mjs` uvozi te podatke v prazne vrstice
brez prepisovanja obstoječih. `npm run utmb:update` je izrecen ročni zajem v datoteko,
ne avtomatsko opravilo in ne prepisuje podatkov v živi bazi.

Vmesnik UTMB je javno dostopen, dovoljenje za ponovno objavo pa s tem ni potrjeno.
