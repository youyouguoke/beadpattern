import type { CharacterConfig, ComposerResult } from './types.js';
import { getPalette } from './palettes.js';
import { Grid, TRANSPARENT } from './grid.js';

interface Anatomy {
  O: number; B: number; S: number; H: number; A: number; D: number; L: number; E: number;
  cx: number; size: number;
  headTop: number; headCy: number; headBottom: number; headRx: number; headRy: number;
  neckY: number;
  bodyTop: number; bodyBottom: number; bodyRx: number; bodyRy: number; bodyCy: number;
  shoulderY: number; shoulderWidth: number;
  armY: number; armLen: number;
  legY: number; legLen: number; footY: number;
  tailY: number;
}

export function compose(config: CharacterConfig): ComposerResult {
  const palette = getPalette(config.palette);
  const grid = new Grid(config.gridSize);
  const O = palette.outline;
  const B = palette.base;
  const S = palette.shadow;
  const H = palette.highlight;
  const A = palette.accent;
  const D = palette.detail ?? S;
  const L = palette.blush ?? A;
  const E = palette.eye ?? O;

  const size = config.gridSize;
  const cx = Math.floor(size / 2);

  // Body ratio determines head/body split
  const headRatio = config.body.headRatio;
  const bodyRatio = config.body.bodyRatio;

  const headHeight = Math.floor(size * headRatio);
  const headTop = Math.floor(size * 0.06);
  const headBottom = headTop + headHeight;
  const headCy = Math.floor((headTop + headBottom) / 2);
  const headRx = Math.floor(headHeight * 0.45);
  const headRy = Math.floor(headHeight * 0.40);

  const neckY = headBottom + 1;
  const bodyTop = neckY + 1;
  const bodyHeight = Math.floor(size * bodyRatio);
  const bodyBottom = bodyTop + bodyHeight;
  const bodyCy = Math.floor((bodyTop + bodyBottom) / 2);
  const bodyRx = Math.floor(size * 0.26); // slightly wider
  const bodyRy = Math.floor(bodyHeight / 2);

  const shoulderY = bodyTop + Math.floor(bodyHeight * 0.12);
  const shoulderWidth = bodyRx + 2 + config.body.shoulderWidth;
  const armY = shoulderY + 2;
  const armLen = Math.floor(bodyHeight * 0.35);
  const legY = bodyCy + Math.floor(bodyRy * 0.5);
  const legLen = bodyBottom - legY - 3;
  const footY = bodyBottom - 2;
  const tailY = bodyBottom - 3;

  const anatomy: Anatomy = {
    O, B, S, H, A, D, L, E,
    cx, size,
    headTop, headCy, headBottom, headRx, headRy,
    neckY,
    bodyTop, bodyBottom, bodyRx, bodyRy, bodyCy,
    shoulderY, shoulderWidth,
    armY, armLen,
    legY, legLen, footY,
    tailY,
  };

  drawBody(grid, config, anatomy);
  drawHead(grid, config, anatomy);
  drawEars(grid, config, anatomy);
  drawArms(grid, config, anatomy);
  drawLegs(grid, config, anatomy);
  drawTail(grid, config, anatomy);
  drawAccessory(grid, config, anatomy);

  const used = new Set<number>();
  for (const row of grid.toArray()) {
    for (const cell of row) {
      if (cell > 0) used.add(cell);
    }
  }
  const colorMap = [0, ...Array.from(used).sort((a, b) => a - b)];

  return { grid: grid.toArray(), palette, colorMap };
}

