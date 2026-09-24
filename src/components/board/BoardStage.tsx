'use client';
import React from 'react';
import { VW, VH } from '../../data/formations';
import { FootballPitch } from './pitches/FootballPitch';
import { DrawingCanvas } from './DrawingCanvas';
import { PlayerTrails } from './svg/PlayerTrails';
import { PlayerChip } from './svg/PlayerChip';
import { PlayerKit, KIT_BADGE_OFFSET } from './svg/PlayerKit';
import { RoleBadge } from './svg/RoleBadge';
import { NameLabel } from './svg/NameLabel';
import { BoardItemShape } from './svg/BoardItemShape';
import { ITEM_RADIUS } from '../../data/boardItems';
import type { BoardItem, Drawing, NewDrawing, Player, Position } from '../../types';
import type { RoleFamily } from '../../data/roleInfo';
import type { PlayerStyle } from '../../hooks/usePlayerStyle';

// ══════════════════════════════════════════════════════════════
//  BOARD STAGE – alt som tegnes på banen, og ingenting mer.
//
//  Ren visning: ingen drag, ingen zoom, ingen store-kall, ingen egen
//  tilstand. Brettene eier interaksjonen og sender inn ferdige
//  håndterere og stiler (playerGroupProps / ballGroupProps), som legges
//  på de samme gruppene som før. Bilde- og videoeksport sender ingen.
//
//  Innholdet ligger i den rekkefølgen det skal tegnes:
//  bane → spillerbaner → tegninger → ball → spillere → fremdrift.
// ══════════════════════════════════════════════════════════════

export interface StagePlayer {
  id: string;
  num: number;
  position: Position;
  /** Rollens kortnavn, f.eks. «SP». Settes i versaler av RoleBadge. */
  label: string;
  /** Rollefamilien. Bestemmer draktfargen. */
  family: RoleFamily;
  /** Kallenavn. Tom streng skjuler navneetiketten. */
  name: string;
  selected?: boolean;
  dragging?: boolean;
  target?: boolean;
  outOfPos?: boolean;
  /** Hvor mye brikken dempes under drag. Fullskjerm demper mindre enn vanlig brett. */
  dragOpacity?: number;
  /** Sprett etter et slipp. Styles av brettet via playerGroupProps. */
  bounce?: boolean;
}

export interface BoardStageProps {
  players: StagePlayer[];
  ball: Position;
  drawings: Drawing[];
  /** Spillerbaner fra forrige fase, eller null når de ikke skal vises. */
  trails?: { from: Player[]; to: Player[] } | null;
  /** Streken som tegnes akkurat nå. */
  preview?: NewDrawing | null;
  /** Fremdrift 0–1 under avspilling. null skjuler linja. */
  progress?: number | null;
  /** Høyden fremdriftslinja ligger på. */
  progressY?: number;
  /** Filteret ballens skygge bruker. Brettene definerer det selv. */
  ballFilterId?: string;
  /** Drakt (standard) eller sirkel. */
  playerStyle?: PlayerStyle;
  /** Utstyr i fasen: kjegler, motstandere osv. */
  items?: BoardItem[];
  /** Markert utstyr får en ring, som en valgt spiller. */
  selectedItemId?: string | null;
  itemGroupProps?: (item: BoardItem) => React.SVGProps<SVGGElement>;
  playerGroupProps?: (player: StagePlayer) => React.SVGProps<SVGGElement>;
  ballGroupProps?: React.SVGProps<SVGGElement>;
  /** Tegnes mellom ballen og spillerne (snap-indikator). */
  beforePlayers?: React.ReactNode;
  /** Tegnes over spillerne (drag-skygge). */
  afterPlayers?: React.ReactNode;
}

