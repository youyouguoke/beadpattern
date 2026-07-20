import type { CharacterConfig, ComposerResult, SkeletonAnchor } from './types.js';
import { getPalette } from './palettes.js';
import { buildCatSkeleton } from './skeleton.js';
import { Grid } from './grid.js';

// v7 Pixel Character Composer
// Concept DNA → Skeleton → Silhouette → Pixel Simplifier → Color Cluster

export function compose(config: CharacterConfig, mode: 'silhouette' | 'full' = 'full'): ComposerResult {
  const palette = getPalette();
  const grid = new Grid(config.gridSize);
  const skeleton = buildCatSkeleton(config.pose, config.gridSize);

  // Step 1: Silhouette from skeleton
  drawCatSilhouette(grid, skeleton, config);

  if (mode === 'full') {
    // Step 2: Pixel simplification / color cluster
    colorizeCat(grid, skeleton, palette, config);
  }

  const used = new Set<number>();
  for (const row of grid.toArray()) for (const cell of row) if (cell > 0) used.add(cell);
  const colorMap = [0, ...Array.from(used).sort((a, b) => a - b)];
  return { grid: grid.toArray(), palette, colorMap };
}

function drawCatSilhouette(grid: Grid, s: SkeletonAnchor, config: CharacterConfig) {
  // Head (slightly tilted if needed)
  const headX = s.head.x + s.headTilt;
  grid.fillEllipse(headX, s.head.y, s.head.rx, s.head.ry, 1);
  // Ears: add to silhouette
  drawCatEars(grid, headX, s.head.y - s.head.ry, s.ear, 1);

  // Neck fusion into shoulder/chest (no visible neck gap)
  grid.fillEllipse(s.neck.x, s.neck.y + 1, Math.floor(s.head.rx * 0.7), 2, 1);

  // Spine connector
  grid.drawThickLine(s.spine.x1, s.spine.y1, s.spine.x2, s.spine.y2, 1, 3);

  // Chest
  grid.fillEllipse(s.chest.x, s.chest.y, s.chest.rx, s.chest.ry, 1);

  // Hip
  grid.fillEllipse(s.hip.x, s.hip.y, s.hip.rx, s.hip.ry, 1);

  // Front legs: distinct paws, not just blob
  for (const leg of s.frontLegs) {
    grid.fillEllipse(leg.x, leg.y + leg.len / 2, 2, leg.len / 2, 1);
    grid.fillEllipse(leg.x, leg.y + leg.len - 1, 3, 2, 1); // paw
  }

  // Hind legs: critical for cat silhouette
  for (const leg of s.hindLegs) {
    if (leg.angle === 'out') {
      // Thigh sticking out (cat sitting)
      grid.fillEllipse(leg.x, leg.y, 4, 5, 1);
      grid.fillEllipse(leg.x, leg.y + leg.len - 2, 2, 3, 1); // lower leg
      grid.fillEllipse(leg.x, leg.y + leg.len - 1, 3, 2, 1); // paw
    } else if (leg.angle === 'back') {
      grid.fillEllipse(leg.x, leg.y, 3, 5, 1);
      grid.fillEllipse(leg.x, leg.y + leg.len - 1, 3, 2, 1);
    } else {
      // tucked
      grid.fillEllipse(leg.x, leg.y, 3, 3, 1);
    }
  }

  // Tail: shape-driven
  drawCatTailSilhouette(grid, s, 1);
}