// ---------------------------------------------------------------------------
// BODY
// ---------------------------------------------------------------------------
function drawBody(grid: Grid, config: CharacterConfig, a: Anatomy) {
  const { O, B, S, H, cx, bodyTop, bodyBottom, bodyRx, bodyRy, bodyCy } = a;

  // Main torso
  grid.fillEllipse(cx, bodyCy, bodyRx, bodyRy, O);
  grid.fillEllipse(cx, bodyCy, bodyRx - 1, bodyRy - 1, B);

  // Belly/chest highlight (premium shading)
  const bellyRx = Math.max(2, Math.floor(bodyRx * 0.5));
  const bellyRy = Math.max(3, Math.floor(bodyRy * 0.55));
  grid.fillEllipse(cx, bodyCy + 2, bellyRx, bellyRy, H);

  // Side shadow
  grid.fillEllipse(cx - bodyRx + 2, bodyCy + 1, 2, Math.floor(bodyRy * 0.6), S);
  grid.fillEllipse(cx + bodyRx - 2, bodyCy + 1, 2, Math.floor(bodyRy * 0.6), S);

  // Neck
  grid.fillRect(cx - 2, a.neckY, 4, 2, B);
  grid.set(cx - 2, a.neckY, O); grid.set(cx + 2, a.neckY, O);
}

// ---------------------------------------------------------------------------
// HEAD
// ---------------------------------------------------------------------------
function drawHead(grid: Grid, config: CharacterConfig, a: Anatomy) {
  const { O, B, S, H, A, L, E, cx, headCy, headRx, headRy } = a;

  // Head shape
  grid.fillEllipse(cx, headCy, headRx, headRy, O);
  grid.fillEllipse(cx, headCy, headRx - 1, headRy - 1, B);

  // Muzzle / cheek highlights
  const muzzleRx = Math.max(2, Math.floor(headRx * 0.45));
  const muzzleRy = Math.max(1, Math.floor(headRy * 0.4));
  grid.fillEllipse(cx, headCy + Math.floor(headRy * 0.35), muzzleRx, muzzleRy, H);

  // Face markings (e.g. tabby stripes, fox mask)
  if (config.face.markings === 'stripe') {
    grid.set(cx, headCy - headRy + 1, S); grid.set(cx, headCy - headRy + 2, S);
  } else if (config.face.markings === 'mask') {
    grid.fillEllipse(cx, headCy, Math.floor(headRx * 0.7), Math.floor(headRy * 0.5), S);
  }

  // Eyes
  drawFace(grid, config, a);
}

// ---------------------------------------------------------------------------
// EARS
// ---------------------------------------------------------------------------
function drawEars(grid: Grid, config: CharacterConfig, a: Anatomy) {
  const { O, B, H, A, cx, headTop, headCy, headRx } = a;
  const ear = config.ear;
  const leftCx = cx - headRx + 1;
  const rightCx = cx + headRx - 1;
  const topY = headCy - headRx + 1;

  switch (ear) {
    case 'pointed':
      grid.set(leftCx - 1, topY - 2, O); grid.set(leftCx, topY - 3, O); grid.set(leftCx + 1, topY - 2, O);
      grid.set(rightCx - 1, topY - 2, O); grid.set(rightCx, topY - 3, O); grid.set(rightCx + 1, topY - 2, O);
      grid.set(leftCx, topY - 2, A); grid.set(rightCx, topY - 2, A);
      break;
    case 'rounded':
      grid.fillEllipse(leftCx, topY - 1, 2, 2, O); grid.fillEllipse(leftCx, topY - 1, 1, 1, H);
      grid.fillEllipse(rightCx, topY - 1, 2, 2, O); grid.fillEllipse(rightCx, topY - 1, 1, 1, H);
      break;
    case 'floppy':
      grid.fillEllipse(leftCx - 1, headCy - 2, 2, 4, O); grid.fillEllipse(leftCx - 1, headCy - 2, 1, 3, B);
      grid.fillEllipse(rightCx + 1, headCy - 2, 2, 4, O); grid.fillEllipse(rightCx + 1, headCy - 2, 1, 3, B);
      break;
    case 'long': // bunny
      grid.fillRect(leftCx - 1, headTop - 6, 2, 7, O); grid.fillRect(leftCx - 1, headTop - 5, 1, 5, H);
      grid.fillRect(rightCx, headTop - 6, 2, 7, O); grid.fillRect(rightCx, headTop - 5, 1, 5, H);
      break;
    case 'tufted': // bear/panda
      grid.set(leftCx, topY - 2, O); grid.set(leftCx - 1, topY - 1, O); grid.set(leftCx + 1, topY - 1, O);
      grid.set(rightCx, topY - 2, O); grid.set(rightCx - 1, topY - 1, O); grid.set(rightCx + 1, topY - 1, O);
      break;
    case 'small':
    default:
      grid.fillEllipse(leftCx, topY - 1, 1, 1, O); grid.fillEllipse(rightCx, topY - 1, 1, 1, O);
  }
}

