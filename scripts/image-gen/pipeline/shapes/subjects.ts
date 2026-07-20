import type { ShapeContext, ShapeLayer } from '../dsl/types.js';
import { createMask, drawCircle, drawEllipse, drawRoundedRect, createShapeLayer, applySymmetry } from './base.js';

export function catShape(ctx: ShapeContext): ShapeLayer[] {
  const size = ctx.size;
  const center = size / 2;
  const layers: ShapeLayer[] = [];

  // Head body
  let head = createMask(size);
  head = drawEllipse(head, center, center - size * 0.02, size * 0.32, size * 0.28);
  head = applySymmetry(head, 'vertical');
  layers.push(createShapeLayer(ctx, head, 'body', 0, 'cat-head'));

  // Ears (triangles via rounded rectangles)
  let ears = createMask(size);
  ears = drawRoundedRect(ears, center - size * 0.30, center - size * 0.30, size * 0.12, size * 0.20, 2, true);
  ears = applySymmetry(ears, 'vertical');
  layers.push(createShapeLayer(ctx, ears, 'detail', 1, 'cat-ears'));

  // Eyes
  let eyes = createMask(size);
  eyes = drawEllipse(eyes, center - size * 0.10, center - size * 0.05, size * 0.06, size * 0.08);
  eyes = applySymmetry(eyes, 'vertical');
  layers.push(createShapeLayer(ctx, eyes, 'detail', 1, 'cat-eyes'));

  // Inner eye highlight
  let pupils = createMask(size);
  pupils = drawCircle(pupils, center - size * 0.08, center - size * 0.05, size * 0.025);
  pupils = applySymmetry(pupils, 'vertical');
  layers.push(createShapeLayer(ctx, pupils, 'highlight', 0, 'cat-pupils'));

  // Nose
  let nose = createMask(size);
  nose = drawEllipse(nose, center, center + size * 0.04, size * 0.03, size * 0.02);
  layers.push(createShapeLayer(ctx, nose, 'detail', 2, 'cat-nose'));

  // Whiskers (small dots)
  let whiskers = createMask(size);
  whiskers = drawCircle(whiskers, center - size * 0.14, center + size * 0.06, size * 0.012);
  whiskers = applySymmetry(whiskers, 'vertical');
  whiskers = drawCircle(whiskers, center - size * 0.18, center + size * 0.08, size * 0.012);
  whiskers = applySymmetry(whiskers, 'vertical');
  layers.push(createShapeLayer(ctx, whiskers, 'detail', 1, 'cat-whiskers'));

  return layers;
}

export function flowerShape(ctx: ShapeContext): ShapeLayer[] {
  const size = ctx.size;
  const center = size / 2;
  const layers: ShapeLayer[] = [];

  // Petals as 5 circles around center
  let petals = createMask(size);
  for (let i = 0; i < 6; i++) {
    const angle = (i * 60) * Math.PI / 180;
    const px = center + Math.cos(angle) * size * 0.16;
    const py = center + Math.sin(angle) * size * 0.16;
    petals = drawCircle(petals, px, py, size * 0.10);
  }
  layers.push(createShapeLayer(ctx, petals, 'body', 0, 'flower-petals'));

  // Center
  let centerM = createMask(size);
  centerM = drawCircle(centerM, center, center, size * 0.10);
  layers.push(createShapeLayer(ctx, centerM, 'detail', 1, 'flower-center'));

  return layers;
}

export function heartShape(ctx: ShapeContext): ShapeLayer[] {
  const size = ctx.size;
  const center = size / 2;
  const layers: ShapeLayer[] = [];
  let heart = createMask(size);
  // Two top circles + bottom triangle approximation
  heart = drawCircle(heart, center - size * 0.13, center - size * 0.13, size * 0.14);
  heart = drawCircle(heart, center + size * 0.13, center - size * 0.13, size * 0.14);
  // Bottom point
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = Math.abs(x - center + 0.5);
      const dy = y - center + 0.5;
      if (dy > 0 && dx / (dy + size * 0.05) <= 0.9) heart[y][x] = true;
    }
  }
  heart = applySymmetry(heart, 'vertical');
  layers.push(createShapeLayer(ctx, heart, 'body', 0, 'heart-body'));
  return layers;
}

