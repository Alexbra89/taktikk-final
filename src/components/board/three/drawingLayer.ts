/** Decodes and caches drawing textures and manages camera-facing drawing labels. */
import * as THREE from 'three';
import { VW, VH } from '@/data/formations';
import type { Drawing, Sport } from '@/types';
import type { SceneFrame } from './BoardScene';
import { PITCHES, boardToWorld } from './coordinates';
import { drawingTexture, textTexture, themeColor } from './textures';
import { DrawingCache } from './drawingCache';
import { drawingColorKey } from '../drawTools';
import type { ResourcePool } from './resourcePool';

export class DrawingLayer {
  readonly labels = new THREE.Group();
  private labelResources: (THREE.Material | THREE.Texture)[] = [];
  private drawingLabelKey = '';
  private readonly drawingCache: DrawingCache<THREE.Texture>;
  private readonly drawingResolution: number;
  private markings!: THREE.Mesh;
  private currentDrawingKey = '';
  disposed = false;

  constructor(
    private readonly sport: Sport,
    private readonly scene: THREE.Scene,
    private readonly figureSize: number,
    private readonly pool: ResourcePool,
    mobile: boolean,
  ) {
    this.drawingCache = new DrawingCache<THREE.Texture>(mobile ? 3 : 6, () => this.currentDrawingKey);
    this.drawingResolution = mobile ? 2 : 3;
  }

  build() {
    const p = PITCHES[this.sport];
    const mat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2 });
    this.pool.ownedMaterials.add(mat);
    this.markings = new THREE.Mesh(this.pool.geo('drawing-plane', () => new THREE.PlaneGeometry(p.length * VW / (VW - 64), p.width * VH / (VH - 64))), mat);
    this.markings.rotation.x = -Math.PI / 2; this.markings.position.y = 0.035; this.markings.visible = false;
    this.scene.add(this.markings);
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

  disposeLabels() {
    this.labelResources.forEach(r => r.dispose());
  }

  dispose() {
    this.drawingCache.dispose();
  }
}
