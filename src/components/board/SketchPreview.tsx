'use client';
import React, { useMemo } from 'react';

// ══════════════════════════════════════════════════════════════
//  SKJEMATISK MINI-BANE – IKKE I BRUK
//
//  TODO: Bygg smartere plassering: N-mot-N, mål/keeper,
//  firkant/sirkel. Krev mer konkret sketch for å tegne.
//
//  Tatt ut av detaljvisningene igjen: regelen «alle spillere på en
//  rekke i midten» ga ingen romlig informasjon. Ti prikker på rad
//  for en 3-mot-3-øvelse så ut som en feil, og alle baner ble like
//  uansett øvelse. `hasSketch` brukes fortsatt av øvelseslista.
//
//  Skissefeltet på øvelsene er fri prosa på norsk («Sone 10×10 m.
//  To kjegler på bakkantlinjen. Angriper starter foran, forsvarer
//  3 m foran angriperen …»). Vi trekker derfor bare ut det som kan
//  TELLES – sone, kjegler, mål, spillere – og plasserer det etter
//  faste regler. Vi tolker bevisst ikke posisjoner: «3 m foran
//  angriperen» eller «skrått foran til siden» blir ignorert, fordi
//  en feil oppstilling er verre enn ingen for en trener som skal
//  rigge økten på banen. Derfor sier bildeteksten alltid hva som
//  faktisk er funnet.
//
//  TODO: For presise skisser må øvelsene få strukturerte data
//  (zone/cones/players/goals som felt på DrillExercise) i stedet
//  for prosa. Det er ~83 øvelser som må fylles ut for hånd, og tas
//  først hvis brukerne etterspør nøyaktighet.
// ══════════════════════════════════════════════════════════════

const NUM_WORDS: Record<string, number> = {
  en: 1, én: 1, ett: 1, to: 2, tre: 3, fire: 4, fem: 5,
  seks: 6, sju: 7, syv: 7, åtte: 8, ni: 9, ti: 10,
};

/** Rollene vi teller som «spillere». Lengste først – regex-alternering
 *  velger første treff, og «midtbanespiller» må slå «spiller». */
const ROLE_STEMS = [
  'midtbanespiller', 'soneforsvarer', 'pasningslegger', 'mannsmarkør',
  'kantspiller', 'innkaster', 'angriper', 'forsvarer', 'servitør',
  'utøver', 'skytter', 'stopper', 'partner', 'spiller', 'keeper',
  'trener', 'tagger', 'joker', 'spiss', 'back',
];

export interface SketchFacts {
  zone?: { w: number; h: number };
  cones: number;
  conesInCorners: boolean;
  goals: number;
  players: number;
}

/** Tallet rett foran et ord: «To kjegler» → 2, «3-4 kjegler» → 3. */
function quantityBefore(text: string, idx: number): number {
  const before = text.slice(Math.max(0, idx - 16), idx).toLowerCase();
  const digit = before.match(/(\d+)(?:\s*[-–]\s*\d+)?\s*$/);
  if (digit) return parseInt(digit[1], 10);
  const word = before.match(/([a-zæøå]+)\s*$/);
  if (word && NUM_WORDS[word[1]] !== undefined) return NUM_WORDS[word[1]];
  return 1;
}

/**
 * Høyeste antall per ord, ikke summen av forekomster. «Angriper starter
 * foran, forsvarer … foran angriperen» skal gi 2 spillere, ikke 3 – samme
 * rolle nevnt flere ganger er den samme personen.
 */
function maxPerStem(text: string, stems: string[]): number {
  const re = new RegExp(`\\b(${stems.join('|')})\\w*`, 'gi');
  const best = new Map<string, number>();
  for (const m of text.matchAll(re)) {
    const stem = m[1].toLowerCase();
    const qty = quantityBefore(text, m.index ?? 0);
    best.set(stem, Math.max(best.get(stem) ?? 0, qty));
  }
  let total = 0;
  for (const v of best.values()) total += v;
  return total;
}

function countGoals(t: string): number {
  // «Start → 8-10 m → mål» i kondisjonsøvelsene er en målstrek, ikke et mål.
  if (/→\s*mål/.test(t) && !/keeper/.test(t)) return 0;
  if (!/\bmål/.test(t)) return 0;
  if (/mål i hvert hjørne/.test(t)) return 4;
  // «i hver kortende», «bak hver kortside», «i begge ender»
  if (/(i|bak|med) (hver|begge) (kortende|kortside|langside|ende)r?\b/.test(t)) return 2;
  return 1;
}

