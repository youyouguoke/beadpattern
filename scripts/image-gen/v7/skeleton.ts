import type { SkeletonAnchor } from './types.js';

export function buildCatSkeleton(pose: string, size: number): SkeletonAnchor {
  const cx = Math.floor(size / 2);

  // Default sitting cat skeleton
  const defaults: SkeletonAnchor = {
    head: { x: cx + 1, y: 10, rx: 8, ry: 7 },
    neck: { x: cx, y: 16 },
    spine: { x1: cx, y1: 16, x2: cx, y2: 28 },
    chest: { x: cx, y: 22, rx: 9, ry: 8 },
    hip: { x: cx, y: 32, rx: 10, ry: 7 },
    frontLegs: [{ x: cx - 3, y: 26, len: 10 }, { x: cx + 3, y: 26, len: 10 }],
    hindLegs: [{ x: cx - 8, y: 30, len: 8, angle: 'out' }, { x: cx + 8, y: 30, len: 8, angle: 'out' }],
    tail: { baseX: cx + 8, baseY: 30, shape: 'around' },
    ear: { angle: 'relaxed', height: 5 },
    headTilt: 0,
  };

  switch (pose) {
    case 'loaf':
      return {
        head: { x: cx, y: 14, rx: 8, ry: 7 },
        neck: { x: cx, y: 19 },
        spine: { x1: cx, y1: 19, x2: cx, y2: 31 },
        chest: { x: cx, y: 26, rx: 11, ry: 7 },
        hip: { x: cx, y: 34, rx: 11, ry: 5 },
        frontLegs: [{ x: cx - 4, y: 28, len: 6 }, { x: cx + 4, y: 28, len: 6 }],
        hindLegs: [{ x: cx - 9, y: 33, len: 5, angle: 'tucked' }, { x: cx + 9, y: 33, len: 5, angle: 'tucked' }],
        tail: { baseX: cx + 10, baseY: 34, shape: 'wrap' },
        ear: { angle: 'relaxed', height: 4 },
        headTilt: 0,
      };

    case 'sleeping':
      return {
        head: { x: cx, y: 18, rx: 8, ry: 6 },
        neck: { x: cx, y: 23 },
        spine: { x1: cx, y1: 23, x2: cx, y2: 34 },
        chest: { x: cx, y: 29, rx: 10, ry: 6 },
        hip: { x: cx, y: 37, rx: 9, ry: 5 },
        frontLegs: [{ x: cx - 6, y: 30, len: 5 }, { x: cx + 6, y: 30, len: 5 }],
        hindLegs: [{ x: cx - 8, y: 36, len: 5, angle: 'tucked' }, { x: cx + 8, y: 36, len: 5, angle: 'tucked' }],
        tail: { baseX: cx + 8, baseY: 34, shape: 'wrap' },
        ear: { angle: 'flat', height: 3 },
        headTilt: 0,
      };

    case 'stretching':
      return {
        head: { x: cx, y: 8, rx: 7, ry: 6 },
        neck: { x: cx, y: 13 },
        spine: { x1: cx, y1: 13, x2: cx + 2, y2: 32 },
        chest: { x: cx + 1, y: 20, rx: 8, ry: 7 },
        hip: { x: cx + 3, y: 35, rx: 9, ry: 6 },
        frontLegs: [{ x: cx - 4, y: 20, len: 18 }, { x: cx + 4, y: 20, len: 18 }],
        hindLegs: [{ x: cx - 8, y: 36, len: 8, angle: 'back' }, { x: cx + 8, y: 36, len: 8, angle: 'back' }],
        tail: { baseX: cx + 10, baseY: 36, shape: 'up' },
        ear: { angle: 'alert', height: 5 },
        headTilt: 0,
      };

    case 'playing-yarn':
      return {
        head: { x: cx + 2, y: 14, rx: 7, ry: 6 },
        neck: { x: cx + 1, y: 19 },
        spine: { x1: cx + 1, y1: 19, x2: cx - 2, y2: 30 },
        chest: { x: cx, y: 24, rx: 9, ry: 6 },
        hip: { x: cx - 2, y: 34, rx: 9, ry: 6 },
        frontLegs: [{ x: cx - 4, y: 26, len: 10 }, { x: cx + 6, y: 26, len: 13 }],
        hindLegs: [{ x: cx - 8, y: 34, len: 7, angle: 'out' }, { x: cx + 6, y: 34, len: 7, angle: 'tucked' }],
        tail: { baseX: cx + 8, baseY: 32, shape: 'up' },
        ear: { angle: 'curious', height: 5 },
        headTilt: 1,
      };

    case 'washing-face':
      return {
        head: { x: cx + 1, y: 12, rx: 8, ry: 7 },
        neck: { x: cx, y: 17 },
        spine: { x1: cx, y1: 17, x2: cx, y2: 28 },
        chest: { x: cx, y: 23, rx: 9, ry: 7 },
        hip: { x: cx, y: 33, rx: 10, ry: 6 },
        frontLegs: [{ x: cx - 6, y: 22, len: 7 }, { x: cx - 1, y: 20, len: 8 }],
        hindLegs: [{ x: cx - 8, y: 32, len: 7, angle: 'out' }, { x: cx + 8, y: 32, len: 7, angle: 'out' }],
        tail: { baseX: cx + 9, baseY: 32, shape: 'around' },
        ear: { angle: 'relaxed', height: 4 },
        headTilt: 1,
      };

    case 'waving':
      return {
        head: { x: cx, y: 10, rx: 8, ry: 7 },
        neck: { x: cx, y: 16 },
        spine: { x1: cx, y1: 16, x2: cx, y2: 28 },
        chest: { x: cx, y: 22, rx: 9, ry: 7 },
        hip: { x: cx, y: 33, rx: 10, ry: 6 },
        frontLegs: [{ x: cx - 3, y: 26, len: 10 }, { x: cx + 4, y: 24, len: 6 }],
        hindLegs: [{ x: cx - 8, y: 32, len: 7, angle: 'out' }, { x: cx + 8, y: 32, len: 7, angle: 'out' }],
        tail: { baseX: cx + 9, baseY: 30, shape: 'up' },
        ear: { angle: 'alert', height: 5 },
        headTilt: 0,
      };

    case 'jumping':
      return {
        head: { x: cx, y: 8, rx: 7, ry: 6 },
        neck: { x: cx, y: 13 },
        spine: { x1: cx, y1: 13, x2: cx, y2: 26 },
        chest: { x: cx, y: 19, rx: 8, ry: 6 },
        hip: { x: cx, y: 30, rx: 9, ry: 5 },
        frontLegs: [{ x: cx - 5, y: 20, len: 12 }, { x: cx + 5, y: 20, len: 12 }],
        hindLegs: [{ x: cx - 8, y: 30, len: 10, angle: 'back' }, { x: cx + 8, y: 30, len: 10, angle: 'back' }],
        tail: { baseX: cx + 10, baseY: 28, shape: 'straight' },
        ear: { angle: 'alert', height: 5 },
        headTilt: 0,
      };

    case 'curled':
      return {
        head: { x: cx - 2, y: 20, rx: 7, ry: 6 },
        neck: { x: cx - 1, y: 25 },
        spine: { x1: cx - 1, y1: 25, x2: cx + 4, y2: 32 },
        chest: { x: cx + 1, y: 29, rx: 9, ry: 6 },
        hip: { x: cx + 5, y: 35, rx: 8, ry: 5 },
        frontLegs: [{ x: cx - 3, y: 30, len: 5 }, { x: cx + 2, y: 30, len: 5 }],
        hindLegs: [{ x: cx + 8, y: 35, len: 5, angle: 'tucked' }, { x: cx + 4, y: 36, len: 5, angle: 'tucked' }],
        tail: { baseX: cx + 8, baseY: 34, shape: 'wrap' },
        ear: { angle: 'flat', height: 3 },
        headTilt: 0,
      };

    case 'eating':
      return {
        head: { x: cx, y: 13, rx: 8, ry: 6 },
        neck: { x: cx, y: 18 },
        spine: { x1: cx, y1: 18, x2: cx, y2: 29 },
        chest: { x: cx, y: 23, rx: 9, ry: 7 },
        hip: { x: cx, y: 34, rx: 10, ry: 6 },
        frontLegs: [{ x: cx - 3, y: 26, len: 10 }, { x: cx + 3, y: 26, len: 10 }],
        hindLegs: [{ x: cx - 8, y: 33, len: 7, angle: 'out' }, { x: cx + 8, y: 33, len: 7, angle: 'out' }],
        tail: { baseX: cx + 9, baseY: 32, shape: 'around' },
        ear: { angle: 'relaxed', height: 4 },
        headTilt: 0,
      };

    case 'sitting':
    default:
      return defaults;
  }
}