function drawCatEars(grid: Grid, headX: number, headTop: number, ear: { angle: string; height: number }, color: number) {
  const h = ear.height;
  let leftTip = { x: headX - 4, y: headTop - h };
  let rightTip = { x: headX + 4, y: headTop - h };
  if (ear.angle === 'flat') {
    leftTip = { x: headX - 5, y: headTop - 1 }; rightTip = { x: headX + 5, y: headTop - 1 };
  } else if (ear.angle === 'alert') {
    leftTip = { x: headX - 5, y: headTop - h - 1 }; rightTip = { x: headX + 5, y: headTop - h - 1 };
  } else if (ear.angle === 'curious') {
    leftTip = { x: headX - 6, y: headTop - h }; rightTip = { x: headX + 5, y: headTop - h - 1 };
  }
  // Left ear
  grid.drawThickLine(headX - 2, headTop + 1, leftTip.x, leftTip.y, color, 2);
  grid.drawThickLine(headX - 2, headTop + 1, headX - 5, headTop + 2, color, 2);
  // Right ear
  grid.drawThickLine(headX + 2, headTop + 1, rightTip.x, rightTip.y, color, 2);
  grid.drawThickLine(headX + 2, headTop + 1, headX + 5, headTop + 2, color, 2);
}

function drawCatTailSilhouette(grid: Grid, s: SkeletonAnchor, color: number) {
  const { baseX, baseY, shape } = s.tail;
  const cx = s.chest.x;
  if (shape === 'wrap') {
    // Tail wraps around body contour
    for (let i = 0; i < 12; i++) {
      const tx = baseX + Math.floor(Math.cos(i / 12 * Math.PI) * 8) - 4;
      const ty = baseY - 3 + Math.floor(Math.sin(i / 12 * Math.PI) * 4);
      grid.fillEllipse(tx, ty, 2, 2, color);
    }
  } else if (shape === 'up') {
    // Tail up excited
    grid.drawThickLine(baseX, baseY, baseX + 2, baseY - 12, color, 3);
    grid.fillEllipse(baseX + 2, baseY - 13, 3, 3, color);
  } else if (shape === 'straight') {
    // Streamlined behind
    grid.drawThickLine(baseX, baseY, baseX + 12, baseY - 2, color, 3);
    grid.fillEllipse(baseX + 12, baseY - 2, 3, 3, color);
  } else {
    // around: curved around right side
    grid.drawThickLine(baseX, baseY, baseX + 6, baseY - 4, color, 3);
    grid.fillEllipse(baseX + 7, baseY - 5, 4, 4, color);
  }
}

function colorizeCat(grid: Grid, s: SkeletonAnchor, palette: any, config: CharacterConfig) {
  const O = palette.outline, B = palette.base, S = palette.shadow, H = palette.highlight, L = palette.belly, N = palette.nose, E = palette.eye, W = palette.ear;
  const headX = s.head.x + s.headTilt;

  // Fill head with base color (inside outline)
  grid.fillEllipse(headX, s.head.y, s.head.rx - 1, s.head.ry - 1, B);
  // Muzzle/belly patch
  grid.fillEllipse(headX, s.head.y + Math.floor(s.head.ry * 0.5), s.head.rx - 2, 3, L);
  // Top highlight cluster
  grid.fillEllipse(headX, s.head.y - Math.floor(s.head.ry * 0.5), 2, 1, H);
  // Ear inner
  drawCatEars(grid, headX, s.head.y - s.head.ry, { angle: 'relaxed', height: 1 }, W);

  // Neck fill
  grid.fillEllipse(s.neck.x, s.neck.y + 1, Math.floor(s.head.rx * 0.7) - 1, 1, B);

  // Chest fill
  grid.fillEllipse(s.chest.x, s.chest.y, s.chest.rx - 1, s.chest.ry - 1, B);
  // Belly patch on chest
  grid.fillEllipse(s.chest.x, s.chest.y + 2, Math.floor(s.chest.rx * 0.5), Math.floor(s.chest.ry * 0.5), L);

  // Hip fill
  grid.fillEllipse(s.hip.x, s.hip.y, s.hip.rx - 1, s.hip.ry - 1, B);

  // Legs fill
  for (const leg of s.frontLegs) {
    grid.fillEllipse(leg.x, leg.y + leg.len / 2, 1, leg.len / 2 - 1, B);
    grid.fillEllipse(leg.x, leg.y + leg.len - 1, 2, 1, H); // paw highlight
  }
  for (const leg of s.hindLegs) {
    if (leg.angle === 'out') {
      grid.fillEllipse(leg.x, leg.y, 3, 4, B);
      grid.fillEllipse(leg.x, leg.y + 2, 2, 2, S); // thigh shadow
      grid.fillEllipse(leg.x, leg.y + leg.len - 1, 2, 1, H);
    } else if (leg.angle === 'back') {
      grid.fillEllipse(leg.x, leg.y, 2, 4, B);
      grid.fillEllipse(leg.x, leg.y + leg.len - 1, 2, 1, H);
    } else {
      grid.fillEllipse(leg.x, leg.y, 2, 2, B);
    }
  }

  // Tail fill
  fillTail(grid, s, B, H, S, O);

  // Semantic shadow clusters
  // Armpit/shoulder shadow
  grid.fillEllipse(s.neck.x, s.neck.y + 3, 2, 2, S);
  // Side body shadow
  grid.fillEllipse(s.chest.x + s.chest.rx - 2, s.chest.y, 2, s.chest.ry - 1, S);
  grid.fillEllipse(s.chest.x - s.chest.rx + 2, s.chest.y, 2, s.chest.ry - 1, S);
  // Hip/tail root shadow
  grid.fillEllipse(s.tail.baseX - 2, s.tail.baseY, 2, 2, S);

  // Face
  drawCatFace(grid, headX, s.head.y, s.head.rx, s.head.ry, config.face, O, N, E, B);

  // Head stripes
  if (config.pose !== 'sleeping') {
    grid.set(headX, s.head.y - 2, S); grid.set(headX - 1, s.head.y - 1, S); grid.set(headX + 1, s.head.y - 1, S);
  }

  // Accessory
  if (config.accessory === 'bow') drawBow(grid, headX, s.neck.y + 2, O, N);
  if (config.accessory === 'flower') drawFlower(grid, headX + 6, s.head.y - 2, O, N);
  if (config.accessory === 'scarf') drawScarf(grid, headX, s.neck.y + 2, O, N);
}

