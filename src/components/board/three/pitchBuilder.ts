/** Builds the turf, pitch markings, goals and stadium surrounds. */
import * as THREE from 'three';
import type { Sport } from '@/types';
import { PITCHES, GOAL_DEPTH } from './coordinates';
import { grassTexture } from './textures';
import type { ResourcePool } from './resourcePool';

export class PitchBuilder {
  constructor(
    private readonly sport: Sport,
    private readonly scene: THREE.Scene,
    private readonly renderer: THREE.WebGLRenderer,
    private readonly figureSize: number,
    private readonly pool: ResourcePool,
  ) {}

  buildPitch() {
    const p = PITCHES[this.sport];
    // A frame around the turf, rather than a second floor 3 cm underneath it.
    // The overlapping floor could bleed through at grazing angles on mobile
    // (z-fighting). Removing the overlap fixes this without reducing detail.
    for (const side of [-1, 1]) {
      this.pool.box(this.scene, side * (p.length / 2 + 9.5), -0.28, 0, 9, 0.5, p.width + 24, '#21452e').castShadow = false;
      this.pool.box(this.scene, 0, -0.28, side * (p.width / 2 + 8.5), p.length + 10, 0.5, 7, '#21452e').castShadow = false;
    }
    const grass = grassTexture(); grass.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy()); this.pool.textures.add(grass);
    const turf = new THREE.MeshStandardMaterial({ map: grass, roughness: .98, bumpMap: grass, bumpScale: .065 });
    // GLSL needs float literals: 60 / 2 must be written as 30.0, not 30.
    const float = (n: number) => Number.isInteger(n) ? n.toFixed(1) : String(n);
    turf.onBeforeCompile = shader => {
      shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 turfPosition;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nturfPosition = position;');
      shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 turfPosition;')
        .replace('#include <color_fragment>', `#include <color_fragment>
          float stripe = mod(floor((turfPosition.x + ${float(p.length / 2)}) / ${float(p.length / 18)}), 2.0);
          float variation = sin(turfPosition.x * .71 + sin(turfPosition.y * .34)) * sin(turfPosition.y * .83) * .035;
          diffuseColor.rgb *= vec3(.65, .92, .59) * (.90 + stripe * .12 + variation);`);
    };
    this.pool.ownedMaterials.add(turf);
    const grassPlane = new THREE.Mesh(this.pool.geo('turf', () => new THREE.PlaneGeometry(p.length + 10, p.width + 10)), turf);
    grassPlane.rotation.x = -Math.PI / 2; grassPlane.receiveShadow = true; this.scene.add(grassPlane);
    // Pitch markings in metres, independently of the old SVG's illustrative proportions.
    const canvas = document.createElement('canvas'); canvas.width = 2048; canvas.height = 1536;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(canvas.width / p.length, canvas.height / p.width);
    ctx.translate(p.length / 2, p.width / 2); ctx.strokeStyle = '#f4f7e8'; ctx.fillStyle = '#f4f7e8'; ctx.lineWidth = 0.13;
    const circle = (x: number, z: number, r: number, a = 0, b = Math.PI * 2) => { ctx.beginPath(); ctx.arc(x, z, r, a, b); ctx.stroke(); };
    ctx.strokeRect(-p.length / 2 + .07, -p.width / 2 + .07, p.length - .14, p.width - .14);
    ctx.beginPath(); ctx.moveTo(0, -p.width / 2); ctx.lineTo(0, p.width / 2); ctx.stroke(); circle(0, 0, p.circle);
    const spot = (x: number) => { ctx.beginPath(); ctx.arc(x, 0, .18, 0, Math.PI * 2); ctx.fill(); };
    spot(0);
    for (const sign of [-1, 1]) {
      ctx.save(); ctx.scale(sign, 1);
      const edge = -p.length / 2;
      ctx.strokeRect(edge, -p.areaWidth / 2, p.areaDepth, p.areaWidth); spot(edge + p.spot);
      if (this.sport === 'football') {
        ctx.strokeRect(edge, -9.16, 5.5, 18.32);
        const a = Math.acos((p.areaDepth - p.spot) / p.circle);
        circle(edge + p.spot, 0, p.circle, -a, a);
      }
      circle(edge, -p.width / 2, 1, 0, Math.PI / 2);
      circle(edge, p.width / 2, 1, -Math.PI / 2, 0);
      ctx.restore();
      // Enlarged with the figures, so goal and players keep their real proportions; the mouth stays on the goal line.
      const goal = this.goal(p.goal, p.goalHeight, GOAL_DEPTH);
      goal.position.x = sign * p.length / 2; goal.rotation.y = -sign * Math.PI / 2; goal.scale.setScalar(this.figureSize); this.scene.add(goal);
    }
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy()); this.pool.textures.add(texture);
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }); this.pool.ownedMaterials.add(material);
    const plane = new THREE.Mesh(this.pool.geo('pitch-plane', () => new THREE.PlaneGeometry(p.length, p.width)), material);
    plane.rotation.x = -Math.PI / 2; plane.position.y = .02; this.scene.add(plane);
    // Quiet stadium frame, clear run-off space and low stepped stands.
    for (const side of [-1, 1]) {
      for (let row = 0; row < 4; row++) {
        this.pool.box(this.scene, 0, row * .7 + .35, side * (p.width / 2 + 8 + row * 1.3), p.length + 8, .7, 1.3, row % 2 ? '#34454e' : '#263941');
      }
      this.pool.box(this.scene, side * (p.length / 2 + 7), .45, 0, .25, .9, p.width + 14, '#85918b');
      this.pool.box(this.scene, 0, .45, side * (p.width / 2 + 5), p.length + 14, .9, .18, '#85918b');
    }
  }

  /** Mouth lies on local z=0; net extends towards -z. */
  goal(width: number, height: number, depth: number, color = '#f7f8f1') {
    const g = new THREE.Group();
    for (const x of [-width / 2, width / 2]) {
      this.pool.box(g, x, height / 2, 0, .08, height, .08, color);
      this.pool.box(g, x, .04, -depth / 2, .07, .07, depth, color);
      this.pool.box(g, x, height / 2, -depth, .06, height, .06, color);
    }
    this.pool.box(g, 0, height, 0, width + .08, .08, .08, color);
    this.pool.box(g, 0, height, -depth, width, .06, .06, color);
    const pts: number[] = [];
    for (let x = -width / 2; x <= width / 2 + .01; x += .25) pts.push(x, 0, -depth, x, height, -depth, x, height, -depth, x, height, 0);
    for (let y = 0; y <= height; y += .25) {
      pts.push(-width / 2, y, -depth, width / 2, y, -depth);
      for (const x of [-width / 2, width / 2]) pts.push(x, y, -depth, x, y, 0);
    }
    for (let z = -depth; z <= 0; z += .25) {
      pts.push(-width / 2, height, z, width / 2, height, z);
      for (const x of [-width / 2, width / 2]) pts.push(x, 0, z, x, height, z);
    }
    this.pool.lines(g, pts, '#d4dfd8', .42, `goal-net/${width}/${height}/${depth}`); return g;
  }
}
