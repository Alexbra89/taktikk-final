'use client';
import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { PlayerRole } from '@/types';
import { useActiveTactic, getSlot, SPORT_LABELS } from '@/store/selectors';
import { getFormationSlots } from '@/data/formations';
import { ROLE_INFO } from '@/data/roleInfo';
import { Modal } from '@/components/ui';

// ═══════════════════════════════════════════════════════════════
//  ROLLEFORKLARINGER – læringsverktøy for unge trenere. Åpnes som modal fra
//  «Forklar rollene». Viser først rollene i aktiv formasjon, deretter «Andre roller».
//  Rollefargen fra ROLE_INFO beholdes: den er den samme som på brettet,
//  og er informasjon om hvem spilleren er – ikke pynt.
// ═══════════════════════════════════════════════════════════════

type CardId =
  | 'keeper' | 'stopper' | 'back' | 'wingback' | 'sweeper' | 'midfielder' | 'playmaker'
  | 'box2box' | 'winger' | 'forward' | 'false9' | 'trequartista' | 'targetman';

interface RoleCard {
  id: CardId;
  role: PlayerRole;
  name: string;
  withBall: string[];
  withoutBall: string[];
}

// Rolletypen `defender` vises som «Stopper» eller «Back» ut fra etiketten på sloten.
const CARDS: RoleCard[] = [
  {
    id: 'keeper', role: 'keeper', name: 'Keeper',
    withBall: ['Spill enkelt ut til stopperne eller backene', 'Tilby deg som pasningsalternativ når laget bygger opp', 'Slå langt hvis laget er presset'],
    withoutBall: ['Stå klar midt i mål, litt foran streken', 'Rop og dirigér forsvarslinja', 'Kom ut og rydd når ballen slås bak forsvaret'],
  },
  {
    id: 'stopper', role: 'defender', name: 'Stopper',
    withBall: ['Spill kort til keeper, back eller midtbane', 'Flytt ballen raskt, ikke drible under press', 'Gå frem med ballen når det er god plass'],
    withoutBall: ['Stå mellom ballen og eget mål', 'Hold linja sammen med de andre forsvarerne', 'Dekk spissen og vinn duellene'],
  },
  {
    id: 'back', role: 'defender', name: 'Back',
    withBall: ['Spill ballen opp til kanten eller midtbanen', 'Løp forbi kantspilleren når det er rom', 'Slå innlegg når du kommer langt frem'],
    withoutBall: ['Stå mellom ballen og målet på din side', 'Følg motstanderens kantspiller', 'Trekk inn mot midten når ballen er på andre siden'],
  },
  {
    id: 'wingback', role: 'wingback', name: 'Vingback',
    withBall: ['Løp langs sidelinja og slå innlegg', 'Skap overtall sammen med kantspilleren', 'Bytt side med lange pasninger'],
    withoutBall: ['Løp tilbake og dekk hele kanten', 'Hjelp stopperne inn mot midten', 'Vær klar til å presse motstanderens kant'],
  },
  {
    id: 'sweeper', role: 'sweeper', name: 'Sweeper',
    withBall: ['Spill enkelt fra baksiden og start angrepet', 'Gå frem i rommet foran forsvaret når det er trygt'],
    withoutBall: ['Stå bak de andre forsvarerne og dekk rommet', 'Grip inn når en motstander kommer gjennom', 'Rop til lagkameratene hvem som skal dekke hvem'],
  },
  {
    id: 'midfielder', role: 'midfielder', name: 'Midtbane',
    withBall: ['Tilby deg hele tiden, slik at ballfører har et alternativ', 'Se deg rundt før du får ballen', 'Spill fremover når det er mulig, ellers til siden'],
    withoutBall: ['Hold passe avstand til lagkameratene', 'Press ballfører sammen med en medspiller', 'Dekk rommet foran eget forsvar'],
  },
  {
    id: 'playmaker', role: 'playmaker', name: 'Playmaker',
    withBall: ['Ta imot mellom motstanderens midtbane og forsvar', 'Spill den avgjørende pasningen til spiss eller kant', 'Bestem tempoet: roe ned eller øk farten'],
    withoutBall: ['Press motstanderens midtbane når laget mister ballen', 'Kom tilbake og hjelp midtbanen', 'Hold deg sentralt slik at du er lett å finne'],
  },
  {
    id: 'box2box', role: 'box2box', name: 'Box-to-box',
    withBall: ['Bær ballen fremover fra midtbanen', 'Kom inn i boksen og avslutt', 'Spill kort og løp videre etter pasningen'],
    withoutBall: ['Løp tilbake og hjelp forsvaret', 'Vinn ballen i midtbanen', 'Hold energien oppe gjennom hele kampen'],
  },
  {
    id: 'winger', role: 'winger', name: 'Kantspiller',
    withBall: ['Utfordre backen én mot én', 'Slå innlegg eller skjær inn og skyt', 'Spill kort til spissen når du blir dobbeltmarkert'],
    withoutBall: ['Press motstanderens back', 'Kom tilbake og hjelp din egen back', 'Hold bredden slik at laget får mer plass'],
  },
  {
    id: 'forward', role: 'forward', name: 'Spiss',
    withBall: ['Hold ballen og hent laget opp i banen', 'Avslutt når du får sjansen', 'Løp bak forsvaret når en pasning er på vei'],
    withoutBall: ['Press motstanderens stoppere og keeper', 'Hindre motstanderen i å spille lett ut', 'Ikke gå for langt fra midtbanen'],
  },
  {
    id: 'false9', role: 'false9', name: 'Falsk 9er',
    withBall: ['Trekk ned i rommet mellom midtbane og forsvar', 'Dra stopperen med deg ut av posisjon', 'Slipp ballen til kantene som løper inn'],
    withoutBall: ['Press først som en vanlig spiss', 'Gå tilbake og hjelp midtbanen'],
  },
  {
    id: 'trequartista', role: 'trequartista', name: 'Trequartista',
    withBall: ['Finn rommet bak spissen og ta imot der', 'Lag overraskelser: gjennomlegg, dribling og skudd'],
    withoutBall: ['Press når ballen er nær deg', 'De andre midtbanespillerne dekker for deg'],
  },
  {
    id: 'targetman', role: 'targetman', name: 'Targetman',
    withBall: ['Vis deg som mål for lange baller', 'Skjerm ballen med kroppen og legg av', 'Vinn hodedueller i boksen'],
    withoutBall: ['Press stopperne når avstanden er kort', 'Stå klar på motstanderens siste linje'],
  },
];