export function starShape(ctx: ShapeContext): ShapeLayer[] {
  const size = ctx.size;
  const center = size / 2;
  const layers: ShapeLayer[] = [];
  let star = createMask(size);
  // Five-pointed star via simple radial threshold
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - center + 0.5;
      const dy = center - 0.5 - y;
      const r = Math.sqrt(dx * dx + dy * dy);
      let angle = Math.atan2(dy, dx);
      if (angle < 0) angle += Math.PI * 2;
      const radiusAtAngle = 0.5 * size * (0.35 + 0.25 * Math.cos(5 * (angle - Math.PI / 2)));
      if (r <= radiusAtAngle) star[y][x] = true;
    }
  }
  star = applySymmetry(star, 'vertical');
  layers.push(createShapeLayer(ctx, star, 'body', 0, 'star-body'));
  return layers;
}

export function ghostShape(ctx: ShapeContext): ShapeLayer[] {
  const size = ctx.size;
  const center = size / 2;
  const layers: ShapeLayer[] = [];

  // Body: rounded top, wavy bottom
  let body = createMask(size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - center + 0.5;
      const dy = center - 0.5 - y;
      if (y < center - size * 0.10) {
        if (dx * dx + dy * dy <= Math.pow(size * 0.32, 2)) body[y][x] = true;
      } else {
        const w = size * 0.30 + Math.sin(y * 0.5) * size * 0.02;
        if (Math.abs(dx) <= w) body[y][x] = true;
      }
    }
  }
  body = applySymmetry(body, 'vertical');
  layers.push(createShapeLayer(ctx, body, 'body', 0, 'ghost-body'));

  // Eyes
  let eyes = createMask(size);
  eyes = drawCircle(eyes, center - size * 0.10, center - size * 0.08, size * 0.05);
  eyes = applySymmetry(eyes, 'vertical');
  layers.push(createShapeLayer(ctx, eyes, 'detail', 1, 'ghost-eyes'));

  // Mouth (small O)
  let mouth = createMask(size);
  mouth = drawCircle(mouth, center, center + size * 0.06, size * 0.04);
  layers.push(createShapeLayer(ctx, mouth, 'detail', 1, 'ghost-mouth'));

  return layers;
}

export function pumpkinShape(ctx: ShapeContext): ShapeLayer[] {
  const size = ctx.size;
  const center = size / 2;
  const layers: ShapeLayer[] = [];

  // Main pumpkin body
  let body = createMask(size);
  body = drawEllipse(body, center, center, size * 0.32, size * 0.28);
  body = applySymmetry(body, 'vertical');
  layers.push(createShapeLayer(ctx, body, 'body', 0, 'pumpkin-body'));

  // Vertical ribs
  let ribs = createMask(size);
  for (let i = -2; i <= 2; i++) {
    const ox = center + i * size * 0.08;
    ribs = drawEllipse(ribs, ox, center, size * 0.05, size * 0.26);
  }
  ribs = applySymmetry(ribs, 'vertical');
  layers.push(createShapeLayer(ctx, ribs, 'detail', 1, 'pumpkin-ribs'));

  // Stem
  let stem = createMask(size);
  stem = drawRoundedRect(stem, center - size * 0.04, center - size * 0.32, size * 0.08, size * 0.10, 2, true);
  layers.push(createShapeLayer(ctx, stem, 'detail', 2, 'pumpkin-stem'));

  return layers;
}

export function rainbowShape(ctx: ShapeContext): ShapeLayer[] {
  const size = ctx.size;
  const center = size / 2;
  const layers: ShapeLayer[] = [];
  const colors = Math.min(6, ctx.palette.length);
  for (let i = 0; i < colors; i++) {
    const radius = size * 0.42 - i * size * 0.05;
    let arc = createMask(size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - center + 0.5;
        const dy = center - 0.5 - y;
        const r = Math.sqrt(dx * dx + dy * dy);
        if (Math.abs(r - radius) <= size * 0.025 && y > center - size * 0.05) arc[y][x] = true;
      }
    }
    arc = applySymmetry(arc, 'vertical');
    layers.push(createShapeLayer(ctx, arc, 'body', i, `rainbow-arc-${i}`));
  }
  return layers;
}

