import type { CharacterConfig, ComposerResult } from './types.js';
import { getPalette } from './palettes.js';
import { Grid } from './grid.js';

// v5.5 Animal Master Pipeline
// Goal: product-grade Perler bead characters.
// Rules:
// 1. Silhouette first (recognizable at distance)
// 2. Head-body fusion (no visible neck/rod)
// 3. Species-specific anatomy (not generic body + animal head)
// 4. Color grammar by body part, not global light
// 5. Pixel-cluster shading (not smooth gradients)
// 6. Expression presets per pose (not random eye/mouth mix)

export interface Skeleton {
  cx: number;
  headCx: number;
  headTop: number;
  headBottom: number;
  headWidth: number; // cheek width at shoulder connection
  shoulderY: number;
  shoulderWidth: number;
  torsoTop: number;
  torsoBottom: number;
  torsoWidth: number;
  hipWidth: number;
  legY: number;
  legBottom: number;
  tailBase: { x: number; y: number };
}

export function compose(config: CharacterConfig): ComposerResult {
  const palette = getPalette(config.palette);
  const grid = new Grid(config.gridSize);
  const skeleton = buildSkeleton(config);

  switch (config.animal) {
    case 'cat':
      drawCat(grid, config, skeleton, palette);
      break;
    case 'fox':
      drawFox(grid, config, skeleton, palette);
      break;
    default:
      throw new Error(`Animal not yet implemented in v5.5: ${config.animal}`);
  }

  const used = new Set<number>();
  for (const row of grid.toArray()) {
    for (const cell of row) {
      if (cell > 0) used.add(cell);
    }
  }
  const colorMap = [0, ...Array.from(used).sort((a, b) => a - b)];

  return { grid: grid.toArray(), palette, colorMap };
}

function buildSkeleton(config: CharacterConfig): Skeleton {
  const size = config.gridSize;
  const cx = Math.floor(size / 2);
  const { pose } = config.body;
  const headTilt = config.body.headTilt;

  let headTop: number, headBottom: number, headWidth: number;
  let shoulderY: number, shoulderWidth: number;
  let torsoTop: number, torsoBottom: number, torsoWidth: number, hipWidth: number;
  let legY: number, legBottom: number, tailBase: { x: number; y: number };

  const headCx = cx + headTilt;

  if (config.animal === 'cat') {
    switch (pose) {
      case 'sleeping':
        headTop = 12; headBottom = 22; headWidth = 9;
        shoulderY = 20; shoulderWidth = 10;
        torsoTop = 20; torsoBottom = 36; torsoWidth = 13; hipWidth = 12;
        legY = 34; legBottom = 43; tailBase = { x: cx + 10, y: 30 };
        break;
      case 'stretching':
        headTop = 4; headBottom = 16; headWidth = 8;
        shoulderY = 14; shoulderWidth = 8;
        torsoTop = 14; torsoBottom = 38; torsoWidth = 10; hipWidth = 12;
        legY = 36; legBottom = 46; tailBase = { x: cx + 10, y: 34 };
        break;
      case 'playful':
        headTop = 2; headBottom = 14; headWidth = 8;
        shoulderY = 12; shoulderWidth = 8;
        torsoTop = 12; torsoBottom = 30; torsoWidth = 11; hipWidth = 11;
        legY = 28; legBottom = 40; tailBase = { x: cx + 10, y: 26 };
        break;
      case 'sitting':
      default:
        headTop = 4; headBottom = 16; headWidth = 9;
        shoulderY = 14; shoulderWidth = 9;
        torsoTop = 14; torsoBottom = 32; torsoWidth = 12; hipWidth = 11;
        legY = 30; legBottom = 42; tailBase = { x: cx + 10, y: 28 };
    }
  } else {
    // fox
    switch (pose) {
      case 'running':
        headTop = 6; headBottom = 16; headWidth = 7;
        shoulderY = 14; shoulderWidth = 7;
        torsoTop = 14; torsoBottom = 32; torsoWidth = 8; hipWidth = 10;
        legY = 30; legBottom = 44; tailBase = { x: cx + 10, y: 28 };
        break;
      case 'sleeping':
        headTop = 14; headBottom = 22; headWidth = 8;
        shoulderY = 20; shoulderWidth = 8;
        torsoTop = 20; torsoBottom = 34; torsoWidth = 10; hipWidth = 10;
        legY = 32; legBottom = 42; tailBase = { x: cx + 10, y: 30 };
        break;
      case 'playful':
        headTop = 2; headBottom = 14; headWidth = 7;
        shoulderY = 12; shoulderWidth = 7;
        torsoTop = 12; torsoBottom = 28; torsoWidth = 9; hipWidth = 9;
        legY = 26; legBottom = 40; tailBase = { x: cx + 10, y: 24 };
        break;
      case 'sitting':
      default:
        headTop = 4; headBottom = 16; headWidth = 7;
        shoulderY = 14; shoulderWidth = 7;
        torsoTop = 14; torsoBottom = 32; torsoWidth = 9; hipWidth = 10;
        legY = 30; legBottom = 44; tailBase = { x: cx + 10, y: 28 };
    }
  }

  return { cx, headCx, headTop, headBottom, headWidth, shoulderY, shoulderWidth, torsoTop, torsoBottom, torsoWidth, hipWidth, legY, legBottom, tailBase };
}

