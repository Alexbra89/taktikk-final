import React from 'react';
import { ShieldCheck, Scale } from 'lucide-react';
import { Tile, TileHeader } from '@/components/layout/Surface';

// ══════════════════════════════════════════════════════════════
//  PERSONVERN, VILKÅR OG KILDER – vises under Innstillinger.
//
//  Teksten skal stemme med koden: alt lagres lokalt, ingen analyse
//  eller sporing, Vercel som vertskap, og AI-treneren sender bare det
//  src/lib/ai/context.ts og appContext.ts bygger. Endres det som
//  sendes, må teksten her endres også.
// ══════════════════════════════════════════════════════════════

export const CONTACT_EMAIL = 'alex_bratland@live.no';

const H = ({ children }: { children: React.ReactNode }) => (
  <h3 className="mt-4 first:mt-0 text-body font-bold text-ink">{children}</h3>
);
const P = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-1 text-body text-ink-muted">{children}</p>
);
const Mail = () => <a href={`mailto:${CONTACT_EMAIL}`} className="text-signal underline underline-offset-2">{CONTACT_EMAIL}</a>;

export const PrivacySection: React.FC = () => (
  <Tile aria-label="Personvern og vilkår" className="md:col-span-2">
    <TileHeader icon={ShieldCheck} tone="bg-canvas-raised text-ink-muted" title="Personvern og vilkår" subtitle="Hva som lagres, og hvor" />
    <div className="max-w-[70ch]">
      <H>Alt lagres på denne enheten</H>
      <P>
        Taktikker, treninger, kalender, rapporter, spillernavn og innstillinger lagres bare i nettleseren på enheten
        du bruker. Det finnes ingen konto, ingen innlogging og ingen database, og vi kan ikke se dataene dine.
        Sikkerhetskopien er en fil du selv laster ned. Du sletter alt ved å slette nettstedsdata for appen i
        nettleserens innstillinger.
      </P>

      <H>Ingen sporing</H>
      <P>
        Appen bruker ikke analyseverktøy, annonser eller informasjonskapsler for sporing. Nettleserens lokale lagring
        brukes bare for at appen skal virke.
      </P>

      <H>Vertskap</H>
      <P>
        Appen ligger hos Vercel Inc. (USA). Som for alle nettsider registrerer serveren tekniske opplysninger når appen
        lastes, som IP-adresse, tidspunkt og nettlesertype. Dette brukes til drift og sikkerhet og lagres en begrenset tid.
      </P>

      <H>AI-treneren</H>
      <P>
        AI-treneren krever en tilgangskode. Når du bruker den, sendes spørsmålet ditt via vår server til OpenRouter
        (USA), som sender det videre til en AI-modell. Sammen med spørsmålet sendes et utdrag fra appen: på brettet
        roller, draktnumre, posisjoner, utstyr, tegninger, tekst på banen, fasenavn og fasenotat; ellers titler, datoer,
        varighet og fokus for treninger, motstander i kamper og stikkord fra kamprapporter. Ber du AI-en lage en
        variant av en egen øvelse, sendes den øvelsen. Spillernavn, navnelista,
        fremmøte, sted og frie treningsnotater sendes aldri.
      </P>
      <P>
        Vi lagrer ikke spørsmålene eller svarene. Serveren noterer bare tidspunkt og størrelse på forespørselen, og
        IP-adressen brukes kort i minnet for å begrense antall forespørsler. Vi har slått av at leverandørene kan bruke
        forespørslene til å trene AI-modeller. Skriv ikke navn eller andre personopplysninger i spørsmål, fasenotater
        eller tekst på banen når du bruker AI-treneren.
      </P>

      <H>Feilrapport og tilbakemelding</H>
      <P>
        Feilrapporten lagres bare på enheten og sendes ingen steder. Lenkene «Ser noe feil ut?» åpner e-postprogrammet
        ditt; da sendes bare det du selv velger å sende.
      </P>

      <H>Ansvar</H>
      <P>
        Taktikkboard er gratis og leveres som den er. Øvelsene og AI-forslagene er forslag: treneren vurderer selv
        sikkerhet, alder og nivå. AI kan ta feil.
      </P>

      <H>Kontakt</H>
      <P>Spørsmål om personvern eller appen: <Mail /></P>
    </div>
  </Tile>
);

export const CreditsSection: React.FC = () => (
  <Tile aria-label="Kilder og lisenser" className="md:col-span-2">
    <TileHeader icon={Scale} tone="bg-canvas-raised text-ink-muted" title="Kilder og lisenser" />
    <ul className="max-w-[70ch] space-y-1.5 text-body text-ink-muted list-disc pl-5">
      <li>Spillerfiguren i 3D: Universal Animation Library fra Quaternius (quaternius.com), lisens CC0.</li>
      <li>Himmelen i 3D: Poly Haven (polyhaven.com), lisens CC0.</li>
      <li>Skrifter: Schibsted Grotesk, Instrument Serif og IBM Plex Mono, lisens SIL Open Font License 1.1.</li>
      <li>Øvelsene bygger på kildene som står ved hver øvelse.</li>
    </ul>
  </Tile>
);
