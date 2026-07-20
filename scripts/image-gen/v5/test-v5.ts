import { mkdir, writeFile } from 'fs/promises';
import * as path from 'node:path';
import { compose } from './composer.js';
import { renderGrid, canvasToPngBuffer, gridToSvg } from './renderer.js';
import type { CharacterConfig, PatternMetadata } from './types.js';

type PoseTest = {
  animal: CharacterConfig['animal'];
  pose: CharacterConfig['body']['pose'];
  face: CharacterConfig['face'];
  headTilt: number;
  accessory: CharacterConfig['accessory'];
};

const tests: PoseTest[] = [
  // Cat poses
  { animal: 'cat', pose: 'sitting', face: { eye: 'cute', mouth: 'w', blush: true, expression: 'happy' }, headTilt: 0, accessory: 'bow' },
  { animal: 'cat', pose: 'sleeping', face: { eye: 'sleepy', mouth: 'small', blush: false, expression: 'sleepy' }, headTilt: 0, accessory: 'none' },
  { animal: 'cat', pose: 'stretching', face: { eye: 'curious', mouth: 'small', blush: true, expression: 'curious' }, headTilt: 1, accessory: 'none' },
  { animal: 'cat', pose: 'playful', face: { eye: 'happy', mouth: 'open', blush: true, expression: 'happy' }, headTilt: -1, accessory: 'none' },
  // Fox poses
  { animal: 'fox', pose: 'sitting', face: { eye: 'cute', mouth: 'w', blush: false, expression: 'happy' }, headTilt: 0, accessory: 'none' },
  { animal: 'fox', pose: 'sleeping', face: { eye: 'sleepy', mouth: 'small', blush: false, expression: 'sleepy' }, headTilt: 0, accessory: 'none' },
  { animal: 'fox', pose: 'running', face: { eye: 'curious', mouth: 'small', blush: false, expression: 'curious' }, headTilt: 1, accessory: 'none' },
  { animal: 'fox', pose: 'playful', face: { eye: 'happy', mouth: 'open', blush: false, expression: 'happy' }, headTilt: -1, accessory: 'none' },
];

async function main() {
  const outDir = path.resolve('./output');
  await mkdir(outDir, { recursive: true });

  const summary: PatternMetadata[] = [];

  for (const test of tests) {
    const config: CharacterConfig = {
      gridSize: 48,
      animal: test.animal,
      palette: test.animal === 'cat' ? 'tabby-cat' : 'red-fox',
      body: {
        pose: test.pose,
        headTilt: test.headTilt,
        shoulderWidth: 2,
        torsoLength: 2,
        armLength: 4,
        legLength: 5,
      },
      face: test.face,
      ear: 'pointed',
      tail: test.animal === 'cat' ? 'long' : 'fluffy',
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

    summary.push({
      slug,
      title,
      colors: result.colorMap.length - 1,
      palette: result.palette.name,
      animal: test.animal,
      pose: test.pose,
    });
  }

  await writeFile(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log(`Generated ${tests.length} v5.5 master patterns.`);
  for (const s of summary) {
    console.log(`- ${s.title} (${s.colors} colors) ${path.join(outDir, `${s.slug}.png`)}`);
  }
}

main().catch(console.error);
