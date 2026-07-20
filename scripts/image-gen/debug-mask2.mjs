import sharp from 'sharp';

const imagePath = '/root/projects/BeadPatternAI/bead-pattern-ai-backend/scripts/image-gen/data/reference/panda.jpg';
const { data, info } = await sharp(imagePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const w = info.width, h = info.height;

function luma(p) { return p.r*0.299 + p.g*0.587 + p.b*0.114; }
function saturation(p) { const max=Math.max(p.r,p.g,p.b), min=Math.min(p.r,p.g,p.b); return max===0?0:(max-min)/max; }

const lumas = [];
for (let i=0;i<w*h;i++){ const idx=i*4; const p={r:data[idx],g:data[idx+1],b:data[idx+2],a:data[idx+3]}; if(p.a>128) lumas.push(luma(p)); }
lumas.sort((a,b)=>a-b);
const threshold = Math.min(230, lumas[Math.floor(lumas.length*0.7)] + 5);
console.log('Threshold candidates:', '70pct', lumas[Math.floor(lumas.length*0.7)].toFixed(1), '80pct', lumas[Math.floor(lumas.length*0.8)].toFixed(1), '90pct', lumas[Math.floor(lumas.length*0.9)].toFixed(1), 'selected', threshold.toFixed(1));

let mask = [];
for (let y=0;y<h;y++){
  const row=[];
  for(let x=0;x<w;x++){ const idx=(y*w+x)*4; const p={r:data[idx],g:data[idx+1],b:data[idx+2],a:data[idx+3]}; row.push(p.a>128 && luma(p)<threshold && saturation(p)>0.05); }
  mask.push(row);
}

// Count
let count=0, minX=w, maxX=-1, minY=h, maxY=-1;
for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(mask[y][x]){count++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
console.log('Mask pixels:', count, 'ratio:', (count/(w*h)*100).toFixed(1)+'%', 'bbox:', minX, minY, maxX-minX+1, maxY-minY+1);

// Save preview
const previewSize = 60;
const out = Buffer.alloc(previewSize*previewSize*4);
for(let y=0;y<previewSize;y++)for(let x=0;x<previewSize;x++){ const sy=Math.floor(y*h/previewSize), sx=Math.floor(x*w/previewSize); const idx=(y*previewSize+x)*4; const on=mask[sy][sx]; out[idx]=on?255:0; out[idx+1]=on?0:0; out[idx+2]=on?0:255; out[idx+3]=255; }
await sharp(out, {raw:{width:previewSize,height:previewSize,channels:4}}).png().toFile('/tmp/mask-v2.png');
console.log('Saved /tmp/mask-v2.png');
