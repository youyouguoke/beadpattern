import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, 'data');

const PUBLIC_PROMPT_PREFIX =
  'A finished, professional photo of a cute {subject} design made of colorful plastic fuse beads (Perler beads / Hama beads). The beads are small, round cylinders with visible central holes, arranged on a pegboard. Top-down product photography style. Soft even studio lighting. Clean solid {background} background. No text, no watermarks. 4k, high detail.';

interface Sample {
  slug: string;
  subject: string;
  background: string;
}

const SAMPLES: Sample[] = [
  { slug: 'cute-panda', subject: 'panda face', background: 'light gray' },
  { slug: 'frog-prince', subject: 'frog prince with a tiny golden crown', background: 'deep green' },
];

const COVER_SIZE = 1024;
const FINISHED_SIZE = 1536;

function buildPrompt(sample: Sample): string {
  return PUBLIC_PROMPT_PREFIX
    .replace('{subject}', sample.subject)
    .replace('{background}', sample.background);
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

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const [idx, sample] of SAMPLES.entries()) {
    const prompt = buildPrompt(sample);

    // 1. Generate high-quality finished image at FINISHED_SIZE
    console.log(`\n[${idx + 1}/${SAMPLES.length}] Generating finished image for ${sample.slug}...`);
    const finishedBuffer = await generateImage(prompt, FINISHED_SIZE, FINISHED_SIZE, idx + 1);
    const finishedPath = path.join(OUT_DIR, `${sample.slug}-finished.png`);
    fs.writeFileSync(finishedPath, finishedBuffer);
    console.log(`  Finished: ${finishedPath} (${finishedBuffer.length} bytes)`);

    // 2. Derive cover image: resize + smart-crop to 1:1 cover, maybe slight zoom
    console.log(`  Deriving cover image for ${sample.slug}...`);
    const coverBuffer = await sharp(finishedBuffer)
      .resize(COVER_SIZE, COVER_SIZE, { fit: 'cover', position: 'attention' })
      .png({ quality: 95 })
      .toBuffer();
    const coverPath = path.join(OUT_DIR, `${sample.slug}-cover.png`);
    fs.writeFileSync(coverPath, coverBuffer);
    console.log(`  Cover: ${coverPath} (${coverBuffer.length} bytes)`);
  }
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
