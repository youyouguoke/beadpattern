#!/usr/bin/env python3
"""Insert 50 new V3 animal patterns into D1 and link them to cute-animals collection."""

import json
import uuid
from pathlib import Path
from datetime import datetime, timezone

OUT_DIR = Path('/tmp/bead-template-v3')
R2_PUBLIC = 'https://pub-98e050954fa34ccebe6d2e8911f520a3.r2.dev'
COLLECTION_ID = 'col_cute_animals'
CATEGORY_ID = 'cat_animals'
DIFFICULTY_ID = 1

ANIMALS = ['cat', 'panda', 'dog', 'fox', 'rabbit', 'bear', 'penguin', 'owl', 'frog', 'turtle', 'koala', 'lion']
STYLES = ['cute', 'sleepy', 'kawaii', 'simple', 'detailed']


def title_case(slug):
    parts = slug.split('-')
    return ' '.join(p.capitalize() for p in parts)


def escape_sql(s):
    return s.replace("'", "''")


def generate():
    now = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')
    inserts = []
    links = []

    for subject in ANIMALS:
        for style in STYLES:
            slug = f'{style}-{subject}'
            meta_path = OUT_DIR / f'{slug}.json'
            if not meta_path.exists():
                continue
            meta = json.loads(meta_path.read_text())

            title = title_case(slug)
            description = f'A {style} {subject} bead pattern designed in cute pixel art style. Fun and easy to make with fuse beads.'
            grid_size = meta['grid_size']
            w, h = grid_size.split('x')
            estimated_beads = int(w) * int(h)
            color_count = len(meta['color_palette'])
            grid_data = json.dumps(meta['grid_data'])
            palette = json.dumps(meta['color_palette'])
            cover = f'{R2_PUBLIC}/covers/{slug}.png'
            finished = f'{R2_PUBLIC}/finished/{slug}.png'
            pid = str(uuid.uuid4())
            status = 'published'
            difficulty = 'easy'
            estimated_time = f'{estimated_beads // 60 + 1} min'

            sql = f"""INSERT INTO patterns (
                id, slug, title, description, difficulty, status,
                cover_image, grid_size, estimated_beads, color_count, color_palette,
                grid_data, version, finished_image, created_at, updated_at,
                difficulty_id, style, grid_status, grid_version, grid_review_required,
                estimated_time, seo_priority, publish_order
            ) VALUES (
                '{pid}', '{slug}', '{escape_sql(title)}', '{escape_sql(description)}', '{difficulty}', '{status}',
                '{cover}', '{grid_size}', {estimated_beads}, {color_count}, '{escape_sql(palette)}',
                '{escape_sql(grid_data)}', 1, '{finished}', '{now}', '{now}',
                {DIFFICULTY_ID}, '{style}', 'ready', 3, 0,
                '{estimated_time}', 50, 0
            ) ON CONFLICT(slug) DO UPDATE SET
                title=excluded.title,
                description=excluded.description,
                cover_image=excluded.cover_image,
                finished_image=excluded.finished_image,
                grid_data=excluded.grid_data,
                color_palette=excluded.color_palette,
                grid_size=excluded.grid_size,
                estimated_beads=excluded.estimated_beads,
                color_count=excluded.color_count,
                grid_status='ready',
                grid_version=3,
                updated_at=excluded.updated_at;"""
            inserts.append(sql)

            links.append(f"INSERT INTO pattern_collections (pattern_id, collection_id) SELECT id, '{COLLECTION_ID}' FROM patterns WHERE slug='{slug}' ON CONFLICT DO NOTHING;")
            links.append(f"INSERT INTO pattern_categories (pattern_id, category_id) SELECT id, '{CATEGORY_ID}' FROM patterns WHERE slug='{slug}' ON CONFLICT DO NOTHING;");

    return inserts, links


def main():
    inserts, links = generate()
    # Write patterns first, then links, to avoid FK issues within a single transaction
    out_patterns = Path('/tmp/bead-template-v3/insert-patterns.sql')
    out_links = Path('/tmp/bead-template-v3/insert-links.sql')
    out_patterns.write_text('\n'.join(inserts), encoding='utf-8')
    out_links.write_text('\n'.join(links), encoding='utf-8')
    print(f'Wrote {out_patterns} ({len(inserts)} inserts)')
    print(f'Wrote {out_links} ({len(links)} links)')


if __name__ == '__main__':
    main()
