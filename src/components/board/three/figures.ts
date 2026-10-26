/** Creates, animates and releases player figures and builds the match ball. */
import * as THREE from 'three';
import type { FigurePose } from '../BoardStage';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { textTexture } from './textures';
import { clonePlayer, kitMaterial } from './assets';
import type { ResourcePool } from './resourcePool';

/** Slightly larger than a real ball (0.11 m), so it reads in the overview. */
export const BALL_RADIUS = .26;

export interface Figure {
  group: THREE.Group;
  limbs: THREE.Group[];
  /** Where the frame says the player is; the group glides there in render(). */
  target: THREE.Vector3;
  heading: number;
  stride: number;
  motion: number;
  signature: string;
  mixer?: THREE.AnimationMixer;
  actions?: THREE.AnimationAction[];
  /** Shared jog/sprint stride phase, 0–1. */
  cycle: number;
  /** Eased weight of running against standing. */
  running: number;
  speed: number;
  resources: (THREE.Material | THREE.Texture)[];
  displaced?: THREE.Mesh;
  /** Animated drills only: a keeper diving (borrowed from the frame, read every render). */
  pose?: FigurePose;
}

export class Figures {
  playerAsset?: GLTF;
  /** Where in Sprint_Loop the stride matches the start of Jog_Fwd_Loop. */
  sprintPhase = 0;
  private kitMaterials = new Map<string, THREE.MeshStandardMaterial>();
  /** Contact shadow under figures where real shadows are off (mobile). */
  figureBlob: THREE.MeshBasicMaterial | null = null;

  constructor(
    private readonly scene: THREE.Scene,
    private readonly figureSize: number,
    private readonly pool: ResourcePool,
    private readonly reducedMotion: boolean,
    private readonly exportMode: boolean,
  ) {}

  releaseFigure(f: Figure) {
    f.mixer?.stopAllAction(); f.mixer?.uncacheRoot(f.mixer.getRoot());
    f.group.traverse(object => { if (object instanceof THREE.SkinnedMesh) object.skeleton.dispose(); });
    f.resources.forEach(resource => resource.dispose()); this.scene.remove(f.group);
  }

  makeBall() {
    const ball = new THREE.Mesh(this.pool.geo('ball', () => new THREE.IcosahedronGeometry(BALL_RADIUS, 1)), [this.pool.mat('#f7f7eb'), this.pool.mat('#192126')]);
    const geo = ball.geometry;
    if (!geo.groups.length) for (let i = 0; i < geo.attributes.position.count; i += 3) geo.addGroup(i, 3, (i / 3) % 5 === 0 ? 1 : 0);
    ball.position.y = BALL_RADIUS; ball.castShadow = true; return ball;
  }

