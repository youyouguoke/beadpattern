import type { CharacterConfig, ComposerResult } from './types.js';
import { getPalette } from './palettes.js';
import { Grid } from './grid.js';

export interface Skeleton {
  cx: number;
  headCx: number;
  headTop: number;
  headBottom: number;
  headWidth: number;
  headHeight: number;
  cheekY: number;
  shoulderY: number;
  shoulderWidth: number;
  torsoTop: number;
  torsoBottom: number;
  torsoWidth: number;
  torsoHeight: number;
  hipY: number;
  hipWidth: number;
  legY: number;
  legBottom: number;
  tailBase: { x: number; y: number };
  pose: string;
}

export function compose(config: CharacterConfig): ComposerResult {
  const palette = getPalette(config.palette);
  const grid = new Grid(config.gridSize);
  const skeleton = buildSkeleton(config);

  if (config.animal === 'cat') drawCat(grid, skeleton, palette, config);
  else if (config.animal === 'fox') drawFox(grid, skeleton, palette, config);
  else throw new Error(`Animal not implemented: ${config.animal}`);

  const used = new Set<number>();
  for (const row of grid.toArray()) for (const cell of row) if (cell > 0) used.add(cell);
  const colorMap = [0, ...Array.from(used).sort((a, b) => a - b)];
  return { grid: grid.toArray(), palette, colorMap };
}

function buildSkeleton(config: CharacterConfig): Skeleton {
  const size = config.gridSize;
  const cx = Math.floor(size / 2);
  const headTilt = config.body.headTilt;
  const pose = config.body.pose;
  const headCx = cx + headTilt;

  let headTop: number, headBottom: number, headWidth: number, headHeight: number;
  let cheekY: number, shoulderY: number, shoulderWidth: number;
  let torsoTop: number, torsoBottom: number, torsoWidth: number, torsoHeight: number;
  let hipY: number, hipWidth: number;
  let legY: number, legBottom: number, tailBase: { x: number; y: number };

  if (config.animal === 'cat') {
    switch (pose) {
      case 'sleeping':
        headTop = 14; headBottom = 26; headWidth = 9; headHeight = 12; cheekY = 24;
        shoulderY = 24; shoulderWidth = 9;
        torsoTop = 24; torsoBottom = 38; torsoWidth = 14; torsoHeight = 14; hipY = 36; hipWidth = 13;
        legY = 36; legBottom = 44; tailBase = { x: cx + 10, y: 34 };
        break;
      case 'stretching':
        headTop = 6; headBottom = 16; headWidth = 8; headHeight = 10; cheekY = 16;
        shoulderY = 14; shoulderWidth = 8;
        torsoTop = 14; torsoBottom = 36; torsoWidth = 10; torsoHeight = 22; hipY = 34; hipWidth = 12;
        legY = 34; legBottom = 46; tailBase = { x: cx + 10, y: 34 };
        break;
      case 'playful':
      case 'waving':
      case 'jumping':
      case 'happy':
      case 'holding':
      case 'eating':
      case 'curled':
      case 'sitting':
      default:
        headTop = 4; headBottom = 16; headWidth = 9; headHeight = 12; cheekY = 16;
        shoulderY = 14; shoulderWidth = 8;
        torsoTop = 14; torsoBottom = 32; torsoWidth = 12; torsoHeight = 18; hipY = 30; hipWidth = 12;
        legY = 30; legBottom = 42; tailBase = { x: cx + 10, y: 28 };
    }
  } else { // fox
    switch (pose) {
      case 'sleeping':
        headTop = 16; headBottom = 26; headWidth = 7; headHeight = 10; cheekY = 24;
        shoulderY = 24; shoulderWidth = 7;
        torsoTop = 24; torsoBottom = 38; torsoWidth = 10; torsoHeight = 14; hipY = 36; hipWidth = 10;
        legY = 36; legBottom = 44; tailBase = { x: cx + 8, y: 34 };
        break;
      case 'running':
      case 'stretching':
      case 'playful':
      case 'sitting':
      default:
        headTop = 4; headBottom = 16; headWidth = 7; headHeight = 12; cheekY = 16;
        shoulderY = 14; shoulderWidth = 7;
        torsoTop = 14; torsoBottom = 32; torsoWidth = 9; torsoHeight = 18; hipY = 30; hipWidth = 9;
        legY = 30; legBottom = 44; tailBase = { x: cx + 8, y: 28 };
    }
  }

  return { cx, headCx, headTop, headBottom, headWidth, headHeight, cheekY, shoulderY, shoulderWidth, torsoTop, torsoBottom, torsoWidth, torsoHeight, hipY, hipWidth, legY, legBottom, tailBase, pose };
}

