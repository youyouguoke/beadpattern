import { getDB } from '../src/lib/db';
import { generateId } from '../src/lib/slug';

function chunkGrid(grid: string[][], numSteps: number): string[][][] {
  const per = Math.max(1, Math.floor(grid.length / numSteps));
  const chunks: string[][][] = [];
  for (let i = 0; i < numSteps; i++) {
    const start = i * per;
    const end = i === numSteps - 1 ? grid.length : (i + 1) * per;
    chunks.push(grid.slice(start, end));
  }
  return chunks;
}

const descriptions = [
  'Step 1: Start with the base outline and border colors.',
  'Step 2: Add the main color blocks and body shape.',
  'Step 3: Fill in details like eyes, nose, and facial features.',
  'Step 4: Add final accents, highlights, and finishing touches.',
];

async function main() {
  const env = { DB: (globalThis as any).__D1_DB } as any;
  if (!env.DB) throw new Error('Set global __D1_DB binding before running.');
  const db = getDB(env);

  const rows = await db.query<{ id: string; slug: string; title: string; grid_data: string }>(
    `SELECT id, slug, title, grid_data FROM patterns
     WHERE status = 'published' AND grid_data IS NOT NULL AND grid_data != 'null'`
  );

  let totalSteps = 0;
  for (const row of rows) {
    let grid: string[][];
    try {
      const parsed = JSON.parse(row.grid_data);
      if (!Array.isArray(parsed) || parsed.length === 0) continue;
      grid = parsed as string[][];
    } catch {
      continue;
    }

    const existing = await db.queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM pattern_steps WHERE pattern_id = ?',
      [row.id]
    );
    if ((existing?.count ?? 0) > 0) continue;

    const numSteps = grid.length >= 20 ? 4 : 3;
    const chunks = chunkGrid(grid, numSteps);
    for (let i = 0; i < chunks.length; i++) {
      const description = descriptions[i % descriptions.length].replace('Step 1', `Step ${i + 1}`).replace('Step 2', `Step ${i + 1}`).replace('Step 3', `Step ${i + 1}`).replace('Step 4', `Step ${i + 1}`);
      await db.insert('pattern_steps', {
        id: generateId(),
        pattern_id: row.id,
        step_number: i + 1,
        description: `${description} (${row.title})`,
        image: null,
        grid_data: JSON.stringify(chunks[i]),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      totalSteps++;
    }
  }
  console.log(`Generated ${totalSteps} steps for patterns`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
