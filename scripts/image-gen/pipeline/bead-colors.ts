// Color utilities for LAB color matching and palette handling

export interface RGB { r: number; g: number; b: number }
export interface Lab { l: number; a: number; b: number }

export interface BeadColor {
  id?: number;
  brand: string;
  code: string;
  name: string;
  hex: string;
  available: number;
}

function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }

export function hexToRgb(hex: string): RGB {
  const h = hex.toLowerCase().trim();
  let r = 0, g = 0, b = 0;
  if (h.length === 4 && h[0] === '#') {
    r = parseInt(h[1] + h[1], 16);
    g = parseInt(h[2] + h[2], 16);
    b = parseInt(h[3] + h[3], 16);
  } else if (h.length === 7 && h[0] === '#') {
    r = parseInt(h.slice(1, 3), 16);
    g = parseInt(h.slice(3, 5), 16);
    b = parseInt(h.slice(5, 7), 16);
  }
  return { r, g, b };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.round(clamp(n, 0, 255)).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToXyz({ r, g, b }: RGB) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;

  const R = rn > 0.04045 ? Math.pow((rn + 0.055) / 1.055, 2.4) : rn / 12.92;
  const G = gn > 0.04045 ? Math.pow((gn + 0.055) / 1.055, 2.4) : gn / 12.92;
  const B = bn > 0.04045 ? Math.pow((bn + 0.055) / 1.055, 2.4) : bn / 12.92;

  return {
    x: R * 41.24 + G * 35.76 + B * 18.05,
    y: R * 21.26 + G * 71.52 + B * 7.22,
    z: R * 1.93 + G * 11.92 + B * 95.05,
  };
}

export function rgbToLab(rgb: RGB): Lab {
  const { x, y, z } = rgbToXyz(rgb);

  const Xn = 95.047, Yn = 100.000, Zn = 108.883;
  const fx = x / Xn > 0.008856 ? Math.pow(x / Xn, 1 / 3) : (7.787 * x / Xn + 16 / 116);
  const fy = y / Yn > 0.008856 ? Math.pow(y / Yn, 1 / 3) : (7.787 * y / Yn + 16 / 116);
  const fz = z / Zn > 0.008856 ? Math.pow(z / Zn, 1 / 3) : (7.787 * z / Zn + 16 / 116);

  return {
    l: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}

export function deltaE(lab1: Lab, lab2: Lab): number {
  return Math.sqrt(
    Math.pow(lab1.l - lab2.l, 2) +
    Math.pow(lab1.a - lab2.a, 2) +
    Math.pow(lab1.b - lab2.b, 2)
  );
}

export function findClosestBeadColor(rgb: RGB, palette: BeadColor[], brand?: string): BeadColor {
  const target = rgbToLab(rgb);
  let best = palette[0];
  let bestDist = Infinity;

  for (const bead of palette) {
    if (brand && bead.brand !== brand) continue;
    if (!bead.available) continue;
    const dist = deltaE(target, rgbToLab(hexToRgb(bead.hex)));
    if (dist < bestDist) {
      bestDist = dist;
      best = bead;
    }
  }
  return best;
}

export function mapPaletteToBeads(hexPalette: string[], beadColors: BeadColor[], brand?: string): BeadColor[] {
  const mapped: BeadColor[] = [];
  const seen = new Set<string>();
  for (const hex of hexPalette) {
    const bead = findClosestBeadColor(hexToRgb(hex), beadColors, brand);
    if (bead && !seen.has(bead.hex)) {
      seen.add(bead.hex);
      mapped.push(bead);
    }
  }
  return mapped;
}

export function buildGridPalette(grid: string[][], beadColors: BeadColor[]): BeadColor[] {
  const used = new Set(grid.flat());
  const byHex = new Map(beadColors.map((b) => [b.hex.toLowerCase(), b]));
  const out: BeadColor[] = [];
  for (const hex of Array.from(used)) {
    const bead = byHex.get(hex.toLowerCase());
    if (bead) out.push(bead);
  }
  return out;
}
