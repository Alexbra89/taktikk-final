import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';

// Shared source assets survive view switches and are also used by the export scene.
// Only the three useful clips are retained; geometry is shared by all skeletons.
let player: Promise<GLTF> | undefined;
let sky: Promise<THREE.DataTexture> | undefined;
export function loadPlayer() {
  return player ??= new GLTFLoader().loadAsync('/models/spiller.glb').then(gltf => {
    gltf.animations = gltf.animations.filter(c => ['Idle_Loop', 'Jog_Fwd_Loop', 'Sprint_Loop'].includes(c.name));
    // Remove horizontal root motion: the board's phase clock owns the position.
    for (const clip of gltf.animations) {
      clip.optimize();
      // The library keys every bone's position/scale on every frame. Omit
      // tracks identical to the bind pose (especially the fingers) on mobile.
      clip.tracks = clip.tracks.filter(track => {
        const split = track.name.lastIndexOf('.'), node = gltf.scene.getObjectByName(track.name.slice(0, split));
        const property = track.name.slice(split + 1);
        if (!node || (property !== 'position' && property !== 'scale')) return true;
        const rest = node[property].toArray();
        return Array.from(track.values).some((value, i) => Math.abs(value - rest[i % 3]) > .00001);
      });
      for (const track of clip.tracks) {
        if (/^(root|Root|Armature)\.position$/.test(track.name)) {
          for (let i = 0; i < track.values.length; i += 3) {
            track.values[i] = track.values[0]; track.values[i + 2] = track.values[2];
          }
        }
      }
    }
    return gltf;
  });
}
export function loadSky() { return sky ??= new RGBELoader().loadAsync('/models/himmel.hdr'); }

export function clonePlayer(source: GLTF, kit: THREE.MeshStandardMaterial) {
  const model = clone(source.scene);
  model.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    object.material = kit;
    object.castShadow = true; object.receiveShadow = true;
    // Animated limbs can leave the bind-pose bounds.
    object.frustumCulled = false;
  });
  return model;
}

/** The supplied CC0 mannequin has a single body material, not separate clothes.
 * Colour regions use bind-pose coordinates, so the kit follows the skinning. */
export function kitMaterial(color: string) {
  const material = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .85 });
  material.onBeforeCompile = shader => {
    shader.uniforms.kitColor = { value: new THREE.Color(color) };
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 kitPosition;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nkitPosition = position;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 kitPosition;\nuniform vec3 kitColor;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        vec3 outfit = kitColor;
        if (kitPosition.y > 1.53 || (abs(kitPosition.x) > .48 && kitPosition.y > 1.0)) outfit = vec3(.62, .36, .22);
        if (kitPosition.y < .88 && kitPosition.y > .48) outfit = vec3(.025, .04, .065);
        if (kitPosition.y < .12) outfit = vec3(.012, .018, .025);
        diffuseColor.rgb *= outfit;`);
  };
  material.customProgramCacheKey = () => 'football-kit-v1';
  return material;
}
