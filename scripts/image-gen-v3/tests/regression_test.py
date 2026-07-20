"""Regression test suite for the Pixel Artist Engine."""

from __future__ import annotations

from copy import deepcopy
import sys
from pathlib import Path
from typing import List, Tuple, Dict

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from engine.composer.composer_v11 import COMPOSERS
from engine.artist.feature_guard import SemanticLock
from engine.artist.cluster_optimizer import PixelClusterOptimizer
from engine.validator.quality import QualityValidator


GOLDEN_SAMPLES = [
    ('cat', {'eye': 'round', 'mouth': 'smile', 'blush': True, 'whiskers': True}),
    ('panda', {'eye': 'round', 'mouth': 'smile', 'blush': False, 'whiskers': True}),
    ('dog', {'eye': 'round', 'mouth': 'smile', 'blush': True, 'whiskers': True}),
    ('fox', {'eye': 'round', 'mouth': 'smile', 'blush': False, 'whiskers': True}),
    ('rabbit', {'eye': 'round', 'mouth': 'smile', 'blush': True, 'whiskers': True}),
    ('bear', {'eye': 'round', 'mouth': 'smile', 'blush': False, 'whiskers': True}),
    ('penguin', {'eye': 'round', 'mouth': 'smile', 'blush': False, 'whiskers': True}),
    ('owl', {'eye': 'round', 'mouth': 'smile', 'blush': False, 'whiskers': True}),
    ('frog', {'eye': 'round', 'mouth': 'smile', 'blush': False, 'whiskers': True}),
    ('turtle', {'eye': 'round', 'mouth': 'smile', 'blush': False, 'whiskers': True}),
    ('koala', {'eye': 'round', 'mouth': 'smile', 'blush': False, 'whiskers': True}),
    ('lion', {'eye': 'round', 'mouth': 'smile', 'blush': False, 'whiskers': True}),
    ('cat', {'eye': 'shut_line', 'mouth': 'tiny', 'blush': False, 'whiskers': True}),
    ('panda', {'eye': 'shut_curve', 'mouth': 'smile', 'blush': False, 'whiskers': True}),
    ('dog', {'eye': 'wink', 'mouth': 'cat', 'blush': True, 'whiskers': True}),
    ('fox', {'eye': 'big', 'mouth': 'open', 'blush': True, 'whiskers': False}),
    ('rabbit', {'eye': 'shut_curve', 'mouth': 'smile', 'blush': False, 'whiskers': True}),
    ('bear', {'eye': 'shut_line', 'mouth': 'tiny', 'blush': False, 'whiskers': True}),
    ('penguin', {'eye': 'wink', 'mouth': 'cat', 'blush': True, 'whiskers': True}),
    ('lion', {'eye': 'big', 'mouth': 'open', 'blush': True, 'whiskers': False}),
]

RULES = {'required': ['ears', 'eyes', 'nose']}


def grid_to_hash(grid: List[List[str]]) -> str:
    return ''.join(''.join(row) for row in grid)


def shape_similarity(a: List[List[str]], b: List[List[str]]) -> float:
    total = 0
    match = 0
    for y in range(min(len(a), len(b))):
        for x in range(min(len(a[0]), len(b[0]))):
            total += 1
            if (a[y][x] == '.') == (b[y][x] == '.'):
                match += 1
    return match / total if total else 0.0


def run_baseline() -> Dict[str, dict]:
    results = {}
    for subject, style in GOLDEN_SAMPLES:
        key = f"{subject}-{style.get('eye', 'round')}-{style.get('mouth', 'smile')}"
        grid = COMPOSERS[subject](style)
        score, reasons = QualityValidator(grid, RULES).evaluate()
        results[key] = {'grid': grid, 'score': score, 'reasons': reasons}
    return results


def run_with_optimizer() -> Dict[str, dict]:
    results = {}
    for subject, style in GOLDEN_SAMPLES:
        key = f"{subject}-{style.get('eye', 'round')}-{style.get('mouth', 'smile')}"
        grid = COMPOSERS[subject](style)
        lock = SemanticLock.from_grid(grid)
        lock.capture_original(grid)
        optimized = PixelClusterOptimizer(deepcopy(grid), lock).optimize_with_guard()
        score, reasons = QualityValidator(optimized, RULES).evaluate()
        ok, lock_reasons = lock.validate(grid, optimized)
        sim = shape_similarity(grid, optimized)
        results[key] = {
            'grid': optimized,
            'score': score,
            'reasons': reasons,
            'lock_ok': ok,
            'lock_reasons': lock_reasons,
            'similarity': sim,
        }
    return results


def compare(baseline: Dict[str, dict], optimized: Dict[str, dict]) -> None:
    regressions = []
    print('=== Regression Report ===')
    print(f'{"sample":<30} {"base":>5} {"opt":>5} {"diff":>5} {"sim":>5} {"lock":>5}')
    for key in GOLDEN_SAMPLES:
        k = f"{key[0]}-{key[1].get('eye', 'round')}-{key[1].get('mouth', 'smile')}"
        b = baseline[k]
        o = optimized[k]
        diff = o['score'] - b['score']
        print(f'{k:<30} {b["score"]:>5} {o["score"]:>5} {diff:>+5} {o["similarity"]:>5.2f} {"OK" if o["lock_ok"] else "FAIL"}')
        if diff < -3 or not o['lock_ok'] or o['similarity'] < 0.95:
            regressions.append((k, b['score'], o['score'], o['lock_reasons'], o['similarity']))
    if regressions:
        print('\n--- REGRESSIONS ---')
        for k, bs, os, reasons, sim in regressions:
            print(f'{k}: base={bs} opt={os} sim={sim:.2f} reasons={reasons}')
        raise SystemExit(1)
    print('\nAll golden samples passed.')


if __name__ == '__main__':
    baseline = run_baseline()
    optimized = run_with_optimizer()
    compare(baseline, optimized)