// ---------------------------------------------------------------------------
// CAT
// ---------------------------------------------------------------------------
function drawCat(grid: Grid, s: Skeleton, palette: any, config: CharacterConfig) {
  const O = palette.outline, B = palette.base, S = palette.shadow, H = palette.highlight, L = palette.belly, N = palette.nose, E = palette.eye, W = palette.ear;
  const { cx, headCx, headTop, headBottom, headWidth, cheekY, shoulderY, torsoTop, torsoBottom, torsoWidth, torsoHeight, hipY, hipWidth, legY, legBottom, tailBase } = s;

  // Tail (behind, with root integration)
  drawCatTail(grid, s, O, B, S, H, config.body.pose);

  // Body: head-fused shoulder + torso + hips + hind legs
  // Hind legs (sitting): two haunches on sides
  const haunchRx = Math.floor(hipWidth / 2);
  const haunchRy = Math.floor((torsoBottom - hipY) / 2) + 2;
  grid.fillEllipse(cx - hipWidth + 2, hipY + 2, haunchRx, haunchRy, O); // left haunch outline
  grid.fillEllipse(cx - hipWidth + 2, hipY + 2, haunchRx - 1, haunchRy - 1, B);
  grid.fillEllipse(cx + hipWidth - 2, hipY + 2, haunchRx, haunchRy, O); // right haunch
  grid.fillEllipse(cx + hipWidth - 2, hipY + 2, haunchRx - 1, haunchRy - 1, B);
  // Hind paw shadows
  grid.fillEllipse(cx - hipWidth + 2, hipY + 4, Math.floor(haunchRx * 0.6), 1, S);
  grid.fillEllipse(cx + hipWidth - 2, hipY + 4, Math.floor(haunchRx * 0.6), 1, S);

  // Shoulder fused with head (no neck gap)
  grid.fillEllipse(cx, shoulderY, headWidth, 3, O);
  grid.fillEllipse(cx, shoulderY, headWidth - 1, 2, B);

  // Torso
  const torsoCy = Math.floor((torsoTop + torsoBottom) / 2);
  const torsoRy = Math.floor((torsoBottom - torsoTop) / 2);
  grid.fillEllipse(cx, torsoCy, torsoWidth, torsoRy, O);
  grid.fillEllipse(cx, torsoCy, torsoWidth - 1, torsoRy - 1, B);

  // Chest / belly patch (pixel cluster)
  grid.fillEllipse(cx, torsoCy + 2, Math.floor(torsoWidth * 0.4), Math.floor(torsoRy * 0.5), L);
  // Semantic shadow clusters (not gradient)
  grid.fillEllipse(cx - torsoWidth + 2, torsoCy, 2, torsoRy - 2, S); // left side
  grid.fillEllipse(cx + torsoWidth - 2, torsoCy, 2, torsoRy - 2, S); // right side
  grid.fillEllipse(cx, torsoBottom - 2, torsoWidth - 2, 1, S); // belly bottom

  // Front paws
  if (['sitting', 'playful', 'waving', 'happy', 'holding', 'eating'].includes(config.body.pose)) {
    const pawX1 = cx - 4, pawX2 = cx + 2;
    grid.fillRect(pawX1, legY, 2, legBottom - legY, O); grid.fillRect(pawX1, legY + 1, 1, legBottom - legY - 1, B);
    grid.fillRect(pawX2, legY, 2, legBottom - legY, O); grid.fillRect(pawX2, legY + 1, 1, legBottom - legY - 1, B);
    grid.fillRect(pawX1 - 1, legBottom, 3, 2, H); grid.outlineRect(pawX1 - 1, legBottom, 3, 2, O);
    grid.fillRect(pawX2 - 1, legBottom, 3, 2, H); grid.outlineRect(pawX2 - 1, legBottom, 3, 2, O);
  }
  // Pose-specific arm variations
  if (config.body.pose === 'waving') {
    grid.drawLine(cx - 5, shoulderY + 2, cx - 8, shoulderY - 4, O);
    grid.set(cx - 8, shoulderY - 4, H); grid.set(cx - 8, shoulderY - 5, O);
  }
  if (config.body.pose === 'holding') {
    grid.drawLine(cx - 5, shoulderY + 2, cx - 2, shoulderY + 5, O);
    grid.drawLine(cx + 4, shoulderY + 2, cx + 2, shoulderY + 5, O);
  }
  if (config.body.pose === 'eating') {
    grid.drawLine(cx - 5, shoulderY + 2, cx - 3, shoulderY + 6, O);
    grid.drawLine(cx + 4, shoulderY + 2, cx + 3, shoulderY + 6, O);
    grid.fillRect(cx - 2, shoulderY + 7, 4, 2, O); // bowl hint
  }
  if (config.body.pose === 'jumping') {
    grid.drawLine(cx - 5, shoulderY + 2, cx - 8, shoulderY - 2, O);
    grid.drawLine(cx + 5, shoulderY + 2, cx + 8, shoulderY - 2, O);
  }
  if (config.body.pose === 'curled') {
    // Hide front paws, just ears peeking
  }
  if (config.body.pose === 'stretching') {
    // Front legs stretched forward
    grid.drawLine(cx - 4, shoulderY + 3, cx - 8, legBottom - 3, O);
    grid.drawLine(cx + 3, shoulderY + 3, cx + 7, legBottom - 3, O);
    grid.fillRect(cx - 9, legBottom - 3, 3, 2, H); grid.outlineRect(cx - 9, legBottom - 3, 3, 2, O);
    grid.fillRect(cx + 6, legBottom - 3, 3, 2, H); grid.outlineRect(cx + 6, legBottom - 3, 3, 2, O);
  }
  if (config.body.pose === 'playful') {
    grid.drawLine(cx - 5, shoulderY + 2, cx - 8, shoulderY - 3, O);
    grid.set(cx - 8, shoulderY - 3, H); grid.set(cx - 8, shoulderY - 4, O);
  }
  if (config.body.pose === 'sleeping') {
    // Tucked front paws
    grid.fillRect(cx - 3, legY, 2, 3, O); grid.fillRect(cx + 1, legY, 2, 3, O);
    grid.fillRect(cx - 3, legY + 1, 1, 2, B); grid.fillRect(cx + 2, legY + 1, 1, 2, B);
  }

  // Head (fused with body, no neck)
  drawCatHead(grid, headCx, headTop, headBottom, headWidth, config.body.earAngle, O, B, H, L, W, config.body.pose);

  // Face
  drawCatFace(grid, headCx, headTop, headBottom, config.face, O, N, E, B);

  // Head stripes (pixel cluster)
  if (config.body.pose !== 'sleeping') {
    grid.set(headCx, headTop + 2, S); grid.set(headCx - 1, headTop + 3, S); grid.set(headCx + 1, headTop + 3, S);
  }

  if (config.accessory === 'bow') drawBow(grid, headCx, shoulderY - 1, O, N);
  if (config.accessory === 'scarf') drawScarf(grid, headCx, shoulderY, O, N);
  if (config.accessory === 'flower') drawFlower(grid, headCx + 6, headTop + 4, O, N);
}

