# Neobdelane GPX datoteke

V to mapo samo odloži originalne `.gpx` datoteke. Za zdaj jih ne zaganjaj skozi noben pretvornik.

Uporabi strukturo:

```text
public/gpx/
  slug-tekme/
    id-trase.gpx
```

Primer:

```text
public/gpx/julian-alps-trail-run-by-utmb/funny-10k.gpx
public/gpx/julian-alps-trail-run-by-utmb/sky-trail-50k.gpx
public/gpx/julian-alps-trail-run-by-utmb/lake-bled-80k.gpx
```

`slug-tekme` in `id-trase` sta že zapisana v `data/races.ts`. Ime datoteke naj se natančno ujema z `distance.id`.

Datoteke ostanejo neobdelane. Kasneje bomo skupaj določili končni proces, ki bo iz vsake GPX trase izdelal:

- izvorno geometrijo,
- tri stopnje podrobnosti za različne povečave,
- višinski profil,
- meje, središče, start in cilj,
- D+, D− in najvišjo točko,
- GeoJSON za skupni in podrobni zemljevid.