export const BoardStage: React.FC<BoardStageProps> = ({
  players, ball, drawings, trails, preview,
  progress = null, progressY = VH - 14, ballFilterId = 'dropShadow', playerStyle = 'kit',
  items, selectedItemId = null, itemGroupProps,
  playerGroupProps, ballGroupProps, beforePlayers, afterPlayers,
}) => {
  const kit = playerStyle === 'kit';
  // Drakten er høyere enn sirkelen, så etikettene står litt lenger ned.
  const badgeDy = kit ? KIT_BADGE_OFFSET : 22;
  return (
  <>
    <rect width={VW} height={VH} style={{ fill: 'rgb(var(--k-pitch))' }}/>

    <FootballPitch/>

    {/* Under tegningene: banene er avledet og skal ikke skjule det treneren har tegnet. */}
    {trails && <PlayerTrails from={trails.from} to={trails.to}/>}

    {drawings?.map(d => <DrawingCanvas key={d.id} drawing={d}/>)}
    {preview && (
      <g opacity={0.85} style={{ pointerEvents: 'none' }}>
        <DrawingCanvas drawing={{ id: 'preview', ...preview }}/>
      </g>
    )}

    {/* Utstyr over tegningene – ellers ville en pil over en kjegle stjele draget –
        men under ballen og spillerne, som er det man oftest tar tak i. */}
    {items?.map(item => (
      <g key={item.id} data-item="true" {...(itemGroupProps ? itemGroupProps(item) : null)}>
        {/* Usynlig treffflate, så små elementer er lette å treffe med finger. */}
        <circle cx={item.position.x} cy={item.position.y} r={Math.max(ITEM_RADIUS[item.type], 20)}
          fill="transparent" style={{ pointerEvents: 'all' }}/>
        {item.id === selectedItemId && (
          <circle data-export="skip" cx={item.position.x} cy={item.position.y} r={ITEM_RADIUS[item.type] + 8}
            fill="none" strokeWidth={1.5} strokeDasharray="5,4" style={{ stroke: 'rgb(var(--k-ink))' }} opacity={0.65}/>
        )}
        <g transform={`translate(${item.position.x} ${item.position.y}) rotate(${item.rotation ?? 0})`}>
          <BoardItemShape type={item.type}/>
        </g>
      </g>
    ))}

    {/* Kalk: ballen er en blekkprikk med kalkkjerne – leses på både mørk og lys bane. */}
    <g {...ballGroupProps} filter={`url(#${ballFilterId})`}>
      {/* Usynlig treffflate – ballen er liten å treffe med finger. */}
      <circle cx={ball.x} cy={ball.y} r={28} fill="transparent" style={{ pointerEvents: 'all' }}/>
      <circle cx={ball.x} cy={ball.y} r={10} style={{ fill: 'rgb(var(--k-ink))' }}/>
      <circle cx={ball.x} cy={ball.y} r={4} style={{ fill: 'rgb(var(--k-pitch))' }}/>
    </g>

    {beforePlayers}

    {players.map(player => {
      const { x, y } = player.position;
      return (
        <g key={player.id} data-player="true" {...(playerGroupProps ? playerGroupProps(player) : null)}>
          {kit ? (
            <PlayerKit x={x} y={y} num={player.num} family={player.family}
              selected={!!player.selected} isDragging={!!player.dragging}
              isTarget={!!player.target} isOutOfPos={!!player.outOfPos}
              dragOpacity={player.dragOpacity}/>
          ) : (
            <PlayerChip x={x} y={y} num={player.num}
              selected={!!player.selected} isDragging={!!player.dragging}
              isTarget={!!player.target} isOutOfPos={!!player.outOfPos}
              dragOpacity={player.dragOpacity}/>
          )}
          <RoleBadge x={x} y={y + badgeDy} label={player.label}/>
          {player.name && <NameLabel x={x} y={y + badgeDy + 22} name={player.name}/>}
        </g>
      );
    })}

    {afterPlayers}

    {progress !== null && (
      <rect x={32} y={progressY} rx={2} height={4}
        width={progress * (VW - 64)} style={{ fill: 'rgb(var(--k-signal))' }}/>
    )}
  </>
  );
};