const cardIdFor = (role: PlayerRole, label: string): CardId =>
  role === 'defender' ? (label === 'MS' ? 'stopper' : 'back') : (role as CardId);

export const RoleExplanations: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const tactic = useActiveTactic();
  const [openId, setOpenId] = useState<CardId | null>(null);

  // Etikettene per rolle i aktiv formasjon, i rekkefølgen de først forekommer (keeper først).
  const inFormation = useMemo(() => {
    const labels = new Map<CardId, Map<string, number>>();
    getFormationSlots(tactic.sport, tactic.formation).forEach((_, i) => {
      const { role, label } = getSlot(tactic, i);
      const id = cardIdFor(role, label);
      const perLabel = labels.get(id) ?? new Map<string, number>();
      perLabel.set(label, (perLabel.get(label) ?? 0) + 1);
      labels.set(id, perLabel);
    });
    return labels;
  }, [tactic]);

  const usedCards = [...inFormation.keys()].map(id => CARDS.find(c => c.id === id)!);
  const otherCards = CARDS.filter(c => !inFormation.has(c.id));

  const renderCard = (card: RoleCard) => {
    const open = openId === card.id;
    const labels = inFormation.get(card.id);
    return (
      <div key={card.id} className="rounded-panel bg-canvas-sunken shadow-hair overflow-hidden">
        <button
          onClick={() => setOpenId(open ? null : card.id)}
          aria-expanded={open}
          className="w-full flex items-center gap-2 px-3 py-2.5 text-left min-h-[44px]
            hover:bg-canvas-hover transition-colors"
        >
          <span aria-hidden className="h-2.5 w-2.5 rounded-full flex-shrink-0"
            style={{ background: ROLE_INFO[card.role].color }} />
          <span className="text-body font-bold text-ink">{card.name}</span>
          {labels && (
            <span className="flex gap-1 flex-wrap">
              {[...labels.entries()].map(([label, n]) => (
                <span key={label}
                  className="px-1.5 py-0.5 rounded-ctl bg-signal/10 text-signal font-mono text-[10px] tracking-[0.06em]">
                  {label}{n > 1 ? ` ×${n}` : ''}
                </span>
              ))}
            </span>
          )}
          <span aria-hidden className="ml-auto text-ink-faint flex-shrink-0">
            {open
              ? <ChevronUp size={15} strokeWidth={1.75} />
              : <ChevronDown size={15} strokeWidth={1.75} />}
          </span>
        </button>
        {open && (
          <div className="px-3 pb-3 grid gap-3 sm:grid-cols-2">
            {([
              { title: 'Med ball',  items: card.withBall },
              { title: 'Uten ball', items: card.withoutBall },
            ]).map(({ title, items }) => (
              <div key={title}>
                <div className="font-mono text-meta uppercase tracking-[0.08em] text-ink-subtle mb-1.5">
                  {title}
                </div>
                <ul className="space-y-1">
                  {items.map(t => (
                    <li key={t} className="text-body text-ink-muted leading-snug flex gap-2">
                      <span aria-hidden className="text-ink-faint flex-shrink-0">✦</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal
      onClose={onClose}
      size="lg"
      title={<span className="font-serif text-[1.5rem] leading-tight">Roller</span>}
    >
      <div className="space-y-2">
        <div className="font-mono text-meta uppercase tracking-[0.08em] text-ink-subtle">
          I {tactic.formation} ({SPORT_LABELS[tactic.sport]})
        </div>
        {usedCards.map(renderCard)}

        {otherCards.length > 0 && (
          <>
            <div className="pt-3 font-mono text-meta uppercase tracking-[0.08em] text-ink-subtle">
              Andre roller
            </div>
            {otherCards.map(renderCard)}
          </>
        )}
      </div>
    </Modal>
  );
};
