import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { VW, VH } from '@/data/formations';
import type { BoardItem, Drawing, Position, Sport } from '@/types';
import type { StagePlayer } from '../BoardStage';
import type { PlayerStyle } from '@/hooks/usePlayerStyle';
import { KIT_COLORS } from '../svg/PlayerKit';
import { PITCHES, boardToWorld, boardRotation, figureScale } from './coordinates';
import { drawingTexture, textTexture, themeColor } from './textures';

export type CameraView = 'overview' | 'top' | 'ball' | 'player';
export interface SceneFrame {
  players: StagePlayer[];
  ball: Position;
  items: BoardItem[];
  drawings: Drawing[];
  /** Metres above the grass; see ballArcHeight. */
  ballHeight?: number;
}
export interface CameraState {
  view: CameraView;
  playerId: string;
  position: number[];
  target: number[];
  manual: boolean;
  zoom: number;
}
interface Figure {
  group: THREE.Group;
  limbs: THREE.Group[];
  heading: number;
  stride: number;
  motion: number;
  signature: string;
}

/** A read-only renderer. It knows nothing about the store, editing, or phase timers. */
export class BoardScene {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(44, 1, 0.08, 600);
  readonly controls: OrbitControls;
  private geometry = new Map<string, THREE.BufferGeometry>();
  private materials = new Map<string, THREE.MeshStandardMaterial>();
  private ownedMaterials = new Set<THREE.Material>();
  private textures = new Set<THREE.Texture>();
  private drawingCache = new Map<string, Promise<THREE.Texture>>();
  private figures = new Map<string, Figure>();
  private equipment = new Map<string, { type: string; group: THREE.Group }>();
  private ball: THREE.Mesh;
  /** Soft contact shadow, only where real shadows are switched off (mobile). */
  private ballBlob: THREE.Mesh | null = null;
  private readonly figureSize: number;
  private markings: THREE.Mesh;
  private currentDrawingKey = '';
  private disposed = false;
  private frame: SceneFrame = { players: [], ball: { x: VW / 2, y: VH / 2 }, items: [], drawings: [] };
  private view: CameraView = 'overview';
  private playerId = '';
  private manual = false;
  private zoomFactor = 1;
  private desiredPosition = new THREE.Vector3();
  private desiredTarget = new THREE.Vector3();
  private fromOffset = new THREE.Spherical();
  private toOffset = new THREE.Spherical();
  private offset = new THREE.Vector3();
  private ballPlaced = false;
  private reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  private onManual = () => { this.manual = true; };

