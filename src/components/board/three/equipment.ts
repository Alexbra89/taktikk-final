/** Builds cones, additional players, balls, mini goals and training equipment. */
import * as THREE from 'three';
import type { BoardItem } from '@/types';
import { themeColor } from './textures';
import type { ResourcePool } from './resourcePool';
import type { Figures } from './figures';
import type { PitchBuilder } from './pitchBuilder';

export function equipmentGroup(
  item: BoardItem,
  pool: ResourcePool,
  figures: Figures,
  pitch: PitchBuilder,
  chipKit: { fill: string; fg: string },
  figureSize: number,
) {
  const g = new THREE.Group();
  const ink = themeColor('--k-ink', '#eeeeee');
  switch (item.type) {
    case 'cone': {
      const cone = new THREE.Mesh(pool.geo('cone', () => new THREE.ConeGeometry(.19, .42, 20)), pool.mat('#F97316'));
      cone.position.y = .24; cone.castShadow = true; g.add(cone); pool.box(g, 0, .025, 0, .46, .05, .46, '#F97316');
      for (const y of [.15, .29]) {
        // Follows the cone's slope (±.0125 over the band), a few mm proud of it so it never z-fights.
        const radius = .19 * (1 - (y - .03) / .42) + .005;
        const band = new THREE.Mesh(pool.geo(`cone-band-${y}`, () => new THREE.CylinderGeometry(radius - .0125, radius + .0125, .055, 20, 1, true)), pool.mat('#ffffff'));
        band.position.y = y; g.add(band);
      }
      break;
    }
    case 'opponent': case 'player': {
      const figure = figures.figure(item.type === 'opponent' ? themeColor('--k-opponent', '#cbd5e1') : chipKit.fill, '', '');
      // Same enlarged TV scale as the numbered players, so opponents never look like children;
      // unlike them, they keep the rotation set in 2D.
      g.add(figure.group); g.userData.figure = figure; break;
    }
    case 'ball': g.add(figures.makeBall()); break;
    case 'minigoal': {
      const goal = pitch.goal(3, 1.5, 1, ink); goal.scale.setScalar(figureSize); g.add(goal); break;
    }
    case 'mannequin':
      pool.box(g, 0, .05, 0, .65, .1, .5, '#45334e');
      for (const x of [-.19, .19]) pool.box(g, x, .45, 0, .06, .8, .06, '#A855F7');
      pool.box(g, 0, 1.05, 0, .52, .78, .10, '#A855F7'); pool.sphere(g, 0, 1.64, 0, .18, '#A855F7');
      for (const x of [-.13, 0, .13]) pool.box(g, x, 1.08, .056, .018, .60, .015, '#d6b5fa'); break;
    case 'ladder':
      for (const z of [-.25, .25]) pool.box(g, 0, .018, z, 4, .025, .035, '#FACC15');
      for (let x = -2; x <= 2; x += .5) pool.box(g, x, .022, 0, .045, .03, .5, '#FACC15'); break;
    case 'hurdle':
      pool.box(g, 0, .45, 0, 1.2, .065, .065, ink);
      for (const x of [-.57, .57]) { pool.box(g, x, .225, 0, .055, .45, .055, ink); pool.box(g, x, .03, 0, .06, .06, .5, ink); } break;
  }
  // Same enlarged TV scale as the figures, so a cone or dummy keeps its real size next to a player.
  // Scaled from the ground point, so it still stands on the grass. The ball keeps BALL_RADIUS like the match ball.
  if (['cone', 'mannequin', 'ladder', 'hurdle'].includes(item.type)) g.scale.setScalar(figureSize);
  return g;
}
