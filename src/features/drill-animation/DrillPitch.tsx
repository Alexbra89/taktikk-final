'use client';
import { memo, useEffect, useReducer } from 'react';
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
// ══════════════════════════════════════════════════════════════

const around = (p: Position, scale: number) =>
  scale === 1 ? undefined : `translate(${p.x} ${p.y}) scale(${scale}) translate(${-p.x} ${-p.y})`;

export function stagePlayersOf(animation: DrillAnimation, players: Player[]): StagePlayer[] {
  return players.map(p => ({
    id: p.id, num: p.num, position: p.position, name: '',
    label: animation.cast[p.id]?.label ?? '', family: animation.cast[p.id]?.family ?? 'mid',
  }));
}

/** Svak stiplet strek fra der ballen ble spilt til der den skal, med en luke rundt selve ballen. */
function BallTrail({ flight, ball, gap, scale }: { flight: BallFlight; ball: Position; gap: number; scale: number }) {
  const dx = flight.to.x - flight.from.x, dy = flight.to.y - flight.from.y;
  const length = Math.hypot(dx, dy);
  if (length < 1) return null;
  const ux = dx / length, uy = dy / length;
  const travelled = Math.hypot(ball.x - flight.from.x, ball.y - flight.from.y) - gap;
  const remaining = Math.hypot(flight.to.x - ball.x, flight.to.y - ball.y) - gap;
  const stroke = { stroke: 'rgb(var(--k-ink))' };
  return (
    <g data-ball-trail="true" style={{ pointerEvents: 'none' }} strokeLinecap="round">
      {travelled > 0 && <line x1={flight.from.x} y1={flight.from.y} x2={ball.x - ux * gap} y2={ball.y - uy * gap}
        strokeWidth={2.5 * scale} opacity={0.22} style={stroke} />}
      {remaining > 0 && <line x1={ball.x + ux * gap} y1={ball.y + uy * gap} x2={flight.to.x} y2={flight.to.y}
        strokeWidth={2 * scale} strokeDasharray={`${6 * scale} ${6 * scale}`} opacity={0.5} style={stroke} />}
    </g>
  );
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

/** Bare figurene abonnerer på hvert bilde. Dialogen får kun faseendringer.
 * sample bruker samme playheadAt/drillMotion som videoens frameAt. */
export function LiveDrillPitch({ head, sample, isPlaying, ...props }: Omit<Props, 'frame' | 'drawings'> & {
  head: Pick<Playhead, 'from' | 't' | 'moving'>;
  sample: () => Playhead | null;
  isPlaying: boolean;
}) {
  const [, redraw] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    if (!isPlaying) return;
    let raf = 0;
    let previous: Playhead | null = null;
    const tick = () => {
      const next = sample();
      if (next && (!previous || next.from !== previous.from || next.t !== previous.t || next.moving !== previous.moving)) redraw();
      previous = next;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, sample]);
  const at = (isPlaying && sample()) || head;
  return <DrillPitch {...props} frame={drillMotion(props.animation, at.from, at.t, at.moving, props.kitScale)}
    drawings={props.animation.phases[at.from].drawings} />;
}

/** Innholdet i SVG-en (viewBox = utsnittet settes av den som tegner). */
export function DrillPitch({ animation, frame, drawings, crop, kitScale, playerStyle }: Props) {
  const labels = drawings.filter((d): d is LabelDrawing => d.type === 'label');
  const others = drawings.filter(d => d.type !== 'label');
  return (
    <>
      <defs><clipPath id="drill-animation-crop"><rect x={crop.x} y={crop.y} width={crop.width} height={crop.height} /></clipPath></defs>
      <g clipPath="url(#drill-animation-crop)">
        <PitchBackground />
        {others.map(drawing => <DrawingCanvas key={drawing.id} drawing={drawing} />)}
        {frame.items.map(item => (
          <g key={item.id} data-item="true" transform={around(item.position, kitScale)}>
            <g transform={`translate(${item.position.x} ${item.position.y}) rotate(${item.rotation ?? 0})`}>
              <BoardItemShape type={item.type} />
            </g>
          </g>
        ))}
        <g transform={around(frame.ball, kitScale)} filter="url(#dropShadow)">
          <circle cx={frame.ball.x} cy={frame.ball.y} r={10} style={{ fill: 'rgb(var(--k-ink))' }} />
          <circle cx={frame.ball.x} cy={frame.ball.y} r={4} style={{ fill: 'rgb(var(--k-pitch))' }} />
        </g>
        {frame.flight && <BallTrail flight={frame.flight} ball={frame.ball} gap={13 * kitScale} scale={kitScale} />}
        {labels.map(label => (
          <g key={label.id} transform={anchoredLabel(label, frame.items, kitScale)}><DrawingCanvas drawing={label} /></g>
        ))}
        {stagePlayersOf(animation, frame.players).map(player => {
          const { x, y } = player.position;
          const kit = playerStyle === 'kit';
          return <g key={player.id} data-player="true" transform={around(player.position, kitScale)}>
            {kit
              ? <PlayerKit x={x} y={y} num={player.num} family={player.family} selected={false} isDragging={false} isTarget={false} isOutOfPos={false} />
              : <PlayerChip x={x} y={y} num={player.num} selected={false} isDragging={false} isTarget={false} isOutOfPos={false} />}
            <RoleBadge x={x} y={y + (kit ? KIT_BADGE_OFFSET : 22)} label={player.label} />
          </g>;
        })}
      </g>
    </>
  );
}
