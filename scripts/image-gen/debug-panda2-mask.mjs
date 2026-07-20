import sharp from 'sharp';

const imagePath = '/root/projects/BeadPatternAI/bead-pattern-ai-backend/scripts/image-gen/data/reference/panda2.jpg';
const { data, info } = await sharp(imagePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const w = info.width, h = info.height;

function colorDistance(a,b){ return Math.abs(a.r-b.r)+Math.abs(a.g-b.g)+Math.abs(a.b-b.b); }
function luma(p){ return p.r*0.299+p.g*0.587+p.b*0.114; }
function otsu(values){
  let min=Infinity,max=-Infinity; for(const v of values){if(v<min)min=v; if(v>max)max=v;}
  if(min===max)return min;
  const bins=256, hist=new Array(bins).fill(0);
  for(const v of values){ const idx=Math.min(bins-1,Math.floor((v-min)/(max-min+1e-9)*bins)); hist[idx]++; }
  const total=values.length; let sum=0; for(let i=0;i<bins;i++)sum+=i*hist[i];
  let sumB=0,wB=0,maxVar=0,thr=0;
  for(let i=0;i<bins;i++){ wB+=hist[i]; if(wB===0)continue; const wF=total-wB; if(wF===0)break; sumB+=i*hist[i]; const mB=sumB/wB, mF=(sum-sumB)/wF; const v=wB*wF*(mB-mF)*(mB-mF); if(v>maxVar){maxVar=v; thr=i;} }
  return min+(thr/bins)*(max-min);
}

// background
const edgeSamples=[];
for (let x=0;x<w;x+=2){ edgeSamples.push({x,y:0}); edgeSamples.push({x,y:h-1}); }
for (let y=0;y<h;y+=2){ edgeSamples.push({x:0,y}); edgeSamples.push({x:w-1,y}); }
const counts = new Map();
for (const s of edgeSamples){ const idx=(s.y*w+s.x)*4; const hex=`#${data[idx].toString(16).padStart(2,'0')}${data[idx+1].toString(16).padStart(2,'0')}${data[idx+2].toString(16).padStart(2,'0')}`; counts.set(hex, (counts.get(hex)||0)+1); }
let best='', bestCount=0; for(const [hex,c] of counts) if(c>bestCount){bestCount=c; best=hex;}
const bg = {r:parseInt(best.slice(1,3),16), g:parseInt(best.slice(3,5),16), b:parseInt(best.slice(5,7),16)};
console.log('Bg', best, 'luma', luma(bg).toFixed(1));

const distances=[];
for(let i=0;i<w*h;i++){ const idx=i*4; const p={r:data[idx],g:data[idx+1],b:data[idx+2],a:data[idx+3]}; if(p.a>128) distances.push(colorDistance(p,bg)); }
const otsuThr = otsu(distances);
console.log('Otsu threshold:', otsuThr.toFixed(1), 'mean distance:', (distances.reduce((a,b)=>a+b,0)/distances.length).toFixed(1));

for (const ratio of [0.3, 0.5, 0.7, 1.0]) {
  const thr = otsuThr * ratio;
  let mask=[];
  for(let y=0;y<h;y++){ const row=[]; for(let x=0;x<w;x++){ const idx=(y*w+x)*4; const p={r:data[idx],g:data[idx+1],b:data[idx+2],a:data[idx+3]}; const d=p.a>128?colorDistance(p,bg):0; row.push(d>thr); } mask.push(row); }
  let count=0, minX=w, maxX=-1, minY=h, maxY=-1;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(mask[y][x]){count++; minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
  console.log('ratio', ratio, 'thr', thr.toFixed(1), 'subject', count, (count/(w*h)*100).toFixed(1)+'%', 'bbox', maxX-minX+1, maxY-minY+1);
}
