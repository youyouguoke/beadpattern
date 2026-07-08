import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, 'data/patterns-all-300.json');
const API_BASE = process.env.API_BASE || 'https://bead-pattern-ai.youyouguoke.workers.dev/api';
const ADMIN_KEY = process.env.ADMIN_API_KEY || 'dev-beadpatternai-local-admin-key';

async function importBatch(batch: unknown[], index: number): Promise<{ status: number; body: string }> {
  const res = await fetch(`${API_BASE}/admin/seed-import`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ADMIN_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ dry_run: false, patterns: batch }),
  });
  const body = await res.text();
  return { status: res.status, body };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function importBatchWithRetry(batch: unknown[], index: number, retries = 3): Promise<{ status: number; body: string }> {
  let lastStatus = 0;
  let lastBody = '';
  for (let attempt = 0; attempt < retries; attempt++) {
    const { status, body } = await importBatch(batch, index);
    lastStatus = status;
    lastBody = body;
    if (status >= 200 && status < 300) {
      return { status, body };
    }
    console.log(`  Batch ${index + 1} attempt ${attempt + 1} failed (status ${status}), retrying...`);
    await sleep(1000 * (attempt + 1));
  }
  return { status: lastStatus, body: lastBody };
}

async function run() {
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  const data = JSON.parse(raw);
  const patterns = data.patterns as unknown[];

  const batchSize = 5;
  const batches: unknown[][] = [];
  for (let i = 0; i < patterns.length; i += batchSize) {
    batches.push(patterns.slice(i, i + batchSize));
  }

  const startBatch = parseInt(process.env.START_BATCH || '0', 10);
  console.log(`Importing ${patterns.length} patterns in ${batches.length} batches to ${API_BASE}, starting at batch ${startBatch + 1}`);

  for (let i = startBatch; i < batches.length; i++) {
    console.log(`\nBatch ${i + 1}/${batches.length}: ${batches[i].length} patterns`);
    const { status, body } = await importBatchWithRetry(batches[i], i);
    console.log(`Status: ${status}`);
    if (status >= 200 && status < 300) {
      try {
        const json = JSON.parse(body);
        console.log(JSON.stringify(json.data ?? json, null, 2).slice(0, 300));
      } catch {
        console.log(body.slice(0, 300));
      }
    } else {
      console.error('ERROR:', body.slice(0, 1000));
      process.exit(1);
    }
    await sleep(1000);
  }

  console.log('\nAll batches imported.');
}

run().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
