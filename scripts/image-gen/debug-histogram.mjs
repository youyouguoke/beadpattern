import sharp from 'sharp';

const imagePath = '/root/projects/BeadPatternAI/bead-pattern-ai-backend/scripts/image-gen/data/reference/panda.jpg';
const { data, info } = await sharp(imagePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const w = info.width, h = info.height;

const hist = {};
for (let i = 0; i < w*h; i++) {
  const idx = i*4;
  const luma = Math.round((data[idx]*0.299 + data[idx+1]*0.587 + data[idx+2]*0.114)/10)*10;
  hist[luma] = (hist[luma] || 0) + 1;
}
const sorted = Object.entries(hist).sort((a,b)=>Number(a[0])-Number(b[0]));
console.log('Luma histogram (10-bin):');
for (const [l, c] of sorted) console.log(l, c);
