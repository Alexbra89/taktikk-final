import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { VW, VH } from '@/data/formations';
import { ALL_DRILL_ANIMATIONS } from '@/data/drillAnimations';
import { CameraRig } from '@/components/board/three/cameraRig';
import { boardToWorld, figureScale } from '@/components/board/three/coordinates';
import { drillFraming, fitCrop, KIT_ROOM, MIN_KIT_SCALE } from './framing';
import { PHASE_MOVE_MS, PHASE_PAUSE_MS, playbackMs, playheadAt } from './playback';

/** Flatene 2D-banen får i vinduene brukeren testet (omtrent: vinduet minus topp og tekst). */
const AREAS = [
  { name: '1890×960', width: 1890, height: 760 },
  { name: '1920×700 (tekst ved siden av)', width: 1500, height: 640 },
  { name: '1920×700 (tekst under)', width: 1920, height: 470 },
  { name: '1440×900', width: 1440, height: 700 },
  { name: '390×844', width: 390, height: 560 },
  { name: '844×390', width: 560, height: 330 },
  { name: 'fullskjerm 1920×1080', width: 1920, height: 880 },
];

describe('fast utsnitt og tempo for øvelser', () => {
  it.each(ALL_DRILL_ANIMATIONS)('$drillId inkluderer alle faser og holder hele øvelsen under 12 sekunder', animation => {
    const { bounds, length, width, content } = drillFraming(animation);
    expect(length).toBeGreaterThanOrEqual(15);
    expect(width).toBeGreaterThanOrEqual(10);
    for (const phase of animation.phases) {
      for (const point of [...phase.players.map(p => p.position), phase.ball, ...(phase.items ?? []).map(i => i.position)]) {
        const world = boardToWorld(point, animation.sport);
        expect(world.x).toBeGreaterThan(bounds.minX);
        expect(world.x).toBeLessThan(bounds.maxX);
        expect(world.z).toBeGreaterThan(bounds.minZ);
        expect(world.z).toBeLessThan(bounds.maxZ);
        expect(point.x).toBeGreaterThanOrEqual(content.x);
        expect(point.x).toBeLessThanOrEqual(content.x + content.width);
        expect(point.y).toBeGreaterThanOrEqual(content.y);
        expect(point.y).toBeLessThanOrEqual(content.y + content.height);
      }
    }
    const duration = playbackMs(0, animation.phases.length);
    expect(duration).toBe((animation.phases.length - 1) * PHASE_MOVE_MS + animation.phases.length * PHASE_PAUSE_MS);
    expect(duration).toBeLessThan(12_000);
  });

  it('beveger seg ca. 1,2–1,5 s per fase og holder ca. 0,4 s pause', () => {
    expect(PHASE_MOVE_MS).toBeGreaterThanOrEqual(1200);
    expect(PHASE_MOVE_MS).toBeLessThanOrEqual(1500);
    expect(PHASE_PAUSE_MS).toBe(400);
  });

  it('klokka: pause, bevegelse og ny tekst når fasen starter; farten gjelder begge', () => {
    expect(playheadAt(0, 3, 0)).toMatchObject({ from: 0, moving: false, shown: 0 });
    expect(playheadAt(0, 3, 399)).toMatchObject({ from: 0, moving: false, shown: 0 });
    // Teksten byttes i det bevegelsen mot fase 2 starter.
    expect(playheadAt(0, 3, 401)).toMatchObject({ from: 0, moving: true, shown: 1 });
    expect(playheadAt(0, 3, 400 + PHASE_MOVE_MS / 2).t).toBeCloseTo(0.5);
    expect(playheadAt(0, 3, 400 + PHASE_MOVE_MS + 100)).toMatchObject({ from: 1, moving: false, shown: 1 });
    expect(playheadAt(0, 3, playbackMs(0, 3) - 1)).toMatchObject({ from: 2, done: false });
    expect(playheadAt(0, 3, playbackMs(0, 3))).toMatchObject({ from: 2, done: true });
    // Dobbel fart: både pausen og bevegelsen halveres.
    expect(playheadAt(0, 3, 201, 2)).toMatchObject({ moving: true, shown: 1 });
    expect(playheadAt(0, 3, 200 + PHASE_MOVE_MS / 4, 2).t).toBeCloseTo(0.5);
    expect(playbackMs(0, 3, 2)).toBe(playbackMs(0, 3) / 2);
    // Start midt i: fra fasen som vises.
    expect(playheadAt(1, 3, 401)).toMatchObject({ from: 1, moving: true, shown: 2 });
  });

  for (const area of AREAS) {
    it(`2D får plass i både bredde og høyde, og draktene vokser ikke med zoomen (${area.name})`, () => {
      const fullBoard = Math.min(area.width / VW, area.height / VH);
      for (const animation of ALL_DRILL_ANIMATIONS) {
        const { content } = drillFraming(animation);
        const { crop, scale, kitScale } = fitCrop(content, area.width, area.height);
        // Contain: utsnittet får plass i begge retninger, og én av dem er fylt.
        expect(crop.width * scale).toBeLessThanOrEqual(area.width + 1e-6);
        expect(crop.height * scale).toBeLessThanOrEqual(area.height + 1e-6);
        expect(Math.max(crop.width * scale / area.width, crop.height * scale / area.height)).toBeCloseTo(1);
        // Hele innholdet pluss plass til draktene (ved den størrelsen de tegnes i).
        expect(crop.x).toBeCloseTo(content.x - KIT_ROOM.side * kitScale);
        expect(crop.y).toBeCloseTo(content.y - KIT_ROOM.top * kitScale);
        expect(crop.x + crop.width).toBeCloseTo(content.x + content.width + KIT_ROOM.side * kitScale);
        expect(crop.y + crop.height).toBeCloseTo(content.y + content.height + KIT_ROOM.bottom * kitScale);
        // Draktens skjermstørrelse: som når hele banen vises, men aldri under mobilstørrelsen.
        const kitOnScreen = scale * kitScale;
        expect(kitScale).toBeLessThanOrEqual(1);
        expect(kitOnScreen).toBeLessThanOrEqual(Math.max(fullBoard, MIN_KIT_SCALE) + 1e-9);
        if (kitScale < 1) expect(kitOnScreen).toBeCloseTo(Math.max(fullBoard, MIN_KIT_SCALE));
      }
    });
  }

  it('på PC blir draktene ikke større enn på taktikkbrettet', () => {
    const animation = ALL_DRILL_ANIMATIONS.find(a => a.drillId === 'cardio-y-02')!;
    const { scale, kitScale } = fitCrop(drillFraming(animation).content, 1890, 760);
    expect(scale).toBeGreaterThan(2);
    expect(scale * kitScale).toBeCloseTo(Math.min(1890 / VW, 760 / VH));
  });

  for (const aspect of [1400 / 600, 390 / 380, 844 / 220, 390 / 844, 1400 / 900, 1890 / 600, 1920 / 360, 1500 / 520, 1440 / 560]) {
    for (const view of ['overview', 'top'] as const) {
      it(`3D ${view} dekker utsnittet og figurhøyden ved skjermforhold ${aspect}`, () => {
        for (const animation of ALL_DRILL_ANIMATIONS) {
          const { bounds } = drillFraming(animation);
          const camera = new THREE.PerspectiveCamera(44, aspect, .5, 450);
          const target = new THREE.Vector3();
          const controls = { target, update: () => { camera.lookAt(target); camera.updateMatrixWorld(); } } as OrbitControls;
          const frame = { cameraBounds: bounds, players: [], ball: { x: 0, y: 0 }, items: [], drawings: [] };
          const rig = new CameraRig(animation.sport, camera, controls, new THREE.Mesh(), new Map(), figureScale(animation.sport), false, new THREE.Vector3(), frame);
          rig.selectCamera(view);
          rig.updateCamera(0, true);
          const position = camera.position.clone();
          for (const x of [bounds.minX, bounds.maxX]) for (const z of [bounds.minZ, bounds.maxZ]) {
            for (const y of [0, 3.5 * figureScale(animation.sport)]) {
              const projected = new THREE.Vector3(x, y, z).project(camera);
              expect(Math.abs(projected.x)).toBeLessThan(1);
              expect(Math.abs(projected.y)).toBeLessThan(1);
            }
          }
          // A different phase changes neither the crop nor the camera position.
          rig.frame = { ...frame, ball: animation.phases.at(-1)!.ball };
          rig.updateCamera(1);
          expect(camera.position.distanceTo(position)).toBeLessThan(1e-10);
        }
      });
    }
  }
});
