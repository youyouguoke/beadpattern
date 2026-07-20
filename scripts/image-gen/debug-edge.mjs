import sharp from 'sharp';

const imagePath = '/root/projects/BeadPatternAI/bead-pattern-ai-backend/scripts/image-gen/data/reference/panda.jpg';
const { data, info } = await sharp(imagePath).greyscale().raw().toBuffer({ resolveWithObject: true });
const w = info.width, h = info.height;

const grey = new Float32Array(w*h);
for (let i=0;i<w*h;i++) grey[i]=data[i];

const sobel = new Float32Array(w*h);
for (let y=1;y<h-1;y++){
  for(let x=1;x<w-1;x++){
    const gx = -grey[(y-1)*w+x-1] + grey[(y-1)*w+x+1]
             -2*grey[y*w+x-1]     +2*grey[y*w+x+1]
             -grey[(y+1)*w+x-1] + grey[(y+1)*w+x+1];
    const gy = -grey[(y-1)*w+x-1] -2*grey[(y-1)*w+x] -grey[(y-1)*w+x+1]
             +grey[(y+1)*w+x-1] +2*grey[(y+1)*w+x] +grey[(y+1)*w+x+1];
    sobel[y*w+x] = Math.sqrt(gx*gx + gy*gy);
  }
}

// Find threshold by percentile
const sorted = Array.from(sobel).filter(v=>v>0).sort((a,b)=>a-b);
const threshold = sorted[Math.floor(sorted.length*0.85)];
console.log('Edge threshold 85pct:', threshold.toFixed(1), 'max:', sorted[sorted.length-1].toFixed(1));

let mask = [];
for (let y=0;y<h;y++){
  const row=[];
  for(let x=0;x<w;x++) row.push(sobel[y*w+x] > threshold);
  mask.push(row);
}

// Close edges to fill subject
const closed = Array.from({length:h},()=>Array(w).fill(false));
const radius=8;
for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(mask[y][x]){for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++){const ny=y+dy,nx=x+dx;if(ny>=0&&ny<h&&nx>=0&&nx<w)closed[ny][nx]=true;}}

// Erode
const eroded = Array.from({length:h},()=>Array(w).fill(false));
for(let y=radius;y<h-radius;y++)for(let x=radius;x<w-radius;x++){let all=true;for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++)if(!closed[y+dy][x+dx]){all=false;break;}eroded[y][x]=all;}

let count=0,minX=w,maxX=-1,minY=h,maxY=-1;
for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(eroded[y][x]){count++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
console.log('Subject pixels:', count, 'ratio:', (count/(w*h)*100).toFixed(1)+'%', 'bbox:', minX, minY, maxX-minX+1, maxY-minY+1);

const ps=60;
const out=Buffer.alloc(ps*ps*4);
for(let y=0;y<ps;y++)for(let x=0;x<ps;x++){ const sy=Math.floor(y*h/ps), sx=Math.floor(x*w/ps); const idx=(y*ps+x)*4; const on=eroded[sy][sx]; out[idx]=on?255:0; out[idx+1]=on?0:0; out[idx+2]=on?0:255; out[idx+3]=255; }
await sharp(out,{raw:{width:ps,height:ps,channels:4}}).png().toFile('/tmp/mask-edge.png');
console.log('Saved /tmp/mask-edge.png');
