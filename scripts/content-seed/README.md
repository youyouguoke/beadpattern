# BeadPatternAI Content Seed Scripts

These scripts generate pattern seed data and import it into the local D1 database via the admin API.

## Scripts

- `ideas-sample.ts` — 20 sample pattern ideas.
- `generate-sample.ts` — turns ideas into full import JSON with grid_data and color_palette.
- `data/sample-20.json` — generated import payload.

## Usage

Generate sample payload:

```bash
cd scripts/content-seed
npx tsx generate-sample.ts
```

Import locally (requires `wrangler dev` running on http://localhost:8787):

```bash
ADMIN_KEY=$(grep ADMIN_API_KEY ../../.dev.vars | cut -d= -f2)
curl -X POST http://localhost:8787/api/admin/seed-import \
  -H "Authorization: Bearer $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d @data/sample-20.json
```

Add `?dry_run=true` query parameter or set `dry_run: true` in the JSON to validate without writing.