// ---------------------------------------------------------------------------
// CAT
// ---------------------------------------------------------------------------
function drawCat(grid: Grid, config: CharacterConfig, s: Skeleton, palette: any) {
  const O = palette.outline, B = palette.base, S = palette.shadow, H = palette.highlight, L = palette.belly, N = palette.nose, E = palette.eye, Y = palette.ear, W = palette.ear;
  const { cx, headCx, headTop, headBottom, headWidth, shoulderY, torsoTop, torsoBottom, torsoWidth, hipWidth, legY, legBottom, tailBase } = s;

  // Tail (behind body)
  drawCatTail(grid, s, config.body.pose, O, B, S);

  // Body: fused shoulders + torso + hips
  // Shoulder fusion: starts from head width
  grid.fillEllipse(cx, shoulderY, headWidth, 3, O); // shoulder cap
  grid.fillEllipse(cx, shoulderY, headWidth - 1, 2, B);
  // Torso
  const torsoCy = Math.floor((torsoTop + torsoBottom) / 2);
  const torsoRy = Math.floor((torsoBottom - torsoTop) / 2);
  grid.fillEllipse(cx, torsoCy, torsoWidth, torsoRy, O);
  grid.fillEllipse(cx, torsoCy, torsoWidth - 1, torsoRy - 1, B);
  // Hips / haunches (sitting cat: wider at bottom)
  grid.fillEllipse(cx - hipWidth + 2, torsoBottom - 2, Math.floor(hipWidth * 0.5), 3, O);
  grid.fillEllipse(cx + hipWidth - 2, torsoBottom - 2, Math.floor(hipWidth * 0.5), 3, O);
  grid.fillEllipse(cx - hipWidth + 2, torsoBottom - 2, Math.floor(hipWidth * 0.5) - 1, 2, B);
  grid.fillEllipse(cx + hipWidth - 2, torsoBottom - 2, Math.floor(hipWidth * 0.5) - 1, 2, B);

  // Chest / belly patch (pixel cluster, not gradient)
  grid.fillEllipse(cx, torsoCy + 2, Math.floor(torsoWidth * 0.45), Math.floor(torsoRy * 0.6), L);
  // Shadow cluster on sides
  grid.fillEllipse(cx - torsoWidth + 2, torsoCy, 2, torsoRy - 2, S);
  grid.fillEllipse(cx + torsoWidth - 2, torsoCy, 2, torsoRy - 2, S);

  // Front paws (sitting or standing)
  if (config.body.pose === 'sitting' || config.body.pose === 'playful') {
    const pawX1 = cx - 4; const pawX2 = cx + 2;
    grid.fillRect(pawX1, legY, 2, legBottom - legY, O); grid.fillRect(pawX1, legY + 1, 1, legBottom - legY - 1, B);
    grid.fillRect(pawX2, legY, 2, legBottom - legY, O); grid.fillRect(pawX2, legY + 1, 1, legBottom - legY - 1, B);
    // Paw pads
    grid.fillRect(pawX1 - 1, legBottom, 3, 2, H); grid.outlineRect(pawX1 - 1, legBottom, 3, 2, O);
    grid.fillRect(pawX2 - 1, legBottom, 3, 2, H); grid.outlineRect(pawX2 - 1, legBottom, 3, 2, O);
  }
  if (config.body.pose === 'playful') {
    // One paw raised
    grid.drawLine(cx - 6, shoulderY + 2, cx - 8, shoulderY - 3, O);
    grid.set(cx - 8, shoulderY - 3, H); grid.set(cx - 8, shoulderY - 4, O);
  }
  if (config.body.pose === 'sleeping') {
    // Tucked paws
    grid.fillRect(cx - 3, legY, 2, 3, O); grid.fillRect(cx + 1, legY, 2, 3, O);
    grid.fillRect(cx - 3, legY + 1, 1, 2, B); grid.fillRect(cx + 2, legY + 1, 1, 2, B);
  }
  if (config.body.pose === 'stretching') {
    // Front legs stretched forward
    grid.drawLine(cx - 4, shoulderY + 3, cx - 6, legBottom - 3, O);
    grid.drawLine(cx + 3, shoulderY + 3, cx + 5, legBottom - 3, O);
    grid.fillRect(cx - 7, legBottom - 3, 3, 2, H); grid.outlineRect(cx - 7, legBottom - 3, 3, 2, O);
    grid.fillRect(cx + 4, legBottom - 3, 3, 2, H); grid.outlineRect(cx + 4, legBottom - 3, 3, 2, O);
  }

  // Head: directly fused with shoulders (no neck gap)
  drawRoundHead(grid, headCx, headTop, headBottom, headWidth, O, B, H, L);

  // Cat ears: pointed with inner ear
  drawCatEars(grid, headCx, headTop, Y, W, O);

  // Face: expression preset per pose
  drawCatFace(grid, headCx, headTop, headBottom, config.body.pose, O, N, E, B);

  // Head stripes (pixel cluster)
  if (config.body.pose !== 'sleeping') {
    grid.set(headCx, headTop + 2, S); grid.set(headCx - 1, headTop + 3, S); grid.set(headCx + 1, headTop + 3, S);
  }

  if (config.accessory === 'bow') drawBow(grid, headCx, headBottom - 1, O, N);
}