function drawCatTail(grid: Grid, s: Skeleton, O: number, B: number, S: number, H: number, pose: string) {
  const { cx, tailBase, torsoTop, torsoBottom } = s;
  if (pose === 'sleeping') {
    // Tail wrapped over body
    for (let i = 0; i < 10; i++) {
      grid.set(cx - 4 + i, torsoTop - 1, O); grid.set(cx - 4 + i, torsoTop - 2, O);
    }
    grid.set(cx - 3, torsoTop - 2, B); grid.set(cx - 2, torsoTop - 2, B); grid.set(cx - 1, torsoTop - 2, B); grid.set(cx, torsoTop - 2, B); grid.set(cx + 1, torsoTop - 2, B); grid.set(cx + 2, torsoTop - 2, B); grid.set(cx + 3, torsoTop - 2, B); grid.set(cx + 4, torsoTop - 2, B);
  } else if (pose === 'curled') {
    // Tail wrapped around body like a donut
    for (let i = 0; i < 14; i++) {
      const angle = (i / 14) * Math.PI * 1.5;
      const tx = cx + Math.floor(Math.cos(angle) * 6) + 4;
      const ty = tailBase.y + Math.floor(Math.sin(angle) * 4) - 2;
      grid.set(tx, ty, O); grid.set(tx + 1, ty, O);
    }
  } else if (pose === 'stretching') {
    // Long tail arched up
    grid.drawLine(tailBase.x, tailBase.y, tailBase.x + 8, tailBase.y - 6, O);
    grid.drawLine(tailBase.x + 1, tailBase.y, tailBase.x + 9, tailBase.y - 6, O);
    grid.set(tailBase.x + 8, tailBase.y - 7, H); grid.set(tailBase.x + 9, tailBase.y - 7, H);
  } else if (['playful', 'waving', 'happy', 'jumping'].includes(pose)) {
    // Tail up excited
    grid.drawLine(tailBase.x, tailBase.y, tailBase.x + 2, tailBase.y - 10, O);
    grid.drawLine(tailBase.x + 1, tailBase.y, tailBase.x + 3, tailBase.y - 10, O);
    grid.set(tailBase.x + 2, tailBase.y - 11, H); grid.set(tailBase.x + 3, tailBase.y - 11, H);
  } else {
    // sitting / holding / eating: curled around right side with root shadow
    grid.set(tailBase.x, tailBase.y, O); grid.set(tailBase.x + 1, tailBase.y - 1, O);
    for (let i = 2; i < 7; i++) grid.set(tailBase.x + i, tailBase.y - 1 - Math.floor(i / 2), O);
    grid.set(tailBase.x + 6, tailBase.y - 4, H); grid.set(tailBase.x + 7, tailBase.y - 4, H);
  }
  // Tail root shadow
  grid.set(tailBase.x - 1, tailBase.y, S); grid.set(tailBase.x - 2, tailBase.y, S);
}

