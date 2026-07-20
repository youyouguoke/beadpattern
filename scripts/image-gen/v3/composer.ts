import type { CharacterConfig, ComposerResult } from './types.js';
import { getPalette } from './palettes.js';

export const TRANSPARENT = 0;

export class Grid {
  private size: number;
  private data: number[][];

  constructor(size: number) {
    this.size = size;
    this.data = Array.from({ length: size }, () => Array(size).fill(TRANSPARENT));
  }

  set(x: number, y: number, colorIndex: number) {
    if (x >= 0 && x < this.size && y >= 0 && y < this.size) {
      this.data[y][x] = colorIndex;
    }
  }

  get(x: number, y: number): number {
    if (x >= 0 && x < this.size && y >= 0 && y < this.size) return this.data[y][x];
    return TRANSPARENT;
  }

  fillRect(x: number, y: number, w: number, h: number, colorIndex: number) {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        this.set(x + dx, y + dy, colorIndex);
      }
    }
  }

  fillEllipse(cx: number, cy: number, rx: number, ry: number, colorIndex: number, outlineColor?: number) {
    for (let dy = -ry; dy <= ry; dy++) {
      for (let dx = -rx; dx <= rx; dx++) {
        if (rx === 0 || ry === 0) continue;
        const dist = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);
        if (dist <= 1.0) {
          const isEdge = dist >= 0.75;
          this.set(cx + dx, cy + dy, isEdge && outlineColor !== undefined ? outlineColor : colorIndex);
        }
      }
    }
  }

  outlineRect(x: number, y: number, w: number, h: number, colorIndex: number) {
    for (let dx = 0; dx < w; dx++) {
      this.set(x + dx, y, colorIndex);
      this.set(x + dx, y + h - 1, colorIndex);
    }
    for (let dy = 1; dy < h - 1; dy++) {
      this.set(x, y + dy, colorIndex);
      this.set(x + w - 1, y + dy, colorIndex);
    }
  }

  toArray(): number[][] {
    return this.data.map(row => [...row]);
  }
}

