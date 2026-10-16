// Lager public/models/spiller-v2.glb fra spiller.glb: beholder bare de tre
// animasjonene appen bruker (se src/components/board/three/assets.ts) og
// fjerner data som da ikke lenger brukes.
// Kjøres fra prosjektmappa: node scripts/slank-modell.mjs [inn.glb] [ut.glb]
// Originalen er slettet fra public/models, men ligger i git-historikken:
// git show b3c7e1c:public/models/spiller.glb > spiller.glb
import { stat } from 'node:fs/promises';
import { NodeIO } from '@gltf-transform/core';
import { prune } from '@gltf-transform/functions';

const KEEP = ['Idle_Loop', 'Jog_Fwd_Loop', 'Sprint_Loop'];
const [input = 'public/models/spiller.glb', output = 'public/models/spiller-v2.glb'] = process.argv.slice(2);

const io = new NodeIO();
const document = await io.read(input);
const animations = document.getRoot().listAnimations();

const missing = KEEP.filter(name => !animations.some(animation => animation.getName() === name));
if (missing.length) throw new Error(`Fant ikke animasjonene ${missing.join(', ')} i ${input}`);

for (const animation of animations) {
  if (KEEP.includes(animation.getName())) continue;
  // Samplerne holder fast på keyframe-dataene, så prune ser dem ellers som i bruk.
  animation.listChannels().forEach(channel => channel.dispose());
  animation.listSamplers().forEach(sampler => sampler.dispose());
  animation.dispose();
}
await document.transform(prune());
await io.write(output, document);

const mb = async file => ((await stat(file)).size / 1024 / 1024).toFixed(2);
console.log(`${animations.length} animasjoner → ${document.getRoot().listAnimations().length}`);
console.log(`${input}: ${await mb(input)} MB → ${output}: ${await mb(output)} MB`);
