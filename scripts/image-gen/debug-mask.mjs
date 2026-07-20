import sharp from 'sharp';
import fs from 'fs';

const imagePath = '/root/projects/BeadPatternAI/bead-pattern-ai-backend/scripts/image-gen/data/reference/panda.jpg';
const { data, info } = await sharp(imagePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const w = info.width, h = info.height;

function colorDistance(a, b) { return Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b); }

function findBackgroundColor() {
  const samples = [];
  for (let x = 0; x < w; x += 2) {
    samples.push({ x, y: 0 }); samples.push({ x, y: h - 1 });
  }
  for (let y = 0; y < h; y += 2) {
    samples.push({ x: 0, y }); samples.push({ x: w - 1, y });
  }
  const counts = new Map();
  for (const s of samples) {
    const idx = (s.y * w + s.x) * 4;
    const hex = `#${data[idx].toString(16).padStart(2,'0')}${data[idx+1].toString(16).padStart(2,'0')}${data[idx+2].toString(16).padStart(2,'0')}`;
    counts.set(hex, (counts.get(hex) || 0) + 1);
  }
  let best = '', bestCount = 0;
  for (const [hex, count] of counts) if (count > bestCount) { bestCount = count; best = hex; }
  console.log('Background color:', best, 'votes', bestCount, 'of', samples.length);
  return hexToRgb(best);
}

function hexToRgb(hex) {
  return { r: parseInt(hex.slice(1,3),16), g: parseInt(hex.slice(3,5),16), b: parseInt(hex.slice(5,7),16), a: 255 };
}

const bg = findBackgroundColor();
let mask = [];
for (let y = 0; y < h; y++) {
  const row = [];
  for (let x = 0; x < w; x++) {
    const idx = (y * w + x) * 4;
    const p = { r: data[idx], g: data[idx+1], b: data[idx+2], a: data[idx+3] };
    row.push(p.a > 128 && colorDistance(p, bg) > 25);
  }
  mask.push(row);
}

// Erode + dilate
const eroded = Array.from({length:h},()=>Array(w).fill(false));
for (let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){let all=true;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(!mask[y+dy][x+dx]){all=false;break;}if(!all)break;eroded[y][x]=all;}
const dilated = Array.from({length:h},()=>Array(w).fill(false));
for (let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){let any=false;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(eroded[y+dy][x+dx]){any=true;break;}if(any)break;dilated[y][x]=any;}

let minX=w,maxX=-1,minY=h,maxY=-1,subjectCount=0;
for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(dilated[y][x]){subjectCount++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
console.log('Image:', w, 'x', h, 'subject pixels:', subjectCount, 'ratio:', (subjectCount/(w*h)*100).toFixed(1)+'%');
console.log('Bbox:', minX, minY, maxX-minX+1, maxY-minY+1, 'fill ratio in bbox:', (subjectCount/((maxX-minX+1)*(maxY-minY+1))*100).toFixed(1)+'%');

// Output mask preview (scaled down to 60px)
const previewSize = 60;
const outData = Buffer.alloc(previewSize * previewSize * 4);
for (let y=0;y<previewSize;y++){
  for(let x=0;x<previewSize;x++){
    const sy = Math.floor(y*h/previewSize);
    const sx = Math.floor(x*w/previewSize);
    const on = dilated[sy][sx];
    const idx = (y*previewSize+x)*4;
    outData[idx] = on ? 255 : 0;
    outData[idx+1] = on ? 0 : 0;
    outData[idx+2] = on ? 0 : 255;
    outData[idx+3] = 255;
  }
}
await sharp(outData, { raw: { width: previewSize, height: previewSize, channels: 4 } }).png().toFile('/tmp/mask-preview.png');
console.log('Mask preview: /tmp/mask-preview.png');