function drawCatTail(grid: Grid, s: Skeleton, pose: string, O: number, B: number, S: number) {
  const { cx, tailBase } = s;
  if (pose === 'sleeping') {
    // Tail wrapped over body
    grid.set(cx - 3, s.torsoTop - 1, O); grid.set(cx - 2, s.torsoTop - 2, O); grid.set(cx - 1, s.torsoTop - 2, O); grid.set(cx, s.torsoTop - 2, O); grid.set(cx + 1, s.torsoTop - 2, O); grid.set(cx + 2, s.torsoTop - 1, O);
    grid.set(cx - 1, s.torsoTop - 2, B); grid.set(cx, s.torsoTop - 2, B); grid.set(cx + 1, s.torsoTop - 2, B);
  } else if (pose === 'playful') {
    // Tail up excited
    grid.drawLine(tailBase.x, tailBase.y, tailBase.x + 2, tailBase.y - 10, O);
    grid.drawLine(tailBase.x + 1, tailBase.y, tailBase.x + 3, tailBase.y - 10, O);
    grid.set(tailBase.x + 2, tailBase.y - 11, S); grid.set(tailBase.x + 3, tailBase.y - 11, S);
  } else if (pose === 'sitting') {
    // Tail curled around right side
    for (let i = 0; i < 6; i++) {
      grid.set(tailBase.x + i, tailBase.y - Math.floor(i / 2), O);
    }
    grid.set(tailBase.x + 5, tailBase.y - 3, S); grid.set(tailBase.x + 6, tailBase.y - 2, S);
  } else {
    // stretching: long tail behind
    grid.drawLine(tailBase.x, tailBase.y, tailBase.x + 12, tailBase.y - 2, O);
  }
}

function drawCatEars(grid: Grid, headCx: number, headTop: number, outer: number, inner: number, O: number) {
  // Left ear
  grid.set(headCx - 5, headTop + 2, O); grid.set(headCx - 6, headTop + 1, O); grid.set(headCx - 7, headTop + 2, O); grid.set(headCx - 6, headTop + 3, O);
  grid.set(headCx - 6, headTop + 2, inner);
  // Right ear
  grid.set(headCx + 5, headTop + 2, O); grid.set(headCx + 6, headTop + 1, O); grid.set(headCx + 7, headTop + 2, O); grid.set(headCx + 6, headTop + 3, O);
  grid.set(headCx + 6, headTop + 2, inner);
}

