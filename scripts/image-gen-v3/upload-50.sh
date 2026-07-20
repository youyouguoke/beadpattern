#!/bin/bash
# Upload 50 generated V3 animal pattern images to R2 and update D1.
set -euo pipefail

BUCKET=beadpatternai
DB=beadpatternai-db
R2_PUBLIC=https://pub-98e050954fa34ccebe6d2e8911f520a3.r2.dev

ANIMALS="cat panda dog fox rabbit bear penguin owl frog turtle koala lion"
STYLES="cute sleepy kawaii simple detailed"

echo "==> Uploading images to R2"
for subject in $ANIMALS; do
    for style in $STYLES; do
        slug="${style}-${subject}"
        if [ -f "/tmp/bead-template-v3/${slug}-cover.png" ]; then
            npx wrangler r2 object put --remote "$BUCKET/covers/${slug}.png" --file "/tmp/bead-template-v3/${slug}-cover.png"
            npx wrangler r2 object put --remote "$BUCKET/finished/${slug}.png" --file "/tmp/bead-template-v3/${slug}-finished.png"
            echo "  uploaded $slug"
        fi
    done
done

echo "==> Updating D1 records"
for subject in $ANIMALS; do
    for style in $STYLES; do
        slug="${style}-${subject}"
        meta="/tmp/bead-template-v3/${slug}.json"
        if [ ! -f "$meta" ]; then
            continue
        fi
        GRID=$(cat "$meta" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(json.dumps(d["grid_data"]))')
        PALETTE=$(cat "$meta" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(json.dumps(d["color_palette"]))')
        SCORE=$(cat "$meta" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d["quality_score"])')
        npx wrangler d1 execute --remote "$DB" --command "UPDATE patterns SET grid_data='$GRID', color_palette='$PALETTE', cover_image='$R2_PUBLIC/covers/${slug}.png', finished_image='$R2_PUBLIC/finished/${slug}.png', grid_status='ready', grid_version=3 WHERE slug='${slug}';"
        echo "  updated $slug (score=$SCORE)"
    done
done

echo "==> Done"
