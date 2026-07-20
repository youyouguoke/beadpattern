import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import sharp from 'sharp';
import { createCanvas } from 'canvas';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, 'data');

const GRID_SIZE = 32;
const FINISHED_SIZE = 1536;
const COVER_SIZE = 1024;

const FINISHED_PROMPT =
  'A finished, professional top-down photo of a {subject} design made of colorful plastic fuse beads (Perler beads). The beads are small round cylinders with visible central holes, arranged in a perfectly regular square grid on a pegboard. Orthographic top-down view, no perspective, no shadows. Clean solid {background} background. No text, no watermarks. 4k, high detail.';

const BEAD_PALETTE = [
  { name: 'Black', hex: '#1a1a1a' },
  { name: 'White', hex: '#f5f5f5' },
  { name: 'Red', hex: '#e53935' },
  { name: 'Dark Red', hex: '#b71c1c' },
  { name: 'Orange', hex: '#fb8c00' },
  { name: 'Yellow', hex: '#fdd835' },
  { name: 'Lime', hex: '#7cb342' },
  { name: 'Green', hex: '#2e7d32' },
  { name: 'Teal', hex: '#00897b' },
  { name: 'Cyan', hex: '#00acc1' },
  { name: 'Light Blue', hex: '#4fc3f7' },
  { name: 'Blue', hex: '#1e88e5' },
  { name: 'Navy', hex: '#0d47a1' },
  { name: 'Purple', hex: '#8e24aa' },
  { name: 'Pink', hex: '#f06292' },
  { name: 'Hot Pink', hex: '#d81b60' },
  { name: 'Brown', hex: '#6d4c41' },
  { name: 'Tan', hex: '#d7ccc8' },
  { name: 'Gray', hex: '#757575' },
  { name: 'Light Gray', hex: '#bdbdbd' },
  { name: 'Gold', hex: '#fbc02d' },
  { name: 'Cream', hex: '#fff9c4' },
];

interface Sample {
  slug: string;
  subject: string;
  background: string;
}

const SAMPLES: Sample[] = [
  { slug: 'cute-panda', subject: 'cute panda face', background: 'light gray' },
  { slug: 'frog-prince', subject: 'cute frog prince with a tiny golden crown', background: 'deep green' },
];

