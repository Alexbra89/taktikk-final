import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { VW, VH } from '@/data/formations';
import type { BoardItem, Drawing, Position, Sport, Player } from '@/types';
import type { StagePlayer } from '../BoardStage';
import type { PlayerStyle } from '@/hooks/usePlayerStyle';
import { KIT_COLORS } from '../svg/PlayerKit';
import { PITCHES, boardToWorld, ballToWorld, boardRotation, figureScale, GOAL_DEPTH } from './coordinates';
import { drawingTexture, textTexture, themeColor, grassTexture, phaseTexture, PHASE_PILL_WIDTH } from './textures';
import { DrawingCache } from './drawingCache';
import { drawingColorKey } from '../drawTools';
import { loadPlayer, loadSky, clonePlayer, kitMaterial, strideOffset } from './assets';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

/** Slightly larger than a real ball (0.11 m), so it reads in the overview. */
const BALL_RADIUS = .26;

export type CameraView = 'overview' | 'top' | 'ball' | 'player';
export interface SceneFrame {
  players: StagePlayer[];
  ball: Position;
  items: BoardItem[];
  drawings: Drawing[];
  phaseName?: string;
  stickyNote?: string;
  trails?: { from: Player[]; to: Player[] } | null;
  progress?: number | null;
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
  /** The followed ground point, so a manual follow angle survives into the export. */
  anchor: number[] | null;
}
interface Figure {
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
}

/** A read-only renderer. It knows nothing about the store, editing, or phase timers. */
export class BoardScene {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  // Keep depth precision for low, oblique views, including mobile depth buffers.
  readonly camera = new THREE.PerspectiveCamera(44, 1, 0.5, 450);
  readonly controls: OrbitControls;
  readonly assetsReady: Promise<void>;
  readonly assetWarnings: string[] = [];
  private playerAsset?: GLTF;
  /** Where in Sprint_Loop the stride matches the start of Jog_Fwd_Loop. */
  private sprintPhase = 0;
  private environment?: THREE.WebGLRenderTarget;
  private hud = new THREE.Scene();
  private hudCamera = new THREE.OrthographicCamera(0, 1, 1, 0, -1, 1);
  private phasePanel = new THREE.Sprite(new THREE.SpriteMaterial({ depthTest: false, toneMapped: false }));
  private phaseKey = '';
  private progressBar?: THREE.Mesh;
  private labels = new THREE.Group();
  private labelResources: (THREE.Material | THREE.Texture)[] = [];
  private drawingLabelKey = '';
  private kitMaterials = new Map<string, THREE.MeshStandardMaterial>();
  private geometry = new Map<string, THREE.BufferGeometry>();
  private materials = new Map<string, THREE.MeshStandardMaterial>();
  private lineMaterials = new Map<string, THREE.LineBasicMaterial>();
  private ownedMaterials = new Set<THREE.Material>();
  private textures = new Set<THREE.Texture>();
  private readonly drawingCache: DrawingCache<THREE.Texture>;
  private readonly drawingResolution: number;
  private figures = new Map<string, Figure>();
  private equipment = new Map<string, { type: string; group: THREE.Group; target: THREE.Vector3; turn: number }>();
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
  private stadiumShift = new THREE.Vector3();
  private ballTarget = new THREE.Vector3();
  private ballPlaced = false;
  /** Ground point the camera follows in Følg ballen / Spillerperspektiv, also after manual orbiting. */
  private anchor = new THREE.Vector3();
  private lastAnchor = new THREE.Vector3();
  private anchorKnown = false;
  private reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  /** Circle-style kit; read once, since a theme change rebuilds the scene. */
  private readonly chipKit = { fill: themeColor('--k-signal', '#ff5a36'), fg: themeColor('--k-signal-fg', '#160704') };
  /** Contact shadow under figures where real shadows are off (mobile). */
  private figureBlob: THREE.MeshBasicMaterial | null = null;
  private onManual = () => { this.manual = true; };

