export const TRANSPARENT = 0;

export class Grid {
  private size: number;
  private data: number[][];

  constructor(size: number) {
    this.size = size;
    this.data = Array.from({ length: size }, () => Array(size).fill(TRANSPARENT));
  }

  set(x: number, y: number, colorIndex: number) {
    if (x >= 0 && x < this.size && y >= 0 && y < this.size) this.data[y][x] = colorIndex;
  }

  get(x: number, y: number): number {
    if (x >= 0 && x < this.size && y >= 0 && y < this.size) return this.data[y][x];
    return TRANSPARENT;
  }

  fillEllipse(cx: number, cy: number, rx: number, ry: number, colorIndex: number) {
    for (let dy = -ry; dy <= ry; dy++) {
      for (let dx = -rx; dx <= rx; dx++) {
        if (rx === 0 || ry === 0) continue;
        const dist = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);
        if (dist <= 1.0) this.set(cx + dx, cy + dy, colorIndex);
      }
    }
  }

  drawThickLine(x1: number, y1: number, x2: number, y2: number, colorIndex: number, thickness: number = 1) {
    const dx = Math.abs(x2 - x1), dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1, sy = y1 < y2 ? 1 : -1;
    let err = dx - dy, x = x1, y = y1;
    while (true) {
      for (let t = -Math.floor((thickness - 1) / 2); t <= Math.floor(thickness / 2); t++) {
        this.set(x + t, y, colorIndex);
        this.set(x, y + t, colorIndex);
      }
      if (x === x2 && y === y2) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x += sx; }
      if (e2 < dx) { err += dx; y += sy; }
    }
  }

  fillRect(x: number, y: number, w: number, h: number, colorIndex: number) {
    for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) this.set(x + dx, y + dy, colorIndex);
  }

  toArray(): number[][] { return this.data.map(row => [...row]); }
}