  figure(color: string, number: string, name: string, foreground = '#ffffff', role = ''): Figure {
    const group = new THREE.Group();
    const limbs: THREE.Group[] = [];
    const resources: Figure['resources'] = [];
    let mixer: THREE.AnimationMixer | undefined, actions: THREE.AnimationAction[] | undefined;
    let spine: THREE.Object3D | undefined;
    if (this.playerAsset) {
      if (!this.kitMaterials.has(color)) {
        const material = kitMaterial(color); this.kitMaterials.set(color, material); this.pool.ownedMaterials.add(material);
      }
      const model = clonePlayer(this.playerAsset, this.kitMaterials.get(color)!);
      const bounds = new THREE.Box3().setFromObject(model);
      model.scale.setScalar(2 / Math.max(.1, bounds.max.y - bounds.min.y));
      model.position.y = -bounds.min.y * model.scale.x;
      group.add(model);
      spine = model.getObjectByName('spine_03') ?? model.getObjectByName('spine_02');
      mixer = new THREE.AnimationMixer(model);
      actions = ['Idle_Loop', 'Jog_Fwd_Loop', 'Sprint_Loop'].flatMap(name => {
        const clip = this.playerAsset!.animations.find(c => c.name === name);
        // Jog and sprint are not clocked by the mixer; animateFigure sets their time from one stride cycle.
        return clip ? [mixer!.clipAction(clip).setEffectiveWeight(name === 'Idle_Loop' ? 1 : 0).setEffectiveTimeScale(name === 'Idle_Loop' ? 1 : 0).play()] : [];
      });
      mixer.update(0);
    } else {
    this.pool.box(group, 0, 1.17, 0, .6, .66, .34, color);
    this.pool.box(group, 0, .79, 0, .56, .25, .32, '#19232e');
    this.pool.sphere(group, 0, 1.77, 0, .23, '#d3a17e');
    this.pool.sphere(group, 0, 1.88, -.025, .20, '#302b29');
    for (const side of [-1, 1]) {
      const leg = new THREE.Group(); leg.position.set(side * .17, .7, 0);
      this.pool.box(leg, 0, -.27, 0, .18, .54, .19, color);
      this.pool.box(leg, 0, -.62, .07, .2, .16, .34, '#121b23');
      group.add(leg); limbs.push(leg);
      const arm = new THREE.Group(); arm.position.set(side * .4, 1.43, 0);
      this.pool.box(arm, 0, -.12, 0, .2, .28, .24, color);
      this.pool.box(arm, 0, -.36, 0, .14, .27, .16, '#d3a17e');
      group.add(arm); limbs.push(arm);
    }
    }
    if (this.figureBlob) {
      const blob = new THREE.Mesh(this.pool.geo('blob', () => new THREE.CircleGeometry(.3, 20)), this.figureBlob);
      blob.rotation.x = -Math.PI / 2; blob.position.y = .02; blob.scale.setScalar(1.5); group.add(blob);
    }
    if (number) {
      const tex = textTexture(number, foreground, color); resources.push(tex);
      const mat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }); resources.push(mat);
      for (const side of [-1, 1]) {
        const label = new THREE.Mesh(this.pool.geo('number', () => new THREE.PlaneGeometry(.4, .4)), mat);
        label.position.set(0, 1.36, side * (this.playerAsset ? .235 : .176)); label.rotation.y = side < 0 ? Math.PI : 0; group.add(label);
        if (spine) { group.updateMatrixWorld(true); spine.attach(label); }
      }
      const title = `${number}${role ? ` · ${role.toUpperCase()}` : ''}`;
      const tag = textTexture(title, '#ffffff'); resources.push(tag);
      const tagMat = new THREE.SpriteMaterial({ map: tag, depthTest: true, depthWrite: false, toneMapped: false }); resources.push(tagMat);
      // Just above the head (the model is 2 tall), so the tag reads as part of the player, not floating over it.
      const sprite = new THREE.Sprite(tagMat); sprite.position.y = 2.4; group.add(sprite);
      // textTexture is 4:1 with a role and square for a bare number; keep glyphs undistorted.
      sprite.scale.set(role ? 3 : .75, .75, 1);
      if (name) {
        const texture = textTexture(name, '#ffffff'); resources.push(texture);
        const material = new THREE.SpriteMaterial({ map: texture, depthWrite: false, toneMapped: false }); resources.push(material);
        const label = new THREE.Sprite(material); label.position.y = 3.1; label.scale.set(4, 1, 1); group.add(label);
      }
    }
    const displacedMaterial = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .55, toneMapped: false });
    resources.push(displacedMaterial);
    const displaced = new THREE.Mesh(this.pool.geo('out-of-position', () => new THREE.PlaneGeometry(.65, .055)), displacedMaterial);
    displaced.rotation.x = -Math.PI / 2; displaced.position.set(0, .03, .55); displaced.visible = false; group.add(displaced);
    // Enlarged TV figures remain legible on phones and in the overview.
    group.scale.setScalar(this.figureSize);
    return { group, limbs, mixer, actions, resources, displaced, cycle: 0, running: 0, speed: 0, target: new THREE.Vector3(), heading: Math.PI / 2, stride: 0, motion: 0, signature: '' };
  }

  animateFigure(f: Figure, dt: number, speed: number) {
    if (!f.mixer || !f.actions?.length) return;
    // Figures are drawn figureSize× life size; their stride is too, so cadence follows body lengths, not metres.
    const pace = speed / this.figureSize;
    // Eased over about a quarter second, so starting and stopping blend softly into and out of Idle.
    f.running += (THREE.MathUtils.smoothstep(pace, .08, .4) - f.running) * (1 - Math.exp(-dt * 8));
    const sprint = THREE.MathUtils.smoothstep(pace, 3, 5.5);
    const [idle, jog, run] = f.actions;
    idle.setEffectiveWeight(1 - f.running); jog.setEffectiveWeight(f.running * (1 - sprint)); run.setEffectiveWeight(f.running * sprint);
    // Jog and sprint share one stride cycle, aligned on the same foot: blending
    // two loops out of step averages a left stride into a right one, and the
    // legs go stiff and slide. Cadence is as before: natural speed at pace 3 / 6.
    const jogTime = jog.getClip().duration, runTime = run.getClip().duration;
    const rate = THREE.MathUtils.lerp(THREE.MathUtils.clamp(pace / 3, .3, 3) / jogTime, THREE.MathUtils.clamp(pace / 6, .3, 3) / runTime, sprint);
    // The stride always follows the figure's own movement: with reduced motion,
    // frozen legs on a gliding body read as sliding. Only the idle sway rests,
    // and never in an export, which is watched elsewhere.
    f.cycle = (f.cycle + rate * dt) % 1;
    jog.time = f.cycle * jogTime; run.time = (f.cycle + this.sprintPhase) % 1 * runTime;
    f.mixer.update(this.reducedMotion && !this.exportMode ? 0 : dt);
  }
}
