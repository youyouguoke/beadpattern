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
          const isEdge = dist >= 0.8;
          this.set(cx + dx, cy + dy, isEdge && outlineColor !== undefined ? outlineColor : colorIndex);
        }
      }
    }
  }

  fillCircle(cx: number, cy: number, r: number, colorIndex: number, outlineColor?: number) {
    this.fillEllipse(cx, cy, r, r, colorIndex, outlineColor);
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

  drawLine(x1: number, y1: number, x2: number, y2: number, colorIndex: number) {
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;
    let x = x1;
    let y = y1;
    while (true) {
      this.set(x, y, colorIndex);
      if (x === x2 && y === y2) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x += sx; }
      if (e2 < dx) { err += dx; y += sy; }
    }
  }

  toArray(): number[][] {
    return this.data.map(row => [...row]);
  }
}
