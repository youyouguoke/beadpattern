#!/bin/bash
# Upload 300 rendered seed pattern images to R2 and update local D1 records.
# Usage: source ~/.cloudflare_env && bash scripts/content-seed/upload-300-to-r2.sh
set -euo pipefail

BUCKET="beadpatternai"
DB="beadpatternai-db"
R2_PUBLIC="https://pub-98e050954fa34ccebe6d2e8911f520a3.r2.dev"
IMG_DIR="/tmp/bead-pattern-300"
DATA_JSON="scripts/content-seed/data/patterns-all-300.json"

SLUGS=$(python3 -c "import json; data=json.load(open('$DATA_JSON')); print(' '.join(p['slug'] for p in data['patterns']))")

echo "==> Uploading cover/finished images to R2 ($BUCKET)"
for slug in $SLUGS; do
    npx wrangler r2 object put --remote "$BUCKET/covers/$slug.png" --file "$IMG_DIR/$slug-cover.png"
    npx wrangler r2 object put --remote "$BUCKET/finished/$slug.png" --file "$IMG_DIR/$slug-finished.png"
    echo "  uploaded $slug"
done

echo "==> Updating local D1 records"
python3 - "$DATA_JSON" "$R2_PUBLIC" "$DB" <<'PY'
import json, subprocess, sys

data_file = sys.argv[1]
r2_public = sys.argv[2]
db = sys.argv[3]

with open(data_file) as f:
    patterns = json.load(f)['patterns']

for i in range(0, len(patterns), 30):
    batch = patterns[i:i+30]
    for p in batch:
        slug = p['slug']
        grid = json.dumps(p['grid_data'])
        palette = json.dumps(p['color_palette'])
        cover = f"{r2_public}/covers/{slug}.png"
        finished = f"{r2_public}/finished/{slug}.png"
        cmd = [
            'npx', 'wrangler', 'd1', 'execute', '--local', db,
            '--command',
            f"UPDATE patterns SET grid_data='{grid}', color_palette='{palette}', cover_image='{cover}', finished_image='{finished}', grid_status='ready', image_updated_at=datetime('now') WHERE slug='{slug}';"
        ]
        subprocess.run(cmd, check=True)
        print(f'  updated {slug}')
PY

echo "==> Done"
