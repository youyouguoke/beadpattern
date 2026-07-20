import sharp from 'sharp';

export interface ImageToGridOptions {
  size: number;
  maxColors: number;
  palette?: string[];
  targetFillRatio?: number;
  smoothing?: boolean;
}

interface Pixel { r: number; g: number; b: number; a: number }

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToRgb(hex: string): Pixel {
  const h = hex.toLowerCase().trim();
  let r = 0, g = 0, b = 0;
  if (h.length === 4 && h[0] === '#') { r = parseInt(h[1] + h[1], 16); g = parseInt(h[2] + h[2], 16); b = parseInt(h[3] + h[3], 16); }
  else if (h.length === 7 && h[0] === '#') { r = parseInt(h.slice(1, 3), 16); g = parseInt(h.slice(3, 5), 16); b = parseInt(h.slice(5, 7), 16); }
  return { r, g, b, a: 255 };
}

function colorDistance(a: Pixel, b: Pixel): number { return Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b); }
function luma(p: Pixel): number { return p.r * 0.299 + p.g * 0.587 + p.b * 0.114; }
function saturation(p: Pixel): number { const max = Math.max(p.r, p.g, p.b), min = Math.min(p.r, p.g, p.b); return max === 0 ? 0 : (max - min) / max; }

function findClosestPaletteColor(r: number, g: number, b: number, palette: string[]): string {
  const target = { r, g, b, a: 255 };
  let best = palette[0], bestDist = Infinity;
  for (const hex of palette) { const dist = colorDistance(target, hexToRgb(hex)); if (dist < bestDist) { bestDist = dist; best = hex; } }
  return best;
}

function kMeansQuantize(pixels: Pixel[], k: number, fixedColors: string[] = []): string[] {
  const fixedRgb = fixedColors.map(hexToRgb);
  const freeK = Math.max(1, k - fixedRgb.length);
  if (pixels.length === 0) return fixedColors;
  const centers: Pixel[] = [...fixedRgb];
  if (centers.length === 0) centers.push(pixels[Math.floor(pixels.length * 0.37)]);
  while (centers.length - fixedRgb.length < freeK) {
    const distances = pixels.map((p) => { let min = Infinity; for (const c of centers) { const d = colorDistance(p, c); if (d < min) min = d; } return min; });
    const total = distances.reduce((a, b) => a + b, 0) || 1;
    let rand = Math.random() * total, idx = 0;
    for (let i = 0; i < distances.length; i++) { rand -= distances[i]; if (rand <= 0) { idx = i; break; } }
    centers.push(pixels[idx]);
  }
  for (let iter = 0; iter < 25; iter++) {
    const sums = centers.map(() => ({ r: 0, g: 0, b: 0, count: 0 }));
    for (const p of pixels) {
      let best = 0, bestDist = Infinity;
      for (let i = 0; i < centers.length; i++) { const d = colorDistance(p, centers[i]); if (d < bestDist) { bestDist = d; best = i; } }
      sums[best].r += p.r; sums[best].g += p.g; sums[best].b += p.b; sums[best].count++;
    }
    for (let i = fixedRgb.length; i < centers.length; i++) if (sums[i].count > 0) centers[i] = { r: Math.round(sums[i].r / sums[i].count), g: Math.round(sums[i].g / sums[i].count), b: Math.round(sums[i].b / sums[i].count), a: 255 };
  }
  return centers.map((c) => rgbToHex(c.r, c.g, c.b));
}

function findBackgroundColor(data: Buffer, width: number, height: number): Pixel {
  const samples: Pixel[] = [];
  const add = (x: number, y: number) => {
    const xx = Math.max(0, Math.min(width - 1, x));
    const yy = Math.max(0, Math.min(height - 1, y));
    const idx = (yy * width + xx) * 4;
    samples.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2], a: data[idx + 3] });
  };
  for (let x = 0; x < width; x += 2) { add(x, 0); add(x, height - 1); }
  for (let y = 0; y < height; y += 2) { add(0, y); add(width - 1, y); }
  const counts = new Map<string, number>();
  for (const p of samples) { const hex = rgbToHex(p.r, p.g, p.b); counts.set(hex, (counts.get(hex) || 0) + 1); }
  let best = samples[0], bestCount = 0;
  for (const [hex, count] of counts) if (count > bestCount) { bestCount = count; best = hexToRgb(hex); }
  return best;
}

