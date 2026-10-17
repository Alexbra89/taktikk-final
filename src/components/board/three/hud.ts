/** Draws and lays out the export phase pill and playback progress overlay. */
import * as THREE from 'three';
import { phaseTexture, PHASE_PILL_WIDTH } from './textures';
import type { ResourcePool } from './resourcePool';
import type { SceneFrame } from './BoardScene';

export class Hud {
  private hud = new THREE.Scene();
  private hudCamera = new THREE.OrthographicCamera(0, 1, 1, 0, -1, 1);
  private phasePanel = new THREE.Sprite(new THREE.SpriteMaterial({ depthTest: false, toneMapped: false }));
  private phaseKey = '';
  private progressBar?: THREE.Mesh;

  constructor(
    private readonly renderer: THREE.WebGLRenderer,
    pool: ResourcePool,
    chipKit: { fill: string; fg: string },
    private readonly exportMode: boolean,
    public frame: SceneFrame,
  ) {
    this.hud.add(this.phasePanel); this.phasePanel.center.set(0, 1); this.phasePanel.visible = false;
    const progressMaterial = new THREE.MeshBasicMaterial({ color: chipKit.fill, depthTest: false, toneMapped: false });
    pool.ownedMaterials.add(progressMaterial);
    this.progressBar = new THREE.Mesh(pool.geo('hud-progress', () => new THREE.PlaneGeometry(1, 4)), progressMaterial);
    this.hud.add(this.progressBar); this.progressBar.visible = false;
  }

  /** Only the video draws the phase into WebGL; the live view shows a tappable pill in the page (Board3D). */
  setPhase(name = '', note = '') {
    if (!this.exportMode) return;
    const key = JSON.stringify([name, note]); if (key === this.phaseKey) return;
    this.phaseKey = key;
    const material = this.phasePanel.material;
    material.map?.dispose(); material.map = phaseTexture(name, note); material.needsUpdate = true;
    this.phasePanel.visible = !!(name || note); this.layoutHud();
  }
  layoutHud() {
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

  render() {
    this.renderer.autoClear = false; this.renderer.clearDepth(); this.renderer.render(this.hud, this.hudCamera); this.renderer.autoClear = true;
  }

  dispose() {
    this.phasePanel.material.map?.dispose(); this.phasePanel.material.dispose(); this.hud.clear();
  }
}