function drawCatFace(grid: Grid, cx: number, headTop: number, headBottom: number, pose: string, O: number, N: number, E: number, B: number) {
  const cy = Math.floor((headTop + headBottom) / 2);
  const eyeY = cy - 1;
  const leftX = cx - 3; const rightX = cx + 3;

  // Nose
  grid.set(cx, cy + 1, N);

  // Expression preset
  switch (pose) {
    case 'sleeping':
      // - - closed eyes
      grid.set(leftX - 1, eyeY, O); grid.set(leftX, eyeY, O); grid.set(leftX + 1, eyeY, O);
      grid.set(rightX - 1, eyeY, O); grid.set(rightX, eyeY, O); grid.set(rightX + 1, eyeY, O);
      grid.set(cx - 1, cy + 2, O); grid.set(cx + 1, cy + 2, O); // small cat mouth
      break;
    case 'playful':
      // ^ ^ happy eyes
      grid.set(leftX - 1, eyeY - 1, E); grid.set(leftX, eyeY, E); grid.set(leftX + 1, eyeY - 1, E);
      grid.set(rightX - 1, eyeY - 1, E); grid.set(rightX, eyeY, E); grid.set(rightX + 1, eyeY - 1, E);
      // open mouth with tongue
      grid.set(cx - 1, cy + 2, O); grid.set(cx, cy + 2, O); grid.set(cx + 1, cy + 2, O);
      grid.set(cx, cy + 3, N); grid.set(cx, cy + 4, N);
      break;
    case 'curious':
    case 'stretching':
      // ○ ○ wide eyes
      grid.set(leftX, eyeY, E); grid.set(leftX, eyeY - 1, E); grid.set(leftX - 1, eyeY, E); grid.set(leftX + 1, eyeY, E);
      grid.set(rightX, eyeY, E); grid.set(rightX, eyeY - 1, E); grid.set(rightX - 1, eyeY, E); grid.set(rightX + 1, eyeY, E);
      grid.set(cx - 1, cy + 2, O); grid.set(cx, cy + 2, O); grid.set(cx + 1, cy + 2, O);
      break;
    case 'sitting':
    default:
      // cute eyes
      grid.set(leftX, eyeY, E); grid.set(leftX - 1, eyeY - 1, E); grid.set(leftX, eyeY - 1, E);
      grid.set(rightX, eyeY, E); grid.set(rightX + 1, eyeY - 1, E); grid.set(rightX, eyeY - 1, E);
      // W mouth
      grid.set(cx - 1, cy + 2, O); grid.set(cx, cy + 3, O); grid.set(cx + 1, cy + 2, O);
  }
}

function drawRoundHead(grid: Grid, cx: number, headTop: number, headBottom: number, headWidth: number, O: number, B: number, H: number, L: number) {
  const cy = Math.floor((headTop + headBottom) / 2);
  const rx = headWidth;
  const ry = headBottom - cy;
  grid.fillEllipse(cx, cy, rx, ry, O);
  grid.fillEllipse(cx, cy, rx - 1, ry - 1, B);
  // Muzzle/cheek patch
  grid.fillEllipse(cx, cy + ry - 2, rx - 2, 2, L);
  // Top highlight cluster
  grid.set(cx - 1, cy - ry + 2, H); grid.set(cx, cy - ry + 2, H); grid.set(cx + 1, cy - ry + 2, H);
}

