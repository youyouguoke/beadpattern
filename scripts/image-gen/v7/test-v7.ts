import { mkdir, writeFile } from 'fs/promises';
import * as path from 'node:path';
import { compose } from './composer.js';
import { renderGrid, canvasToPngBuffer } from './renderer.js';
import type { CharacterConfig, PatternMetadata } from './types.js';

const poses: PoseTest[] = [
  { pose: 'sitting', face: { eye: 'cute', eyeDirection: 'front', mouth: 'w', blush: true }, accessory: 'bow' },
  { pose: 'loaf', face: { eye: 'sleepy', eyeDirection: 'front', mouth: 'small', blush: false }, accessory: 'none' },
  { pose: 'sleeping', face: { eye: 'sleepy', eyeDirection: 'front', mouth: 'small', blush: false }, accessory: 'none' },
  { pose: 'stretching', face: { eye: 'curious', eyeDirection: 'up', mouth: 'small', blush: true }, accessory: 'none' },
  { pose: 'playing-yarn', face: { eye: 'curious', eyeDirection: 'left', mouth: 'open', blush: true }, accessory: 'none' },
  { pose: 'washing-face', face: { eye: 'happy', eyeDirection: 'right', mouth: 'w', blush: true }, accessory: 'none' },
  { pose: 'waving', face: { eye: 'happy', eyeDirection: 'right', mouth: 'w', blush: true }, accessory: 'none' },
  { pose: 'jumping', face: { eye: 'happy', eyeDirection: 'up', mouth: 'open', blush: true }, accessory: 'none' },
  { pose: 'curled', face: { eye: 'sleepy', eyeDirection: 'front', mouth: 'small', blush: false }, accessory: 'none' },
  { pose: 'eating', face: { eye: 'happy', eyeDirection: 'down', mouth: 'open', blush: true }, accessory: 'none' },
];

interface PoseTest {
  pose: CharacterConfig['pose'];
  face: CharacterConfig['face'];
  accessory: CharacterConfig['accessory'];
}

async function main() {
  const outDir = path.resolve('./output');
  await mkdir(outDir, { recursive: true });

  const summary: PatternMetadata[] = [];

  // Silhouette only first
  for (const test of poses) {
    const config: CharacterConfig = { gridSize: 48, animal: 'cat', pose: test.pose, face: test.face, accessory: test.accessory };
    const result = compose(config, 'silhouette');
    const slug = `cat-${test.pose}-silhouette`;
    const canvas = renderGrid(result.grid, result.palette, { beadSize: 10, gap: 1, silhouette: true });
    await writeFile(path.join(outDir, `${slug}.png`), canvasToPngBuffer(canvas));
  }

  // Full color
  for (const test of poses) {
    const config: CharacterConfig = { gridSize: 48, animal: 'cat', pose: test.pose, face: test.face, accessory: test.accessory };
    const result = compose(config, 'full');
    const slug = `cat-${test.pose}`;
    const title = `Cat ${test.pose}`.replace(/\b\w/g, c => c.toUpperCase());
    const canvas = renderGrid(result.grid, result.palette, { beadSize: 10, gap: 1 });
    await writeFile(path.join(outDir, `${slug}.png`), canvasToPngBuffer(canvas));
    await writeFile(path.join(outDir, `${slug}.json`), JSON.stringify(result, null, 2));
    summary.push({ slug, title, colors: result.colorMap.length - 1, animal: 'cat', pose: test.pose });
  }

  await writeFile(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log(`Generated ${poses.length} silhouette + full cat prototypes.`);
}

main().catch(console.error);