function drawCatHead(grid: Grid, cx: number, headTop: number, headBottom: number, headWidth: number, earAngle: string, O: number, B: number, H: number, L: number, W: number, pose: string) {
  const cy = Math.floor((headTop + headBottom) / 2);
  const ry = headBottom - cy;
  grid.fillEllipse(cx, cy, headWidth, ry, O);
  grid.fillEllipse(cx, cy, headWidth - 1, ry - 1, B);
  // Muzzle patch
  grid.fillEllipse(cx, cy + ry - 2, headWidth - 2, 2, L);
  // Top highlight cluster
  grid.set(cx - 1, cy - ry + 2, H); grid.set(cx, cy - ry + 2, H); grid.set(cx + 1, cy - ry + 2, H);
  // Ears with angle
  drawCatEars(grid, cx, headTop, earAngle, O, W, B);
}

function drawCatEars(grid: Grid, headCx: number, headTop: number, angle: string, O: number, W: number, B: number) {
  const leftTip = { x: headCx - 6, y: headTop + 1 };
  const rightTip = { x: headCx + 6, y: headTop + 1 };
  if (angle === 'alert') {
    leftTip.y -= 1; rightTip.y -= 1;
  } else if (angle === 'relaxed') {
    leftTip.y += 1; rightTip.y += 1;
  } else if (angle === 'curious') {
    leftTip.x -= 1; leftTip.y -= 1;
    rightTip.x += 1; rightTip.y -= 1;
  }
  // Left ear
  grid.set(headCx - 4, headTop + 2, O); grid.set(leftTip.x, leftTip.y, O); grid.set(headCx - 5, headTop + 3, O);
  grid.set(headCx - 5, headTop + 2, W);
  // Right ear
  grid.set(headCx + 4, headTop + 2, O); grid.set(rightTip.x, rightTip.y, O); grid.set(headCx + 5, headTop + 3, O);
  grid.set(headCx + 5, headTop + 2, W);
}

