"""Generate all 60 patterns using the new engine pipeline."""

from __future__ import annotations

import json
import sys
from copy import deepcopy
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from engine.composer.composer_v11 import COMPOSERS, Canvas, LayerComposer
from engine.artist.feature_guard import SemanticLock
from engine.artist.cluster_optimizer import PixelClusterOptimizer
from engine.validator.quality import QualityValidator
from composer import render_grid, to_hex_grid, to_color_palette, slugify

OUT_DIR = Path('/tmp/bead-template-v3-engine')
OUT_DIR.mkdir(parents=True, exist_ok=True)


def pipeline(subject: str, style: dict) -> list:
    grid = COMPOSERS[subject](style)
    lock = SemanticLock.from_grid(grid)
    lock.capture_original(grid)
    optimized = PixelClusterOptimizer(deepcopy(grid), lock).optimize_with_guard()
    ok, reasons = lock.validate(grid, optimized)
    if not ok:
        raise RuntimeError(f'{subject} lock failed: {reasons}')
    return optimized


if __name__ == '__main__':
    animals = ['cat', 'panda', 'dog', 'fox', 'rabbit', 'bear', 'penguin', 'owl', 'frog', 'turtle', 'koala', 'lion']
    styles = [
        {'eye': 'round', 'mouth': 'smile', 'blush': True, 'whiskers': True},
        {'eye': 'shut_curve', 'mouth': 'smile', 'blush': False, 'whiskers': True},
        {'eye': 'shut_line', 'mouth': 'tiny', 'blush': False, 'whiskers': True},
        {'eye': 'wink', 'mouth': 'cat', 'blush': True, 'whiskers': True},
        {'eye': 'big', 'mouth': 'open', 'blush': True, 'whiskers': False},
    ]
    rules = {'required': ['ears', 'eyes', 'nose']}
    outputs = []

    for subject in animals:
        for i, style in enumerate(styles):
            title = f'{subject}-{i + 1}'
            slug = slugify(title)
            try:
                grid = pipeline(subject, style)
            except Exception as e:
                print(f'{slug}: ERROR {e}')
                continue
            validator = QualityValidator(grid, rules)
            score, reasons = validator.evaluate()
            cover_path = OUT_DIR / f'{slug}-cover.png'
            finished_path = OUT_DIR / f'{slug}-finished.png'
            render_grid(grid, finished=False, output_path=cover_path)
            render_grid(grid, finished=True, output_path=finished_path)

            meta = {
                'slug': slug,
                'subject': subject,
                'style': style,
                'grid_size': f'{len(grid[0])}x{len(grid)}',
                'grid_data': to_hex_grid(grid),
                'color_palette': to_color_palette(grid),
                'quality_score': score,
                'quality_reasons': reasons,
            }
            (OUT_DIR / f'{slug}.json').write_text(json.dumps(meta, indent=2), encoding='utf-8')
            outputs.append((slug, score, reasons))
            print(f'{slug}: score={score}')

    print('\n=== Summary ===')
    scores = [s for _, s, _ in outputs]
    print(f'Average: {sum(scores)/len(scores):.1f}')
    print(f'Min: {min(scores)}, Max: {max(scores)}')
    low = [slug for slug, s, _ in outputs if s < 80]
    print(f'Low (<80): {low}')