// ---------------------------------------------------------------------------
// FACE
// ---------------------------------------------------------------------------
function drawFace(grid: Grid, config: CharacterConfig, a: Anatomy) {
  const { O, A, H, L, E, cx, headCy, headRx } = a;
  const eyeY = headCy - 1;
  const leftX = cx - Math.max(2, Math.floor(headRx * 0.4));
  const rightX = cx + Math.max(2, Math.floor(headRx * 0.4));

  // Eyes
  switch (config.face.eye) {
    case 'round':
      grid.set(leftX, eyeY, E); grid.set(rightX, eyeY, E);
      break;
    case 'cute':
      grid.set(leftX, eyeY, E); grid.set(leftX - 1, eyeY - 1, E); grid.set(leftX, eyeY - 1, E);
      grid.set(rightX, eyeY, E); grid.set(rightX + 1, eyeY - 1, E); grid.set(rightX, eyeY - 1, E);
      break;
    case 'happy':
      grid.set(leftX - 1, eyeY - 1, E); grid.set(leftX, eyeY, E); grid.set(leftX + 1, eyeY - 1, E);
      grid.set(rightX - 1, eyeY - 1, E); grid.set(rightX, eyeY, E); grid.set(rightX + 1, eyeY - 1, E);
      break;
    case 'wink':
      grid.set(leftX, eyeY, E); grid.set(leftX, eyeY - 1, E);
      grid.set(rightX - 1, eyeY - 1, E); grid.set(rightX, eyeY, E); grid.set(rightX + 1, eyeY - 1, E);
      break;
    case 'sleepy':
      grid.set(leftX - 1, eyeY, E); grid.set(leftX, eyeY, E); grid.set(leftX + 1, eyeY, E);
      grid.set(rightX - 1, eyeY, E); grid.set(rightX, eyeY, E); grid.set(rightX + 1, eyeY, E);
      break;
    case 'anime':
      grid.set(leftX, eyeY, E); grid.set(leftX, eyeY - 1, E); grid.set(leftX - 1, eyeY, E);
      grid.set(rightX, eyeY, E); grid.set(rightX, eyeY - 1, E); grid.set(rightX + 1, eyeY, E);
      break;
    case 'sparkle':
      grid.set(leftX, eyeY, E); grid.set(leftX - 1, eyeY - 1, E); grid.set(leftX + 1, eyeY - 1, E);
      grid.set(rightX, eyeY, E); grid.set(rightX - 1, eyeY - 1, E); grid.set(rightX + 1, eyeY - 1, E);
      break;
    case 'shy':
      grid.set(leftX, eyeY, E); grid.set(leftX - 1, eyeY, O);
      grid.set(rightX, eyeY, E); grid.set(rightX + 1, eyeY, O);
      if (config.face.blush) {
        grid.set(leftX - 2, eyeY + 1, L); grid.set(rightX + 2, eyeY + 1, L);
      }
      break;
    case 'angry':
      grid.set(leftX - 1, eyeY - 1, E); grid.set(leftX, eyeY, E);
      grid.set(rightX + 1, eyeY - 1, E); grid.set(rightX, eyeY, E);
      break;
    case 'surprised':
      grid.set(leftX, eyeY, E); grid.set(leftX, eyeY - 1, E); grid.set(leftX - 1, eyeY, E); grid.set(leftX + 1, eyeY, E);
      grid.set(rightX, eyeY, E); grid.set(rightX, eyeY - 1, E); grid.set(rightX - 1, eyeY, E); grid.set(rightX + 1, eyeY, E);
      break;
    default:
      grid.set(leftX, eyeY, E); grid.set(rightX, eyeY, E);
  }

  // Blush (if not shy-integrated)
  if (config.face.blush && config.face.eye !== 'shy') {
    grid.set(leftX - 2, eyeY + 1, L); grid.set(rightX + 2, eyeY + 1, L);
  }

  // Nose
  const noseY = headCy + 1;
  grid.set(cx, noseY, A);

  // Mouth
  const mouthY = noseY + 1;
  switch (config.face.mouth) {
    case 'smile':
      grid.set(cx - 1, mouthY + 1, O); grid.set(cx, mouthY, O); grid.set(cx + 1, mouthY + 1, O);
      break;
    case 'w':
      grid.set(cx - 1, mouthY, O); grid.set(cx, mouthY + 1, O); grid.set(cx + 1, mouthY, O);
      break;
    case 'open':
      grid.fillRect(cx - 1, mouthY, 2, 2, O); grid.set(cx, mouthY + 1, H);
      break;
    case 'tongue':
      grid.set(cx - 1, mouthY, O); grid.set(cx, mouthY, O); grid.set(cx + 1, mouthY, O);
      grid.set(cx, mouthY + 1, L); grid.set(cx, mouthY + 2, L);
      break;
    case 'fang':
      grid.set(cx - 1, mouthY, O); grid.set(cx, mouthY, O); grid.set(cx + 1, mouthY, O);
      grid.set(cx - 1, mouthY + 1, O); grid.set(cx + 2, mouthY + 1, O);
      break;
    case 'beak':
      grid.set(cx, noseY, O); grid.set(cx - 1, mouthY, O); grid.set(cx + 1, mouthY, O);
      break;
    case 'cat_mouth':
      grid.set(cx, noseY, A); grid.set(cx - 1, mouthY, O); grid.set(cx + 1, mouthY, O); grid.set(cx, mouthY + 1, O);
      break;
    case 'duck':
      grid.set(cx - 1, mouthY, O); grid.set(cx, mouthY, O); grid.set(cx + 1, mouthY, O);
      grid.set(cx - 2, mouthY + 1, O); grid.set(cx + 2, mouthY + 1, O);
      break;
    case 'small':
    default:
      grid.set(cx, mouthY, O);
  }
}