  constructor(readonly sport: Sport, readonly playerStyle: PlayerStyle, mobile: boolean, private readonly exportMode = false) {
    // Offscreen export must retain the rendered pixels until VideoFrame copies them.
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: exportMode });
    this.renderer.setPixelRatio(mobile ? 1 : Math.min(devicePixelRatio, 1.75));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = .9;
    this.figureSize = figureScale(sport);
    this.drawingCache = new DrawingCache<THREE.Texture>(mobile ? 3 : 6, () => this.currentDrawingKey);
    this.drawingResolution = mobile ? 2 : 3;
    this.renderer.shadowMap.enabled = !mobile;
    // three r186 removed PCFSoftShadowMap; PCF with a blur radius gives the soft edge.
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:none';
    this.renderer.domElement.setAttribute('aria-label', 'Taktikktavle i 3D. Dra for å rotere, høyreklikk og dra, Shift og dra eller dra med to fingre for å flytte kameraet, rull eller klyp for å zoome.');
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    // Shift/Ctrl + left drag also pans. Panning slides along the grass, never into it.
    this.controls.enablePan = true;
    this.controls.screenSpacePanning = false;
    this.controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
    this.controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
    this.controls.minDistance = 1;
    this.controls.maxDistance = 260;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.015;
    this.controls.addEventListener('start', this.onManual);
    this.scene.background = new THREE.Color('#17252c');
    this.scene.fog = new THREE.Fog('#17252c', 150, 340);
    this.scene.add(new THREE.HemisphereLight('#e4f0ff', '#324528', .8));
    const sun = new THREE.DirectionalLight('#fff4db', 1.8);
    sun.position.set(-35, 65, 25); sun.castShadow = !mobile;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -80, right: 80, top: 80, bottom: -80, near: 1, far: 180 });
    sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.04; sun.shadow.radius = 3;
    this.scene.add(sun);
    this.hud.add(this.phasePanel); this.phasePanel.center.set(0, 1); this.phasePanel.visible = false;
    const progressMaterial = new THREE.MeshBasicMaterial({ color: this.chipKit.fill, depthTest: false, toneMapped: false });
    this.ownedMaterials.add(progressMaterial);
    this.progressBar = new THREE.Mesh(this.geo('hud-progress', () => new THREE.PlaneGeometry(1, 4)), progressMaterial);
    this.hud.add(this.progressBar); this.progressBar.visible = false;
    this.scene.add(this.labels);
    this.buildPitch();
    this.ball = this.makeBall(); this.scene.add(this.ball);
    if (mobile) {
      const blob = new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: .32, depthWrite: false });
      this.ownedMaterials.add(blob);
      this.ballBlob = new THREE.Mesh(this.geo('blob', () => new THREE.CircleGeometry(.3, 20)), blob);
      this.ballBlob.rotation.x = -Math.PI / 2; this.ballBlob.position.y = .03; this.scene.add(this.ballBlob);
      this.figureBlob = new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: .26, depthWrite: false });
      this.ownedMaterials.add(this.figureBlob);
    }
    const p = PITCHES[sport];
    const mat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2 });
    this.ownedMaterials.add(mat);
    this.markings = new THREE.Mesh(this.geo('drawing-plane', () => new THREE.PlaneGeometry(p.length * VW / (VW - 64), p.width * VH / (VH - 64))), mat);
    this.markings.rotation.x = -Math.PI / 2; this.markings.position.y = 0.035; this.markings.visible = false;
    this.scene.add(this.markings);
    this.selectCamera('overview'); this.updateCamera(1, true);
    this.assetsReady = this.loadAssets();
  }

  private async loadAssets() {
    await Promise.all([
      loadPlayer().then(asset => {
        if (this.disposed) return;
        this.playerAsset = asset;
        const clip = (name: string) => asset.animations.find(c => c.name === name)!;
        this.sprintPhase = strideOffset(clip('Jog_Fwd_Loop'), clip('Sprint_Loop'));
        this.figures.forEach(f => this.releaseFigure(f)); this.figures.clear();
        // Rebuild numbered and additional players after the one shared load.
        this.equipment.forEach((entry, id) => {
          if (entry.type === 'player' || entry.type === 'opponent') { if (entry.group.userData.figure) this.releaseFigure(entry.group.userData.figure); this.scene.remove(entry.group); this.equipment.delete(id); }
        });
        this.setFrame(this.frame, false);
      }).catch(() => { if (!this.disposed) this.assetWarnings.push('Spillermodellen kunne ikke lastes. Enkle figurer brukes.'); }),
      loadSky().then(texture => {
        if (this.disposed) return;
        const pmrem = new THREE.PMREMGenerator(this.renderer);
        try {
          this.environment = pmrem.fromEquirectangular(texture);
          this.scene.environment = this.environment.texture;
          this.scene.background = texture; texture.mapping = THREE.EquirectangularReflectionMapping;
          this.scene.backgroundBlurriness = .12;
          this.scene.environmentIntensity = .65;
          this.scene.fog = new THREE.Fog('#b6c6cb', 180, 390);
        } finally { pmrem.dispose(); }
      }).catch(() => { if (!this.disposed) this.assetWarnings.push('Himmelen kunne ikke lastes. Vanlig lys brukes.'); }),
    ]);
  }

  private releaseFigure(f: Figure) {
    f.mixer?.stopAllAction(); f.mixer?.uncacheRoot(f.mixer.getRoot());
    f.group.traverse(object => { if (object instanceof THREE.SkinnedMesh) object.skeleton.dispose(); });
    f.resources.forEach(resource => resource.dispose()); this.scene.remove(f.group);
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
  private lines(parent: THREE.Object3D, points: number[], color: string, opacity: number, key: string) {
    const geometry = this.geo(key, () => {
      const net = new THREE.BufferGeometry();
      net.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
      return net;
    });
    const materialKey = `${color}/${opacity}`;
    if (!this.lineMaterials.has(materialKey)) {
      const material = new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity });
      this.lineMaterials.set(materialKey, material); this.ownedMaterials.add(material);
    }
    const material = this.lineMaterials.get(materialKey)!;
    parent.add(new THREE.LineSegments(geometry, material));
  }

  private buildPitch() {
    const p = PITCHES[this.sport];
    // A frame around the turf, rather than a second floor 3 cm underneath it.
    // The overlapping floor could bleed through at grazing angles on mobile
    // (z-fighting). Removing the overlap fixes this without reducing detail.
    for (const side of [-1, 1]) {
      this.box(this.scene, side * (p.length / 2 + 9.5), -0.28, 0, 9, 0.5, p.width + 24, '#21452e').castShadow = false;
      this.box(this.scene, 0, -0.28, side * (p.width / 2 + 8.5), p.length + 10, 0.5, 7, '#21452e').castShadow = false;
    }
    const grass = grassTexture(); grass.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy()); this.textures.add(grass);
    const turf = new THREE.MeshStandardMaterial({ map: grass, roughness: .98, bumpMap: grass, bumpScale: .065 });
    turf.onBeforeCompile = shader => {
      shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 turfPosition;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nturfPosition = position;');
      shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 turfPosition;')
        .replace('#include <color_fragment>', `#include <color_fragment>
          float stripe = mod(floor((turfPosition.x + ${p.length / 2}) / ${p.length / 18}), 2.0);
          float variation = sin(turfPosition.x * .71 + sin(turfPosition.y * .34)) * sin(turfPosition.y * .83) * .035;
          diffuseColor.rgb *= vec3(.65, .92, .59) * (.90 + stripe * .12 + variation);`);
    };
    this.ownedMaterials.add(turf);
    const grassPlane = new THREE.Mesh(this.geo('turf', () => new THREE.PlaneGeometry(p.length + 10, p.width + 10)), turf);
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
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy()); this.textures.add(texture);
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }); this.ownedMaterials.add(material);
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
  private goal(width: number, height: number, depth: number, color = '#f7f8f1') {
    const g = new THREE.Group();
    for (const x of [-width / 2, width / 2]) {
      this.box(g, x, height / 2, 0, .08, height, .08, color);
      this.box(g, x, .04, -depth / 2, .07, .07, depth, color);
      this.box(g, x, height / 2, -depth, .06, height, .06, color);
    }
    this.box(g, 0, height, 0, width + .08, .08, .08, color);
    this.box(g, 0, height, -depth, width, .06, .06, color);
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
    this.lines(g, pts, '#d4dfd8', .42, `goal-net/${width}/${height}/${depth}`); return g;
  }

  private makeBall() {
    const ball = new THREE.Mesh(this.geo('ball', () => new THREE.IcosahedronGeometry(BALL_RADIUS, 1)), [this.mat('#f7f7eb'), this.mat('#192126')]);
    const geo = ball.geometry;
    if (!geo.groups.length) for (let i = 0; i < geo.attributes.position.count; i += 3) geo.addGroup(i, 3, (i / 3) % 5 === 0 ? 1 : 0);
    ball.position.y = BALL_RADIUS; ball.castShadow = true; return ball;
  }

  private figure(color: string, number: string, name: string, foreground = '#ffffff', role = ''): Figure {
    const group = new THREE.Group();
    const limbs: THREE.Group[] = [];
    const resources: Figure['resources'] = [];
    let mixer: THREE.AnimationMixer | undefined, actions: THREE.AnimationAction[] | undefined;
    let spine: THREE.Object3D | undefined;
    if (this.playerAsset) {
      if (!this.kitMaterials.has(color)) {
        const material = kitMaterial(color); this.kitMaterials.set(color, material); this.ownedMaterials.add(material);
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
    }
    if (this.figureBlob) {
      const blob = new THREE.Mesh(this.geo('blob', () => new THREE.CircleGeometry(.3, 20)), this.figureBlob);
      blob.rotation.x = -Math.PI / 2; blob.position.y = .02; blob.scale.setScalar(1.5); group.add(blob);
    }
    if (number) {
      const tex = textTexture(number, foreground, color); resources.push(tex);
      const mat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }); resources.push(mat);
      for (const side of [-1, 1]) {
        const label = new THREE.Mesh(this.geo('number', () => new THREE.PlaneGeometry(.4, .4)), mat);
        label.position.set(0, 1.36, side * (this.playerAsset ? .235 : .176)); label.rotation.y = side < 0 ? Math.PI : 0; group.add(label);
        if (spine) { group.updateMatrixWorld(true); spine.attach(label); }
      }
      const title = `${number}${role ? ` · ${role.toUpperCase()}` : ''}`;
      const tag = textTexture(title, '#ffffff'); resources.push(tag);
      const tagMat = new THREE.SpriteMaterial({ map: tag, depthTest: true, depthWrite: false, toneMapped: false }); resources.push(tagMat);
      const sprite = new THREE.Sprite(tagMat); sprite.position.y = 2.75; group.add(sprite);
      // textTexture is 4:1 with a role and square for a bare number; keep glyphs undistorted.
      sprite.scale.set(role ? 3 : .75, .75, 1);
      if (name) {
        const texture = textTexture(name, '#ffffff'); resources.push(texture);
        const material = new THREE.SpriteMaterial({ map: texture, depthWrite: false, toneMapped: false }); resources.push(material);
        const label = new THREE.Sprite(material); label.position.y = 3.45; label.scale.set(4, 1, 1); group.add(label);
      }
    }
    const displacedMaterial = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .55, toneMapped: false });
    resources.push(displacedMaterial);
    const displaced = new THREE.Mesh(this.geo('out-of-position', () => new THREE.PlaneGeometry(.65, .055)), displacedMaterial);
    displaced.rotation.x = -Math.PI / 2; displaced.position.set(0, .03, .55); displaced.visible = false; group.add(displaced);
    // Enlarged TV figures remain legible on phones and in the overview.
    group.scale.setScalar(this.figureSize);
    return { group, limbs, mixer, actions, resources, displaced, cycle: 0, running: 0, speed: 0, target: new THREE.Vector3(), heading: Math.PI / 2, stride: 0, motion: 0, signature: '' };
  }

  private equipmentGroup(item: BoardItem) {
    const g = new THREE.Group();
    const ink = themeColor('--k-ink', '#eeeeee');
    switch (item.type) {
      case 'cone': {
        const cone = new THREE.Mesh(this.geo('cone', () => new THREE.ConeGeometry(.19, .42, 20)), this.mat('#F97316'));
        cone.position.y = .24; cone.castShadow = true; g.add(cone); this.box(g, 0, .025, 0, .46, .05, .46, '#F97316');
        for (const y of [.15, .29]) {
          // Follows the cone's slope (±.0125 over the band), a few mm proud of it so it never z-fights.
          const radius = .19 * (1 - (y - .03) / .42) + .005;
          const band = new THREE.Mesh(this.geo(`cone-band-${y}`, () => new THREE.CylinderGeometry(radius - .0125, radius + .0125, .055, 20, 1, true)), this.mat('#ffffff'));
          band.position.y = y; g.add(band);
        }
        break;
      }
      case 'opponent': case 'player': {
        const figure = this.figure(item.type === 'opponent' ? themeColor('--k-opponent', '#cbd5e1') : this.chipKit.fill, '', '');
        // Same enlarged TV scale as the numbered players, so opponents never look like children;
        // unlike them, they keep the rotation set in 2D.
        g.add(figure.group); g.userData.figure = figure; break;
      }
      case 'ball': g.add(this.makeBall()); break;
      case 'minigoal': {
        const goal = this.goal(3, 1.5, 1, ink); goal.scale.setScalar(this.figureSize); g.add(goal); break;
      }
      case 'mannequin':
        this.box(g, 0, .05, 0, .65, .1, .5, '#45334e');
        for (const x of [-.19, .19]) this.box(g, x, .45, 0, .06, .8, .06, '#A855F7');
        this.box(g, 0, 1.05, 0, .52, .78, .10, '#A855F7'); this.sphere(g, 0, 1.64, 0, .18, '#A855F7');
        for (const x of [-.13, 0, .13]) this.box(g, x, 1.08, .056, .018, .60, .015, '#d6b5fa'); break;
      case 'ladder':
        for (const z of [-.25, .25]) this.box(g, 0, .018, z, 4, .025, .035, '#FACC15');
        for (let x = -2; x <= 2; x += .5) this.box(g, x, .022, 0, .045, .03, .5, '#FACC15'); break;
      case 'hurdle':
        this.box(g, 0, .45, 0, 1.2, .065, .065, ink);
        for (const x of [-.57, .57]) { this.box(g, x, .225, 0, .055, .45, .055, ink); this.box(g, x, .03, 0, .06, .06, .5, ink); } break;
    }
    // Same enlarged TV scale as the figures, so a cone or dummy keeps its real size next to a player.
    // Scaled from the ground point, so it still stands on the grass. The ball keeps BALL_RADIUS like the match ball.
    if (['cone', 'mannequin', 'ladder', 'hurdle'].includes(item.type)) g.scale.setScalar(this.figureSize);
    return g;
  }

  async prepareDrawings(drawings: Drawing[], trails?: SceneFrame['trails']) {
    const key = JSON.stringify([drawings, trails ?? null]);
    return this.drawingCache.get(key, () => drawingTexture(drawings, trails, this.drawingResolution));
  }

  async setDrawings(drawings: Drawing[], trails?: SceneFrame['trails']) {
    const key = JSON.stringify([drawings, trails ?? null]);
    // Never display the previous phase's instructions while a new SVG decodes.
    if (key !== this.currentDrawingKey) this.markings.visible = false;
    this.currentDrawingKey = key;
    this.setDrawingLabels(drawings);
    const texture = await this.prepareDrawings(drawings, trails);
    if (this.disposed || key !== this.currentDrawingKey) return;
    const material = this.markings.material as THREE.MeshBasicMaterial;
    if (material.map !== texture) { material.map = texture; material.needsUpdate = true; }
    this.markings.visible = drawings.length > 0 || !!trails;
    // Keep recent phases warm, with a bounded GPU footprint on mobile.
    this.drawingCache.use(key, texture);
  }

  private setDrawingLabels(drawings: Drawing[]) {
    const labels = drawings.filter(d => d.type === 'label');
    const key = JSON.stringify(labels); if (key === this.drawingLabelKey) return;
    this.drawingLabelKey = key; this.labels.clear(); this.labelResources.forEach(r => r.dispose()); this.labelResources = [];
    for (const label of labels) {
      if (label.type !== 'label' || !Number.isFinite(label.at.x) || !Number.isFinite(label.at.y)) continue;
      const color = themeColor(`--k-draw-${drawingColorKey(label)}`, '#ffffff');
      const texture = textTexture(label.text, color);
      const material = new THREE.SpriteMaterial({ map: texture, depthWrite: false, toneMapped: false });
      this.labelResources.push(texture, material);
      const sprite = new THREE.Sprite(material), pos = boardToWorld(label.at, this.sport, .1);
      // Anchored at the glyphs' baseline: a camera-facing sprite tilts its lower
      // half towards the camera, which would otherwise sink into the grass.
      sprite.center.set(.5, .18);
      sprite.position.set(pos.x, pos.y, pos.z); sprite.scale.set(8 * this.figureSize, 2 * this.figureSize, 1);
      this.labels.add(sprite);
    }
  }

  /** Only the video draws the phase into WebGL; the live view shows a tappable pill in the page (Board3D). */
  private setPhase(name = '', note = '') {
    if (!this.exportMode) return;
    const key = JSON.stringify([name, note]); if (key === this.phaseKey) return;
    this.phaseKey = key;
    const material = this.phasePanel.material;
    material.map?.dispose(); material.map = phaseTexture(name, note); material.needsUpdate = true;
    this.phasePanel.visible = !!(name || note); this.layoutHud();
  }
  private layoutHud() {
    const size = this.renderer.getSize(new THREE.Vector2());
    this.hudCamera.right = size.x; this.hudCamera.top = size.y; this.hudCamera.updateProjectionMatrix();
    if (this.progressBar) {
      const width = Math.max(0, size.x - 24) * (this.frame.progress ?? 0);
      this.progressBar.visible = this.frame.progress != null;
      this.progressBar.scale.x = width; this.progressBar.position.set(12 + width / 2, 10, 0);
    }
    const image = this.phasePanel.material.map?.image as HTMLCanvasElement | undefined;
    if (!image) return;
    // Compact corner pill: a full-width texture is at most 30 % of the frame,
    // so it never reaches the middle of the pitch (576 px wide in 1080p).
    const scale = Math.min(size.x * .3, size.y * .55) / PHASE_PILL_WIDTH;
    const margin = Math.round(size.y * .025);
    this.phasePanel.position.set(margin, size.y - margin, 0);
    this.phasePanel.scale.set(image.width * scale, image.height * scale, 1);
  }

  setFrame(frame: SceneFrame, animate = true) {
    this.frame = frame;
    this.setPhase(frame.phaseName, frame.stickyNote);
    this.layoutHud();
    const ids = new Set(frame.players.map(p => p.id));
    this.figures.forEach((f, id) => { if (!ids.has(id)) { this.releaseFigure(f); this.figures.delete(id); } });
    for (const p of frame.players) {
      const kit = this.playerStyle === 'kit' || p.family === 'gk' ? KIT_COLORS[p.family] : this.chipKit;
      const signature = `${kit.fill}/${p.num}/${p.name}/${p.label}`;
      let f = this.figures.get(p.id);
      const pos = boardToWorld(p.position, this.sport);
      if (!f || f.signature !== signature) {
        const old = f;
        f = this.figure(kit.fill, String(p.num), p.name, kit.fg, p.label); f.signature = signature;
        // A changed name or kit keeps where the figure stands and faces.
        if (old) { f.group.position.copy(old.group.position); f.heading = old.heading; f.group.rotation.y = old.group.rotation.y; this.releaseFigure(old); }
        else f.group.position.set(pos.x, 0, pos.z);
        this.figures.set(p.id, f); this.scene.add(f.group);
      }
      f.target.set(pos.x, 0, pos.z);
      if (f.displaced) f.displaced.visible = !!p.outOfPos;
      if (!animate) { f.group.position.copy(f.target); f.motion = 0; f.speed = 0; }
    }
    const itemIds = new Set(frame.items.map(i => i.id));
    this.equipment.forEach((e, id) => { if (!itemIds.has(id)) { if (e.group.userData.figure) this.releaseFigure(e.group.userData.figure); this.scene.remove(e.group); this.equipment.delete(id); } });
    for (const item of frame.items) {
      let entry = this.equipment.get(item.id);
      const p = item.type === 'ball' ? ballToWorld(item.position, this.sport, BALL_RADIUS) : boardToWorld(item.position, this.sport);
      const fresh = !entry || entry.type !== item.type;
      if (!entry || fresh) {
        if (entry) {
          if (entry.group.userData.figure) this.releaseFigure(entry.group.userData.figure);
          this.scene.remove(entry.group);
        }
        entry = { type: item.type, group: this.equipmentGroup(item), target: new THREE.Vector3(), turn: 0 }; this.equipment.set(item.id, entry); this.scene.add(entry.group);
      }
      entry.target.set(p.x, 0, p.z); entry.turn = boardRotation(item.rotation);
      if (!animate || fresh) { entry.group.position.copy(entry.target); entry.group.rotation.y = entry.turn; }
    }
    const height = Math.max(0, frame.ballHeight ?? 0);
    // The ground path is always the 2D path; only the height is added, and a ball in a 2D goal lies in the net.
    const bp = ballToWorld(frame.ball, this.sport, BALL_RADIUS, BALL_RADIUS + height);
    this.ballTarget.set(bp.x, bp.y, bp.z);
    if (!animate || !this.ballPlaced) { this.ball.position.copy(this.ballTarget); this.placeBallBlob(); }
    this.ballPlaced = true;
  }

  private placeBallBlob() {
    if (!this.ballBlob) return;
    const height = Math.max(0, this.ball.position.y - BALL_RADIUS);
    this.ballBlob.position.set(this.ball.position.x, .03, this.ball.position.z);
    this.ballBlob.scale.setScalar(1 + height * .08);
    (this.ballBlob.material as THREE.MeshBasicMaterial).opacity = .32 / (1 + height * .35);
  }

  /**
   * Moves figures and ball towards the frame. Live playback updates the frame
   * ~33 times a second; easing over that bridges the steps so it looks smooth
   * at any refresh rate. Export frames are exact, so they are never eased.
   */
  private advance(dt: number, snap: boolean) {
    const follow = snap || this.exportMode ? 1 : 1 - Math.exp(-dt * 30);
    this.figures.forEach(f => {
      const dx = (f.target.x - f.group.position.x) * follow, dz = (f.target.z - f.group.position.z) * follow;
      const moved = Math.hypot(dx, dz);
      f.speed = THREE.MathUtils.lerp(f.speed, !snap && dt > 0 ? moved / dt : 0, this.exportMode || snap ? 1 : 1 - Math.exp(-dt * 14));
      f.group.position.x += dx; f.group.position.z += dz;
      // Faces where it runs; slower than walking pace counts as standing.
      if (!snap && moved > .0001 && moved / Math.max(dt, 1e-3) > .4) { f.heading = Math.atan2(dx, dz); f.stride += moved * 2.8; f.motion = 1; }
    });
    this.equipment.forEach(e => {
      const figure: Figure | undefined = e.group.userData.figure;
      const velocity = dt > 0 && !snap ? e.group.position.distanceTo(e.target) * follow / dt : 0;
      if (figure) this.animateFigure(figure, dt, velocity);
      e.group.position.lerp(e.target, follow);
      const r = e.group.rotation.y;
      e.group.rotation.y = r + Math.atan2(Math.sin(e.turn - r), Math.cos(e.turn - r)) * follow;
    });
    const bx = (this.ballTarget.x - this.ball.position.x) * follow, bz = (this.ballTarget.z - this.ball.position.z) * follow;
    const rolled = Math.hypot(bx, bz);
    const airborne = this.ball.position.y > BALL_RADIUS + .05;
    // Rolls on the grass; keeps a lighter spin in the air.
    if (!snap && rolled > .00001) this.ball.rotateOnWorldAxis(this.offset.set(bz, 0, -bx).normalize(), rolled / BALL_RADIUS * (airborne ? .35 : 1));
    this.ball.position.x += bx; this.ball.position.z += bz;
    this.ball.position.y += (this.ballTarget.y - this.ball.position.y) * follow;
    this.placeBallBlob();
  }

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
  private updateCamera(dt: number, snap = false) {
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
    this.layoutHud();
  }
  private animateFigure(f: Figure, dt: number, speed: number) {
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
  render(dt: number, snap = false) {
    this.advance(dt, snap);
    this.figures.forEach(f => {
      const delta = Math.atan2(Math.sin(f.heading - f.group.rotation.y), Math.cos(f.heading - f.group.rotation.y));
      f.group.rotation.y += delta * (snap ? 1 : 1 - Math.exp(-dt * 14));
      const swing = this.reducedMotion ? 0 : Math.sin(f.stride) * .65 * f.motion;
      f.limbs.forEach((limb, i) => { limb.rotation.x = swing * (i === 0 || i === 3 ? 1 : -1); });
      f.motion *= Math.exp(-dt * 4);
      this.animateFigure(f, dt, f.speed);
      f.group.visible = true;
    });
    this.updateCamera(dt, snap);
    // In Spillerperspektiv the camera sits in the player's head; hide that figure once there.
    const pov = this.view === 'player' && !this.manual ? this.povFigure() : undefined;
    if (pov && pov.group.position.distanceTo(this.camera.position) < 2.5 * this.figureSize) pov.group.visible = false;
    this.renderer.render(this.scene, this.camera);
    this.renderer.autoClear = false; this.renderer.clearDepth(); this.renderer.render(this.hud, this.hudCamera); this.renderer.autoClear = true;
  }
  dispose() {
    this.disposed = true; this.controls.removeEventListener('start', this.onManual); this.controls.dispose();
    this.figures.forEach(f => this.releaseFigure(f));
    this.equipment.forEach(e => { if (e.group.userData.figure) this.releaseFigure(e.group.userData.figure); });
    this.labelResources.forEach(r => r.dispose());
    this.phasePanel.material.map?.dispose(); this.phasePanel.material.dispose(); this.hud.clear();
    this.environment?.dispose();
    this.drawingCache.dispose();
    this.geometry.forEach(g => g.dispose()); this.materials.forEach(m => m.dispose());
    this.ownedMaterials.forEach(m => m.dispose()); this.textures.forEach(t => t.dispose());
    this.scene.clear(); this.renderer.dispose(); this.renderer.forceContextLoss();
  }
}
