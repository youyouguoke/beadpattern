#!/bin/bash
# Batch upload 600 images to R2 with delays between batches.
set -euo pipefail

BUCKET="beadpatternai"
DB="beadpatternai-db"
R2_PUBLIC="https://pub-98e050954fa34ccebe6d2e8911f520a3.r2.dev"
IMG_DIR="/tmp/bead-pattern-300"
DATA_JSON="scripts/content-seed/data/patterns-all-300.json"
LOG="/tmp/upload-300-r2.log"

: > "$LOG"

SLUGS=$(python3 -c "import json; data=json.load(open('$DATA_JSON')); print(' '.join(p['slug'] for p in data['patterns']))")
TOTAL=$(echo "$SLUGS" | wc -w)
COUNT=0

echo "==> Uploading $TOTAL patterns to R2 bucket $BUCKET" | tee -a "$LOG"
for slug in $SLUGS; do
    npx wrangler r2 object put --remote "$BUCKET/covers/$slug.png" --file "$IMG_DIR/$slug-cover.png" &>> "$LOG"
    npx wrangler r2 object put --remote "$BUCKET/finished/$slug.png" --file "$IMG_DIR/$slug-finished.png" &>> "$LOG"
    COUNT=$((COUNT + 1))
    echo "[$COUNT/$TOTAL] uploaded $slug" | tee -a "$LOG"
    if [ $((COUNT % 50)) -eq 0 ]; then
        echo "[$COUNT/$TOTAL] sleeping 5s" | tee -a "$LOG"
        sleep 5
    fi
done

echo "==> Generating D1 update SQL" | tee -a "$LOG"
python3 - "$DATA_JSON" "$R2_PUBLIC" <<'PY'
import json, sys
data_file = sys.argv[1]
r2_public = sys.argv[2]
with open(data_file) as f:
    patterns = json.load(f)['patterns']
with open('/tmp/update-300-d1.sql', 'w') as f:
    f.write('BEGIN;\n')
    for p in patterns:
        slug = p['slug']
        grid = json.dumps(p['grid_data']).replace("'", "''")
        palette = json.dumps(p['color_palette']).replace("'", "''")
        cover = f"{r2_public}/covers/{slug}.png"
        finished = f"{r2_public}/finished/{slug}.png"
        f.write(f"UPDATE patterns SET grid_data='{grid}', color_palette='{palette}', cover_image='{cover}', finished_image='{finished}', grid_status='ready', image_updated_at=datetime('now') WHERE slug='{slug}';\n")
    f.write('COMMIT;\n')
PY

echo "==> Applying D1 update" | tee -a "$LOG"
npx wrangler d1 execute --local "$DB" --file /tmp/update-300-d1.sql &>> "$LOG"

echo "==> Done" | tee -a "$LOG"
