import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, 'data/patterns-all-300.json');

const API_BASE = process.env.API_BASE || 'https://bead-pattern-ai.youyouguoke.workers.dev/api';
const ADMIN_KEY = process.env.ADMIN_API_KEY || 'dev-beadpatternai-local-admin-key';

async function main() {
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  const data = JSON.parse(raw) as {
    patterns: Array<{
      slug: string;
      category_slugs?: string[];
      tag_slugs?: string[];
      collection_slugs?: string[];
    }>;
  };

  const res = await fetch(`${API_BASE}/admin/repair/pattern-associations`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ADMIN_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ dry_run: false }),
  });

  const body = await res.text();
  console.log(`Status: ${res.status}`);
  try {
    console.log(JSON.stringify(JSON.parse(body), null, 2));
  } catch {
    console.log(body.slice(0, 2000));
  }
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
