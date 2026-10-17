/** Composes the read-only 3D scene and preserves the public BoardScene API. */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { VW, VH } from '@/data/formations';
import type { BoardItem, Drawing, Position, Sport, Player } from '@/types';
import type { StagePlayer } from '../BoardStage';
import type { PlayerStyle } from '@/hooks/usePlayerStyle';
import { KIT_COLORS } from '../svg/PlayerKit';
import { boardToWorld, ballToWorld, boardRotation, figureScale } from './coordinates';
import { themeColor } from './textures';
import { loadPlayer, loadSky, strideOffset } from './assets';
import { ResourcePool } from './resourcePool';
import { PitchBuilder } from './pitchBuilder';
import { Figures, BALL_RADIUS, type Figure } from './figures';
import { equipmentGroup } from './equipment';
import { Hud } from './hud';
import { DrawingLayer } from './drawingLayer';
import { CameraRig, type CameraView, type CameraState, type CameraPose } from './cameraRig';

export type { CameraView, CameraState, CameraPose } from './cameraRig';
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

/** A read-only renderer. It knows nothing about the store, editing, or phase timers. */
export class BoardScene {
  private readonly pool = new ResourcePool();
  private readonly figureFactory: Figures;
  private readonly pitch: PitchBuilder;
  private readonly drawingLayer: DrawingLayer;
  private readonly hud: Hud;
  private readonly cameraRig: CameraRig;
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  // Keep depth precision for low, oblique views, including mobile depth buffers.
  readonly camera = new THREE.PerspectiveCamera(44, 1, 0.5, 450);
  readonly controls: OrbitControls;
  readonly assetsReady: Promise<void>;
  readonly assetWarnings: string[] = [];
  private environment?: THREE.WebGLRenderTarget;
  private figures = new Map<string, Figure>();
  private equipment = new Map<string, { type: string; group: THREE.Group; target: THREE.Vector3; turn: number }>();
  private ball: THREE.Mesh;
  /** Soft contact shadow, only where real shadows are switched off (mobile). */
  private ballBlob: THREE.Mesh | null = null;
  private readonly figureSize: number;
  private disposed = false;
  private frame: SceneFrame = { players: [], ball: { x: VW / 2, y: VH / 2 }, items: [], drawings: [] };
  private offset = new THREE.Vector3();
  private ballTarget = new THREE.Vector3();
  private ballPlaced = false;
  private reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  /** Circle-style kit; read once, since a theme change rebuilds the scene. */
  private readonly chipKit = { fill: themeColor('--k-signal', '#ff5a36'), fg: themeColor('--k-signal-fg', '#160704') };
  private onManual = () => { this.cameraRig.manual = true; };

