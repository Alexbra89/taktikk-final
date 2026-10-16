import { test, expect } from '@playwright/test';
import type { Camera, Mesh, Scene, WebGLRenderer } from 'three';

declare global {
  interface Window {
    __THREE_DEVTOOLS__: EventTarget;
    __pitchRender?: { renderer: WebGLRenderer; scene: Scene; camera: Camera; render: WebGLRenderer['render'] };
  }
}

for (const mobile of [true, false]) {
  test(`pitch surfaces stay separate while orbiting and zooming (${mobile ? 'mobile' : 'desktop'})`, async ({ page }, info) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error' && /THREE|WebGL|shader/i.test(message.text())) errors.push(message.text());
    });
    await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1400, height: 900 });
    // Three's devtools hook lets the test inspect actual rendered geometry;
    // no test-only hooks or scene access are added to the application.
    await page.addInitScript(() => {
      window.__THREE_DEVTOOLS__ = new EventTarget();
      window.__THREE_DEVTOOLS__.addEventListener('observe', event => {
        const renderer = (event as CustomEvent).detail as WebGLRenderer;
        if (!(renderer as WebGLRenderer & { isWebGLRenderer?: boolean }).isWebGLRenderer) return;
        const render = renderer.render.bind(renderer);
        renderer.render = (scene, camera) => {
          if ((camera as Camera & { isPerspectiveCamera?: boolean }).isPerspectiveCamera) {
            window.__pitchRender = { renderer, scene: scene as Scene, camera, render };
          }
          render(scene, camera);
        };
      });
    });
    await page.goto('/');
    await page.getByRole('navigation', { name: 'Hovedmeny' }).getByRole('button', { name: 'Taktikk', exact: true }).click();
    const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('taktikkboard-storage')!).state.tactics);
    const before = await saved();
    await page.getByRole('button', { name: '3D', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Oversikt', exact: true })).toBeEnabled({ timeout: 45_000 });
    await expect(page.getByText('Laster spillermodell og himmel …', { exact: true })).toHaveCount(0, { timeout: 45_000 });
    await page.waitForFunction(() => window.__pitchRender);
    const result = await page.evaluate(() => {
      const { renderer, scene, camera, render } = window.__pitchRender!;
      const meshes = scene.children.filter(object => (object as Mesh).isMesh) as Mesh[];
      const turf = meshes.find(mesh => !Array.isArray(mesh.material) && 'bumpMap' in mesh.material && mesh.material.bumpMap)!;
      const surrounds = meshes.filter(mesh => !Array.isArray(mesh.material) && 'color' in mesh.material &&
        (mesh.material as import('three').MeshStandardMaterial).color.getHexString() === '21452e');
      const width = (turf.geometry as import('three').PlaneGeometry).parameters.width;
      const height = (turf.geometry as import('three').PlaneGeometry).parameters.height;
      const overlappingFloors = surrounds.filter(mesh =>
        Math.abs(mesh.position.x) < (width + mesh.scale.x) / 2 - .0001 &&
        Math.abs(mesh.position.z) < (height + mesh.scale.z) / 2 - .0001).length;
      const material = turf.material as import('three').MeshStandardMaterial;
      const gl = renderer.getContext();
      const read = () => {
        render(scene, camera);
        const pixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
        gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        return pixels;
      };
      const samples = [];
      // Low angles on both sides of the stands, at several zoom distances.
      for (const pose of [[70, 4, 25], [50, 8, 50], [0, 4, -65]]) {
        camera.position.set(pose[0], pose[1], pose[2]); camera.lookAt(0, 0, 0); camera.updateMatrixWorld();
        const visible = read();
        surrounds.forEach(mesh => { mesh.visible = false; });
        const hidden = read();
        surrounds.forEach(mesh => { mesh.visible = true; });
        const ray = camera.position.clone(); let checked = 0, changed = 0;
        for (let y = 0; y < gl.drawingBufferHeight; y++) for (let x = 0; x < gl.drawingBufferWidth; x++) {
          ray.set((x + .5) / gl.drawingBufferWidth * 2 - 1, (y + .5) / gl.drawingBufferHeight * 2 - 1, .5)
            .unproject(camera).sub(camera.position).normalize();
          if (ray.y >= 0) continue;
          const distance = -camera.position.y / ray.y;
          if (Math.abs(camera.position.x + ray.x * distance) > width / 2 - 8 ||
              Math.abs(camera.position.z + ray.z * distance) > height / 2 - 8) continue;
          checked++;
          const i = (y * gl.drawingBufferWidth + x) * 4;
          if (Math.abs(visible[i] - hidden[i]) + Math.abs(visible[i + 1] - hidden[i + 1]) + Math.abs(visible[i + 2] - hidden[i + 2]) > 6) changed++;
        }
        samples.push({ checked, changed });
      }
      return {
        overlappingFloors, surrounds: surrounds.length, samples,
        depthRange: (camera as import('three').PerspectiveCamera).far / (camera as import('three').PerspectiveCamera).near,
        shadows: renderer.shadowMap.enabled,
        mipmaps: material.map!.generateMipmaps,
        anisotropy: material.map!.anisotropy,
        expectedAnisotropy: Math.min(8, renderer.capabilities.getMaxAnisotropy()),
      };
    });
    expect(result.surrounds).toBeGreaterThan(0);
    expect(result.overlappingFloors).toBe(0);
    expect(result.depthRange).toBeLessThanOrEqual(1000);
    expect(result.shadows).toBe(!mobile);
    expect(result.mipmaps).toBe(true);
    expect(result.anisotropy).toBe(result.expectedAnisotropy);
    for (const sample of result.samples) {
      expect(sample.checked).toBeGreaterThan(1000);
      expect(sample.changed).toBe(0);
    }
    await page.screenshot({ path: info.outputPath('pitch-after-camera-sweep.png') });
    await page.getByRole('button', { name: '2D', exact: true }).click();
    expect(await saved()).toEqual(before);
    expect(errors).toEqual([]);
  });
}
