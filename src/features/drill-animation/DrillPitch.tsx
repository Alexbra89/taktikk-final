'use client';
import { memo, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import type { StagePlayer } from '@/components/board/BoardStage';
import { DrawingCanvas } from '@/components/board/DrawingCanvas';
import { FootballPitch } from '@/components/board/pitches/FootballPitch';
import { SvgDefs } from '@/components/board/svg/SvgDefs';
import { PlayerKit, KIT_BADGE_OFFSET } from '@/components/board/svg/PlayerKit';
import { PlayerChip } from '@/components/board/svg/PlayerChip';
import { RoleBadge } from '@/components/board/svg/RoleBadge';
import { BoardItemShape } from '@/components/board/svg/BoardItemShape';
import { VW, VH } from '@/data/formations';
import type { PlayerStyle } from '@/hooks/usePlayerStyle';
import type { BoardItem, Drawing, LabelDrawing, Player, Position } from '@/types';
import type { Box } from './framing';
import type { BallFlight, MotionFrame } from './motion';
import type { DrillAnimation } from './types';
import { drillMotion } from './motion';
import type { Playhead } from './playback';

// ══════════════════════════════════════════════════════════════
//  2D-BANEN FOR EN ANIMERT ØVELSE – på skjermen og i 2D-videoen
//
//  Brettets egne bane og figurer, klippet til utsnittet. Draktene, ballen,
//  kjeglene og tekstene krympes rundt sitt eget midtpunkt (kitScale), så
//  de har samme skjermstørrelse som på taktikkbrettet selv om banen zoomes.
//  Mens ballen er på vei, viser en svak stiplet strek hvor den skal.
//
//  Hver figur tegnes rundt (0, 0) og flyttes med én transform. placementOf
//  regner ut alle flyttingene i et bilde. Videoen (DrillPitch) gir dem til
//  React; avspillingen på skjermen (LiveDrillPitch) skriver dem rett i SVG-en
//  i hvert skjermbilde, uten å tegne React-komponentene på nytt.
// ══════════════════════════════════════════════════════════════

const around = (p: Position, scale: number) =>
  scale === 1 ? undefined : `translate(${p.x} ${p.y}) scale(${scale}) translate(${-p.x} ${-p.y})`;

/** En figur tegnet rundt (0, 0), flyttet til `p` og krympet som draktene. */
const placed = (p: Position, scale: number, rotation = 0) =>
  `translate(${p.x} ${p.y})${scale === 1 ? '' : ` scale(${scale})`}${rotation ? ` rotate(${rotation})` : ''}`;

export function stagePlayersOf(animation: DrillAnimation, players: Player[]): StagePlayer[] {
  return players.map(p => ({
    id: p.id, num: p.num, position: p.position, name: '',
    label: animation.cast[p.id]?.label ?? '', family: animation.cast[p.id]?.family ?? 'mid',
  }));
}

type Segment = { x1: number; y1: number; x2: number; y2: number };
/** Ballsporet: tilbakelagt strek og stiplet strek fram, med en luke rundt selve ballen. */
interface Trail { travelled: Segment | null; remaining: Segment | null }

function trailOf(flight: BallFlight | null, ball: Position, gap: number): Trail | null {
  if (!flight) return null;
  const dx = flight.to.x - flight.from.x, dy = flight.to.y - flight.from.y;
  const length = Math.hypot(dx, dy);
  if (length < 1) return null;
  const ux = dx / length, uy = dy / length;
  const travelled = Math.hypot(ball.x - flight.from.x, ball.y - flight.from.y) - gap;
  const remaining = Math.hypot(flight.to.x - ball.x, flight.to.y - ball.y) - gap;
  if (travelled <= 0 && remaining <= 0) return null;
  return {
    travelled: travelled > 0 ? { x1: flight.from.x, y1: flight.from.y, x2: ball.x - ux * gap, y2: ball.y - uy * gap } : null,
    remaining: remaining > 0 ? { x1: ball.x + ux * gap, y1: ball.y + uy * gap, x2: flight.to.x, y2: flight.to.y } : null,
  };
}

/** En tekst ved en kjegle følger kjeglen når den krympes, så den ikke blir hengende langt unna. */
function anchoredLabel(label: LabelDrawing, items: BoardItem[], scale: number) {
  const anchor = items.reduce<BoardItem | null>((best, item) => {
    const d = Math.hypot(item.position.x - label.at.x, item.position.y - label.at.y);
    return d < 60 && (!best || d < Math.hypot(best.position.x - label.at.x, best.position.y - label.at.y)) ? item : best;
  }, null);
  const at = anchor
    ? { x: anchor.position.x + (label.at.x - anchor.position.x) * scale, y: anchor.position.y + (label.at.y - anchor.position.y) * scale }
    : label.at;
  return `translate(${at.x - label.at.x} ${at.y - label.at.y}) ${around(label.at, scale) ?? ''}`;
}

const labelsOf = (drawings: Drawing[]) => drawings.filter((d): d is LabelDrawing => d.type === 'label');

/** Alt som flytter seg i ett bilde: transform per figur (data-move) og ballsporet. */
interface Placement { transforms: Record<string, string>; trail: Trail | null }

function placementOf(frame: MotionFrame, labels: LabelDrawing[], kitScale: number): Placement {
  const transforms: Record<string, string> = { ball: placed(frame.ball, kitScale) };
  for (const p of frame.players) transforms[`player:${p.id}`] = placed(p.position, kitScale);
  for (const item of frame.items) transforms[`item:${item.id}`] = placed(item.position, kitScale, item.rotation ?? 0);
  for (const label of labels) transforms[`label:${label.id}`] = anchoredLabel(label, frame.items, kitScale);
  return { transforms, trail: trailOf(frame.flight, frame.ball, 13 * kitScale) };
}

function setAttribute(element: SVGElement, name: string, value: string | null) {
  if (element.getAttribute(name) === value) return;
  if (value === null) element.removeAttribute(name);
  else element.setAttribute(name, value);
}

function setLine(line: SVGLineElement | undefined, segment: Segment | null) {
  if (!line) return;
  if (!segment) { setAttribute(line, 'display', 'none'); return; }
  setAttribute(line, 'display', null);
  for (const key of ['x1', 'y1', 'x2', 'y2'] as const) setAttribute(line, key, String(segment[key]));
}

/** Finn nodene etter React har tegnet, aldri på nytt i hvert skjermbilde. */
function bindPlacement(root: SVGGElement) {
  const nodes = Array.from(root.querySelectorAll<SVGGElement>('[data-move]'), el => ({
    el, key: el.dataset.move!, lines: Array.from(el.querySelectorAll('line')),
  }));
  // Som brettets React-tegning: skriv bare egenskaper som faktisk er endret.
  // Uendrede display-/spor-attributter må ikke ugyldiggjøre SVG-en i pausene.
  return ({ transforms, trail }: Placement) => nodes.forEach(({ el, key, lines }) => {
    if (key === 'trail') {
      setAttribute(el, 'data-ball-trail', trail ? 'true' : null);
      setAttribute(el, 'display', trail ? null : 'none');
      const [travelled, remaining] = lines;
      setLine(travelled, trail?.travelled ?? null);
      setLine(remaining, trail?.remaining ?? null);
      return;
    }
    const transform = transforms[key];
    if (transform !== undefined) setAttribute(el, 'transform', transform);
  });
}

interface Props {
  animation: DrillAnimation;
  frame: MotionFrame;
  drawings: Drawing[];
  crop: Box;
  kitScale: number;
  playerStyle: PlayerStyle;
  /** Plasseringen skrives av LiveDrillPitch, ikke av React. */
  live?: boolean;
}

/** Gress og banestreker endrer seg aldri under avspilling. */
const PitchBackground = memo(function PitchBackground() {
  return <><SvgDefs /><rect width={VW} height={VH} style={{ fill: 'rgb(var(--k-pitch))' }} /><FootballPitch /></>;
});

/**
 * Banen på skjermen. React tegner figurene bare når fasen skifter; i hvert
 * skjermbilde (requestAnimationFrame) leses klokka med bildets tidsstempel,
 * og drakter, ball og utstyr flyttes rett i SVG-en – samme playheadAt,
 * drillMotion og placementOf som bildene i 2D-opptaket.
 */
export function LiveDrillPitch({ head, sample, isPlaying, ...props }: Omit<Props, 'frame' | 'drawings' | 'live'> & {
  head: Pick<Playhead, 'from' | 't' | 'moving'>;
  sample: (now?: number) => Playhead | null;
  isPlaying: boolean;
}) {
  const root = useRef<SVGGElement>(null);
  const draw = useRef<(now?: number) => void>(() => {});
  const { animation, kitScale } = props;
  const phaseLabels = useMemo(() => animation.phases.map(phase => labelsOf(phase.drawings)), [animation]);

  // Etter hver tegning i React, før skjermen males: figurene står der klokka er nå.
  useLayoutEffect(() => {
    const apply = root.current && bindPlacement(root.current);
    let painted: Pick<Playhead, 'from' | 't' | 'moving'> | null = null;
    draw.current = now => {
      const at = (isPlaying && sample(now)) || head;
      if (painted && painted.from === at.from && painted.t === at.t && painted.moving === at.moving) return;
      painted = at;
      const frame = drillMotion(animation, at.from, at.t, at.moving, kitScale);
      apply?.(placementOf(frame, phaseLabels[at.from], kitScale));
    };
    draw.current();
  });

  useEffect(() => {
    if (!isPlaying) return;
    let raf = 0;
    const tick = (now: number) => { draw.current(now); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying]);

  return <g ref={root}>
    <DrillPitch {...props} live frame={drillMotion(animation, head.from, 0, false, kitScale)}
      drawings={animation.phases[head.from].drawings} />
  </g>;
}

/** Innholdet i SVG-en (viewBox = utsnittet settes av den som tegner). */
export function DrillPitch({ animation, frame, drawings, crop, kitScale, playerStyle, live = false }: Props) {
  const labels = labelsOf(drawings);
  const others = drawings.filter(d => d.type !== 'label');
  const { transforms, trail } = placementOf(frame, labels, kitScale);
  const move = (key: string) => ({ 'data-move': key, transform: live ? undefined : transforms[key] });
  const line = (segment: Segment | null | undefined) => live ? {} : segment ? segment : { display: 'none' };
  const stroke = { stroke: 'rgb(var(--k-ink))' };
  const kit = playerStyle === 'kit';
  return (
    <>
      <defs><clipPath id="drill-animation-crop"><rect x={crop.x} y={crop.y} width={crop.width} height={crop.height} /></clipPath></defs>
      <g clipPath="url(#drill-animation-crop)">
        <PitchBackground />
        {others.map(drawing => <DrawingCanvas key={drawing.id} drawing={drawing} />)}
        {frame.items.map(item => (
          <g key={item.id} data-item="true" {...move(`item:${item.id}`)}>
            <g><BoardItemShape type={item.type} /></g>
          </g>
        ))}
        <g data-ball="true" {...move('ball')} filter="url(#dropShadow)">
          <circle cx={0} cy={0} r={10} style={{ fill: 'rgb(var(--k-ink))' }} />
          <circle cx={0} cy={0} r={4} style={{ fill: 'rgb(var(--k-pitch))' }} />
        </g>
        <g data-move="trail" {...(live ? {} : trail ? { 'data-ball-trail': 'true' } : { display: 'none' })}
          style={{ pointerEvents: 'none' }} strokeLinecap="round">
          <line {...line(trail?.travelled)} strokeWidth={2.5 * kitScale} opacity={0.22} style={stroke} />
          <line {...line(trail?.remaining)} strokeWidth={2 * kitScale}
            strokeDasharray={`${6 * kitScale} ${6 * kitScale}`} opacity={0.5} style={stroke} />
        </g>
        {labels.map(label => (
          <g key={label.id} {...move(`label:${label.id}`)}><DrawingCanvas drawing={label} /></g>
        ))}
        {stagePlayersOf(animation, frame.players).map(player => (
          <g key={player.id} data-player="true" {...move(`player:${player.id}`)}>
            {kit
              ? <PlayerKit x={0} y={0} num={player.num} family={player.family} selected={false} isDragging={false} isTarget={false} isOutOfPos={false} />
              : <PlayerChip x={0} y={0} num={player.num} selected={false} isDragging={false} isTarget={false} isOutOfPos={false} />}
            <RoleBadge x={0} y={kit ? KIT_BADGE_OFFSET : 22} label={player.label} />
          </g>
        ))}
      </g>
    </>
  );
}