function fillTail(grid: Grid, s: SkeletonAnchor, B: number, H: number, S: number, O: number) {
  const { baseX, baseY, shape } = s.tail;
  if (shape === 'wrap') {
    for (let i = 0; i < 12; i++) {
      const tx = baseX + Math.floor(Math.cos(i / 12 * Math.PI) * 8) - 4;
      const ty = baseY - 3 + Math.floor(Math.sin(i / 12 * Math.PI) * 4);
      grid.fillEllipse(tx, ty, 1, 1, B);
      grid.fillEllipse(tx, ty - 1, 1, 1, H);
    }
  } else if (shape === 'up') {
    grid.drawThickLine(baseX, baseY, baseX + 2, baseY - 12, B, 2);
    grid.fillEllipse(baseX + 2, baseY - 13, 2, 2, H);
  } else if (shape === 'straight') {
    grid.drawThickLine(baseX, baseY, baseX + 12, baseY - 2, B, 2);
    grid.fillEllipse(baseX + 12, baseY - 2, 2, 2, H);
  } else {
    grid.drawThickLine(baseX, baseY, baseX + 6, baseY - 4, B, 2);
    grid.fillEllipse(baseX + 7, baseY - 5, 3, 3, B);
    grid.fillEllipse(baseX + 7, baseY - 5, 2, 2, H); // tip
  }
  // Tail root shadow
  grid.fillEllipse(baseX - 2, baseY, 2, 2, S);
  grid.fillEllipse(baseX - 1, baseY + 1, 2, 2, O);
}