function countCones(t: string): { cones: number; corners: boolean } {
  const corners = /kjegle i hvert hjørne/.test(t);
  if (corners) return { cones: 4, corners: true };

  let cones = maxPerStem(t, ['kjegle', 'markør']);

  // «Kjegleport» er to kjegler; «kjeglerekke (3-4)» oppgir antallet i parentes.
  const ports = [...t.matchAll(/kjegleport/g)].length;
  if (ports) cones = Math.max(cones, ports * 2);
  if (/kjeglerekke/.test(t) && cones === 0) {
    const n = t.match(/kjeglerekke\s*\((\d+)/);
    cones = n ? parseInt(n[1], 10) : 4;
  }
  return { cones, corners: /hjørne/.test(t) && cones === 4 };
}

export function parseSketch(sketch?: string, players?: string): SketchFacts | null {
  if (!sketch || !sketch.trim()) return null;
  const t = sketch.toLowerCase();

  const dim = t.match(/(\d+)\s*[×x]\s*(\d+)\s*m\b/);
  const zone = dim
    ? { w: Math.max(+dim[1], +dim[2]), h: Math.min(+dim[1], +dim[2]) }
    : undefined;

  const { cones, corners } = countCones(t);
  const goals = countGoals(t);

  let playerCount = maxPerStem(t, ROLE_STEMS);
  // «4 mot 4» beskriver hele oppstillingen; bruk den hvis den er større,
  // ikke i tillegg, så vi ikke teller de samme spillerne to ganger.
  const versus = t.match(/(\d+)\s*mot\s*(\d+)/);
  if (versus) playerCount = Math.max(playerCount, +versus[1] + +versus[2]);
  // «en spiller i hvert hjørne» – fire personer, ikke én.
  if (new RegExp(`(${ROLE_STEMS.join('|')})\\w*\\s+i\\s+hvert\\s+hjørne`).test(t)) {
    playerCount = Math.max(playerCount, 4);
  }
  // Siste utvei: antallet på selve øvelsen, men bare et rent tall («6», ikke «2 og 2»).
  if (playerCount === 0 && players) {
    const solo = players.trim().match(/^(\d+)$/);
    if (solo) playerCount = +solo[1];
  }

  // Uten sone, kjegler eller mål har vi ikke nok til å tegne noe ærlig.
  if (!zone && cones === 0 && goals === 0) return null;

  return { zone, cones, conesInCorners: corners, goals, players: playerCount };
}

/** Har øvelsen en skissebeskrivelse i det hele tatt? Dette er sjekken
 *  øvelseslista bruker til bane-ikonet. */
export function hasSketch(sketch?: string): boolean {
  return Boolean(sketch && sketch.trim());
}

/**
 * Kan vi tegne en ærlig skisse av denne teksten? Ikke i bruk nå som
 * tegningen er tatt ut, men beholdt til den smartere versjonen.
 */
export function canRenderSketch(sketch?: string, players?: string): boolean {
  return parseSketch(sketch, players) !== null;
}

function caption(f: SketchFacts): string {
  const parts: string[] = [];
  if (f.zone) parts.push(`${f.zone.w}×${f.zone.h} m`);
  if (f.cones) parts.push(`${f.cones} ${f.cones === 1 ? 'kjegle' : 'kjegler'}`);
  if (f.goals) parts.push(`${f.goals} mål`);
  if (f.players) parts.push(`${f.players} ${f.players === 1 ? 'spiller' : 'spillere'}`);
  return parts.join(' · ');
}

// ─── Tegning ──────────────────────────────────────────────────
// Faste regler, ingen posisjonstolkning:
//   sone    – riktig proporsjon, ellers 3:2
//   mål     – på kortsidene (eller i hjørnene hvis det er fire)
//   kjegler – i hjørnene hvis teksten sier det, ellers jevnt på en linje
//   spillere– nummererte prikker på en rekke i midten

const PAD = 10;
const BOX_W = 100;
const MAX_CONES = 10;
const MAX_PLAYERS = 12;

const Cone: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <polygon points={`${x},${y - 3} ${x + 2.6},${y + 2} ${x - 2.6},${y + 2}`} className="fill-ink-subtle" />
);

