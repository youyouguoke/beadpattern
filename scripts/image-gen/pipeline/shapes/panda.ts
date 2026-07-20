import type { ShapeContext, ShapeLayer } from '../dsl/types.js';
import { createMask, drawCircle, drawEllipse, createShapeLayer, applySymmetry } from './base.js';

export function pandaShape(ctx: ShapeContext): ShapeLayer[] {
  const size = ctx.size;
  const center = size / 2;
  const m = size * 0.06; // margin offset
  const layers: ShapeLayer[] = [];

  // Color indices: 0 = white, 1 = black, 2 = blush pink
  const white = 0;
  const black = 1;
  const blush = 2;

  const whiteColor = ctx.palette[white] || '#ffffff';
  const blackColor = ctx.palette[black] || '#12171a';
  const blushColor = ctx.palette[blush] || '#ffb6c1';

  // Body (small rounded body, lower)
  let body = createMask(size);
  body = drawEllipse(body, center, center + size * 0.34, size * 0.18, size * 0.16);
  body = applySymmetry(body, 'vertical');
  layers.push(createShapeLayer(ctx, body, 'body', white, 'panda-body'));

  // Arms (vertical oval on each side of body)
  let arms = createMask(size);
  arms = drawEllipse(arms, center - size * 0.18, center + size * 0.30, size * 0.07, size * 0.12);
  arms = applySymmetry(arms, 'vertical');
  layers.push(createShapeLayer(ctx, arms, 'detail', black, 'panda-arms'));

  // Legs
  let legs = createMask(size);
  legs = drawEllipse(legs, center - size * 0.12, center + size * 0.44, size * 0.07, size * 0.08);
  legs = applySymmetry(legs, 'vertical');
  layers.push(createShapeLayer(ctx, legs, 'detail', black, 'panda-legs'));

  // Head: large, slightly squished circle at upper-center
  let head = createMask(size);
  head = drawEllipse(head, center, center - size * 0.04, size * 0.40, size * 0.36);
  head = applySymmetry(head, 'vertical');
  layers.push(createShapeLayer(ctx, head, 'body', white, 'panda-head'));

  // Ears: on upper sides, not at edge
  let ears = createMask(size);
  ears = drawCircle(ears, center - size * 0.30, center - size * 0.25, size * 0.11);
  ears = applySymmetry(ears, 'vertical');
  layers.push(createShapeLayer(ctx, ears, 'detail', black, 'panda-ears'));

  // Eye patches: larger, offset from center
  let patches = createMask(size);
  patches = drawEllipse(patches, center - size * 0.13, center - size * 0.06, size * 0.11, size * 0.09);
  patches = applySymmetry(patches, 'vertical');
  layers.push(createShapeLayer(ctx, patches, 'detail', black, 'panda-eye-patches'));

  // Eyes: small white circles inside patches
  let eyes = createMask(size);
  eyes = drawCircle(eyes, center - size * 0.13, center - size * 0.07, size * 0.035);
  eyes = applySymmetry(eyes, 'vertical');
  layers.push(createShapeLayer(ctx, eyes, 'highlight', white, 'panda-eyes'));

  // Pupils
  let pupils = createMask(size);
  pupils = drawCircle(pupils, center - size * 0.12, center - size * 0.06, size * 0.018);
  pupils = applySymmetry(pupils, 'vertical');
  layers.push(createShapeLayer(ctx, pupils, 'detail', black, 'panda-pupils'));

  // Nose: small black oval near center
  let nose = createMask(size);
  nose = drawEllipse(nose, center, center + size * 0.03, size * 0.04, size * 0.025);
  layers.push(createShapeLayer(ctx, nose, 'detail', black, 'panda-nose'));

  // Mouth: tiny 'w' shape using two dots
  let mouth = createMask(size);
  mouth = drawCircle(mouth, center - size * 0.02, center + size * 0.08, size * 0.015);
  mouth = applySymmetry(mouth, 'vertical');
  layers.push(createShapeLayer(ctx, mouth, 'detail', black, 'panda-mouth'));

  // Blush: small pink ovals on cheeks
  let blushM = createMask(size);
  blushM = drawEllipse(blushM, center - size * 0.22, center + size * 0.05, size * 0.04, size * 0.025);
  blushM = applySymmetry(blushM, 'vertical');
  layers.push(createShapeLayer({ ...ctx, palette: [blushColor] }, blushM, 'detail', 0, 'panda-blush'));

  return layers;
}