// ---------------------------------------------------------------------------
// ARMS
// ---------------------------------------------------------------------------
function drawArms(grid: Grid, config: CharacterConfig, a: Anatomy) {
  const { O, B, H, cx, shoulderY, shoulderWidth, armY, armLen } = a;
  const armPos = config.body.armPosition;
  const leftShoulder = cx - shoulderWidth;
  const rightShoulder = cx + shoulderWidth;

  if (armPos === 'none') return;

  // Shoulder balls
  grid.set(leftShoulder, shoulderY, O); grid.set(leftShoulder + 1, shoulderY, B); grid.set(leftShoulder - 1, shoulderY, O);
  grid.set(rightShoulder, shoulderY, O); grid.set(rightShoulder - 1, shoulderY, B); grid.set(rightShoulder + 1, shoulderY, O);

  // Left arm
  let leftArmX = leftShoulder;
  let leftArmY = armY + armLen;
  if (armPos === 'front') {
    grid.drawLine(leftShoulder, armY, leftShoulder, armY + armLen, O);
    grid.set(leftShoulder, armY + armLen, H); // paw
  } else if (armPos === 'up') {
    grid.drawLine(leftShoulder, armY, leftShoulder - 2, armY - 2, O);
    grid.set(leftShoulder - 2, armY - 2, H);
  } else if (armPos === 'holding') {
    grid.drawLine(leftShoulder, armY, cx - 3, armY + 2, O);
  } else {
    grid.drawLine(leftShoulder, armY, leftShoulder - 1, armY + armLen - 1, O);
  }

  // Right arm
  if (armPos === 'waving') {
    grid.drawLine(rightShoulder, armY, rightShoulder + 2, armY - 3, O);
    grid.set(rightShoulder + 2, armY - 3, H);
  } else if (armPos === 'front') {
    grid.drawLine(rightShoulder, armY, rightShoulder, armY + armLen, O);
    grid.set(rightShoulder, armY + armLen, H);
  } else if (armPos === 'holding') {
    grid.drawLine(rightShoulder, armY, cx + 3, armY + 2, O);
  } else {
    grid.drawLine(rightShoulder, armY, rightShoulder + 1, armY + armLen - 1, O);
  }
}