export function smileyShape(ctx: ShapeContext): ShapeLayer[] {
  const size = ctx.size;
  const center = size / 2;
  const layers: ShapeLayer[] = [];

  // Face
  let face = createMask(size);
  face = drawCircle(face, center, center, size * 0.32);
  layers.push(createShapeLayer(ctx, face, 'body', 0, 'smiley-face'));

  // Eyes
  let eyes = createMask(size);
  eyes = drawEllipse(eyes, center - size * 0.12, center - size * 0.08, size * 0.05, size * 0.07);
  eyes = applySymmetry(eyes, 'vertical');
  layers.push(createShapeLayer(ctx, eyes, 'detail', 1, 'smiley-eyes'));

  // Mouth (smile arc)
  let mouth = createMask(size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - center + 0.5;
      const dy = center - 0.5 - y;
      const r = Math.sqrt(dx * dx + dy * dy);
      if (r >= size * 0.18 && r <= size * 0.22 && dy < 0) mouth[y][x] = true;
    }
  }
  mouth = applySymmetry(mouth, 'vertical');
  layers.push(createShapeLayer(ctx, mouth, 'detail', 1, 'smiley-mouth'));

  return layers;
}

export function mushroomShape(ctx: ShapeContext): ShapeLayer[] {
  const size = ctx.size;
  const center = size / 2;
  const layers: ShapeLayer[] = [];

  // Stem
  let stem = createMask(size);
  stem = drawRoundedRect(stem, center - size * 0.10, center + size * 0.06, size * 0.20, size * 0.22, 3, true);
  layers.push(createShapeLayer(ctx, stem, 'body', 1, 'mushroom-stem'));

  // Cap
  let cap = createMask(size);
  cap = drawEllipse(cap, center, center - size * 0.08, size * 0.34, size * 0.22);
  cap = applySymmetry(cap, 'vertical');
  layers.push(createShapeLayer(ctx, cap, 'body', 0, 'mushroom-cap'));

  // Spots on cap
  let spots = createMask(size);
  spots = drawCircle(spots, center - size * 0.12, center - size * 0.10, size * 0.05);
  spots = drawCircle(spots, center + size * 0.12, center - size * 0.10, size * 0.05);
  spots = drawCircle(spots, center, center - size * 0.04, size * 0.04);
  spots = applySymmetry(spots, 'vertical');
  layers.push(createShapeLayer(ctx, spots, 'detail', 2, 'mushroom-spots'));

  return layers;
}

export function bunnyShape(ctx: ShapeContext): ShapeLayer[] {
  const size = ctx.size;
  const center = size / 2;
  const layers: ShapeLayer[] = [];

  // Head
  let head = createMask(size);
  head = drawEllipse(head, center, center + size * 0.06, size * 0.26, size * 0.22);
  head = applySymmetry(head, 'vertical');
  layers.push(createShapeLayer(ctx, head, 'body', 0, 'bunny-head'));

  // Ears (long vertical)
  let ears = createMask(size);
  ears = drawEllipse(ears, center - size * 0.10, center - size * 0.22, size * 0.07, size * 0.18);
  ears = applySymmetry(ears, 'vertical');
  layers.push(createShapeLayer(ctx, ears, 'body', 0, 'bunny-ears'));

  // Inner ears
  let innerEars = createMask(size);
  innerEars = drawEllipse(innerEars, center - size * 0.10, center - size * 0.22, size * 0.03, size * 0.12);
  innerEars = applySymmetry(innerEars, 'vertical');
  layers.push(createShapeLayer(ctx, innerEars, 'detail', 2, 'bunny-inner-ears'));

  // Eyes
  let eyes = createMask(size);
  eyes = drawCircle(eyes, center - size * 0.08, center + size * 0.04, size * 0.04);
  eyes = applySymmetry(eyes, 'vertical');
  layers.push(createShapeLayer(ctx, eyes, 'detail', 1, 'bunny-eyes'));

  // Nose
  let nose = createMask(size);
  nose = drawEllipse(nose, center, center + size * 0.10, size * 0.03, size * 0.02);
  layers.push(createShapeLayer(ctx, nose, 'detail', 2, 'bunny-nose'));

  return layers;
}