  constructor(readonly sport: Sport, readonly playerStyle: PlayerStyle, mobile: boolean, exportMode = false) {
    // Offscreen export must retain the rendered pixels until VideoFrame copies them.
    this.renderer = new THREE.WebGLRenderer({ antialias: !mobile, powerPreference: 'high-performance', preserveDrawingBuffer: exportMode });
    this.renderer.setPixelRatio(mobile ? 1 : Math.min(devicePixelRatio, 1.75));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.figureSize = figureScale(sport);
    this.renderer.shadowMap.enabled = !mobile;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:none';
    this.renderer.domElement.setAttribute('aria-label', 'Taktikktavle i 3D. Dra for å rotere, rull eller klyp for å zoome.');
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.enablePan = false;
    this.controls.minDistance = 1;
    this.controls.maxDistance = 260;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.015;
    this.controls.addEventListener('start', this.onManual);
    this.scene.background = new THREE.Color('#17252c');
    this.scene.fog = new THREE.Fog('#17252c', 150, 340);
    this.scene.add(new THREE.HemisphereLight('#e4f0ff', '#324528', 2.1));
    const sun = new THREE.DirectionalLight('#fff4db', 2.6);
    sun.position.set(-35, 65, 25); sun.castShadow = !mobile;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -80, right: 80, top: 80, bottom: -80, near: 1, far: 180 });
    sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.04;
    this.scene.add(sun);
    this.buildPitch();
    this.ball = this.makeBall(); this.scene.add(this.ball);
    if (mobile) {
      const blob = new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: .32, depthWrite: false });
      this.ownedMaterials.add(blob);
      this.ballBlob = new THREE.Mesh(this.geo('blob', () => new THREE.CircleGeometry(.3, 20)), blob);
      this.ballBlob.rotation.x = -Math.PI / 2; this.ballBlob.position.y = .03; this.scene.add(this.ballBlob);
    }
    const p = PITCHES[sport];
    const mat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    this.ownedMaterials.add(mat);
    this.markings = new THREE.Mesh(this.geo('drawing-plane', () => new THREE.PlaneGeometry(p.length * VW / (VW - 64), p.width * VH / (VH - 64))), mat);
    this.markings.rotation.x = -Math.PI / 2; this.markings.position.y = 0.035; this.markings.visible = false;
    this.scene.add(this.markings);
    this.selectCamera('overview'); this.updateCamera(1, true);
  }

  private geo(key: string, make: () => THREE.BufferGeometry) {
    if (!this.geometry.has(key)) this.geometry.set(key, make());
    return this.geometry.get(key)!;
  }
  private mat(color: string) {
    if (!this.materials.has(color)) this.materials.set(color, new THREE.MeshStandardMaterial({ color, roughness: 0.86 }));
    return this.materials.get(color)!;
  }
  private box(parent: THREE.Object3D, x: number, y: number, z: number, w: number, h: number, d: number, color: string) {
    const mesh = new THREE.Mesh(this.geo('box', () => new THREE.BoxGeometry(1, 1, 1)), this.mat(color));
    mesh.position.set(x, y, z); mesh.scale.set(w, h, d); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  private sphere(parent: THREE.Object3D, x: number, y: number, z: number, radius: number, color: string) {
    const mesh = new THREE.Mesh(this.geo('sphere', () => new THREE.SphereGeometry(1, 12, 8)), this.mat(color));
    mesh.position.set(x, y, z); mesh.scale.setScalar(radius); mesh.castShadow = true; parent.add(mesh); return mesh;
  }
  private lines(parent: THREE.Object3D, points: number[], color: string, opacity = 1) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    this.geometry.set(`lines-${this.geometry.size}`, geometry);
    const material = new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity });
    this.ownedMaterials.add(material);
    parent.add(new THREE.LineSegments(geometry, material));
  }

  private buildPitch() {
    const p = PITCHES[this.sport];
    this.box(this.scene, 0, -0.28, 0, p.length + 28, 0.5, p.width + 24, '#21452e');
    for (let i = 0; i < 20; i++) {
      this.box(this.scene, -p.length / 2 + (i + 0.5) * p.length / 20, -0.015, 0, p.length / 20, 0.025, p.width, i % 2 ? '#387d48' : '#317342');
    }
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
      const goal = this.goal(p.goal, p.goalHeight, 2);
      goal.position.x = sign * p.length / 2; goal.rotation.y = -sign * Math.PI / 2; this.scene.add(goal);
    }
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy()); this.textures.add(texture);
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }); this.ownedMaterials.add(material);
    const plane = new THREE.Mesh(this.geo('pitch-plane', () => new THREE.PlaneGeometry(p.length, p.width)), material);
    plane.rotation.x = -Math.PI / 2; plane.position.y = .02; this.scene.add(plane);
    // Quiet stadium frame, clear run-off space and low stepped stands.
    for (const side of [-1, 1]) {
      for (let row = 0; row < 4; row++) {
        this.box(this.scene, 0, row * .7 + .35, side * (p.width / 2 + 8 + row * 1.3), p.length + 8, .7, 1.3, row % 2 ? '#34454e' : '#263941');
      }
      this.box(this.scene, side * (p.length / 2 + 7), .45, 0, .25, .9, p.width + 14, '#85918b');
      this.box(this.scene, 0, .45, side * (p.width / 2 + 5), p.length + 14, .9, .18, '#85918b');
    }
  }

  /** Mouth lies on local z=0; net extends towards -z. */
  private goal(width: number, height: number, depth: number) {
    const g = new THREE.Group();
    for (const x of [-width / 2, width / 2]) {
      this.box(g, x, height / 2, 0, .12, height, .12, '#f7f8f1');
      this.box(g, x, .06, -depth / 2, .1, .1, depth, '#dce1db');
    }
    this.box(g, 0, height, 0, width + .12, .12, .12, '#f7f8f1');
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
    this.lines(g, pts, '#d4dfd8', .42); return g;
  }

  private makeBall() {
    const ball = new THREE.Mesh(this.geo('ball', () => new THREE.IcosahedronGeometry(.26, 1)), [this.mat('#f7f7eb'), this.mat('#192126')]);
    const geo = ball.geometry;
    if (!geo.groups.length) for (let i = 0; i < geo.attributes.position.count; i += 3) geo.addGroup(i, 3, (i / 3) % 5 === 0 ? 1 : 0);
    ball.position.y = .26; ball.castShadow = true; return ball;
  }

  private figure(color: string, number: string, name: string, foreground = '#ffffff'): Figure {
    const group = new THREE.Group();
    const limbs: THREE.Group[] = [];
    this.box(group, 0, 1.17, 0, .6, .66, .34, color);
    this.box(group, 0, .79, 0, .56, .25, .32, '#19232e');
    this.sphere(group, 0, 1.77, 0, .23, '#d3a17e');
    this.sphere(group, 0, 1.88, -.025, .20, '#302b29');
    for (const side of [-1, 1]) {
      const leg = new THREE.Group(); leg.position.set(side * .17, .7, 0);
      this.box(leg, 0, -.27, 0, .18, .54, .19, color);
      this.box(leg, 0, -.62, .07, .2, .16, .34, '#121b23');
      group.add(leg); limbs.push(leg);
      const arm = new THREE.Group(); arm.position.set(side * .4, 1.43, 0);
      this.box(arm, 0, -.12, 0, .2, .28, .24, color);
      this.box(arm, 0, -.36, 0, .14, .27, .16, '#d3a17e');
      group.add(arm); limbs.push(arm);
    }
    if (number) {
      const tex = textTexture(number, foreground, color); this.textures.add(tex);
      const mat = new THREE.MeshBasicMaterial({ map: tex }); this.ownedMaterials.add(mat);
      for (const side of [-1, 1]) {
        const label = new THREE.Mesh(this.geo('number', () => new THREE.PlaneGeometry(.4, .4)), mat);
        label.position.set(0, 1.23, side * .176); label.rotation.y = side < 0 ? Math.PI : 0; group.add(label);
      }
      const tag = textTexture(name ? `${number} · ${name}` : number, '#ffffff'); this.textures.add(tag);
      const tagMat = new THREE.SpriteMaterial({ map: tag, depthTest: true, depthWrite: false }); this.ownedMaterials.add(tagMat);
      const sprite = new THREE.Sprite(tagMat); sprite.position.y = 2.6; sprite.scale.set(name ? 5 : 1.3, name ? 1.25 : 1.3, 1); group.add(sprite);
    }
    // Enlarged TV figures remain legible on phones and in the overview.
    group.scale.setScalar(this.figureSize);
    return { group, limbs, heading: Math.PI / 2, stride: 0, motion: 0, signature: '' };
  }

  private equipmentGroup(item: BoardItem) {
    const g = new THREE.Group();
    const ink = themeColor('--k-ink', '#eeeeee');
    switch (item.type) {
      case 'cone': {
        const cone = new THREE.Mesh(this.geo('cone', () => new THREE.ConeGeometry(.5, 1, 16)), this.mat('#F97316'));
        cone.position.y = .5; cone.castShadow = true; g.add(cone); this.box(g, 0, .05, 0, 1, .1, 1, '#F97316'); break;
      }
      case 'opponent': g.add(this.figure(themeColor('--k-opponent', '#cbd5e1'), '', '').group); break;
      case 'player': g.add(this.figure(themeColor('--k-signal', '#ff5a36'), '', '').group); break;
      case 'ball': g.add(this.makeBall()); break;
      case 'minigoal': g.add(this.goal(4, 1.6, 1.4)); break;
      case 'mannequin':
        this.box(g, 0, .08, 0, 1, .16, .8, '#45334e'); this.box(g, 0, 1, 0, .7, 1.6, .16, '#A855F7'); this.sphere(g, 0, 2, 0, .28, '#A855F7'); break;
      case 'ladder':
        for (const z of [-.65, .65]) this.box(g, 0, .035, z, 8, .07, .08, '#FACC15');
        for (let x = -4; x <= 4; x += 1) this.box(g, x, .035, 0, .08, .07, 1.3, '#FACC15'); break;
      case 'hurdle':
        this.box(g, 0, .9, 0, 2.8, .12, .12, ink);
        for (const x of [-1.35, 1.35]) { this.box(g, x, .45, 0, .1, .9, .1, ink); this.box(g, x, .06, 0, .12, .12, 1, ink); } break;
    }
    return g;
  }

  async prepareDrawings(drawings: Drawing[]) {
    const key = JSON.stringify(drawings);
    if (!this.drawingCache.has(key)) this.drawingCache.set(key, drawingTexture(drawings).then(texture => {
      if (this.disposed) texture.dispose(); else this.textures.add(texture);
      return texture;
    }));
    return this.drawingCache.get(key)!;
  }

  async setDrawings(drawings: Drawing[]) {
    const key = JSON.stringify(drawings); this.currentDrawingKey = key;
    const texture = await this.prepareDrawings(drawings);
    if (this.disposed || key !== this.currentDrawingKey) return;
    const material = this.markings.material as THREE.MeshBasicMaterial;
    material.map = texture; material.needsUpdate = true; this.markings.visible = drawings.length > 0;
  }

  setFrame(frame: SceneFrame, animate = true) {
    this.frame = frame;
    const ids = new Set(frame.players.map(p => p.id));
    this.figures.forEach((f, id) => { if (!ids.has(id)) { this.scene.remove(f.group); this.figures.delete(id); } });
    for (const p of frame.players) {
      const kit = this.playerStyle === 'kit' ? KIT_COLORS[p.family] : { fill: themeColor('--k-signal', '#ff5a36'), fg: themeColor('--k-signal-fg', '#160704') };
      const signature = `${kit.fill}/${p.num}/${p.name}`;
      let f = this.figures.get(p.id);
      const pos = boardToWorld(p.position, this.sport);
      if (!f || f.signature !== signature) {
        if (f) this.scene.remove(f.group);
        f = this.figure(kit.fill, String(p.num), p.name, kit.fg); f.signature = signature;
        f.group.position.set(pos.x, 0, pos.z); this.figures.set(p.id, f); this.scene.add(f.group);
      }
      const dx = pos.x - f.group.position.x, dz = pos.z - f.group.position.z;
      const distance = Math.hypot(dx, dz);
      if (animate && distance > .0001) {
        f.heading = Math.atan2(dx, dz); f.stride += distance * 2.8; f.motion = 1;
      } else if (!animate) f.motion = 0;
      f.group.position.set(pos.x, 0, pos.z);
    }
    const itemIds = new Set(frame.items.map(i => i.id));
    this.equipment.forEach((e, id) => { if (!itemIds.has(id)) { this.scene.remove(e.group); this.equipment.delete(id); } });
    for (const item of frame.items) {
      let entry = this.equipment.get(item.id);
      if (!entry || entry.type !== item.type) {
        if (entry) this.scene.remove(entry.group);
        entry = { type: item.type, group: this.equipmentGroup(item) }; this.equipment.set(item.id, entry); this.scene.add(entry.group);
      }
      const p = boardToWorld(item.position, this.sport);
      entry.group.position.set(p.x, 0, p.z); entry.group.rotation.y = boardRotation(item.rotation);
    }
    const height = Math.max(0, frame.ballHeight ?? 0);
    const bp = boardToWorld(frame.ball, this.sport, .26 + height);
    if (animate && this.ballPlaced) {
      const dx = bp.x - this.ball.position.x, dz = bp.z - this.ball.position.z;
      const d = Math.hypot(dx, dz);
      // Rolls on the grass; keeps a lighter backspin-free spin in the air.
      if (d > .00001) this.ball.rotateOnWorldAxis(new THREE.Vector3(dz, 0, -dx).normalize(), d / .26 * (height > .05 ? .35 : 1));
    }
    // The ground path is always the 2D path; only the height is added.
    this.ball.position.set(bp.x, bp.y, bp.z); this.ballPlaced = true;
    if (this.ballBlob) {
      this.ballBlob.position.set(bp.x, .03, bp.z);
      this.ballBlob.scale.setScalar(1 + height * .08);
      (this.ballBlob.material as THREE.MeshBasicMaterial).opacity = .32 / (1 + height * .35);
    }
  }

  selectCamera(view: CameraView, playerId = this.playerId) { this.view = view; this.playerId = playerId; this.manual = false; this.zoomFactor = 1; }
  zoom(factor: number) {
    if (this.manual) this.camera.position.sub(this.controls.target).multiplyScalar(factor).add(this.controls.target);
    else this.zoomFactor = THREE.MathUtils.clamp(this.zoomFactor * factor, .3, 2.2);
  }
  cameraState(): CameraState { return { view: this.view, playerId: this.playerId, position: this.camera.position.toArray(), target: this.controls.target.toArray(), manual: this.manual, zoom: this.zoomFactor }; }
  restoreCamera(state: CameraState) {
    this.view = state.view; this.playerId = state.playerId; this.manual = state.manual; this.zoomFactor = state.zoom;
    this.camera.position.fromArray(state.position); this.controls.target.fromArray(state.target); this.controls.update();
  }
  private updateCamera(dt: number, snap = false) {
    if (this.manual) { this.controls.update(); return; }
    const p = PITCHES[this.sport]; const target = this.desiredTarget; const position = this.desiredPosition;
    target.set(0, 0, 0);
    if (this.view === 'top') {
      const direction = new THREE.Vector3(0, 1, .0001).normalize();
      position.copy(direction).multiplyScalar(this.pitchFitDistance(direction) * this.zoomFactor);
    }
    else if (this.view === 'ball') {
      target.copy(this.ball.position); position.copy(target).add(new THREE.Vector3(0, 17 * this.zoomFactor, 24 * this.zoomFactor));
    } else if (this.view === 'player' && this.figures.size) {
      const f = this.povFigure()!;
      const direction = new THREE.Vector3(Math.sin(f.heading), 0, Math.cos(f.heading));
      position.copy(f.group.position).add(new THREE.Vector3(0, 1.8 * this.figureSize, 0)).addScaledVector(direction, .2 * this.figureSize);
      target.copy(position).addScaledVector(direction, 15); target.y = 1.6;
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
  private povFigure() {
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
  resize(width: number, height: number, pixelRatio?: number) {
    if (pixelRatio !== undefined) this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(Math.max(1, width), Math.max(1, height), false);
    this.camera.aspect = width / Math.max(1, height); this.camera.updateProjectionMatrix();
  }
  render(dt: number, snap = false) {
    this.figures.forEach(f => {
      const delta = Math.atan2(Math.sin(f.heading - f.group.rotation.y), Math.cos(f.heading - f.group.rotation.y));
      f.group.rotation.y += delta * (snap ? 1 : 1 - Math.exp(-dt * 14));
      const swing = this.reducedMotion ? 0 : Math.sin(f.stride) * .65 * f.motion;
      f.limbs.forEach((limb, i) => { limb.rotation.x = swing * (i === 0 || i === 3 ? 1 : -1); });
      f.motion *= Math.exp(-dt * 4);
      f.group.visible = true;
    });
    this.updateCamera(dt, snap);
    // In Spillerperspektiv the camera sits in the player's head; hide that figure once there.
    const pov = this.view === 'player' && !this.manual ? this.povFigure() : undefined;
    if (pov && pov.group.position.distanceTo(this.camera.position) < 2.5 * this.figureSize) pov.group.visible = false;
    this.renderer.render(this.scene, this.camera);
  }
  dispose() {
    this.disposed = true; this.controls.removeEventListener('start', this.onManual); this.controls.dispose();
    this.geometry.forEach(g => g.dispose()); this.materials.forEach(m => m.dispose());
    this.ownedMaterials.forEach(m => m.dispose()); this.textures.forEach(t => t.dispose());
    this.scene.clear(); this.renderer.dispose(); this.renderer.forceContextLoss();
  }
}