function hexToRgb(hex: string) {
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

function colorDistance(c1: { r: number; g: number; b: number }, c2: { r: number; g: number; b: number }) {
  return Math.sqrt((c1.r - c2.r) ** 2 + (c1.g - c2.g) ** 2 + (c1.b - c2.b) ** 2);
}

function mapToPalette(r: number, g: number, b: number) {
  let best = BEAD_PALETTE[0].hex;
  let bestDist = Infinity;
  const target = { r, g, b };
  for (const color of BEAD_PALETTE) {
    const dist = colorDistance(target, hexToRgb(color.hex));
    if (dist < bestDist) {
      bestDist = dist;
      best = color.hex;
    }
  }
  return best;
}

async function generateImage(prompt: string, width: number, height: number, seed: number): Promise<Buffer> {
  const encoded = encodeURIComponent(prompt);
  const url = `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&nologo=true&seed=${seed}&enhance=true`;
  console.log('Fetching', url);
  const res = await fetch(url, { timeout: 180000 } as any);
  if (!res.ok) {
    throw new Error(`Pollinations failed: ${res.status} ${await res.text()}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function extractGrid(buffer: Buffer): Promise<string[][]> {
  const { data, info } = await sharp(buffer)
    .resize(FINISHED_SIZE, FINISHED_SIZE, { fit: 'fill' })
    .raw()
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });

  const grid: string[][] = [];
  const cellSize = FINISHED_SIZE / GRID_SIZE;
  const sampleMargin = cellSize * 0.3; // avoid bead edges and holes

  for (let y = 0; y < GRID_SIZE; y++) {
    const row: string[] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      let rSum = 0, gSum = 0, bSum = 0, count = 0;
      const startX = Math.floor(x * cellSize + sampleMargin);
      const endX = Math.floor((x + 1) * cellSize - sampleMargin);
      const startY = Math.floor(y * cellSize + sampleMargin);
      const endY = Math.floor((y + 1) * cellSize - sampleMargin);

      for (let py = startY; py < endY; py++) {
        for (let px = startX; px < endX; px++) {
          const idx = (py * info.width + px) * 4;
          rSum += data[idx];
          gSum += data[idx + 1];
          bSum += data[idx + 2];
          count++;
        }
      }

      const color = count > 0 ? mapToPalette(rSum / count, gSum / count, bSum / count) : '#1a1a1a';
      row.push(color);
    }
    grid.push(row);
  }
  return grid;
}

function renderGridCover(grid: string[][], title: string): Buffer {
  const rows = grid.length;
  const cols = grid[0].length;
  const maxDim = Math.max(cols, rows);
  const canvasSize = COVER_SIZE;
  const margin = 80;
  const beadSize = Math.floor((canvasSize - margin * 2) / maxDim);
  const gridWidth = cols * beadSize;
  const gridHeight = rows * beadSize;
  const startX = (canvasSize - gridWidth) / 2;
  const startY = (canvasSize - gridHeight) / 2 + 30;

  const canvas = createCanvas(canvasSize, canvasSize);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f5f6f8';
  ctx.fillRect(0, 0, canvasSize, canvasSize);

  // Title
  ctx.font = 'bold 36px sans-serif';
  ctx.fillStyle = '#222';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(title, canvasSize / 2, 24);
  ctx.font = '18px sans-serif';
  ctx.fillStyle = '#666';
  ctx.fillText(`${cols}×${rows} bead pattern`, canvasSize / 2, 66);

  // Pegboard shadow
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  roundRect(ctx, startX - 10 + 3, startY - 10 + 3, gridWidth + 20, gridHeight + 20, 8);
  ctx.fill();
  ctx.fillStyle = '#e8eaed';
  roundRect(ctx, startX - 10, startY - 10, gridWidth + 20, gridHeight + 20, 8);
  ctx.fill();

  // Beads
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      drawBead(ctx, startX + x * beadSize, startY + y * beadSize, beadSize, grid[y][x]);
    }
  }

  return canvas.toBuffer('image/png');
}

function drawBead(ctx: any, x: number, y: number, size: number, color: string) {
  const centerX = x + size / 2;
  const centerY = y + size / 2;
  const radius = size * 0.42;
  const { r, g, b } = hexToRgb(color);

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.ellipse(centerX + 1, centerY + 2, radius * 0.95, radius * 0.85, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  const gradient = ctx.createRadialGradient(
    centerX - radius * 0.35,
    centerY - radius * 0.35,
    radius * 0.15,
    centerX,
    centerY,
    radius
  );
  gradient.addColorStop(0, `rgb(${Math.min(255, r + 55)}, ${Math.min(255, g + 55)}, ${Math.min(255, b + 55)})`);
  gradient.addColorStop(0.45, `rgb(${r}, ${g}, ${b})`);
  gradient.addColorStop(1, `rgb(${Math.max(0, r - 45)}, ${Math.max(0, g - 45)}, ${Math.max(0, b - 45)})`);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radius * 0.95, radius * 0.85, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hole
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radius * 0.28 * 0.9, radius * 0.28 * 0.8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Highlight
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.ellipse(centerX - radius * 0.3, centerY - radius * 0.35, radius * 0.18, radius * 0.12, -0.4, 0, Math.PI * 2);
  ctx.fill();
}

function roundRect(ctx: any, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const [idx, sample] of SAMPLES.entries()) {
    console.log(`\n[${idx + 1}/${SAMPLES.length}] Processing ${sample.slug}...`);

    const prompt = FINISHED_PROMPT.replace('{subject}', sample.subject).replace('{background}', sample.background);
    const finishedBuffer = await generateImage(prompt, FINISHED_SIZE, FINISHED_SIZE, idx + 1);
    const finishedPath = path.join(OUT_DIR, `${sample.slug}-finished.png`);
    fs.writeFileSync(finishedPath, finishedBuffer);
    console.log(`  Finished: ${finishedPath} (${finishedBuffer.length} bytes)`);

    console.log('  Extracting grid...');
    const grid = await extractGrid(finishedBuffer);

    console.log('  Rendering cover from grid...');
    const coverBuffer = renderGridCover(grid, sample.subject);
    const coverPath = path.join(OUT_DIR, `${sample.slug}-cover.png`);
    fs.writeFileSync(coverPath, coverBuffer);
    console.log(`  Cover: ${coverPath} (${coverBuffer.length} bytes)`);

    const gridPath = path.join(OUT_DIR, `${sample.slug}-grid.json`);
    fs.writeFileSync(gridPath, JSON.stringify(grid));
    console.log(`  Grid saved: ${gridPath}`);
  }
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