// ---------------------------------------------------------------------------
// FOX
// ---------------------------------------------------------------------------
function drawFox(grid: Grid, config: CharacterConfig, s: Skeleton, palette: any) {
  const O = palette.outline, B = palette.base, S = palette.shadow, H = palette.highlight, L = palette.belly, N = palette.nose, E = palette.eye, Y = palette.ear, W = palette.ear;
  const { cx, headCx, headTop, headBottom, headWidth, shoulderY, torsoTop, torsoBottom, torsoWidth, hipWidth, legY, legBottom, tailBase } = s;

  // Big fox tail behind
  drawFoxTail(grid, s, config.body.pose, O, B, L, S);

  // Body: slim and angular
  grid.fillEllipse(cx, shoulderY, headWidth - 1, 2, O); // shoulders
  grid.fillEllipse(cx, shoulderY, headWidth - 2, 1, B);
  const torsoCy = Math.floor((torsoTop + torsoBottom) / 2);
  const torsoRy = Math.floor((torsoBottom - torsoTop) / 2);
  grid.fillEllipse(cx, torsoCy, torsoWidth, torsoRy, O);
  grid.fillEllipse(cx, torsoCy, torsoWidth - 1, torsoRy - 1, B);
  // Cream chest
  grid.fillEllipse(cx, torsoCy + 1, Math.floor(torsoWidth * 0.35), Math.floor(torsoRy * 0.5), L);
  // Side shadow cluster
  grid.fillEllipse(cx - torsoWidth + 2, torsoCy, 2, torsoRy - 1, S);

  // Legs
  if (config.body.pose !== 'sleeping') {
    const paw1 = cx - 3; const paw2 = cx + 1;
    grid.fillRect(paw1, legY, 2, legBottom - legY, O); grid.fillRect(paw1, legY + 1, 1, legBottom - legY - 1, B);
    grid.fillRect(paw2, legY, 2, legBottom - legY, O); grid.fillRect(paw2, legY + 1, 1, legBottom - legY - 1, B);
    grid.fillRect(paw1 - 1, legBottom, 3, 2, L); grid.outlineRect(paw1 - 1, legBottom, 3, 2, O);
    grid.fillRect(paw2 - 1, legBottom, 3, 2, L); grid.outlineRect(paw2 - 1, legBottom, 3, 2, O);
  } else {
    // Tucked paws
    grid.fillRect(cx - 2, legY, 2, 3, O); grid.fillRect(cx + 1, legY, 2, 3, O);
  }

  // Fox head: triangular with long muzzle
  drawFoxHead(grid, headCx, headTop, headBottom, headWidth, O, B, H, L, N, E, config.body.pose);

  // Fox ears: large pointed
  drawFoxEars(grid, headCx, headTop, Y, W, O);

  if (config.accessory === 'scarf') drawScarf(grid, headCx, headBottom - 1, O, B);
}

function drawFoxHead(grid: Grid, cx: number, headTop: number, headBottom: number, headWidth: number, O: number, B: number, H: number, L: number, N: number, E: number, pose: string) {
  const cy = Math.floor((headTop + headBottom) / 2);
  // Triangular outline: narrow forehead, wide cheek, long muzzle
  const foreheadW = Math.floor(headWidth * 0.5);
  const cheekW = headWidth;
  const muzzleY = headBottom - 2;
  for (let y = headTop; y <= headBottom; y++) {
    const progress = (y - headTop) / (headBottom - headTop);
    let halfW: number;
    if (y < cy) {
      halfW = foreheadW + Math.floor((cheekW - foreheadW) * progress * 2);
    } else {
      halfW = cheekW - Math.floor((cheekW - 1) * (progress - 0.5) * 2);
    }
    for (let dx = -halfW; dx <= halfW; dx++) {
      grid.set(cx + dx, y, O);
    }
    for (let dx = -halfW + 1; dx <= halfW - 1; dx++) {
      grid.set(cx + dx, y, B);
    }
  }
  // Cream cheek/muzzle
  for (let y = cy - 1; y <= headBottom - 1; y++) {
    for (let dx = -2; dx <= 2; dx++) {
      grid.set(cx + dx, y, L);
    }
  }
  // Nose tip
  grid.set(cx, headBottom - 1, O); grid.set(cx, headBottom - 2, N);
  // Eyes
  const eyeY = cy - 2;
  const leftX = cx - 3; const rightX = cx + 3;
  if (pose === 'sleeping') {
    grid.set(leftX - 1, eyeY, O); grid.set(leftX, eyeY, O); grid.set(leftX + 1, eyeY, O);
    grid.set(rightX - 1, eyeY, O); grid.set(rightX, eyeY, O); grid.set(rightX + 1, eyeY, O);
  } else if (pose === 'playful') {
    grid.set(leftX - 1, eyeY - 1, E); grid.set(leftX, eyeY, E); grid.set(leftX + 1, eyeY - 1, E);
    grid.set(rightX - 1, eyeY - 1, E); grid.set(rightX, eyeY, E); grid.set(rightX + 1, eyeY - 1, E);
  } else if (pose === 'curious') {
    grid.set(leftX, eyeY, E); grid.set(leftX, eyeY - 1, E); grid.set(leftX - 1, eyeY, E); grid.set(leftX + 1, eyeY, E);
    grid.set(rightX, eyeY, E); grid.set(rightX, eyeY - 1, E); grid.set(rightX - 1, eyeY, E); grid.set(rightX + 1, eyeY, E);
  } else {
    // cute
    grid.set(leftX, eyeY, E); grid.set(leftX - 1, eyeY - 1, E); grid.set(leftX, eyeY - 1, E);
    grid.set(rightX, eyeY, E); grid.set(rightX + 1, eyeY - 1, E); grid.set(rightX, eyeY - 1, E);
  }
}