export const SketchPreview: React.FC<{ sketch?: string; players?: string }> = ({ sketch, players }) => {
  const facts = useMemo(() => parseSketch(sketch, players), [sketch, players]);

  // Uten skissetekst er det ingenting å vise til. «Se skisse under» pekte
  // tidligere på en seksjon som ikke fantes (f.eks. «A1-A2: 2 mot 2 pluss
  // joker», som har oppsettet i steps[0] og ikke noe sketch-felt).
  if (!hasSketch(sketch)) return null;

  if (!facts) {
    // Generisk bane – vi later ikke som vi vet hvordan øvelsen ser ut.
    return (
      <figure className="m-0">
        <div className="mx-auto w-full max-w-[280px] h-[130px] rounded-panel bg-pitch shadow-hair
                        flex flex-col items-center justify-center gap-2">
          <svg viewBox="0 0 60 40" className="h-12 w-auto" aria-hidden>
            <g className="fill-none stroke-pitch-line" strokeWidth={1.2}>
              <rect x={1} y={1} width={58} height={38} rx={1} />
              <line x1={30} y1={1} x2={30} y2={39} />
              <circle cx={30} cy={20} r={6} />
              <rect x={1} y={13} width={7} height={14} />
              <rect x={52} y={13} width={7} height={14} />
            </g>
          </svg>
          <span className="text-body text-ink-subtle">Se skisse under</span>
        </div>
      </figure>
    );
  }

  const aspect = facts.zone ? facts.zone.w / facts.zone.h : 1.5;
  const boxH = Math.round(BOX_W / aspect);
  const vbW = BOX_W + PAD * 2;
  const vbH = boxH + PAD * 2;

  const left = PAD, top = PAD, right = PAD + BOX_W, bottom = PAD + boxH;
  const midY = top + boxH / 2;

  const goalH = Math.min(boxH * 0.4, 22);
  const cones = Math.min(facts.cones, MAX_CONES);
  const playerCount = Math.min(facts.players, MAX_PLAYERS);

  const conePoints: { x: number; y: number }[] = [];
  if (facts.conesInCorners) {
    const inset = 6;
    conePoints.push(
      { x: left + inset, y: top + inset }, { x: right - inset, y: top + inset },
      { x: left + inset, y: bottom - inset }, { x: right - inset, y: bottom - inset },
    );
  } else {
    for (let i = 0; i < cones; i++) {
      conePoints.push({ x: left + (BOX_W * (i + 1)) / (cones + 1), y: bottom - 6 });
    }
  }

  const playerR = playerCount > 8 ? 3.6 : 4.4;
  const span = BOX_W * 0.74;
  const playerPoints = Array.from({ length: playerCount }, (_, i) => ({
    x: left + BOX_W / 2 - span / 2 + (playerCount === 1 ? span / 2 : (span * i) / (playerCount - 1)),
    y: midY,
  }));

  const label = `Skjematisk skisse: ${caption(facts)}`;

  return (
    <figure className="m-0">
      {/* Baneflaten ligger inne i SVG-en, ikke på containeren: ellers blir det
          en bred mørk flate med en liten tegning midt i på desktop. */}
      <div className="w-full h-[210px] sm:h-[190px] flex items-center justify-center">
        <svg viewBox={`0 0 ${vbW} ${vbH}`} preserveAspectRatio="xMidYMid meet"
          className="h-full w-auto max-w-full" role="img" aria-label={label}>

          <rect x={0} y={0} width={vbW} height={vbH} rx={3} className="fill-pitch" />

          {/* Sone */}
          <rect x={left} y={top} width={BOX_W} height={boxH} rx={1.5}
            className="fill-none stroke-pitch-line" strokeWidth={1.2} />

          {/* Midtlinje når det spilles mot mål i begge ender */}
          {facts.goals === 2 && (
            <g className="stroke-pitch-line" strokeWidth={0.8} opacity={0.65}>
              <line x1={left + BOX_W / 2} y1={top} x2={left + BOX_W / 2} y2={bottom} />
              <circle cx={left + BOX_W / 2} cy={midY} r={Math.min(boxH, BOX_W) * 0.14}
                className="fill-none stroke-pitch-line" />
            </g>
          )}

          {/* Mål – alltid på kortsidene, aldri tolket ut fra teksten */}
          {facts.goals === 1 && (
            <rect x={right} y={midY - goalH / 2} width={3.5} height={goalH}
              className="fill-ink-muted" />
          )}
          {facts.goals === 2 && (
            <>
              <rect x={left - 3.5} y={midY - goalH / 2} width={3.5} height={goalH} className="fill-ink-muted" />
              <rect x={right} y={midY - goalH / 2} width={3.5} height={goalH} className="fill-ink-muted" />
            </>
          )}
          {facts.goals >= 3 && (
            <>
              {[[left - 3, top + 4], [right, top + 4], [left - 3, bottom - 12], [right, bottom - 12]]
                .map(([gx, gy], i) => (
                  <rect key={i} x={gx} y={gy} width={3} height={8} className="fill-ink-muted" />
                ))}
            </>
          )}

          {/* Kjegler */}
          {conePoints.map((c, i) => <Cone key={i} x={c.x} y={c.y} />)}

          {/* Spillere */}
          {playerPoints.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={playerR} className="fill-signal" />
              <text x={p.x} y={p.y + playerR * 0.36} textAnchor="middle"
                fontSize={playerR * 1.15} className="fill-signal-fg font-mono">
                {i + 1}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <figcaption className="mt-1.5 text-center font-mono text-meta text-ink-subtle">
        Skjematisk · {caption(facts)}
      </figcaption>
    </figure>
  );
};
