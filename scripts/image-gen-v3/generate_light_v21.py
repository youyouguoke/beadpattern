"""Full pipeline with Cluster Optimizer + LightEngine + v2 validator."""

from __future__ import annotations

import json
import sys
from copy import deepcopy
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from engine.composer.composer_v11 import COMPOSERS
from engine.artist.feature_guard import SemanticLock
from engine.artist.cluster_optimizer import PixelClusterOptimizer
from engine.artist.light_engine import LightEngine, LightConfig, Direction
from engine.validator.quality import QualityValidator
from engine.validator.quality_v2 import QualityValidatorV2
from composer import render_grid, to_hex_grid, to_color_palette, slugify

OUT_DIR = Path('/tmp/bead-template-v3-light')
OUT_DIR.mkdir(parents=True, exist_ok=True)


def pipeline(subject: str, style: dict, difficulty: str = 'easy') -> list:
    grid = COMPOSERS[subject](style)
    lock = SemanticLock.from_grid(grid)
    lock.capture_original(grid)
    optimized = PixelClusterOptimizer(deepcopy(grid), lock).optimize_with_guard()
    # base_colors are derived from the grid
    base_colors = list({ch for row in grid for ch in row if ch != '.' and ch != 'K'})
    # difficulty-aware config
    if difficulty == 'easy':
        max_new = 1
    elif difficulty == 'medium':
        max_new = 2
    else:
        max_new = 3
    config = LightConfig(
        direction=Direction.TOP_LEFT,
        strength=0.25,
        max_new_colors=max_new,
        region_min_area=8,
        radial_weight=0.6,
        directional_weight=0.4,
    )
    lit = LightEngine(optimized, lock, base_colors, config).apply_with_guard()
    return lit


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
                grid = pipeline(subject, style, difficulty='easy')
            except Exception as e:
                print(f'{slug}: ERROR {e}')
                continue
            v1 = QualityValidator(grid, rules).evaluate()[0]
            v2 = QualityValidatorV2(grid, rules).evaluate()['score_v2']
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
                'quality_score_v1': v1,
                'quality_score_v2': v2,
            }
            (OUT_DIR / f'{slug}.json').write_text(json.dumps(meta, indent=2), encoding='utf-8')
            outputs.append((slug, v1, v2))
            print(f'{slug}: v1={v1} v2={v2}')

    print('\n=== Summary ===')
    v1_scores = [a for _, a, _ in outputs]
    v2_scores = [b for _, _, b in outputs]
    print(f'v1 average: {sum(v1_scores)/len(v1_scores):.1f}')
    print(f'v2 average: {sum(v2_scores)/len(v2_scores):.1f}')
    print(f'v1 min: {min(v1_scores)}, max: {max(v1_scores)}')
    print(f'v2 min: {min(v2_scores)}, max: {max(v2_scores)}')
    improved = sum(1 for a, b in zip(v1_scores, v2_scores) if b > a)
    same = sum(1 for a, b in zip(v1_scores, v2_scores) if b == a)
    worsened = sum(1 for a, b in zip(v1_scores, v2_scores) if b < a)
    print(f'v2 improved: {improved}, same: {same}, worsened: {worsened}')

    # Visual appeal change
    from engine.validator.quality_v2 import QualityValidatorV2
    visual_base = []
    visual_lit = []
    for subject in animals:
        for i, style in enumerate(styles):
            base = COMPOSERS[subject](style)
            lit = pipeline(subject, style, difficulty='easy')
            base_eval = QualityValidatorV2(base, rules).evaluate()
            lit_eval = QualityValidatorV2(lit, rules).evaluate()
            visual_base.append(base_eval['v2_breakdown']['visual'])  # type: ignore
            visual_lit.append(lit_eval['v2_breakdown']['visual'])  # type: ignore
    avg_base = sum(visual_base) / len(visual_base)
    avg_lit = sum(visual_lit) / len(visual_lit)
    print(f'visual appeal: base={avg_base:.2f} lit={avg_lit:.2f} diff={avg_lit-avg_base:+.2f}')
