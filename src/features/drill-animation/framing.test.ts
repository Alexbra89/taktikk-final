import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ALL_DRILL_ANIMATIONS } from '@/data/drillAnimations';
import { CameraRig } from '@/components/board/three/cameraRig';
import { boardToWorld, figureScale } from '@/components/board/three/coordinates';
import { drillFraming } from './framing';
import { phasePauseMs, PHASE_MOVE_MS } from './playback';

describe('fast utsnitt og tempo for øvelser', () => {
  it.each(ALL_DRILL_ANIMATIONS)('$drillId inkluderer alle faser og holder hele øvelsen under 12 sekunder', animation => {
    const { bounds, length, width } = drillFraming(animation);
    expect(length).toBeGreaterThanOrEqual(15);
    expect(width).toBeGreaterThanOrEqual(10);
    for (const phase of animation.phases) {
      for (const point of [...phase.players.map(p => p.position), phase.ball, ...(phase.items ?? []).map(i => i.position)]) {
        const world = boardToWorld(point, animation.sport);
        expect(world.x).toBeGreaterThan(bounds.minX);
        expect(world.x).toBeLessThan(bounds.maxX);
        expect(world.z).toBeGreaterThan(bounds.minZ);
        expect(world.z).toBeLessThan(bounds.maxZ);
      }
    }
    const duration = (animation.phases.length - 1) * PHASE_MOVE_MS
      + animation.phases.reduce((sum, phase) => sum + phasePauseMs(phase.text), 0);
    expect(duration).toBeLessThan(12_000);
    expect(duration).toBeGreaterThan(6000);
  });

  it('gir lengre tekst litt mer tid, uten lang stillstand', () => {
    expect(phasePauseMs('Kort tekst')).toBe(650);
    expect(phasePauseMs('a'.repeat(100))).toBe(825);
    expect(phasePauseMs('a'.repeat(500))).toBe(850);
  });

  for (const aspect of [1400 / 600, 390 / 380, 844 / 220, 390 / 844, 1400 / 900]) {
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
