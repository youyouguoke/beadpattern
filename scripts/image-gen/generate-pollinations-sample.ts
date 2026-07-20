import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, 'data');

async function generatePollinationsImage(prompt: string, seed: number): Promise<Buffer> {
  const encoded = encodeURIComponent(prompt);
  const url = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true&seed=${seed}&enhance=true`;
  console.log('Fetching:', url);
  const res = await fetch(url, { timeout: 120000 } as any);
  if (!res.ok) {
    throw new Error(`Pollinations API failed: ${res.status} ${await res.text()}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const samples = [
    {
      slug: 'cute-panda',
      title: 'Cute Panda',
      prompt: 'A cute panda face made of colorful fuse beads (perler beads, hama beads), top-down flat lay view on a white pegboard, photorealistic pixel art style, soft studio lighting, cute kawaii design, high detail, 4k',
      finishedPrompt: 'A finished cute panda made of colorful fuse beads (perler beads), displayed on a dark velvet background, glossy bead texture, product photography style, soft studio lighting, high detail, 4k',
    },
    {
      slug: 'frog-prince',
      title: 'Frog Prince',
      prompt: 'A cute frog prince with a tiny golden crown made of colorful fuse beads (perler beads), top-down flat lay on white pegboard, photorealistic pixel art style, soft studio lighting, kawaii design, high detail, 4k',
      finishedPrompt: 'A finished cute frog prince with a tiny golden crown made of colorful fuse beads, displayed on a dark wood surface, glossy bead texture, product photography style, soft studio lighting, high detail, 4k',
    },
  ];

  for (const [index, sample] of samples.entries()) {
    console.log(`\n[${index + 1}/${samples.length}] Generating ${sample.slug}...`);

    try {
      const coverBuffer = await generatePollinationsImage(sample.prompt, index + 1);
      const coverPath = path.join(OUT_DIR, `${sample.slug}-cover.png`);
      fs.writeFileSync(coverPath, coverBuffer);
      console.log(`  Cover saved: ${coverPath} (${coverBuffer.length} bytes)`);

      const finishedBuffer = await generatePollinationsImage(sample.finishedPrompt, index + 1001);
      const finishedPath = path.join(OUT_DIR, `${sample.slug}-finished.png`);
      fs.writeFileSync(finishedPath, finishedBuffer);
      console.log(`  Finished saved: ${finishedPath} (${finishedBuffer.length} bytes)`);
    } catch (e) {
      console.error(`  Error generating ${sample.slug}:`, e);
    }
  }

  console.log('\nDone. Sample images saved to:', OUT_DIR);
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
