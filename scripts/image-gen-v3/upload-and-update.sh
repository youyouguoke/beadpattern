#!/bin/bash
# Upload generated V3 pattern images to R2 and update D1.
# Run from bead-pattern-ai-backend root after sourcing ~/.cloudflare_env.
set -euo pipefail

SLUGS="sleepy-cat cute-cat cute-panda playful-dog"
BUCKET=beadpatternai
DB=beadpatternai-db
R2_PUBLIC=https://pub-98e050954fa34ccebe6d2e8911f520a3.r2.dev

echo "==> Uploading images to R2"
for slug in $SLUGS; do
    npx wrangler r2 object put --remote "$BUCKET/covers/$slug.png" --file "/tmp/bead-template-v3/$slug-cover.png"
    npx wrangler r2 object put --remote "$BUCKET/finished/$slug.png" --file "/tmp/bead-template-v3/$slug-finished.png"
    echo "  uploaded $slug"
done

echo "==> Updating D1 records"
for slug in $SLUGS; do
    GRID=$(cat "/tmp/bead-template-v3/$slug.json" | npx tsx -e 'const d=JSON.parse(require("fs").readFileSync(0,"utf8")); console.log(JSON.stringify(d.grid_data))')
    PALETTE=$(cat "/tmp/bead-template-v3/$slug.json" | npx tsx -e 'const d=JSON.parse(require("fs").readFileSync(0,"utf8")); console.log(JSON.stringify(d.color_palette))')
    SCORE=$(cat "/tmp/bead-template-v3/$slug.json" | npx tsx -e 'const d=JSON.parse(require("fs").readFileSync(0,"utf8")); console.log(d.quality_score)')
    npx wrangler d1 execute --remote "$DB" --command "UPDATE patterns SET grid_data='$GRID', color_palette='$PALETTE', cover_image='$R2_PUBLIC/covers/$slug.png', finished_image='$R2_PUBLIC/finished/$slug.png', grid_status='ready', grid_version=3 WHERE slug='$slug';"
    echo "  updated $slug (score=$SCORE)"
done

echo "==> Done"
