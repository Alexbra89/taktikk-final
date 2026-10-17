/** Keeps camera selection, zoom, following, stadium bounds and pitch framing together. */
import * as THREE from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Sport } from '@/types';
import type { SceneFrame } from './BoardScene';
import type { Figure } from './figures';
import { PITCHES } from './coordinates';

export type CameraView = 'overview' | 'top' | 'ball' | 'player';
export interface CameraState {
  view: CameraView;
  playerId: string;
  position: number[];
  target: number[];
  manual: boolean;
  zoom: number;
  /** The followed ground point, so a manual follow angle survives into the export. */
  anchor: number[] | null;
}
/** The camera exactly as drawn, so a fullscreen recording can replay the live view. */
export interface CameraPose { position: number[]; quaternion: number[]; projection: number[] }

export class CameraRig {
  view: CameraView = 'overview';
  playerId = '';
  manual = false;
  private zoomFactor = 1;
  private desiredPosition = new THREE.Vector3();
  private desiredTarget = new THREE.Vector3();
  private fromOffset = new THREE.Spherical();
  private toOffset = new THREE.Spherical();
  private stadiumShift = new THREE.Vector3();
  /** Ground point the camera follows in Følg ballen / Spillerperspektiv, also after manual orbiting. */
  private anchor = new THREE.Vector3();
  private lastAnchor = new THREE.Vector3();
  private anchorKnown = false;

  constructor(
    private readonly sport: Sport,
    private readonly camera: THREE.PerspectiveCamera,
    private readonly controls: OrbitControls,
    private readonly ball: THREE.Mesh,
    private readonly figures: Map<string, Figure>,
    private readonly figureSize: number,
    private readonly reducedMotion: boolean,
    private readonly offset: THREE.Vector3,
    public frame: SceneFrame,
  ) {}