  constructor(readonly sport: Sport, readonly playerStyle: PlayerStyle, mobile: boolean, private readonly exportMode = false) {
    // Offscreen export must retain the rendered pixels until VideoFrame copies them.
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: exportMode });
    this.renderer.setPixelRatio(mobile ? 1 : Math.min(devicePixelRatio, 1.75));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = .9;
    this.figureSize = figureScale(sport);
    this.figureFactory = new Figures(this.scene, this.figureSize, this.pool, this.reducedMotion, exportMode);
    this.pitch = new PitchBuilder(sport, this.scene, this.renderer, this.figureSize, this.pool);
    this.drawingLayer = new DrawingLayer(sport, this.scene, this.figureSize, this.pool, mobile);
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
    this.hud = new Hud(this.renderer, this.pool, this.chipKit, exportMode, this.frame);
    this.scene.add(this.drawingLayer.labels);
    this.pitch.buildPitch();
    this.ball = this.figureFactory.makeBall(); this.scene.add(this.ball);
    if (mobile) {
      const blob = new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: .32, depthWrite: false });
      this.pool.ownedMaterials.add(blob);
      this.ballBlob = new THREE.Mesh(this.pool.geo('blob', () => new THREE.CircleGeometry(.3, 20)), blob);
      this.ballBlob.rotation.x = -Math.PI / 2; this.ballBlob.position.y = .03; this.scene.add(this.ballBlob);
      this.figureFactory.figureBlob = new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: .26, depthWrite: false });
      this.pool.ownedMaterials.add(this.figureFactory.figureBlob);
    }
    this.drawingLayer.build();
    this.cameraRig = new CameraRig(sport, this.camera, this.controls, this.ball, this.figures, this.figureSize, this.reducedMotion, this.offset, this.frame);
    this.selectCamera('overview'); this.cameraRig.updateCamera(1, true);
    this.assetsReady = this.loadAssets();
  }

  private async loadAssets() {
    await Promise.all([
      loadPlayer().then(asset => {
        if (this.disposed) return;
        this.figureFactory.playerAsset = asset;
        const clip = (name: string) => asset.animations.find(c => c.name === name)!;
        this.figureFactory.sprintPhase = strideOffset(clip('Jog_Fwd_Loop'), clip('Sprint_Loop'));
        this.figures.forEach(f => this.figureFactory.releaseFigure(f)); this.figures.clear();
        // Rebuild numbered and additional players after the one shared load.
        this.equipment.forEach((entry, id) => {
          if (entry.type === 'player' || entry.type === 'opponent') { if (entry.group.userData.figure) this.figureFactory.releaseFigure(entry.group.userData.figure); this.scene.remove(entry.group); this.equipment.delete(id); }
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

  prepareDrawings(drawings: Drawing[], trails?: SceneFrame['trails']) { return this.drawingLayer.prepareDrawings(drawings, trails); }
  setDrawings(drawings: Drawing[], trails?: SceneFrame['trails']) { return this.drawingLayer.setDrawings(drawings, trails); }
  selectCamera(view: CameraView, playerId = this.cameraRig.playerId) { this.cameraRig.selectCamera(view, playerId); }
  zoom(factor: number) { this.cameraRig.zoom(factor); }
  cameraState(): CameraState { return this.cameraRig.cameraState(); }
  cameraPose(): CameraPose { return this.cameraRig.cameraPose(); }
  restoreCamera(state: CameraState) { this.cameraRig.restoreCamera(state); }

  setFrame(frame: SceneFrame, animate = true) {
    this.frame = frame; this.cameraRig.frame = frame; this.hud.frame = frame;
    this.hud.setPhase(frame.phaseName, frame.stickyNote);
    this.hud.layoutHud();
    const ids = new Set(frame.players.map(p => p.id));
    this.figures.forEach((f, id) => { if (!ids.has(id)) { this.figureFactory.releaseFigure(f); this.figures.delete(id); } });
    for (const p of frame.players) {
      const kit = this.playerStyle === 'kit' || p.family === 'gk' ? KIT_COLORS[p.family] : this.chipKit;
      const signature = `${kit.fill}/${p.num}/${p.name}/${p.label}`;
      let f = this.figures.get(p.id);
      const pos = boardToWorld(p.position, this.sport);
      if (!f || f.signature !== signature) {
        const old = f;
        f = this.figureFactory.figure(kit.fill, String(p.num), p.name, kit.fg, p.label); f.signature = signature;
        // A changed name or kit keeps where the figure stands and faces.
        if (old) { f.group.position.copy(old.group.position); f.heading = old.heading; f.group.rotation.y = old.group.rotation.y; this.figureFactory.releaseFigure(old); }
        else f.group.position.set(pos.x, 0, pos.z);
        this.figures.set(p.id, f); this.scene.add(f.group);
      }
      f.target.set(pos.x, 0, pos.z);
      if (f.displaced) f.displaced.visible = !!p.outOfPos;
      if (!animate) { f.group.position.copy(f.target); f.motion = 0; f.speed = 0; }
    }
    const itemIds = new Set(frame.items.map(i => i.id));
    this.equipment.forEach((e, id) => { if (!itemIds.has(id)) { if (e.group.userData.figure) this.figureFactory.releaseFigure(e.group.userData.figure); this.scene.remove(e.group); this.equipment.delete(id); } });
    for (const item of frame.items) {
      let entry = this.equipment.get(item.id);
      const p = item.type === 'ball' ? ballToWorld(item.position, this.sport, BALL_RADIUS) : boardToWorld(item.position, this.sport);
      const fresh = !entry || entry.type !== item.type;
      if (!entry || fresh) {
        if (entry) {
          if (entry.group.userData.figure) this.figureFactory.releaseFigure(entry.group.userData.figure);
          this.scene.remove(entry.group);
        }
        entry = { type: item.type, group: equipmentGroup(item, this.pool, this.figureFactory, this.pitch, this.chipKit, this.figureSize), target: new THREE.Vector3(), turn: 0 }; this.equipment.set(item.id, entry); this.scene.add(entry.group);
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
      if (figure) this.figureFactory.animateFigure(figure, dt, velocity);
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

  resize(width: number, height: number, pixelRatio?: number) {
    if (pixelRatio !== undefined) this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(Math.max(1, width), Math.max(1, height), false);
    this.camera.aspect = width / Math.max(1, height); this.camera.updateProjectionMatrix();
    this.hud.layoutHud();
  }
  render(dt: number, snap = false, pose?: CameraPose) {
    this.advance(dt, snap);
    this.figures.forEach(f => {
      const delta = Math.atan2(Math.sin(f.heading - f.group.rotation.y), Math.cos(f.heading - f.group.rotation.y));
      f.group.rotation.y += delta * (snap ? 1 : 1 - Math.exp(-dt * 14));
      const swing = this.reducedMotion ? 0 : Math.sin(f.stride) * .65 * f.motion;
      f.limbs.forEach((limb, i) => { limb.rotation.x = swing * (i === 0 || i === 3 ? 1 : -1); });
      f.motion *= Math.exp(-dt * 4);
      this.figureFactory.animateFigure(f, dt, f.speed);
      f.group.visible = true;
    });
    this.cameraRig.updateCamera(dt, snap);
    // Fullscreen recordings follow the live camera's recorded path (cameraTrack.ts).
    if (pose) {
      this.camera.position.fromArray(pose.position); this.camera.quaternion.fromArray(pose.quaternion);
      this.camera.projectionMatrix.fromArray(pose.projection);
      this.camera.projectionMatrixInverse.copy(this.camera.projectionMatrix).invert();
      this.camera.updateMatrixWorld();
    }
    // In Spillerperspektiv the camera sits in the player's head; hide that figure once there.
    const pov = this.cameraRig.view === 'player' && !this.cameraRig.manual ? this.cameraRig.povFigure() : undefined;
    if (pov && pov.group.position.distanceTo(this.camera.position) < 2.5 * this.figureSize) pov.group.visible = false;
    this.renderer.render(this.scene, this.camera);
    this.hud.render();
  }
  dispose() {
    this.disposed = true; this.drawingLayer.disposed = true; this.controls.removeEventListener('start', this.onManual); this.controls.dispose();
    this.figures.forEach(f => this.figureFactory.releaseFigure(f));
    this.equipment.forEach(e => { if (e.group.userData.figure) this.figureFactory.releaseFigure(e.group.userData.figure); });
    this.drawingLayer.disposeLabels();
    this.hud.dispose();
    this.environment?.dispose();
    this.drawingLayer.dispose();
    this.pool.dispose();
    this.scene.clear(); this.renderer.dispose(); this.renderer.forceContextLoss();
  }
}
