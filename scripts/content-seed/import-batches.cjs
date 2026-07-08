const fs = require('fs');
const path = require('path');

const ALL = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'patterns-all-300.json'), 'utf8'));
const BATCH_SIZE = 50;
const BASE_URL = 'http://127.0.0.1:8787/api/admin/seed-import';
const ADMIN_KEY = process.env.ADMIN_API_KEY || 'dev-beadpatternai-local-admin-key';

async function sendBatch(patterns) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ADMIN_KEY}`,
    },
    body: JSON.stringify({ dry_run: false, patterns }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 500)}`);
  }
  return JSON.parse(text);
}

(async () => {
  const { patterns } = ALL;
  const total = patterns.length;
  let imported = 0;
  const errors = [];
  for (let i = 0; i < total; i += BATCH_SIZE) {
    const batch = patterns.slice(i, i + BATCH_SIZE);
    console.log(`Importing batch ${i / BATCH_SIZE + 1}/${Math.ceil(total / BATCH_SIZE)} (${batch.length} patterns)`);
    try {
      const result = await sendBatch(batch);
      if (!result.success) {
        errors.push({ batch: i, error: result.error });
        console.error('Batch failed:', JSON.stringify(result.error).slice(0, 300));
        continue;
      }
      const ok = result.data.results.filter(r => r.errors.length === 0).length;
      imported += ok;
      const failed = result.data.results.filter(r => r.errors.length > 0);
      if (failed.length) {
        console.error(`Batch had ${failed.length} pattern errors`);
        failed.slice(0, 5).forEach(r => console.error(' -', r.slug, r.errors));
        errors.push(...failed.map(r => ({ batch: i, slug: r.slug, errors: r.errors })));
      }
      console.log(`  imported ${ok}, total so far ${imported}`);
    } catch (err) {
      console.error('Batch exception:', err.message);
      errors.push({ batch: i, error: err.message });
    }
  }
  const summary = { total, imported, errors: errors.length, details: errors.slice(0, 50) };
  fs.writeFileSync(path.join(__dirname, 'data', 'import-summary.json'), JSON.stringify(summary, null, 2));
  console.log('\n=== Summary ===');
  console.log(`Total: ${total}, Imported: ${imported}, Errors: ${errors.length}`);
})();