function drawCatFace(grid: Grid, cx: number, headTop: number, headBottom: number, face: import('./types.js').FaceConfig, O: number, N: number, E: number, B: number) {
  const cy = Math.floor((headTop + headBottom) / 2);
  const eyeY = cy - 1;
  const dirOffset = { front: 0, left: -1, right: 1, up: -1, down: 1 } as const;
  const dx = dirOffset[face.eyeDirection];
  const leftX = cx - 3 + dx; const rightX = cx + 3 + dx;

  // Nose
  grid.set(cx, cy + 1, N);

  // Eye expression
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
    case 'cute':
    default:
      grid.set(leftX, eyeY, E); grid.set(leftX - 1, eyeY - 1, E); grid.set(leftX, eyeY - 1, E);
      grid.set(rightX, eyeY, E); grid.set(rightX + 1, eyeY - 1, E); grid.set(rightX, eyeY - 1, E);
  }

  // Mouth
  const mouthY = cy + 2;
  switch (face.mouth) {
    case 'smile':
      grid.set(cx - 1, mouthY + 1, O); grid.set(cx, mouthY, O); grid.set(cx + 1, mouthY + 1, O); break;
    case 'open':
      grid.set(cx - 1, mouthY, O); grid.set(cx, mouthY, O); grid.set(cx + 1, mouthY, O); grid.set(cx, mouthY + 1, O); break;
    case 'w':
      grid.set(cx - 1, mouthY, O); grid.set(cx, mouthY + 1, O); grid.set(cx + 1, mouthY, O); break;
    case 'tongue':
      grid.set(cx - 1, mouthY, O); grid.set(cx, mouthY, O); grid.set(cx + 1, mouthY, O); grid.set(cx, mouthY + 1, N); grid.set(cx, mouthY + 2, N); break;
    case 'cat':
    default:
      grid.set(cx - 1, mouthY, O); grid.set(cx + 1, mouthY, O); grid.set(cx, mouthY + 1, O);
  }

  // Blush
  if (face.blush) {
    grid.set(leftX - 2, eyeY + 1, N); grid.set(rightX + 2, eyeY + 1, N);
  }
}

// ---------------------------------------------------------------------------
// FOX
// ---------------------------------------------------------------------------
function drawFox(grid: Grid, s: Skeleton, palette: any, config: CharacterConfig) {
  const O = palette.outline, B = palette.base, S = palette.shadow, H = palette.highlight, L = palette.belly, N = palette.nose, E = palette.eye, W = palette.ear;
  const { cx, headCx, headTop, headBottom, headWidth, shoulderY, torsoTop, torsoBottom, torsoWidth, hipY, hipWidth, legY, legBottom, tailBase } = s;

  // Fox tail: big, fluffy, integrated with hip
  drawFoxTail(grid, s, O, B, L, S, config.body.pose);

  // Body slim and angular
  grid.fillEllipse(cx, shoulderY, headWidth - 1, 2, O); // shoulders
  grid.fillEllipse(cx, shoulderY, headWidth - 2, 1, B);
  const torsoCy = Math.floor((torsoTop + torsoBottom) / 2);
  const torsoRy = Math.floor((torsoBottom - torsoTop) / 2);
  grid.fillEllipse(cx, torsoCy, torsoWidth, torsoRy, O);
  grid.fillEllipse(cx, torsoCy, torsoWidth - 1, torsoRy - 1, B);
  // Cream chest
  grid.fillEllipse(cx, torsoCy + 1, Math.floor(torsoWidth * 0.35), Math.floor(torsoRy * 0.5), L);
  // Semantic shadow
  grid.fillEllipse(cx - torsoWidth + 2, torsoCy, 2, torsoRy - 1, S);
  grid.fillEllipse(cx, torsoBottom - 2, torsoWidth - 2, 1, S); // belly bottom

  // Hips / tail root integration
  grid.fillEllipse(cx + hipWidth - 2, hipY + 2, 2, 2, O); // hip bump
  grid.fillEllipse(cx + hipWidth - 2, hipY + 2, 1, 1, B);
  grid.fillEllipse(cx - hipWidth + 2, hipY + 2, 2, 2, O);
  grid.fillEllipse(cx - hipWidth + 2, hipY + 2, 1, 1, B);

  // Legs
  if (config.body.pose !== 'sleeping') {
    const paw1 = cx - 3, paw2 = cx + 1;
    grid.fillRect(paw1, legY, 2, legBottom - legY, O); grid.fillRect(paw1, legY + 1, 1, legBottom - legY - 1, B);
    grid.fillRect(paw2, legY, 2, legBottom - legY, O); grid.fillRect(paw2, legY + 1, 1, legBottom - legY - 1, B);
    grid.fillRect(paw1 - 1, legBottom, 3, 2, L); grid.outlineRect(paw1 - 1, legBottom, 3, 2, O);
    grid.fillRect(paw2 - 1, legBottom, 3, 2, L); grid.outlineRect(paw2 - 1, legBottom, 3, 2, O);
  } else {
    grid.fillRect(cx - 2, legY, 2, 3, O); grid.fillRect(cx + 1, legY, 2, 3, O);
  }

  // Fox head: triangular with long muzzle
  drawFoxHead(grid, headCx, headTop, headBottom, headWidth, config.body.earAngle, O, B, H, L, N, E, W, config.face);

  if (config.accessory === 'scarf') drawScarf(grid, headCx, shoulderY, O, B);
}

