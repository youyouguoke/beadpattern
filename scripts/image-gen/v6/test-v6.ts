import { mkdir, writeFile } from 'fs/promises';
import * as path from 'node:path';
import { compose } from './composer.js';
import { renderGrid, canvasToPngBuffer, gridToSvg } from './renderer.js';
import type { CharacterConfig, PatternMetadata } from './types.js';

const catPoses: { pose: CharacterConfig['body']['pose']; face: CharacterConfig['face']; earAngle: CharacterConfig['body']['earAngle']; headTilt: number; accessory: CharacterConfig['accessory'] }[] = [
  { pose: 'sitting', face: { eye: 'cute', eyeDirection: 'front', mouth: 'w', blush: true, expression: 'happy' }, earAngle: 'relaxed', headTilt: 0, accessory: 'bow' },
  { pose: 'sleeping', face: { eye: 'sleepy', eyeDirection: 'front', mouth: 'small', blush: false, expression: 'sleepy' }, earAngle: 'relaxed', headTilt: 0, accessory: 'none' },
  { pose: 'stretching', face: { eye: 'curious', eyeDirection: 'up', mouth: 'small', blush: true, expression: 'curious' }, earAngle: 'alert', headTilt: 1, accessory: 'none' },
  { pose: 'playful', face: { eye: 'happy', eyeDirection: 'left', mouth: 'open', blush: true, expression: 'happy' }, earAngle: 'curious', headTilt: -1, accessory: 'none' },
  { pose: 'waving', face: { eye: 'cute', eyeDirection: 'right', mouth: 'smile', blush: true, expression: 'happy' }, earAngle: 'alert', headTilt: 0, accessory: 'none' },
  { pose: 'holding', face: { eye: 'curious', eyeDirection: 'front', mouth: 'w', blush: false, expression: 'curious' }, earAngle: 'curious', headTilt: 1, accessory: 'none' },
  { pose: 'eating', face: { eye: 'happy', eyeDirection: 'down', mouth: 'open', blush: true, expression: 'happy' }, earAngle: 'relaxed', headTilt: 0, accessory: 'none' },
  { pose: 'curled', face: { eye: 'sleepy', eyeDirection: 'front', mouth: 'small', blush: false, expression: 'sleepy' }, earAngle: 'relaxed', headTilt: 0, accessory: 'none' },
  { pose: 'jumping', face: { eye: 'happy', eyeDirection: 'up', mouth: 'open', blush: true, expression: 'happy' }, earAngle: 'alert', headTilt: 0, accessory: 'none' },
  { pose: 'happy', face: { eye: 'happy', eyeDirection: 'front', mouth: 'smile', blush: true, expression: 'happy' }, earAngle: 'alert', headTilt: 0, accessory: 'flower' },
];

const foxPoses: { pose: CharacterConfig['body']['pose']; face: CharacterConfig['face']; earAngle: CharacterConfig['body']['earAngle']; headTilt: number; accessory: CharacterConfig['accessory'] }[] = [
  { pose: 'sitting', face: { eye: 'cute', eyeDirection: 'front', mouth: 'w', blush: false, expression: 'happy' }, earAngle: 'alert', headTilt: 0, accessory: 'none' },
  { pose: 'sleeping', face: { eye: 'sleepy', eyeDirection: 'front', mouth: 'small', blush: false, expression: 'sleepy' }, earAngle: 'relaxed', headTilt: 0, accessory: 'none' },
  { pose: 'running', face: { eye: 'curious', eyeDirection: 'right', mouth: 'small', blush: false, expression: 'curious' }, earAngle: 'alert', headTilt: 1, accessory: 'none' },
  { pose: 'playful', face: { eye: 'happy', eyeDirection: 'left', mouth: 'open', blush: false, expression: 'happy' }, earAngle: 'curious', headTilt: -1, accessory: 'none' },
  { pose: 'waving', face: { eye: 'cute', eyeDirection: 'right', mouth: 'smile', blush: false, expression: 'happy' }, earAngle: 'alert', headTilt: 0, accessory: 'none' },
  { pose: 'holding', face: { eye: 'curious', eyeDirection: 'front', mouth: 'w', blush: false, expression: 'curious' }, earAngle: 'curious', headTilt: 1, accessory: 'none' },
  { pose: 'eating', face: { eye: 'happy', eyeDirection: 'down', mouth: 'open', blush: false, expression: 'happy' }, earAngle: 'relaxed', headTilt: 0, accessory: 'none' },
  { pose: 'curled', face: { eye: 'sleepy', eyeDirection: 'front', mouth: 'small', blush: false, expression: 'sleepy' }, earAngle: 'relaxed', headTilt: 0, accessory: 'none' },
  { pose: 'jumping', face: { eye: 'happy', eyeDirection: 'up', mouth: 'open', blush: false, expression: 'happy' }, earAngle: 'alert', headTilt: 0, accessory: 'none' },
  { pose: 'happy', face: { eye: 'happy', eyeDirection: 'front', mouth: 'smile', blush: false, expression: 'happy' }, earAngle: 'alert', headTilt: 0, accessory: 'scarf' },
];

async function main() {
  const outDir = path.resolve('./output');
  await mkdir(outDir, { recursive: true });

  const summary: PatternMetadata[] = [];
  const tests: { animal: 'cat' | 'fox'; pose: any; face: any; earAngle: any; headTilt: number; accessory: any }[] = [];
  for (const p of catPoses) tests.push({ animal: 'cat', ...p });
  for (const p of foxPoses) tests.push({ animal: 'fox', ...p });

  for (const test of tests) {
    const config: CharacterConfig = {
      gridSize: 48,
      animal: test.animal,
      palette: test.animal === 'cat' ? 'tabby-cat' : 'red-fox',
      body: { pose: test.pose, headTilt: test.headTilt, earAngle: test.earAngle },
      face: test.face,
      accessory: test.accessory,
    };

    const result = compose(config);
    const slug = `${test.animal}-${test.pose}`;
    const title = `${test.animal} ${test.pose}`.replace(/\b\w/g, c => c.toUpperCase());

    const canvas = renderGrid(result.grid, result.palette, { beadSize: 10, gap: 1, bgColor: '#ffffff' });
    const png = canvasToPngBuffer(canvas);
    const svg = gridToSvg(result.grid, result.palette, 12);

    await writeFile(path.join(outDir, `${slug}.png`), png);
    await writeFile(path.join(outDir, `${slug}.json`), JSON.stringify(result, null, 2));
    await writeFile(path.join(outDir, `${slug}.svg`), svg);

    summary.push({ slug, title, colors: result.colorMap.length - 1, palette: result.palette.name, animal: test.animal, pose: test.pose });
  }

  await writeFile(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log(`Generated ${tests.length} Golden Collection patterns.`);
  for (const s of summary) console.log(`- ${s.title} (${s.colors} colors) ${path.join(outDir, `${s.slug}.png`)}`);
}

main().catch(console.error);