export function compose(config: CharacterConfig): ComposerResult {
  const palette = getPalette(config.palette);
  const grid = new Grid(config.gridSize);
  const O = palette.outline;
  const B = palette.base;
  const S = palette.shadow;
  const H = palette.highlight;
  const A = palette.accent;

  const cx = Math.floor(config.gridSize / 2);
  const size = config.gridSize;
  const headCy = Math.floor(size * 0.10);
  const bodyTop = headCy + 3;
  const bodyBottom = size - 2;
  const bodyW = Math.floor(size * 0.72);
  const bodyH = bodyBottom - bodyTop;
  const bodyCx = cx;
  const bodyCy = bodyTop + Math.floor(bodyH / 2);
  const rx = Math.floor(bodyW / 2);
  const ry = Math.floor(bodyH / 2);

  const shared = { O, B, S, H, A, cx, size, headCy, bodyTop, bodyBottom, bodyW, bodyH, bodyCx, bodyCy, rx, ry };

  switch (config.animal) {
    case 'cat':
      drawCat(grid, config, shared);
      break;
    case 'dog':
      drawDog(grid, config, shared);
      break;
    case 'panda':
      drawPanda(grid, config, shared);
      break;
    case 'fox':
      drawFox(grid, config, shared);
      break;
    case 'penguin':
      drawPenguin(grid, config, shared);
      break;
    case 'lion':
      drawLion(grid, config, shared);
      break;
    case 'bunny':
      drawBunny(grid, config, shared);
      break;
    default:
      throw new Error(`Animal not yet implemented: ${config.animal}`);
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

interface Shared {
  O: number; B: number; S: number; H: number; A: number;
  cx: number; size: number; headCy: number;
  bodyTop: number; bodyBottom: number; bodyW: number; bodyH: number;
  bodyCx: number; bodyCy: number; rx: number; ry: number;
}

function drawSittingBody(grid: Grid, s: Shared, fill: number, highlight: number) {
  const { O, B, bodyCx, bodyCy, rx, ry, cx, bodyW, bodyBottom } = s;
  // outer shell
  grid.fillEllipse(bodyCx, bodyCy, rx, ry, O);
  // fill
  grid.fillEllipse(bodyCx, bodyCy, rx - 1, ry - 1, fill);
  // belly highlight
  grid.fillEllipse(bodyCx, bodyCy + 1, Math.max(2, Math.floor(rx / 2)), Math.max(2, Math.floor(ry / 2)), highlight);
  // paws
  const pawY = bodyBottom - 1;
  const leftPawX = cx - Math.floor(bodyW / 2) + 2;
  const rightPawX = cx + Math.floor(bodyW / 2) - 4;
  grid.fillRect(leftPawX, pawY, 3, 2, highlight);
  grid.fillRect(rightPawX, pawY, 3, 2, highlight);
  grid.outlineRect(leftPawX, pawY, 3, 2, O);
  grid.outlineRect(rightPawX, pawY, 3, 2, O);
}

function drawRoundHead(grid: Grid, s: Shared, fill: number, muzzle: number) {
  const { O, cx, headCy } = s;
  grid.fillEllipse(cx, headCy, 3, 2, O);
  grid.fillEllipse(cx, headCy, 2, 1, fill);
  grid.set(cx, headCy + 1, muzzle);
}

// ---------------------------------------------------------------------------
// CAT
// ---------------------------------------------------------------------------
function drawCat(grid: Grid, config: CharacterConfig, s: Shared) {
  const { O, B, H, A, cx, headCy, bodyBottom } = s;
  drawSittingBody(grid, s, B, H);
  drawRoundHead(grid, s, B, H);
  drawCatEars(grid, cx, headCy, config.ear, O, B, A);
  drawEyes(grid, cx, headCy, config.eye, O, B, H, A);
  // Nose / mouth
  grid.set(cx, headCy + 1, A);
  grid.set(cx - 1, headCy + 2, O);
  grid.set(cx + 1, headCy + 2, O);
  grid.set(cx, headCy + 2, O);
  // whiskers
  grid.set(cx - 3, headCy + 1, O); grid.set(cx - 4, headCy + 1, O);
  grid.set(cx + 3, headCy + 1, O); grid.set(cx + 4, headCy + 1, O);
  if (config.tail !== 'none') drawTail(grid, cx, bodyBottom - 2, config.tail, O, B, H);
  if (config.accessory === 'bow') drawBow(grid, cx, headCy + 3, O, A);
  if (config.accessory === 'heart') drawHeart(grid, cx + 4, headCy + 2, O, A);
  if (config.accessory === 'flower') drawFlower(grid, cx - 4, headCy + 2, O, A, H);
  if (config.accessory === 'scarf') drawScarf(grid, cx, headCy + 3, O, A);
}

function drawCatEars(grid: Grid, cx: number, headCy: number, ear: string, O: number, B: number, A: number) {
  if (ear === 'rounded') {
    grid.fillEllipse(cx - 3, headCy - 2, 2, 2, O);
    grid.fillEllipse(cx - 3, headCy - 2, 1, 1, B);
    grid.fillEllipse(cx + 3, headCy - 2, 2, 2, O);
    grid.fillEllipse(cx + 3, headCy - 2, 1, 1, B);
  } else if (ear === 'large') {
    grid.fillEllipse(cx - 3, headCy - 3, 2, 3, O);
    grid.fillEllipse(cx - 3, headCy - 3, 1, 2, B);
    grid.fillEllipse(cx + 3, headCy - 3, 2, 3, O);
    grid.fillEllipse(cx + 3, headCy - 3, 1, 2, B);
  } else {
    // pointed
    grid.set(cx - 3, headCy - 2, O); grid.set(cx - 2, headCy - 2, O); grid.set(cx - 2, headCy - 3, O);
    grid.set(cx + 3, headCy - 2, O); grid.set(cx + 2, headCy - 2, O); grid.set(cx + 2, headCy - 3, O);
    grid.set(cx - 2, headCy - 2, A); grid.set(cx + 2, headCy - 2, A);
  }
}

// ---------------------------------------------------------------------------
// DOG
// ---------------------------------------------------------------------------
function drawDog(grid: Grid, config: CharacterConfig, s: Shared) {
  const { O, B, H, A, cx, headCy, bodyBottom } = s;
  drawSittingBody(grid, s, B, H);
  drawRoundHead(grid, s, B, H);

  // Ears
  if (config.ear === 'floppy') {
    grid.fillEllipse(cx - 6, headCy, 2, 4, O);
    grid.fillEllipse(cx - 6, headCy, 1, 3, B);
    grid.fillEllipse(cx + 6, headCy, 2, 4, O);
    grid.fillEllipse(cx + 6, headCy, 1, 3, B);
  } else if (config.ear === 'rounded') {
    grid.fillEllipse(cx - 5, headCy - 3, 2, 2, O);
    grid.fillEllipse(cx - 5, headCy - 3, 1, 1, B);
    grid.fillEllipse(cx + 5, headCy - 3, 2, 2, O);
    grid.fillEllipse(cx + 5, headCy - 3, 1, 1, B);
  } else {
    grid.set(cx - 5, headCy - 3, O); grid.set(cx - 4, headCy - 4, O); grid.set(cx - 3, headCy - 3, O);
    grid.set(cx + 3, headCy - 3, O); grid.set(cx + 4, headCy - 4, O); grid.set(cx + 5, headCy - 3, O);
  }

  // Nose / mouth
  grid.set(cx, headCy + 1, A);
  grid.set(cx - 1, headCy + 2, O);
  grid.set(cx, headCy + 2, O);
  grid.set(cx + 1, headCy + 2, O);
  if (config.eye === 'happy') grid.set(cx, headCy + 3, A);

  drawEyes(grid, cx, headCy, config.eye, O, B, H, A);

  if (config.tail !== 'none') drawTail(grid, cx, bodyBottom - 2, config.tail, O, B, H);
  if (config.accessory === 'bow') drawBow(grid, cx, headCy + 3, O, A);
  if (config.accessory === 'ball') drawBall(grid, cx + 4, bodyBottom - 4, O, A);
  if (config.accessory === 'scarf') drawScarf(grid, cx, headCy + 3, O, A);
}

// ---------------------------------------------------------------------------
// PANDA
// ---------------------------------------------------------------------------
function drawPanda(grid: Grid, config: CharacterConfig, s: Shared) {
  const { O, B, H, A, cx, headCy, bodyBottom } = s;
  // black body
  drawSittingBody(grid, s, O, H);
  drawRoundHead(grid, s, B, H);

  // Ears black
  grid.fillEllipse(cx - 5, headCy - 3, 2, 2, O);
  grid.fillEllipse(cx + 5, headCy - 3, 2, 2, O);

  // Eye patches
  grid.fillEllipse(cx - 2, headCy - 1, 2, 2, O);
  grid.fillEllipse(cx + 2, headCy - 1, 2, 2, O);

  drawEyes(grid, cx, headCy + 1, config.eye, O, B, H, A);
  grid.set(cx, headCy + 2, O); // nose

  // arms holding bamboo
  if (config.pose === 'holding') {
    grid.fillRect(cx - 6, headCy + 4, 2, 3, O);
    grid.fillRect(cx + 5, headCy + 4, 2, 3, O);
  }

  if (config.accessory === 'bamboo') {
    drawBamboo(grid, cx + 6, headCy + 5, O, A, H);
  }
  if (config.accessory === 'bow') drawBow(grid, cx, headCy + 5, O, A);
  if (config.tail !== 'none') drawTail(grid, cx, bodyBottom - 2, config.tail, O, O, H);
}

// ---------------------------------------------------------------------------
// FOX
// ---------------------------------------------------------------------------
function drawFox(grid: Grid, config: CharacterConfig, s: Shared) {
  const { O, B, H, A, cx, headCy, bodyBottom } = s;
  drawSittingBody(grid, s, B, H);
  drawRoundHead(grid, s, B, H);

  // Pointed ears with white inner
  grid.set(cx - 5, headCy - 3, O); grid.set(cx - 4, headCy - 5, O); grid.set(cx - 3, headCy - 3, O);
  grid.set(cx + 3, headCy - 3, O); grid.set(cx + 4, headCy - 5, O); grid.set(cx + 5, headCy - 3, O);
  grid.set(cx - 4, headCy - 3, H); grid.set(cx + 4, headCy - 3, H);

  drawEyes(grid, cx, headCy, config.eye, O, B, H, A);
  grid.set(cx, headCy + 2, O); // nose
  // white chest
  grid.fillEllipse(cx, bodyBottom - 4, 3, 2, H);

  if (config.tail !== 'none') drawTail(grid, cx, bodyBottom - 2, 'fluffy', O, B, H);
  if (config.accessory === 'bow') drawBow(grid, cx, headCy + 5, O, A);
  if (config.accessory === 'flower') drawFlower(grid, cx - 6, headCy + 3, O, A, H);
}

// ---------------------------------------------------------------------------
// PENGUIN
// ---------------------------------------------------------------------------
function drawPenguin(grid: Grid, config: CharacterConfig, s: Shared) {
  const { O, B, H, A, cx, headCy, bodyBottom } = s;
  // taller standing body
  grid.fillEllipse(cx, s.bodyCy, Math.floor(s.rx * 0.9), s.ry, O);
  grid.fillEllipse(cx, s.bodyCy, Math.floor(s.rx * 0.9) - 1, s.ry - 1, B);
  grid.fillEllipse(cx, s.bodyCy + 2, Math.floor(s.rx * 0.5), Math.floor(s.ry * 0.6), H);

  drawRoundHead(grid, s, B, H);
  drawEyes(grid, cx, headCy, config.eye, O, B, H, A);
  // beak
  grid.set(cx, headCy + 2, A);
  grid.set(cx - 1, headCy + 1, A);
  grid.set(cx + 1, headCy + 1, A);

  // flippers
  grid.fillRect(cx - 6, s.bodyCy - 2, 2, 4, O);
  grid.fillRect(cx + 5, s.bodyCy - 2, 2, 4, O);
  // feet
  grid.fillRect(cx - 3, bodyBottom - 1, 2, 1, A);
  grid.fillRect(cx + 2, bodyBottom - 1, 2, 1, A);
  grid.outlineRect(cx - 3, bodyBottom - 1, 2, 1, O);
  grid.outlineRect(cx + 2, bodyBottom - 1, 2, 1, O);

  if (config.accessory === 'bow') drawBow(grid, cx, headCy + 5, O, A);
  if (config.accessory === 'scarf') drawScarf(grid, cx, headCy + 5, O, A);
}

// ---------------------------------------------------------------------------
// LION
// ---------------------------------------------------------------------------
function drawLion(grid: Grid, config: CharacterConfig, s: Shared) {
  const { O, B, S, H, A, cx, headCy, bodyBottom } = s;
  drawSittingBody(grid, s, B, H);

  // Mane around head
  grid.fillEllipse(cx, headCy, 7, 6, O);
  grid.fillEllipse(cx, headCy, 6, 5, S);
  grid.fillEllipse(cx, headCy, 5, 4, B);

  // Face
  grid.fillEllipse(cx, headCy, 4, 3, O);
  grid.fillEllipse(cx, headCy, 3, 2, H);

  // Ears
  grid.fillEllipse(cx - 5, headCy - 4, 2, 2, O);
  grid.fillEllipse(cx + 5, headCy - 4, 2, 2, O);

  drawEyes(grid, cx, headCy, config.eye, O, B, H, A);
  grid.set(cx, headCy + 1, O); // nose

  if (config.tail !== 'none') drawTail(grid, cx, bodyBottom - 2, 'fluffy', O, B, H);
  if (config.accessory === 'bow') drawBow(grid, cx, headCy + 5, O, A);
}

// ---------------------------------------------------------------------------
// BUNNY
// ---------------------------------------------------------------------------
function drawBunny(grid: Grid, config: CharacterConfig, s: Shared) {
  const { O, B, H, A, cx, headCy, bodyBottom } = s;
  drawSittingBody(grid, s, B, H);
  drawRoundHead(grid, s, B, H);

  // Long ears
  grid.fillRect(cx - 3, headCy - 8, 2, 5, O);
  grid.fillRect(cx - 2, headCy - 7, 1, 4, H);
  grid.fillRect(cx + 2, headCy - 8, 2, 5, O);
  grid.fillRect(cx + 3, headCy - 7, 1, 4, H);

  drawEyes(grid, cx, headCy, config.eye, O, B, H, A);
  grid.set(cx, headCy + 2, A); // nose

  if (config.tail !== 'none') drawTail(grid, cx, bodyBottom - 2, 'fluffy', O, H, H);
  if (config.accessory === 'bow') drawBow(grid, cx, headCy + 5, O, A);
  if (config.accessory === 'flower') drawFlower(grid, cx - 6, headCy + 3, O, A, H);
}

// ---------------------------------------------------------------------------
// SHARED: EYES
// ---------------------------------------------------------------------------
function drawEyes(grid: Grid, cx: number, headCy: number, eye: string, O: number, B: number, H: number, A: number) {
  const leftX = cx - 2;
  const rightX = cx + 2;
  const y = headCy - 1;

  switch (eye) {
    case 'round':
      grid.set(leftX, y, O); grid.set(rightX, y, O);
      break;
    case 'sleepy':
      grid.set(leftX - 1, y, O); grid.set(leftX, y, O); grid.set(leftX + 1, y, O);
      grid.set(rightX - 1, y, O); grid.set(rightX, y, O); grid.set(rightX + 1, y, O);
      break;
    case 'anime':
      grid.set(leftX, y, O); grid.set(leftX, y - 1, O); grid.set(leftX - 1, y, O);
      grid.set(rightX, y, O); grid.set(rightX, y - 1, O); grid.set(rightX + 1, y, O);
      break;
    case 'cute':
      grid.set(leftX, y, O); grid.set(leftX - 1, y - 1, O); grid.set(leftX, y - 1, O);
      grid.set(rightX, y, O); grid.set(rightX + 1, y - 1, O); grid.set(rightX, y - 1, O);
      break;
    case 'happy':
      grid.set(leftX - 1, y - 1, O); grid.set(leftX, y, O); grid.set(leftX + 1, y - 1, O);
      grid.set(rightX - 1, y - 1, O); grid.set(rightX, y, O); grid.set(rightX + 1, y - 1, O);
      break;
    case 'wink':
      grid.set(leftX, y, O); grid.set(leftX, y - 1, O);
      grid.set(rightX - 1, y - 1, O); grid.set(rightX, y, O); grid.set(rightX + 1, y - 1, O);
      break;
    default:
      grid.set(leftX, y, O); grid.set(rightX, y, O);
  }
}

// ---------------------------------------------------------------------------
// SHARED: TAIL
// ---------------------------------------------------------------------------
function drawTail(grid: Grid, cx: number, y: number, tail: string, O: number, B: number, H: number) {
  switch (tail) {
    case 'right':
      grid.fillEllipse(cx + 5, y - 2, 2, 2, O);
      grid.set(cx + 6, y - 3, O);
      break;
    case 'left':
      grid.fillEllipse(cx - 5, y - 2, 2, 2, O);
      grid.set(cx - 6, y - 3, O);
      break;
    case 'curl':
      grid.set(cx + 4, y - 1, O); grid.set(cx + 5, y - 2, O); grid.set(cx + 6, y - 3, O);
      grid.set(cx + 6, y - 4, O); grid.set(cx + 5, y - 4, O); grid.set(cx + 4, y - 3, O);
      break;
    case 'straight':
      grid.set(cx + 4, y - 1, O); grid.set(cx + 5, y - 2, O); grid.set(cx + 6, y - 3, O);
      break;
    case 'fluffy':
      grid.fillEllipse(cx + 6, y - 3, 3, 3, O);
      grid.fillEllipse(cx + 6, y - 3, 2, 2, B);
      grid.fillEllipse(cx + 6, y - 3, 1, 1, H);
      break;
    case 'heart':
      grid.set(cx + 4, y - 3, O); grid.set(cx + 5, y - 2, O); grid.set(cx + 6, y - 3, O);
      grid.set(cx + 4, y - 1, O); grid.set(cx + 5, y - 2, O); grid.set(cx + 6, y - 1, O);
      break;
    default:
      break;
  }
}

// ---------------------------------------------------------------------------
// SHARED: ACCESSORIES
// ---------------------------------------------------------------------------
function drawBow(grid: Grid, cx: number, y: number, O: number, A: number) {
  grid.set(cx - 1, y, A); grid.set(cx - 2, y, A); grid.set(cx - 1, y - 1, A); grid.set(cx - 1, y + 1, A);
  grid.set(cx, y, O);
  grid.set(cx + 1, y, A); grid.set(cx + 2, y, A); grid.set(cx + 1, y - 1, A); grid.set(cx + 1, y + 1, A);
}

function drawHeart(grid: Grid, x: number, y: number, O: number, A: number) {
  grid.set(x, y - 1, O); grid.set(x - 1, y, A); grid.set(x, y, A); grid.set(x + 1, y, A); grid.set(x - 1, y + 1, O); grid.set(x + 1, y + 1, O); grid.set(x, y + 1, O);
}

function drawFlower(grid: Grid, x: number, y: number, O: number, A: number, H: number) {
  grid.set(x, y - 1, A); grid.set(x - 1, y, A); grid.set(x + 1, y, A); grid.set(x, y + 1, A); grid.set(x, y, H);
  grid.set(x - 1, y - 1, O); grid.set(x + 1, y - 1, O); grid.set(x - 1, y + 1, O); grid.set(x + 1, y + 1, O);
}

function drawBamboo(grid: Grid, x: number, y: number, O: number, A: number, H: number) {
  grid.set(x, y, A); grid.set(x, y - 1, A); grid.set(x, y - 2, A); grid.set(x, y - 3, A);
  grid.set(x - 1, y - 1, O); grid.set(x + 1, y - 1, O); grid.set(x - 1, y - 3, O); grid.set(x + 1, y - 3, O);
  grid.set(x + 2, y - 2, A); grid.set(x + 3, y - 3, A);
  grid.set(x - 2, y - 3, A); grid.set(x - 3, y - 4, A);
}

function drawBall(grid: Grid, x: number, y: number, O: number, A: number) {
  grid.set(x, y, O); grid.set(x - 1, y - 1, O); grid.set(x, y - 1, A); grid.set(x + 1, y - 1, O); grid.set(x - 1, y, A); grid.set(x + 1, y, A); grid.set(x, y + 1, O);
}

function drawScarf(grid: Grid, cx: number, y: number, O: number, A: number) {
  for (let dx = -3; dx <= 3; dx++) grid.set(cx + dx, y, A);
  grid.set(cx - 3, y, O); grid.set(cx + 3, y, O);
  grid.set(cx - 2, y + 1, A); grid.set(cx - 2, y + 2, A); grid.set(cx - 2, y + 3, O);
}

export function flattenGrid(grid: number[][]): number[][] {
  return grid.map(row => [...row]);
}