function drawFoxTail(grid: Grid, s: Skeleton, O: number, B: number, L: number, S: number, pose: string) {
  const { cx, tailBase } = s;
  if (pose === 'sleeping') {
    // Tail wrapped over body/face
    for (let i = 0; i < 12; i++) {
      grid.set(cx - 5 + i, s.torsoTop - 1, O); grid.set(cx - 5 + i, s.torsoTop - 2, O);
    }
    grid.set(cx + 3, s.torsoTop - 2, L); grid.set(cx + 4, s.torsoTop - 2, L); grid.set(cx + 5, s.torsoTop - 2, L); // white tip
  } else if (pose === 'running') {
    // Streamlined tail behind
    for (let i = 0; i < 12; i++) {
      grid.set(tailBase.x + i, tailBase.y - Math.floor(i / 3), O);
    }
    grid.fillEllipse(tailBase.x + 10, tailBase.y - 3, 3, 3, O);
    grid.fillEllipse(tailBase.x + 10, tailBase.y - 3, 2, 2, L); // tip
  } else if (pose === 'playful') {
    // Tail up
    grid.drawLine(tailBase.x, tailBase.y, tailBase.x + 2, tailBase.y - 10, O);
    grid.drawLine(tailBase.x + 1, tailBase.y, tailBase.x + 3, tailBase.y - 10, O);
    grid.set(tailBase.x + 2, tailBase.y - 11, L); grid.set(tailBase.x + 3, tailBase.y - 11, L);
  } else {
    // sitting / default: big fluffy tail curving up
    grid.set(tailBase.x, tailBase.y, O); grid.set(tailBase.x + 1, tailBase.y - 1, O);
    grid.fillEllipse(tailBase.x + 6, tailBase.y - 5, 5, 5, O);
    grid.fillEllipse(tailBase.x + 6, tailBase.y - 5, 4, 4, B);
    grid.fillEllipse(tailBase.x + 7, tailBase.y - 6, 2, 2, L); // white tip
    grid.fillEllipse(tailBase.x + 5, tailBase.y - 4, 2, 2, S); // shadow cluster
  }
  // Tail root shadow
  grid.set(tailBase.x - 1, tailBase.y, S); grid.set(tailBase.x - 2, tailBase.y, S);
}