// ---------------------------------------------------------------------------
// LEGS
// ---------------------------------------------------------------------------
function drawLegs(grid: Grid, config: CharacterConfig, a: Anatomy) {
  const { O, B, H, cx, legY, legLen, footY, bodyBottom } = a;
  const legPos = config.body.legPosition;
  const leftFootX = cx - 4;
  const rightFootX = cx + 3;

  if (legPos === 'tucked') {
    // Sitting with legs tucked under body (bunny/cat)
    grid.set(leftFootX, footY, O); grid.set(leftFootX + 1, footY, H); grid.set(leftFootX + 2, footY, O);
    grid.set(rightFootX, footY, O); grid.set(rightFootX + 1, footY, H); grid.set(rightFootX + 2, footY, O);
  } else if (legPos === 'standing') {
    grid.drawLine(leftFootX, legY, leftFootX, footY, O);
    grid.set(leftFootX, footY, H);
    grid.drawLine(rightFootX, legY, rightFootX, footY, O);
    grid.set(rightFootX, footY, H);
  } else if (legPos === 'wide') {
    grid.drawLine(leftFootX, legY, leftFootX - 2, footY, O);
    grid.set(leftFootX - 2, footY, H);
    grid.drawLine(rightFootX, legY, rightFootX + 2, footY, O);
    grid.set(rightFootX + 2, footY, H);
  } else {
    // sitting: legs forward
    grid.drawLine(leftFootX, legY, leftFootX, footY, O);
    grid.fillRect(leftFootX - 1, footY, 3, 2, H); grid.outlineRect(leftFootX - 1, footY, 3, 2, O);
    grid.drawLine(rightFootX, legY, rightFootX, footY, O);
    grid.fillRect(rightFootX - 1, footY, 3, 2, H); grid.outlineRect(rightFootX - 1, footY, 3, 2, O);
  }
}

// ---------------------------------------------------------------------------
// TAIL
// ---------------------------------------------------------------------------
function drawTail(grid: Grid, config: CharacterConfig, a: Anatomy) {
  const { O, B, H, cx, tailY } = a;
  const tail = config.tail;
  if (tail === 'none') return;

  switch (tail) {
    case 'short':
      grid.set(cx + 3, tailY, O); grid.set(cx + 4, tailY - 1, O); break;
    case 'long':
      grid.set(cx + 3, tailY, O); grid.set(cx + 4, tailY - 1, O); grid.set(cx + 5, tailY - 2, O); grid.set(cx + 6, tailY - 1, O); break;
    case 'fluffy':
      grid.fillEllipse(cx + 5, tailY - 2, 3, 3, O); grid.fillEllipse(cx + 5, tailY - 2, 2, 2, B); grid.fillEllipse(cx + 5, tailY - 2, 1, 1, H);
      break;
    case 'curled':
      grid.set(cx + 3, tailY, O); grid.set(cx + 4, tailY - 1, O); grid.set(cx + 5, tailY - 2, O); grid.set(cx + 4, tailY - 3, O); grid.set(cx + 3, tailY - 2, O); break;
    case 'waving':
      grid.set(cx + 3, tailY - 1, O); grid.set(cx + 4, tailY - 2, O); grid.set(cx + 5, tailY - 3, O); grid.set(cx + 6, tailY - 2, O); break;
    case 'heart':
      grid.set(cx + 3, tailY - 2, O); grid.set(cx + 4, tailY - 1, O); grid.set(cx + 5, tailY - 2, O); grid.set(cx + 3, tailY, O); grid.set(cx + 5, tailY, O); break;
  }
}