function drawCatFace(grid: Grid, cx: number, cy: number, rx: number, ry: number, face: { eye: import('./types.js').EyeType; eyeDirection: import('./types.js').EyeDirection; mouth: import('./types.js').MouthType; blush: boolean }, O: number, N: number, E: number, B: number) {
  const eyeY = cy - 1;
  const dirOffset = { front: 0, left: -1, right: 1, up: -1, down: 1 } as const;
  const dx = dirOffset[face.eyeDirection];
  const leftX = cx - 3 + dx; const rightX = cx + 3 + dx;

  // Nose
  grid.set(cx, cy + 1, N);

  // Eye
  switch (face.eye) {
    case 'sleepy':
      grid.set(leftX - 1, eyeY, O); grid.set(leftX, eyeY, O); grid.set(leftX + 1, eyeY, O);
      grid.set(rightX - 1, eyeY, O); grid.set(rightX, eyeY, O); grid.set(rightX + 1, eyeY, O);
      break;
    case 'happy':
      grid.set(leftX - 1, eyeY - 1, E); grid.set(leftX, eyeY, E); grid.set(leftX + 1, eyeY - 1, E);
      grid.set(rightX - 1, eyeY - 1, E); grid.set(rightX, eyeY, E); grid.set(rightX + 1, eyeY - 1, E);
      break;
    case 'curious':
      grid.set(leftX, eyeY, E); grid.set(leftX, eyeY - 1, E); grid.set(leftX - 1, eyeY, E); grid.set(leftX + 1, eyeY, E);
      grid.set(rightX, eyeY, E); grid.set(rightX, eyeY - 1, E); grid.set(rightX - 1, eyeY, E); grid.set(rightX + 1, eyeY, E);
      break;
    case 'wink':
      grid.set(leftX - 1, eyeY, O); grid.set(leftX, eyeY, O); grid.set(leftX + 1, eyeY, O);
      grid.set(rightX, eyeY, E); grid.set(rightX + 1, eyeY - 1, E); grid.set(rightX, eyeY - 1, E);
      break;
    case 'cute':
    default:
      grid.set(leftX, eyeY, E); grid.set(leftX - 1, eyeY - 1, E); grid.set(leftX, eyeY - 1, E);
      grid.set(rightX, eyeY, E); grid.set(rightX + 1, eyeY - 1, E); grid.set(rightX, eyeY - 1, E);
  }

  // Mouth
  const mouthY = cy + 2;
  switch (face.mouth) {
    case 'w':
      grid.set(cx - 1, mouthY, O); grid.set(cx, mouthY + 1, O); grid.set(cx + 1, mouthY, O); break;
    case 'open':
      grid.set(cx - 1, mouthY, O); grid.set(cx, mouthY, O); grid.set(cx + 1, mouthY, O); grid.set(cx, mouthY + 1, O); break;
    case 'tongue':
      grid.set(cx - 1, mouthY, O); grid.set(cx, mouthY, O); grid.set(cx + 1, mouthY, O); grid.set(cx, mouthY + 1, N); grid.set(cx, mouthY + 2, N); break;
    case 'cat':
    default:
      grid.set(cx - 1, mouthY, O); grid.set(cx + 1, mouthY, O); grid.set(cx, mouthY + 1, O);
  }

  if (face.blush) {
    grid.set(leftX - 2, eyeY + 1, N); grid.set(rightX + 2, eyeY + 1, N);
  }
}

function drawBow(grid: Grid, cx: number, y: number, O: number, A: number) {
  grid.set(cx - 1, y, A); grid.set(cx - 2, y, A); grid.set(cx - 1, y - 1, A); grid.set(cx - 1, y + 1, A);
  grid.set(cx, y, O);
  grid.set(cx + 1, y, A); grid.set(cx + 2, y, A); grid.set(cx + 1, y - 1, A); grid.set(cx + 1, y + 1, A);
}

function drawFlower(grid: Grid, x: number, y: number, O: number, A: number) {
  grid.set(x, y - 1, A); grid.set(x - 1, y, A); grid.set(x + 1, y, A); grid.set(x, y + 1, A); grid.set(x, y, O);
}

function drawScarf(grid: Grid, cx: number, y: number, O: number, A: number) {
  for (let dx = -3; dx <= 3; dx++) grid.set(cx + dx, y, A);
  grid.set(cx - 3, y, O); grid.set(cx + 3, y, O);
  grid.set(cx - 2, y + 1, A); grid.set(cx - 2, y + 2, A); grid.set(cx - 2, y + 3, O);
}

export function flattenGrid(grid: number[][]): number[][] { return grid.map(row => [...row]); }