function computeEdges(luma: Float32Array, width: number, height: number): Float32Array {
  const edges = new Float32Array(width * height);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const gx = -luma[(y - 1) * width + x - 1] + luma[(y - 1) * width + x + 1]
               - 2 * luma[y * width + x - 1] + 2 * luma[y * width + x + 1]
               - luma[(y + 1) * width + x - 1] + luma[(y + 1) * width + x + 1];
      const gy = -luma[(y - 1) * width + x - 1] - 2 * luma[(y - 1) * width + x] - luma[(y - 1) * width + x + 1]
               + luma[(y + 1) * width + x - 1] + 2 * luma[(y + 1) * width + x] + luma[(y + 1) * width + x + 1];
      edges[y * width + x] = Math.sqrt(gx * gx + gy * gy);
    }
  }
  return edges;
}

function findSubjectMask(data: Buffer, width: number, height: number, bgColor: Pixel): boolean[][] {
  const lumas = new Float32Array(width * height);
  const rgbs: Pixel[] = new Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const p = { r: data[idx], g: data[idx + 1], b: data[idx + 2], a: data[idx + 3] };
      rgbs[y * width + x] = p;
      lumas[y * width + x] = luma(p);
    }
  }
  const edges = computeEdges(lumas, width, height);
  const edgeValues = Array.from(edges).filter(v => v > 0).sort((a, b) => a - b);
  const edgeThr = edgeValues[Math.floor(edgeValues.length * 0.75)] || 0;
  const bgLuma = luma(bgColor);
  const bgDistThr = 25;

  const mask: boolean[][] = [];
  for (let y = 0; y < height; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < width; x++) {
      const p = rgbs[y * width + x];
      if (p.a <= 128) { row.push(false); continue; }
      const edge = edges[y * width + x];
      const lum = lumas[y * width + x];
      const sat = saturation(p);
      const dist = colorDistance(p, bgColor);
      const isSubject = edge > edgeThr || lum < bgLuma - 25 || sat > 0.25 || dist > bgDistThr;
      row.push(isSubject);
    }
    mask.push(row);
  }
  return mask;
}

function morphologicalClose(mask: boolean[][], radius = 3): boolean[][] {
  const h = mask.length, w = mask[0].length;
  const dilated = Array.from({ length: h }, () => Array(w).fill(false));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (mask[y][x]) {
    for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) {
      const ny = y + dy, nx = x + dx;
      if (ny >= 0 && ny < h && nx >= 0 && nx < w) dilated[ny][nx] = true;
    }
  }
  const eroded = Array.from({ length: h }, () => Array(w).fill(false));
  for (let y = radius; y < h - radius; y++) for (let x = radius; x < w - radius; x++) {
    let all = true;
    for (let dy = -radius; dy <= radius && all; dy++) for (let dx = -radius; dx <= radius; dx++) if (!dilated[y + dy][x + dx]) { all = false; break; }
    eroded[y][x] = all;
  }
  return eroded;
}

function keepLargestConnectedComponent(mask: boolean[][]): boolean[][] {
  const h = mask.length, w = mask[0].length;
  const visited = new Set<string>();
  let largest: [number, number][] = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!mask[y][x] || visited.has(`${x},${y}`)) continue;
    const cells: [number, number][] = [];
    const stack: [number, number][] = [[x, y]];
    while (stack.length) {
      const [cx, cy] = stack.pop()!;
      if (cx < 0 || cx >= w || cy < 0 || cy >= h) continue;
      if (!mask[cy][cx] || visited.has(`${cx},${cy}`)) continue;
      visited.add(`${cx},${cy}`);
      cells.push([cx, cy]);
      stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
    }
    if (cells.length > largest.length) largest = cells;
  }
  const out = Array.from({ length: h }, () => Array(w).fill(false));
  for (const [x, y] of largest) out[y][x] = true;
  return out;
}

