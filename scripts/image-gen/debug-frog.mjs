import sharp from 'sharp';

const imagePath = '/root/projects/BeadPatternAI/bead-pattern-ai-backend/scripts/image-gen/data/reference/frog.jpg';
const { data, info } = await sharp(imagePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const w = info.width, h = info.height;
console.log('Size:', w, 'x', h);

function luma(p) { return p.r*0.299 + p.g*0.587 + p.b*0.114; }
function saturation(p) { const max=Math.max(p.r,p.g,p.b), min=Math.min(p.r,p.g,p.b); return max===0?0:(max-min)/max; }

const lumas = [];
const sats = [];
for (let i=0;i<w*h;i++){ const idx=i*4; const p={r:data[idx],g:data[idx+1],b:data[idx+2],a:data[idx+3]}; if(p.a>128){ lumas.push(luma(p)); sats.push(saturation(p)); } }
lumas.sort((a,b)=>a-b); sats.sort((a,b)=>a-b);
console.log('Luma 50/70/80/90pct:', lumas[Math.floor(lumas.length*0.5)].toFixed(1), lumas[Math.floor(lumas.length*0.7)].toFixed(1), lumas[Math.floor(lumas.length*0.8)].toFixed(1), lumas[Math.floor(lumas.length*0.9)].toFixed(1));
console.log('Sat 50/70/80/90pct:', sats[Math.floor(sats.length*0.5)].toFixed(2), sats[Math.floor(sats.length*0.7)].toFixed(2), sats[Math.floor(sats.length*0.8)].toFixed(2), sats[Math.floor(sats.length*0.9)].toFixed(2));

// Background color
const edgeSamples = [];
for (let x=0;x<w;x+=2){ edgeSamples.push({x,y:0}); edgeSamples.push({x,y:h-1}); }
for (let y=0;y<h;y+=2){ edgeSamples.push({x:0,y}); edgeSamples.push({x:w-1,y}); }
const counts = new Map();
for (const s of edgeSamples){ const idx=(s.y*w+s.x)*4; const hex=`#${data[idx].toString(16).padStart(2,'0')}${data[idx+1].toString(16).padStart(2,'0')}${data[idx+2].toString(16).padStart(2,'0')}`; counts.set(hex, (counts.get(hex)||0)+1); }
let best='', bestCount=0; for(const [hex,c] of counts) if(c>bestCount){bestCount=c; best=hex;}
console.log('Background edge color:', best, 'votes', bestCount, 'of', edgeSamples.length);
const bg = {r:parseInt(best.slice(1,3),16), g:parseInt(best.slice(3,5),16), b:parseInt(best.slice(5,7),16)};
console.log('Bg luma:', luma(bg).toFixed(1));

// Try background distance mask
let mask = [];
for (let y=0;y<h;y++){
  const row=[];
  for(let x=0;x<w;x++){
    const idx=(y*w+x)*4; const p={r:data[idx],g:data[idx+1],b:data[idx+2],a:data[idx+3]};
    const dist = Math.abs(p.r-bg.r)+Math.abs(p.g-bg.g)+Math.abs(p.b-bg.b);
    row.push(p.a>128 && dist>35);
  }
  mask.push(row);
}
let count=0, minX=w, maxX=-1, minY=h, maxY=-1;
for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(mask[y][x]){count++; minX=Math.min(minX,x); maxX=Math.max(maxX,x); minY=Math.min(minY,y); maxY=Math.max(maxY,y);}
console.log('Bg-dist mask subject:', count, 'ratio:', (count/(w*h)*100).toFixed(1)+'%', 'bbox:', minX, minY, maxX-minX+1, maxY-minY+1);

// Preview
const ps=60;
const out=Buffer.alloc(ps*ps*4);
for(let y=0;y<ps;y++)for(let x=0;x<ps;x++){ const sy=Math.floor(y*h/ps), sx=Math.floor(x*w/ps); const idx=(y*ps+x)*4; const on=mask[sy][sx]; out[idx]=on?255:0; out[idx+1]=on?0:0; out[idx+2]=on?0:255; out[idx+3]=255; }
await sharp(out,{raw:{width:ps,height:ps,channels:4}}).png().toFile('/tmp/frog-mask-preview.png');
console.log('Saved /tmp/frog-mask-preview.png');