// ---------------------------------------------------------------------------
// ACCESSORIES
// ---------------------------------------------------------------------------
function drawAccessory(grid: Grid, config: CharacterConfig, a: Anatomy) {
  const { O, A, H, cx, headCy, neckY } = a;
  const acc = config.accessory;
  const outfit = config.outfit;

  if (acc === 'bow') {
    const y = neckY + 1;
    grid.set(cx - 1, y, A); grid.set(cx - 2, y, A); grid.set(cx - 1, y - 1, A); grid.set(cx - 1, y + 1, A);
    grid.set(cx, y, O);
    grid.set(cx + 1, y, A); grid.set(cx + 2, y, A); grid.set(cx + 1, y - 1, A); grid.set(cx + 1, y + 1, A);
  }
  if (acc === 'heart') {
    const y = headCy + 3;
    grid.set(cx + 4, y - 1, O); grid.set(cx + 3, y, A); grid.set(cx + 4, y, A); grid.set(cx + 5, y, A); grid.set(cx + 3, y + 1, O); grid.set(cx + 5, y + 1, O); grid.set(cx + 4, y + 1, O);
  }
  if (acc === 'flower') {
    const x = cx - 4; const y = headCy + 2;
    grid.set(x, y - 1, A); grid.set(x - 1, y, A); grid.set(x + 1, y, A); grid.set(x, y + 1, A); grid.set(x, y, H);
    grid.set(x - 1, y - 1, O); grid.set(x + 1, y - 1, O); grid.set(x - 1, y + 1, O); grid.set(x + 1, y + 1, O);
  }
  if (acc === 'scarf') {
    const y = neckY + 1;
    for (let dx = -3; dx <= 3; dx++) grid.set(cx + dx, y, A);
    grid.set(cx - 3, y, O); grid.set(cx + 3, y, O);
    grid.set(cx - 2, y + 1, A); grid.set(cx - 2, y + 2, A); grid.set(cx - 2, y + 3, O);
  }
  if (acc === 'bamboo') {
    const x = cx + 5; const y = a.bodyCy;
    grid.set(x, y, A); grid.set(x, y - 1, A); grid.set(x, y - 2, A); grid.set(x, y - 3, A);
    grid.set(x - 1, y - 1, O); grid.set(x + 1, y - 1, O); grid.set(x - 1, y - 3, O); grid.set(x + 1, y - 3, O);
  }
  if (acc === 'ball') {
    const x = cx + 5; const y = a.bodyCy + 2;
    grid.set(x, y, O); grid.set(x - 1, y - 1, O); grid.set(x, y - 1, A); grid.set(x + 1, y - 1, O); grid.set(x - 1, y, A); grid.set(x + 1, y, A); grid.set(x, y + 1, O);
  }
  if (acc === 'hat') {
    const y = a.headTop - 2;
    grid.fillRect(cx - 3, y, 6, 1, A); grid.fillRect(cx - 2, y - 2, 4, 2, A); grid.outlineRect(cx - 2, y - 2, 4, 2, O);
  }

  // Outfits
  if (outfit === 'cape') {
    for (let y = a.bodyTop; y < a.bodyBottom; y++) {
      for (let dx = -a.bodyRx; dx <= a.bodyRx; dx++) {
        if (Math.abs(dx) > a.bodyRx - 2) grid.set(cx + dx, y, A);
      }
    }
  }
  if (outfit === 'bandana') {
    for (let dx = -2; dx <= 2; dx++) grid.set(cx + dx, neckY, A);
    grid.set(cx - 2, neckY + 1, A); grid.set(cx + 2, neckY + 1, A); grid.set(cx - 2, neckY + 2, O); grid.set(cx + 2, neckY + 2, O);
  }
}

export function flattenGrid(grid: number[][]): number[][] {
  return grid.map(row => [...row]);
}
