# Lokale skrifttyper

De samme Latin-filene som `next/font/google` tidligere hentet ved bygging.
De inneholder blant annet æ, ø og å. `next/font/local` leverer dem fra appen,
og `next-pwa` legger de ferdige skriftfilene i forhåndslageret.
Byggingen trenger dermed ingen forbindelse til Google Fonts.

Filene er hentet uendret fra prosjektets eksisterende produksjonscache
17.10.2026. Hver fil er verifisert mot innholdshashen i den tidligere
genererte CSS-en og mot skriftens innebygde navn, stil og opphavsrett.
Cachen trengs ikke for senere bygg.

| Fil | Tidligere innholdshash fra Next |
| --- | --- |
| schibsted-grotesk-latin.woff2 | 91601dd83defba07 |
| instrument-serif-latin.woff2 | e6099e249fd938cc |
| instrument-serif-italic-latin.woff2 | 9cc5b37ab1350db7 |
| ibm-plex-mono-400-latin.woff2 | d3ebbfd689654d3a |
| ibm-plex-mono-500-latin.woff2 | 98e207f02528a563 |

Alle tre familier bruker SIL Open Font License 1.1; se [OFL.txt](OFL.txt).
Opphavsretten nedenfor er også innebygd i filene:

- Copyright 2023 The Schibsted-Grotesk Project Authors (https://github.com/schibsted/schibsted-grotesk)
- Copyright 2022 The Instrument Serif Project Authors (https://github.com/Instrument/instrument-serif)
- Copyright 2017 IBM Corp. All rights reserved.
