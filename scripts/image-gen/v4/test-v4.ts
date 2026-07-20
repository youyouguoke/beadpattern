import { mkdir, writeFile } from 'fs/promises';
import * as path from 'node:path';
import { compose } from './composer.js';
import { renderGrid, canvasToPngBuffer, gridToSvg } from './renderer.js';
import type { CharacterConfig, PatternMetadata } from './types.js';

const tests: CharacterConfig[] = [
  {
    gridSize: 48,
    animal: 'cat',
    palette: 'gray-cat',
    body: { style: 'cute', headRatio: 0.55, bodyRatio: 0.45, shoulderWidth: 1, torsoHeight: 0, armPosition: 'front', legPosition: 'sitting', pose: 'idle' },
    face: { eye: 'cute', mouth: 'cat_mouth', blush: true },
    style: { style: 'premium', lineWeight: 'medium', shading: 'soft', beadGloss: true },
    ear: 'pointed',
    tail: 'long',
    accessory: 'bow',
  },
  {
    gridSize: 48,
    animal: 'cat',
    palette: 'orange-cat',
    body: { style: 'cute', headRatio: 0.55, bodyRatio: 0.45, shoulderWidth: 1, torsoHeight: 0, armPosition: 'up', legPosition: 'sitting', pose: 'happy' },
    face: { eye: 'happy', mouth: 'smile', blush: true },
    style: { style: 'premium', lineWeight: 'medium', shading: 'soft', beadGloss: true },
    ear: 'pointed',
    tail: 'curled',
    accessory: 'heart',
  },
  {
    gridSize: 48,
    animal: 'bunny',
    palette: 'bunny',
    body: { style: 'cute', headRatio: 0.55, bodyRatio: 0.45, shoulderWidth: 0, torsoHeight: 0, armPosition: 'front', legPosition: 'tucked', pose: 'idle' },
    face: { eye: 'cute', mouth: 'w', blush: true },
    style: { style: 'kawaii', lineWeight: 'medium', shading: 'soft', beadGloss: true },
    ear: 'long',
    tail: 'fluffy',
    accessory: 'flower',
  },
  {
    gridSize: 48,
    animal: 'bunny',
    palette: 'bunny',
    body: { style: 'cute', headRatio: 0.55, bodyRatio: 0.45, shoulderWidth: 0, torsoHeight: 0, armPosition: 'waving', legPosition: 'tucked', pose: 'happy' },
    face: { eye: 'happy', mouth: 'smile', blush: true },
    style: { style: 'kawaii', lineWeight: 'medium', shading: 'soft', beadGloss: true },
    ear: 'long',
    tail: 'fluffy',
    accessory: 'bow',
  },
  {
    gridSize: 48,
    animal: 'fox',
    palette: 'fox',
    body: { style: 'detailed', headRatio: 0.50, bodyRatio: 0.50, shoulderWidth: 1, torsoHeight: 1, armPosition: 'front', legPosition: 'sitting', pose: 'idle' },
    face: { eye: 'cute', mouth: 'w', blush: false, markings: 'mask' },
    style: { style: 'premium', lineWeight: 'medium', shading: 'bold', beadGloss: true },
    ear: 'pointed',
    tail: 'fluffy',
    accessory: 'none',
  },
  {
    gridSize: 48,
    animal: 'fox',
    palette: 'fox',
    body: { style: 'detailed', headRatio: 0.50, bodyRatio: 0.50, shoulderWidth: 1, torsoHeight: 1, armPosition: 'up', legPosition: 'sitting', pose: 'happy' },
    face: { eye: 'happy', mouth: 'smile', blush: true },
    style: { style: 'premium', lineWeight: 'medium', shading: 'bold', beadGloss: true },
    ear: 'pointed',
    tail: 'fluffy',
    accessory: 'flower',
  },
  {
    gridSize: 48,
    animal: 'panda',
    palette: 'panda',
    body: { style: 'chubby', headRatio: 0.55, bodyRatio: 0.45, shoulderWidth: 2, torsoHeight: 1, armPosition: 'holding', legPosition: 'sitting', pose: 'holding' },
    face: { eye: 'sleepy', mouth: 'cat_mouth', blush: false },
    style: { style: 'premium', lineWeight: 'medium', shading: 'soft', beadGloss: true },
    ear: 'rounded',
    tail: 'short',
    accessory: 'bamboo',
  },
  {
    gridSize: 48,
    animal: 'panda',
    palette: 'panda',
    body: { style: 'chubby', headRatio: 0.55, bodyRatio: 0.45, shoulderWidth: 2, torsoHeight: 1, armPosition: 'front', legPosition: 'sitting', pose: 'idle' },
    face: { eye: 'cute', mouth: 'small', blush: true },
    style: { style: 'premium', lineWeight: 'medium', shading: 'soft', beadGloss: true },
    ear: 'rounded',
    tail: 'short',
    accessory: 'bow',
  },
  {
    gridSize: 48,
    animal: 'bear',
    palette: 'bear',
    body: { style: 'chubby', headRatio: 0.50, bodyRatio: 0.50, shoulderWidth: 2, torsoHeight: 1, armPosition: 'front', legPosition: 'standing', pose: 'idle' },
    face: { eye: 'round', mouth: 'smile', blush: false },
    style: { style: 'premium', lineWeight: 'medium', shading: 'bold', beadGloss: true },
    ear: 'tufted',
    tail: 'short',
    accessory: 'scarf',
  },
  {
    gridSize: 48,
    animal: 'bear',
    palette: 'bear',
    body: { style: 'chubby', headRatio: 0.50, bodyRatio: 0.50, shoulderWidth: 2, torsoHeight: 1, armPosition: 'waving', legPosition: 'standing', pose: 'happy' },
    face: { eye: 'happy', mouth: 'smile', blush: true },
    style: { style: 'premium', lineWeight: 'medium', shading: 'bold', beadGloss: true },
    ear: 'tufted',
    tail: 'short',
    accessory: 'hat',
  },
];

async function main() {
  const outDir = path.resolve('./output');
  await mkdir(outDir, { recursive: true });

  const summary: PatternMetadata[] = [];

  for (const config of tests) {
    const result = compose(config);
    const slug = `${config.animal}-${config.body.pose}-${config.palette}`;
    const title = `${config.animal} ${config.body.pose}`.replace(/\b\w/g, c => c.toUpperCase());

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
      animal: config.animal,
      pose: config.body.pose,
      style: config.style.style,
    });
  }

  await writeFile(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log(`Generated ${tests.length} v4.0 test patterns.`);
  for (const s of summary) {
    console.log(`- ${s.title} (${s.colors} colors) ${path.join(outDir, `${s.slug}.png`)}`);
  }
}

main().catch(console.error);