function drawFoxHead(grid: Grid, cx: number, headTop: number, headBottom: number, headWidth: number, earAngle: string, O: number, B: number, H: number, L: number, N: number, E: number, W: number, face: import('./types.js').FaceConfig) {
  const cy = Math.floor((headTop + headBottom) / 2);
  const foreheadW = Math.floor(headWidth * 0.5);
  const cheekW = headWidth;
  for (let y = headTop; y <= headBottom; y++) {
    const progress = (y - headTop) / (headBottom - headTop);
    let halfW = progress < 0.5 ? foreheadW + Math.floor((cheekW - foreheadW) * progress * 2) : cheekW - Math.floor((cheekW - 1) * (progress - 0.5) * 2);
    for (let dx = -halfW; dx <= halfW; dx++) grid.set(cx + dx, y, O);
    for (let dx = -halfW + 1; dx <= halfW - 1; dx++) grid.set(cx + dx, y, B);
  }
  // Cream cheek/muzzle
  for (let y = cy - 1; y <= headBottom - 1; y++) {
    for (let dx = -2; dx <= 2; dx++) grid.set(cx + dx, y, L);
  }
  // Nose tip
  grid.set(cx, headBottom - 1, O); grid.set(cx, headBottom - 2, N);
  // Top highlight
  grid.set(cx - 1, headTop + 2, H); grid.set(cx, headTop + 2, H); grid.set(cx + 1, headTop + 2, H);

  // Ear angle for fox: 45° alert, relaxed flatter, curious wider
  drawFoxEars(grid, cx, headTop, earAngle, O, W, B);

  // Face
  const eyeY = cy - 2;
  const dirOffset = { front: 0, left: -1, right: 1, up: -1, down: 1 } as const;
  const dx = dirOffset[face.eyeDirection];
  const leftX = cx - 3 + dx; const rightX = cx + 3 + dx;
  if (face.eye === 'sleepy') {
    grid.set(leftX - 1, eyeY, O); grid.set(leftX, eyeY, O); grid.set(leftX + 1, eyeY, O);
    grid.set(rightX - 1, eyeY, O); grid.set(rightX, eyeY, O); grid.set(rightX + 1, eyeY, O);
  } else if (face.eye === 'happy') {
    grid.set(leftX - 1, eyeY - 1, E); grid.set(leftX, eyeY, E); grid.set(leftX + 1, eyeY - 1, E);
    grid.set(rightX - 1, eyeY - 1, E); grid.set(rightX, eyeY, E); grid.set(rightX + 1, eyeY - 1, E);
  } else if (face.eye === 'curious') {
    grid.set(leftX, eyeY, E); grid.set(leftX, eyeY - 1, E); grid.set(leftX - 1, eyeY, E); grid.set(leftX + 1, eyeY, E);
    grid.set(rightX, eyeY, E); grid.set(rightX, eyeY - 1, E); grid.set(rightX - 1, eyeY, E); grid.set(rightX + 1, eyeY, E);
  } else {
    grid.set(leftX, eyeY, E); grid.set(leftX - 1, eyeY - 1, E); grid.set(leftX, eyeY - 1, E);
    grid.set(rightX, eyeY, E); grid.set(rightX + 1, eyeY - 1, E); grid.set(rightX, eyeY - 1, E);
  }

  const mouthY = headBottom - 4;
  if (face.mouth === 'w') {
    grid.set(cx - 1, mouthY, O); grid.set(cx, mouthY + 1, O); grid.set(cx + 1, mouthY, O);
  } else if (face.mouth === 'open') {
    grid.set(cx - 1, mouthY, O); grid.set(cx, mouthY, O); grid.set(cx + 1, mouthY, O); grid.set(cx, mouthY + 1, O);
  } else {
    grid.set(cx - 1, mouthY, O); grid.set(cx, mouthY, O); grid.set(cx + 1, mouthY, O);
  }
}

function drawFoxEars(grid: Grid, cx: number, headTop: number, angle: string, O: number, W: number, B: number) {
  let leftTip = { x: cx - 7, y: headTop + 1 };
  let rightTip = { x: cx + 7, y: headTop + 1 };
  if (angle === 'alert') {
    leftTip = { x: cx - 8, y: headTop - 1 }; rightTip = { x: cx + 8, y: headTop - 1 };
  } else if (angle === 'relaxed') {
    leftTip = { x: cx - 6, y: headTop + 2 }; rightTip = { x: cx + 6, y: headTop + 2 };
  } else if (angle === 'curious') {
    leftTip = { x: cx - 8, y: headTop - 1 }; rightTip = { x: cx + 7, y: headTop + 1 };
  }
  // Left ear 45°
  grid.drawLine(cx - 3, headTop + 2, leftTip.x, leftTip.y, O);
  grid.drawLine(cx - 4, headTop + 2, leftTip.x - 1, leftTip.y, O);
  grid.drawLine(cx - 3, headTop + 3, leftTip.x, leftTip.y + 1, O);
  grid.set(cx - 5, headTop + 2, W);
  // Right ear
  grid.drawLine(cx + 3, headTop + 2, rightTip.x, rightTip.y, O);
  grid.drawLine(cx + 4, headTop + 2, rightTip.x + 1, rightTip.y, O);
  grid.drawLine(cx + 3, headTop + 3, rightTip.x, rightTip.y + 1, O);
  grid.set(cx + 5, headTop + 2, W);
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

function drawFlower(grid: Grid, x: number, y: number, O: number, A: number) {
  grid.set(x, y - 1, A); grid.set(x - 1, y, A); grid.set(x + 1, y, A); grid.set(x, y + 1, A); grid.set(x, y, O);
}

export function flattenGrid(grid: number[][]): number[][] {
  return grid.map(row => [...row]);
}
