# Google prijava

Prijava z e-pošto, registracija in zaščiten dostop so obnovljeni z `publicPreviewEnabled = false`. Baza znanja zahteva prijavo; skrbniški API-ji še vedno preverjajo obstoječo skrbniško vlogo prek `brain_account`. Google prijava ne dodeljuje skrbniških pravic.

## Nastavitev ponudnika

1. V Google Cloud izberi ali ustvari projekt, nastavi OAuth consent screen (Google Auth Platform → Branding / Audience) in ustvari OAuth client ID vrste **Web application**.
2. Kot **Authorized redirect URI** dodaj `https://favatadzmmqsdocrstti.supabase.co/auth/v1/callback`.
3. V Supabase projektu `favatadzmmqsdocrstti` odpri Authentication → Sign In / Providers → Google. Omogoči Google in vnesi Client ID ter Client secret. Skrivnost ostane v Supabase; ne sodi v repozitorij ali javne okoljske spremenljivke.
4. V Authentication → URL Configuration nastavi Site URL na dejanski javni naslov Slo Trail. Med Redirect URLs dodaj `https://<domena>/profil` in `http://localhost:3000/profil` za lokalni razvoj. Ohrani obstoječe naslove za obnovitev gesla.
5. Če je Google aplikacija v načinu Testing, dodaj testne uporabnike; za javno uporabo nastavi ustrezno objavo aplikacije.

## Preverjanje

- V zasebnem oknu odpri `/mozgan/baza`: sledi preusmeritev na prijavo.
- Registriraj testni račun, odpri potrditveno povezavo v istem brskalniku in preveri dostop do baze.
- Izberi »Nadaljuj z Googlom«, dokončaj Google prijavo in preveri vrnitev v račun oziroma prvotno zahtevani pogled.
- Preveri odjavo, e-poštno prijavo in obnovitev gesla. Google uporabnik lahko nastavi geslo prek »Pozabljeno geslo«.
- Navaden račun ne sme dostopati do skrbniških podatkov; obstoječi skrbnik obdrži dodatne poglede.

Ob preverjanju 7. 11. 2026 je javni Auth settings endpoint vrnil `external.google = false`, `disable_signup = false` in `mailer_autoconfirm = false`. Zato registracija podpira potrditveno e-pošto, Google pa pred začetkom preveri, ali je ponudnik omogočen.

Dokumentacija: https://supabase.com/docs/guides/auth/social-sign-in/auth-google
