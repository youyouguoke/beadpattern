import sharp from 'sharp';

const imagePath = '/root/projects/BeadPatternAI/bead-pattern-ai-backend/scripts/image-gen/data/reference/panda.jpg';
const { data, info } = await sharp(imagePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const w = info.width, h = info.height;

const pixels = [];
for (let i=0;i<w*h;i++){ const idx=i*4; const p={r:data[idx],g:data[idx+1],b:data[idx+2],a:data[idx+3]}; if(p.a>128) pixels.push(p); }

// K-means 2
const centers = [pixels[0], pixels[Math.floor(pixels.length/2)]];
for (let iter=0; iter<20; iter++){
  const sums=[{r:0,g:0,b:0,c:0},{r:0,g:0,b:0,c:0}];
  for (const p of pixels){
    let best=0, bestDist=Infinity;
    for (let i=0;i<2;i++){ const d=Math.abs(p.r-centers[i].r)+Math.abs(p.g-centers[i].g)+Math.abs(p.b-centers[i].b); if(d<bestDist){bestDist=d;best=i;} }
    sums[best].r+=p.r; sums[best].g+=p.g; sums[best].b+=p.b; sums[best].c++;
  }
  for (let i=0;i<2;i++) if(sums[i].c>0) centers[i]={r:Math.round(sums[i].r/sums[i].c),g:Math.round(sums[i].g/sums[i].c),b:Math.round(sums[i].b/sums[i].c)};
}
console.log('Center 0:', centers[0], 'Center 1:', centers[1]);
// Determine which is background by brightness
const bgIdx = (centers[0].r*0.299+centers[0].g*0.587+centers[0].b*0.114) > (centers[1].r*0.299+centers[1].g*0.587+centers[1].b*0.114) ? 0 : 1;
console.log('Background center:', bgIdx);

const mask = [];
let count=0;
for (let y=0;y<h;y++){
  const row=[];
  for(let x=0;x<w;x++){
    const idx=(y*w+x)*4; const p={r:data[idx],g:data[idx+1],b:data[idx+2],a:data[idx+3]};
    const d0=Math.abs(p.r-centers[0].r)+Math.abs(p.g-centers[0].g)+Math.abs(p.b-centers[0].b);
    const d1=Math.abs(p.r-centers[1].r)+Math.abs(p.g-centers[1].g)+Math.abs(p.b-centers[1].b);
    const on = p.a>128 && (d0 < d1 ? 0 : 1) !== bgIdx;
    row.push(on);
    if(on) count++;
  }
  mask.push(row);
}
console.log('Subject pixels:', count, 'ratio:', (count/(w*h)*100).toFixed(1)+'%');

// preview
const ps=60;
const out=Buffer.alloc(ps*ps*4);
for(let y=0;y<ps;y++)for(let x=0;x<ps;x++){ const sy=Math.floor(y*h/ps), sx=Math.floor(x*w/ps); const idx=(y*ps+x)*4; const on=mask[sy][sx]; out[idx]=on?255:0; out[idx+1]=on?0:0; out[idx+2]=on?0:255; out[idx+3]=255; }
await sharp(out,{raw:{width:ps,height:ps,channels:4}}).png().toFile('/tmp/mask-kmeans2.png');
console.log('Saved /tmp/mask-kmeans2.png');