function bboxOfMask(mask: boolean[][]): { x: number; y: number; w: number; h: number } {
  const h = mask.length, w = mask[0].length;
  let minX = w, maxX = -1, minY = h, maxY = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (mask[y][x]) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
  if (maxX < minX) return { x: 0, y: 0, w, h };
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

function computeCropSquare(width: number, height: number, bbox: { x: number; y: number; w: number; h: number }, targetFillRatio: number): { x: number; y: number; size: number } {
  const maxDim = Math.max(bbox.w, bbox.h);
  const cropSize = Math.min(Math.max(width, height), Math.max(Math.floor(maxDim / targetFillRatio), maxDim));
  const cx = Math.floor(bbox.x + bbox.w / 2);
  const cy = Math.floor(bbox.y + bbox.h / 2);
  let x = Math.max(0, Math.floor(cx - cropSize / 2));
  let y = Math.max(0, Math.floor(cy - cropSize / 2));
  if (x + cropSize > width) x = Math.max(0, width - cropSize);
  if (y + cropSize > height) y = Math.max(0, height - cropSize);
  return { x, y, size: Math.min(cropSize, width - x, height - y) };
}

function removeIsolatedNoise(grid: string[][], bgHex: string): string[][] {
  const h = grid.length, w = grid[0].length;
  const out = grid.map((row) => [...row]);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    if (out[y][x] === bgHex) continue;
    let sameNeighbors = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (!(dx === 0 && dy === 0) && out[y + dy][x + dx] === out[y][x]) sameNeighbors++;
    if (sameNeighbors < 2) out[y][x] = bgHex;
  }
  return out;
}

function enforceSymmetry(grid: string[][], bgHex: string): string[][] {
  const h = grid.length, w = grid[0].length;
  const out = grid.map((row) => [...row]);
  const mid = Math.floor(w / 2);
  for (let y = 0; y < h; y++) for (let x = 0; x < mid; x++) {
    const left = out[y][x], right = out[y][w - 1 - x];
    if (left === bgHex) out[y][x] = right;
    else if (right === bgHex) out[y][w - 1 - x] = left;
    else out[y][w - 1 - x] = left;
  }
  return out;
}

export async function imageToGrid(imagePath: string, options: ImageToGridOptions): Promise<{ grid: string[][]; palette: { hex: string; name: string; count: number }[] }> {
  const { size, maxColors, palette: userPalette, targetFillRatio = 0.85, smoothing = true } = options;

  const { data, info } = await sharp(imagePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const width = info.width, height = info.height;
  const bgColor = findBackgroundColor(data, width, height);
  const bgHex = rgbToHex(bgColor.r, bgColor.g, bgColor.b);

  let mask = findSubjectMask(data, width, height, bgColor);
  mask = morphologicalClose(mask, 3);
  mask = keepLargestConnectedComponent(mask);
  const bbox = bboxOfMask(mask);
  const crop = computeCropSquare(width, height, bbox, targetFillRatio);

  const { data: cropped, info: cropInfo } = await sharp(imagePath)
    .extract({ left: crop.x, top: crop.y, width: crop.size, height: crop.size })
    .resize(size * 2, size * 2, { fit: 'fill', kernel: 'cubic' })
    .raw().ensureAlpha()
    .toBuffer({ resolveWithObject: true });

  const pixels: Pixel[] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0, count = 0;
      for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
        const px = x * 2 + dx, py = y * 2 + dy;
        if (px < cropInfo.width && py < cropInfo.height) {
          const idx = (py * cropInfo.width + px) * 4;
          r += cropped[idx]; g += cropped[idx + 1]; b += cropped[idx + 2]; a += cropped[idx + 3]; count++;
        }
      }
      pixels.push({ r: Math.round(r / count), g: Math.round(g / count), b: Math.round(b / count), a: Math.round(a / count) });
    }
  }

  const palette = userPalette || kMeansQuantize(pixels, maxColors, [bgHex]);
  const paletteWithBg = [bgHex, ...palette.filter((c) => c !== bgHex)].slice(0, maxColors + 1);

  let grid: string[][] = [];
  for (let y = 0; y < size; y++) {
    const row: string[] = [];
    for (let x = 0; x < size; x++) {
      const p = pixels[y * size + x];
      if (p.a <= 128) row.push(bgHex);
      else row.push(findClosestPaletteColor(p.r, p.g, p.b, paletteWithBg));
    }
    grid.push(row);
  }

  if (smoothing) { grid = removeIsolatedNoise(grid, bgHex); grid = enforceSymmetry(grid, bgHex); }

  const counts: Record<string, number> = {};
  for (const c of grid.flat()) counts[c] = (counts[c] || 0) + 1;
  const finalPalette = paletteWithBg.map((hex) => ({ hex, name: hex, count: counts[hex] || 0 }));

  return { grid, palette: finalPalette };
}
