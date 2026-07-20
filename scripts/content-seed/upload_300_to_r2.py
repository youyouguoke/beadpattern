#!/usr/bin/env python3
"""Upload 300 rendered seed images to R2 and update local D1 records.

Reads ~/.cloudflare_env for the CLOUDFLARE_API_TOKEN only (not logged).
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path('/root/projects/BeadPatternAI/bead-pattern-ai-backend')
DATA = ROOT / 'scripts/content-seed/data/patterns-all-300.json'
IMG_DIR = Path('/tmp/bead-pattern-300')
ENV_FILE = Path.home() / '.cloudflare_env'

BUCKET = 'beadpatternai'
DB = 'beadpatternai-db'
R2_PUBLIC = 'https://pub-98e050954fa34ccebe6d2e8911f520a3.r2.dev'


def load_env() -> dict:
    env = {}
    if ENV_FILE.exists():
        with open(ENV_FILE) as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                if line.startswith('export '):
                    line = line[7:]
                key, _, val = line.partition('=')
                env[key] = val.strip().strip('"\'')
    return env


def upload_file(remote_key: str, local_path: Path) -> str:
    cmd = ['npx', 'wrangler', 'r2', 'object', 'put', '--remote', f'{BUCKET}/{remote_key}', '--file', str(local_path)]
    subprocess.run(cmd, check=True, capture_output=True, cwd=ROOT, env={**os.environ, **load_env()})
    return remote_key


def main():
    with open(DATA) as f:
        patterns = json.load(f)['patterns']

    print(f'Uploading {len(patterns)} patterns ({len(patterns) * 2} images) to R2...')
    tasks = []
    for p in patterns:
        slug = p['slug']
        tasks.append((f'covers/{slug}.png', IMG_DIR / f'{slug}-cover.png'))
        tasks.append((f'finished/{slug}.png', IMG_DIR / f'{slug}-finished.png'))

    uploaded = 0
    failed = 0
    with ThreadPoolExecutor(max_workers=4) as ex:
        futures = {ex.submit(upload_file, rk, lp): rk for rk, lp in tasks}
        for fut in as_completed(futures):
            rk = futures[fut]
            try:
                fut.result()
                uploaded += 1
                if uploaded % 50 == 0:
                    print(f'  uploaded {uploaded}/{len(tasks)}')
            except Exception as e:
                failed += 1
                print(f'  FAILED {rk}: {e}', file=sys.stderr)

    print(f'R2 upload: {uploaded} succeeded, {failed} failed')

    # Generate D1 update SQL
    sql_path = IMG_DIR / 'update-cover-images.sql'
    with open(sql_path, 'w') as f:
        f.write('BEGIN;\n')
        for p in patterns:
            slug = p['slug']
            grid = json.dumps(p['grid_data']).replace("'", "''")
            palette = json.dumps(p['color_palette']).replace("'", "''")
            cover = f"{R2_PUBLIC}/covers/{slug}.png"
            finished = f"{R2_PUBLIC}/finished/{slug}.png"
            f.write(
                f"UPDATE patterns SET grid_data='{grid}', color_palette='{palette}', "
                f"cover_image='{cover}', finished_image='{finished}', grid_status='ready', "
                f"image_updated_at=datetime('now') WHERE slug='{slug}';\n"
            )
        f.write('COMMIT;\n')
    print(f'Generated SQL: {sql_path}')

    print('Applying D1 updates locally...')
    subprocess.run(
        ['npx', 'wrangler', 'd1', 'execute', '--local', DB, '--file', str(sql_path)],
        check=True, cwd=ROOT, env={**os.environ, **load_env()}
    )
    print('D1 update complete')


if __name__ == '__main__':
    main()