function drawFoxEars(grid: Grid, headCx: number, headTop: number, outer: number, inner: number, O: number) {
  // Large tall pointed ears
  for (let i = 0; i < 6; i++) {
    grid.set(headCx - 5 - i, headTop + i, O); grid.set(headCx - 5 - i, headTop + i + 1, O);
    grid.set(headCx + 5 + i, headTop + i, O); grid.set(headCx + 5 + i, headTop + i + 1, O);
  }
  // Inner ear
  grid.set(headCx - 6, headTop + 4, inner); grid.set(headCx - 7, headTop + 3, inner); grid.set(headCx - 8, headTop + 2, inner);
  grid.set(headCx + 6, headTop + 4, inner); grid.set(headCx + 7, headTop + 3, inner); grid.set(headCx + 8, headTop + 2, inner);
}

function drawFoxTail(grid: Grid, s: Skeleton, pose: string, O: number, B: number, L: number, S: number) {
  const { cx, tailBase } = s;
  if (pose === 'sleeping') {
    // Tail wrapped over back/face
    for (let i = 0; i < 8; i++) {
      grid.set(cx - 4 + i, s.torsoTop - 1, O);
      grid.set(cx - 3 + i, s.torsoTop - 2, O);
    }
    grid.set(cx + 3, s.torsoTop - 2, L); grid.set(cx + 4, s.torsoTop - 2, L); // white tip
  } else if (pose === 'running') {
    // Streamlined tail behind
    for (let i = 0; i < 12; i++) {
      grid.set(tailBase.x + i, tailBase.y - Math.floor(i / 3), O);
    }
    grid.fillEllipse(tailBase.x + 10, tailBase.y - 3, 3, 3, O);
    grid.fillEllipse(tailBase.x + 10, tailBase.y - 3, 2, 2, L); // tip
  } else {
    // Big fluffy tail, curving up
    grid.set(tailBase.x, tailBase.y, O); grid.set(tailBase.x + 1, tailBase.y - 1, O);
    grid.fillEllipse(tailBase.x + 6, tailBase.y - 5, 5, 5, O);
    grid.fillEllipse(tailBase.x + 6, tailBase.y - 5, 4, 4, B);
    grid.fillEllipse(tailBase.x + 7, tailBase.y - 6, 2, 2, L); // white tip
    // Shadow cluster
    grid.fillEllipse(tailBase.x + 5, tailBase.y - 4, 2, 2, S);
  }
}

function drawBow(grid: Grid, cx: number, y: number, O: number, A: number) {
  grid.set(cx - 1, y, A); grid.set(cx - 2, y, A); grid.set(cx - 1, y - 1, A); grid.set(cx - 1, y + 1, A);
  grid.set(cx, y, O);
  grid.set(cx + 1, y, A); grid.set(cx + 2, y, A); grid.set(cx + 1, y - 1, A); grid.set(cx + 1, y + 1, A);
}

function drawScarf(grid: Grid, cx: number, y: number, O: number, A: number) {
  for (let dx = -3; dx <= 3; dx++) grid.set(cx + dx, y, A);
  grid.set(cx - 3, y, O); grid.set(cx + 3, y, O);
  grid.set(cx - 2, y + 1, A); grid.set(cx - 2, y + 2, A); grid.set(cx - 2, y + 3, O);
}

export function flattenGrid(grid: number[][]): number[][] {
  return grid.map(row => [...row]);
}
