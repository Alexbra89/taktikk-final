/** Shared scene geometry, materials and textures, with their original disposal order. */
import * as THREE from 'three';

export class ResourcePool {
  readonly geometry = new Map<string, THREE.BufferGeometry>();
  readonly materials = new Map<string, THREE.MeshStandardMaterial>();
  readonly lineMaterials = new Map<string, THREE.LineBasicMaterial>();
  readonly ownedMaterials = new Set<THREE.Material>();
  readonly textures = new Set<THREE.Texture>();

  geo(key: string, make: () => THREE.BufferGeometry) {
    if (!this.geometry.has(key)) this.geometry.set(key, make());
    return this.geometry.get(key)!;
  }
  mat(color: string) {
    if (!this.materials.has(color)) this.materials.set(color, new THREE.MeshStandardMaterial({ color, roughness: 0.86 }));
    return this.materials.get(color)!;
  }
  box(parent: THREE.Object3D, x: number, y: number, z: number, w: number, h: number, d: number, color: string) {
    const mesh = new THREE.Mesh(this.geo('box', () => new THREE.BoxGeometry(1, 1, 1)), this.mat(color));
    mesh.position.set(x, y, z); mesh.scale.set(w, h, d); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  sphere(parent: THREE.Object3D, x: number, y: number, z: number, radius: number, color: string) {
    const mesh = new THREE.Mesh(this.geo('sphere', () => new THREE.SphereGeometry(1, 12, 8)), this.mat(color));
    mesh.position.set(x, y, z); mesh.scale.setScalar(radius); mesh.castShadow = true; parent.add(mesh); return mesh;
  }
  lines(parent: THREE.Object3D, points: number[], color: string, opacity: number, key: string) {
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

  dispose() {
    this.geometry.forEach(g => g.dispose()); this.materials.forEach(m => m.dispose());
    this.ownedMaterials.forEach(m => m.dispose()); this.textures.forEach(t => t.dispose());
  }
}