  selectCamera(view: CameraView, playerId = this.playerId) { this.view = view; this.playerId = playerId; this.manual = false; this.zoomFactor = 1; this.anchorKnown = false; }
  zoom(factor: number) {
    if (this.manual) this.camera.position.sub(this.controls.target).multiplyScalar(factor).add(this.controls.target);
    // Spillerperspektiv starts in the player's eyes; it can only step back over the shoulder.
    else this.zoomFactor = THREE.MathUtils.clamp(this.zoomFactor * factor, this.view === 'player' ? 1 : .3, 2.2);
  }
  cameraState(): CameraState {
    return {
      view: this.view, playerId: this.playerId, position: this.camera.position.toArray(), target: this.controls.target.toArray(),
      manual: this.manual, zoom: this.zoomFactor, anchor: this.anchorKnown ? this.anchor.toArray() : null,
    };
  }
  cameraPose(): CameraPose {
    return { position: this.camera.position.toArray(), quaternion: this.camera.quaternion.toArray(), projection: this.camera.projectionMatrix.toArray() };
  }
  restoreCamera(state: CameraState) {
    this.view = state.view; this.playerId = state.playerId; this.manual = state.manual; this.zoomFactor = state.zoom;
    this.camera.position.fromArray(state.position); this.controls.target.fromArray(state.target); this.controls.update();
    // A manual follow angle is kept relative to the ball/player: the first
    // render moves the camera from the live anchor to the restored one.
    this.anchorKnown = state.anchor !== null;
    if (state.anchor) this.lastAnchor.fromArray(state.anchor);
  }
  /** The ground point Følg ballen and Spillerperspektiv track. */
  private followPoint(out: THREE.Vector3) {
    if (this.view === 'ball') { out.set(this.ball.position.x, 0, this.ball.position.z); return true; }
    const f = this.view === 'player' ? this.povFigure() : undefined;
    if (f) { out.copy(f.group.position); return true; }
    return false;
  }
  updateCamera(dt: number, snap = false) {
    const hasAnchor = this.followPoint(this.anchor);
    // How far the followed ball/player moved since the last frame.
    const moved = hasAnchor && this.anchorKnown;
    this.offset.subVectors(this.anchor, this.lastAnchor);
    this.lastAnchor.copy(this.anchor); this.anchorKnown = hasAnchor;
    if (this.manual) {
      // After dragging or wheel-zooming, the user's angle is kept, but the camera still follows.
      if (moved) { this.camera.position.add(this.offset); this.controls.target.add(this.offset); }
      this.controls.update(); this.keepInStadium(); return;
    }
    const p = PITCHES[this.sport]; const target = this.desiredTarget; const position = this.desiredPosition;
    target.set(0, 0, 0);
    if (this.view === 'top') {
      const direction = new THREE.Vector3(0, 1, .0001).normalize();
      position.copy(direction).multiplyScalar(this.pitchFitDistance(direction) * this.zoomFactor);
    }
    else if (this.view === 'ball') {
      target.copy(this.anchor); position.copy(target).add(new THREE.Vector3(0, 17 * this.zoomFactor, 24 * this.zoomFactor));
    } else if (this.view === 'player' && hasAnchor) {
      const f = this.povFigure()!;
      const direction = new THREE.Vector3(Math.sin(f.heading), 0, Math.cos(f.heading));
      // Zooming out steps back over the shoulder; fully in is the player's own eyes.
      const back = Math.max(0, this.zoomFactor - 1) * 7 * this.figureSize;
      position.copy(f.group.position).add(new THREE.Vector3(0, 1.8 * this.figureSize + back * .35, 0)).addScaledVector(direction, .2 * this.figureSize - back);
      target.copy(f.group.position).addScaledVector(direction, 15); target.y = 1.6;
    } else {
      const direction = new THREE.Vector3(p.length * .08, p.length * .55, p.width * 1.08).normalize();
      position.copy(direction).multiplyScalar(this.pitchFitDistance(direction) * this.zoomFactor);
    }
    const alpha = snap || this.reducedMotion ? 1 : 1 - Math.exp(-dt * 6);
    // Ease the camera's offset from its target in spherical coordinates: a
    // crane-like swing that never spins around the pole on the way to Ovenfra.
    this.fromOffset.setFromVector3(this.offset.copy(this.camera.position).sub(this.controls.target));
    this.toOffset.setFromVector3(this.offset.copy(position).sub(target));
    const turn = Math.atan2(Math.sin(this.toOffset.theta - this.fromOffset.theta), Math.cos(this.toOffset.theta - this.fromOffset.theta));
    this.fromOffset.set(
      THREE.MathUtils.lerp(this.fromOffset.radius, this.toOffset.radius, alpha),
      THREE.MathUtils.lerp(this.fromOffset.phi, this.toOffset.phi, alpha),
      this.fromOffset.theta + turn * alpha,
    );
    this.controls.target.lerp(target, alpha);
    this.camera.position.setFromSpherical(this.fromOffset).add(this.controls.target);
    this.controls.update();
  }
  /** Panning may roam the whole pitch and its surrounds, but the look-at point stays inside the stands. */
  private keepInStadium() {
    const p = PITCHES[this.sport], target = this.controls.target;
    const x = THREE.MathUtils.clamp(target.x, -p.length / 2 - 10, p.length / 2 + 10);
    const z = THREE.MathUtils.clamp(target.z, -p.width / 2 - 10, p.width / 2 + 10);
    if (x === target.x && z === target.z) return;
    const shift = this.stadiumShift.set(x - target.x, 0, z - target.z);
    target.add(shift); this.camera.position.add(shift);
  }
  povFigure() {
    return this.figures.get(this.playerId) ?? this.figures.get(this.frame.players.find(p => p.num === 1)?.id ?? '') ?? this.figures.values().next().value;
  }
  /** Fit every pitch corner including runoff, at any container aspect ratio. */
  private pitchFitDistance(direction: THREE.Vector3) {
    const p = PITCHES[this.sport];
    const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), direction).normalize();
    const up = new THREE.Vector3().crossVectors(direction, right).normalize();
    const tan = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    let distance = 0;
    for (const x of [-p.length / 2 - 5, p.length / 2 + 5]) {
      for (const z of [-p.width / 2 - 5, p.width / 2 + 5]) {
        const corner = new THREE.Vector3(x, 0, z);
        distance = Math.max(distance, Math.abs(corner.dot(right)) / (tan * this.camera.aspect) + corner.dot(direction), Math.abs(corner.dot(up)) / tan + corner.dot(direction));
      }
    }
    return distance * 1.04;
  }
}
