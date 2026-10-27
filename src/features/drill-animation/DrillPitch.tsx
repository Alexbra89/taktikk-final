'use client';
import { Fragment, memo, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react';
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
import { createMotionSampler, drillMotion, type MotionPlayer } from './motion';
import { PHASE_MOVE_MS, PHASE_PAUSE_MS, type Playhead } from './playback';

// ══════════════════════════════════════════════════════════════
//  2D-BANEN FOR EN ANIMERT ØVELSE – på skjermen og i 2D-videoen
//
//  Brettets egne bane og figurer. Draktene, ballen, kjeglene og tekstene
//  krympes rundt sitt eget midtpunkt (kitScale), så de har samme
//  skjermstørrelse som på taktikkbrettet selv om banen zoomes. Mens ballen
//  er på vei, viser en svak stiplet strek hvor den skal.
//
//  To lag: DrillBackground (gress, banestreker, piler) står stille, og
//  DrillFigures (drakter, ball, utstyr, tekster) flytter seg. Det som flytter
//  seg, har verken filter eller clipPath: ballens skygge er en forskjøvet
//  sirkel, som draktenes. På skjermen har gresset en fast SVG; figurene
//  har små SVG-er i egne HTML-lag, så bevegelse ikke gjør SVG-layout på nytt.
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

export function stagePlayersOf(animation: DrillAnimation, players: MotionPlayer[]): StagePlayer[] {
  return players.map(p => ({
    id: p.id, num: p.num, position: p.position, name: '',
    label: animation.cast[p.id]?.label ?? '', family: animation.cast[p.id]?.family ?? 'mid',
    ...(p.pose ? { pose: p.pose } : {}),
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

/** Hvor mye drakten tippes (grader) når spilleren slenger seg: mot siden fallet går. */
export function diveRotation(player: MotionPlayer) {
  const pose = player.pose;
  if (!pose || pose.lean < 1e-3) return 0;
  const side = pose.face.x * pose.dive.y - pose.face.y * pose.dive.x >= 0 ? 1 : -1;
  return Math.round(pose.lean * 75 * side * 10) / 10;
}

/** Ballen ser litt større ut høyt i luften, så en høy ball synes også ovenfra. */
const ballScale = (height: number) => 1 + Math.min(1, height / 6) * 0.6;

function placementOf(frame: MotionFrame, labels: LabelDrawing[], kitScale: number): Placement {
  const transforms: Record<string, string> = { ball: placed(frame.ball, kitScale * ballScale(frame.ballHeight)) };
  for (const p of frame.players) {
    transforms[`player:${p.id}`] = placed(p.position, kitScale, diveRotation(p));
    // Rolleetiketten står rett også når drakten tippes.
    transforms[`badge:${p.id}`] = placed(p.position, kitScale);
  }
  for (const item of frame.items) transforms[`item:${item.id}`] = placed(item.position, kitScale, item.rotation ?? 0);
  for (const label of labels) transforms[`label:${label.id}`] = anchoredLabel(label, frame.items, kitScale);
  return { transforms, trail: trailOf(frame.flight, frame.ball, 13 * kitScale) };
}

/** CSS transforms are compiled before Play. WAAPI runs them on the compositor;
 * even numeric SVGTransform writes would invalidate SVG layout/style every frame. */
const cssTransform = (value: string) => value
  .replace(/translate\(([^ ]+) ([^)]+)\)/g, 'translate3d($1px, $2px, 0px)')
  .replace(/rotate\(([^)]+)\)/g, 'rotate($1deg)');

function phaseKeyframes(animation: DrillAnimation, from: number, kitScale: number) {
  const motion = createMotionSampler(animation, kitScale);
  const labels = labelsOf(animation.phases[from].drawings);
  const tracks: Record<string, Keyframe[]> = {};
  const cycle = PHASE_PAUSE_MS + PHASE_MOVE_MS;
  let flightAt = -1;
  // 120 samples/s of nonlinear ball motion; players/items remain exactly linear.
  for (let step = -1; step <= 156; step++) {
    const t = Math.max(0, step / 156);
    const offset = step < 0 ? 0 : (PHASE_PAUSE_MS + t * PHASE_MOVE_MS) / cycle;
    const frame = motion.sample(from, t, true);
    if (frame.flight && flightAt < 0) flightAt = t;
    const placement = placementOf(frame, labels, kitScale);
    for (const key in placement.transforms) {
      (tracks[key] ??= []).push({ offset, transform: cssTransform(placement.transforms[key]) });
    }
    for (let line = 0; line < 2; line++) {
      const segment = line ? placement.trail?.remaining : placement.trail?.travelled;
      const dx = segment ? segment.x2 - segment.x1 : 0, dy = segment ? segment.y2 - segment.y1 : 0;
      const transform = segment
        ? `translate3d(${segment.x1}px, ${segment.y1}px, 0px) rotate(${Math.atan2(dy, dx)}rad) scale(${Math.hypot(dx, dy)}, 1)`
        : 'translate3d(0px, 0px, 0px) rotate(0rad) scale(0, 0)';
      (tracks[`trail:${line}`] ??= []).push({ offset, transform });
    }
  }
  // Ekstra baller som spilles inn i neste fase, holdes og reiser: de beholder alle bildene.
  const kicked = new Set(Object.keys(animation.phases[from + 1]?.itemKicks ?? {}).map(id => `item:${id}`));
  for (const key in tracks) {
    const frames = tracks[key];
    // Straight lines need only their ends; a figure that tips over (rotate) keeps every sample.
    const linear = key.startsWith('player:') ? !frames.some(f => String(f.transform).includes('rotate(')) : /^(badge|item|label):/.test(key) && !kicked.has(key);
    if (linear) tracks[key] = [frames[0], frames[1], frames[frames.length - 1]];
  }
  return { tracks, flightAt };
}

interface Props {
  animation: DrillAnimation;
  frame: MotionFrame;
  drawings: Drawing[];
  crop: Box;
  kitScale: number;
  playerStyle: PlayerStyle;
}

/** Gress og banestreker endrer seg aldri under avspilling. */
const PitchBackground = memo(function PitchBackground() {
  return <><SvgDefs /><rect width={VW} height={VH} style={{ fill: 'rgb(var(--k-pitch))' }} /><FootballPitch /></>;
});

/**
 * Det faste laget: gress, banestreker og fasens piler/streker (alt unntatt
 * tekstene, som følger kjeglene). Endres bare når fasen skifter.
 */
export const DrillBackground = memo(function DrillBackground({ drawings }: { drawings: Drawing[] }) {
  return <>
    <PitchBackground />
    {drawings.filter(d => d.type !== 'label').map(drawing => <DrawingCanvas key={drawing.id} drawing={drawing} />)}
  </>;
});

/**
 * Figurlaget på skjermen. React tegner figurene bare når fasen skifter; i hvert
 * skjermbilde (requestAnimationFrame) leses klokka med bildets tidsstempel,
 * og drakter, ball og utstyr flyttes rett i SVG-en – samme playheadAt,
 * drillMotion og placementOf som bildene i 2D-opptaket.
 */
export const LiveDrillPitch = memo(function LiveDrillPitch({ head, time, speed, reducedMotion, isPlaying, ...props }: Omit<Props, 'frame' | 'drawings' | 'crop'> & {
  head: Pick<Playhead, 'from' | 't' | 'moving'>;
  time: () => number | null;
  speed: number;
  reducedMotion: boolean;
  isPlaying: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const { animation, kitScale } = props;
  const stillT = isPlaying ? 0 : head.t, stillMoving = !isPlaying && head.moving;
  const initialFrame = useMemo(() => drillMotion(animation, head.from, stillT, stillMoving, kitScale),
    [animation, head.from, stillT, stillMoving, kitScale]);
  const compiled = useMemo(() => animation.phases.map((_, from) => phaseKeyframes(animation, from, kitScale)), [animation, kitScale]);

  useLayoutEffect(() => {
    if (!root.current || !isPlaying || reducedMotion || head.from >= animation.phases.length - 1) return;
    // Resolve a newly mounted phase once, before creating compositor tracks.
    // No geometry is read after playback starts.
    root.current.getBoundingClientRect();
    const cycle = PHASE_PAUSE_MS + PHASE_MOVE_MS;
    const phaseTime = (time() ?? head.from * cycle) - head.from * cycle;
    const animations: Animation[] = [];
    const tracks = compiled[head.from].tracks;
    const nodes = root.current.querySelectorAll<HTMLElement>('[data-move]');
    for (const node of nodes) {
      const key = node.dataset.move!;
      if (key === 'trail') continue;
      const targets = [node];
      for (let i = 0; i < targets.length; i++) {
        const frames = tracks[key];
        if (!frames) continue;
        if (frames.every(frame => frame.transform === frames[0].transform)) continue;
        const animation = targets[i].animate(frames, { duration: cycle, fill: 'both' });
        animation.playbackRate = speed;
        // Account for setup time so each compositor track follows the same clock.
        animation.startTime = performance.now() - ((time() ?? head.from * cycle) - head.from * cycle) / speed;
        animations.push(animation);
      }
    }
    // Semantic marker for the visible ball trail, changed once when the kick starts.
    const trail = root.current.querySelector('[data-move="trail"]')!;
    const flightAt = compiled[head.from].flightAt;
    const timer = flightAt >= 0 ? setTimeout(() => trail.setAttribute('data-ball-trail', 'true'),
      Math.max(0, (PHASE_PAUSE_MS + PHASE_MOVE_MS * flightAt + 12 - phaseTime) / speed)) : undefined;
    return () => {
      clearTimeout(timer); trail.removeAttribute('data-ball-trail');
      for (const animation of animations) animation.cancel();
    };
  }, [animation, compiled, head.from, isPlaying, reducedMotion, speed, time]);

  return <div ref={root} data-testid="drill-animation-figures" style={{ position: 'absolute', left: 0, top: 0, width: VW, height: VH, pointerEvents: 'none' }}>
    <LiveDrillFigures {...props} frame={initialFrame} drawings={animation.phases[head.from].drawings} />
  </div>;
}, (a, b) => a.animation === b.animation && a.kitScale === b.kitScale && a.playerStyle === b.playerStyle
  && a.time === b.time && a.speed === b.speed && a.reducedMotion === b.reducedMotion
  && a.isPlaying === b.isPlaying && a.head.from === b.head.from
  && (b.isPlaying || (a.head.t === b.head.t && a.head.moving === b.head.moving)));

/** HTML transform layers keep SVG layout out of playback, including Chrome at non-100% browser zoom. */
function LiveSprite({ moveKey, transform, children }: { moveKey: string; transform: string; children: ReactNode }) {
  return <span data-move={moveKey} style={{ position: 'absolute', left: 0, top: 0, width: 1, height: 1,
    transformOrigin: '0 0', transform: cssTransform(transform) }}>
    <svg width={1} height={1} overflow="visible" style={{ display: 'block' }}>{children}</svg>
  </span>;
}

function LiveDrillFigures({ animation, frame, drawings, kitScale, playerStyle }: Omit<Props, 'crop'>) {
  const labels = labelsOf(drawings);
  const { transforms } = placementOf(frame, labels, kitScale);
  const kit = playerStyle === 'kit';
  return <>
    {frame.items.map(item => <LiveSprite key={item.id} moveKey={`item:${item.id}`} transform={transforms[`item:${item.id}`]}>
      <g data-item="true"><g><BoardItemShape type={item.type} /></g></g>
    </LiveSprite>)}
    <LiveSprite moveKey="ball" transform={transforms.ball}>
      <g data-ball="true">
        <circle cx={0} cy={1.2} r={11} fill="#000" opacity={.2} />
        <circle r={10} style={{ fill: 'rgb(var(--k-ink))' }} />
        <circle r={4} style={{ fill: 'rgb(var(--k-pitch))' }} />
      </g>
    </LiveSprite>
    <div data-move="trail">
      <LiveSprite moveKey="trail:0" transform="scale(0)">
        <line x1={0} y1={0} x2={1} y2={0} strokeWidth={2.5 * kitScale} opacity={.22} style={{ stroke: 'rgb(var(--k-ink))' }} />
      </LiveSprite>
      <LiveSprite moveKey="trail:1" transform="scale(0)">
        <line x1={0} y1={0} x2={1} y2={0} strokeWidth={2 * kitScale} opacity={.5}
          strokeDasharray="0.025 0.025" style={{ stroke: 'rgb(var(--k-ink))' }} />
      </LiveSprite>
    </div>
    {labels.map(label => <LiveSprite key={label.id} moveKey={`label:${label.id}`} transform={transforms[`label:${label.id}`]}>
      <DrawingCanvas drawing={label} />
    </LiveSprite>)}
    {stagePlayersOf(animation, frame.players).map(player => <Fragment key={player.id}>
      <LiveSprite moveKey={`player:${player.id}`} transform={transforms[`player:${player.id}`]}>
        <g data-player="true">
          {kit
            ? <PlayerKit x={0} y={0} num={player.num} family={player.family} selected={false} isDragging={false} isTarget={false} isOutOfPos={false} />
            : <PlayerChip x={0} y={0} num={player.num} selected={false} isDragging={false} isTarget={false} isOutOfPos={false} />}
        </g>
      </LiveSprite>
      <LiveSprite moveKey={`badge:${player.id}`} transform={transforms[`badge:${player.id}`]}>
        <g data-role-badge="true"><RoleBadge x={0} y={kit ? KIT_BADGE_OFFSET : 22} label={player.label} /></g>
      </LiveSprite>
    </Fragment>)}
  </>;
}

/**
 * Innholdet i SVG-en til 2D-videoen (viewBox = utsnittet settes av den som
 * tegner). Videobildet har ikke utsnittets form, så banen klippes her, i en
 * gruppe som står stille; hvert bilde tegnes uansett på nytt fra React.
 */
export function DrillPitch({ crop, ...props }: Props) {
  return (
    <>
      <defs><clipPath id="drill-animation-crop"><rect x={crop.x} y={crop.y} width={crop.width} height={crop.height} /></clipPath></defs>
      <g clipPath="url(#drill-animation-crop)">
        <DrillBackground drawings={props.drawings} />
        <DrillFigures {...props} />
      </g>
    </>
  );
}

/** Det som flytter seg: utstyr, ball, ballspor, tekster og spillere. */
export function DrillFigures({ animation, frame, drawings, kitScale, playerStyle }: Omit<Props, 'crop'>) {
  const labels = labelsOf(drawings);
  const { transforms, trail } = placementOf(frame, labels, kitScale);
  const move = (key: string) => ({ 'data-move': key, transform: transforms[key] });
  const line = (segment: Segment | null | undefined) => segment ?? { display: 'none' };
  const stroke = { stroke: 'rgb(var(--k-ink))' };
  const kit = playerStyle === 'kit';
  return (
    <>
      {frame.items.map(item => (
        <g key={item.id} data-item="true" {...move(`item:${item.id}`)}>
          <g><BoardItemShape type={item.type} /></g>
        </g>
      ))}
      <g data-ball="true" {...move('ball')}>
        {/* Skygge: en forskjøvet, gjennomsiktig sirkel, ikke et filter – filtre gjør avspillingen tung. */}
        <circle cx={0} cy={1.2} r={11} fill="#000" opacity={0.2} />
        <circle cx={0} cy={0} r={10} style={{ fill: 'rgb(var(--k-ink))' }} />
        <circle cx={0} cy={0} r={4} style={{ fill: 'rgb(var(--k-pitch))' }} />
      </g>
      <g data-move="trail" {...(trail ? { 'data-ball-trail': 'true' } : { display: 'none' })}
        style={{ pointerEvents: 'none' }} strokeLinecap="round">
        <line {...line(trail?.travelled)} strokeWidth={2.5 * kitScale} opacity={0.22} style={stroke} />
        <line {...line(trail?.remaining)} strokeWidth={2 * kitScale}
          strokeDasharray={`${6 * kitScale} ${6 * kitScale}`} opacity={0.5} style={stroke} />
      </g>
      {labels.map(label => (
        <g key={label.id} {...move(`label:${label.id}`)}><DrawingCanvas drawing={label} /></g>
      ))}
      {stagePlayersOf(animation, frame.players).map(player => (
        <Fragment key={player.id}>
          <g data-player="true" {...move(`player:${player.id}`)}>
            {kit
              ? <PlayerKit x={0} y={0} num={player.num} family={player.family} selected={false} isDragging={false} isTarget={false} isOutOfPos={false} />
              : <PlayerChip x={0} y={0} num={player.num} selected={false} isDragging={false} isTarget={false} isOutOfPos={false} />}
          </g>
          <g data-role-badge="true" {...move(`badge:${player.id}`)}><RoleBadge x={0} y={kit ? KIT_BADGE_OFFSET : 22} label={player.label} /></g>
        </Fragment>
      ))}
    </>
  );
}
