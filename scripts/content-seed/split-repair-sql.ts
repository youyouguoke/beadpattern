import fs from 'fs';
import path from 'path';

const dataPath = 'scripts/content-seed/data/repair-associations.sql';
const outDir = 'scripts/content-seed/data';
const lines = fs.readFileSync(dataPath, 'utf8').split('\n').filter((l) => l.trim().startsWith('INSERT'));
const batchSize = 100;
for (let i = 0; i < lines.length; i += batchSize) {
  const chunk = lines.slice(i, i + batchSize).join('\n');
  fs.writeFileSync(path.join(outDir, `repair-part-${Math.floor(i / batchSize)}.sql`), chunk + '\n');
}
console.log('Wrote ' + Math.ceil(lines.length / batchSize) + ' parts');
