#!/bin/bash
# Upload optimized bear/lion/frog/turtle images and update D1.
set -euo pipefail

BUCKET=beadpatternai
DB=beadpatternai-db
R2_PUBLIC=https://pub-98e050954fa34ccebe6d2e8911f520a3.r2.dev

ANIMALS="bear lion frog turtle"
STYLES="cute sleepy kawaii simple detailed"

for animal in $ANIMALS; do
    for style in $STYLES; do
        slug="$style-$animal"
        cover="/tmp/bead-template-v3/$slug-cover.png"
        finished="/tmp/bead-template-v3/$slug-finished.png"
        meta="/tmp/bead-template-v3/$slug.json"

        if [ -f "$cover" ] && [ -f "$finished" ]; then
            npx wrangler r2 object put --remote "$BUCKET/covers/$slug.png" --file "$cover"
            npx wrangler r2 object put --remote "$BUCKET/finished/$slug.png" --file "$finished"
            echo "  uploaded $slug"
        else
            echo "  missing $slug, skipping"
            continue
        fi

        # Read grid_data and palette from JSON
        grid=$(python3 -c "import json; print(json.dumps(json.load(open('$meta'))['grid_data']).replace(chr(39), chr(39)+chr(39)))" 2>/dev/null || echo '[]')
        palette=$(python3 -c "import json; print(json.dumps(json.load(open('$meta'))['color_palette']).replace(chr(39), chr(39)+chr(39)))" 2>/dev/null || echo '[]')
        score=$(python3 -c "import json; print(json.load(open('$meta'))['quality_score'])" 2>/dev/null || echo 0)

        npx wrangler d1 execute --remote "$DB" --command "
            UPDATE patterns SET
                grid_data='$grid',
                color_palette='$palette',
                cover_image='$R2_PUBLIC/covers/$slug.png',
                finished_image='$R2_PUBLIC/finished/$slug.png',
                grid_status='ready',
                grid_version=3,
                updated_at=datetime('now')
            WHERE slug='$slug';
        "
        echo "  updated $slug (score=$score)"
    done
done

echo "==> Done"
