"""Run v1 vs v2 quality scoring on the full 60-pattern dataset."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from engine.composer.composer_v11 import COMPOSERS
from engine.artist.feature_guard import SemanticLock
from engine.artist.cluster_optimizer import PixelClusterOptimizer
from engine.validator.quality import QualityValidator
from engine.validator.quality_v2 import QualityValidatorV2
from copy import deepcopy


ANIMALS = ['cat', 'panda', 'dog', 'fox', 'rabbit', 'bear', 'penguin', 'owl', 'frog', 'turtle', 'koala', 'lion']
STYLES = [
    {'eye': 'round', 'mouth': 'smile', 'blush': True, 'whiskers': True},
    {'eye': 'shut_curve', 'mouth': 'smile', 'blush': False, 'whiskers': True},
    {'eye': 'shut_line', 'mouth': 'tiny', 'blush': False, 'whiskers': True},
    {'eye': 'wink', 'mouth': 'cat', 'blush': True, 'whiskers': True},
    {'eye': 'big', 'mouth': 'open', 'blush': True, 'whiskers': False},
]
RULES = {'required': ['ears', 'eyes', 'nose']}


def optimize(grid: list) -> list:
    lock = SemanticLock.from_grid(grid)
    lock.capture_original(grid)
    return PixelClusterOptimizer(deepcopy(grid), lock).optimize_with_guard()


if __name__ == '__main__':
    print(f'{"sample":<20} {"v1":>4} {"v2":>4} {"diff":>5}')
    v1_scores = []
    v2_scores = []
    for subject in ANIMALS:
        for i, style in enumerate(STYLES):
            grid = optimize(COMPOSERS[subject](style))
            slug = f'{subject}-{i+1}'
            v1 = QualityValidator(grid, RULES).evaluate()[0]
            result = QualityValidatorV2(grid, RULES).evaluate()
            v2: int = result['score_v2']  # type: ignore
            v1_scores.append(v1)
            v2_scores.append(v2)
            marker = ''
            if v2 >= v1 + 5:
                marker = '↑'
            elif v2 <= v1 - 5:
                marker = '↓'
            print(f'{slug:<20} {v1:>4} {v2:>4} {v2-v1:>+5} {marker}')

    print('\n=== Summary ===')
    print(f'v1 average: {sum(v1_scores)/len(v1_scores):.1f}')
    print(f'v2 average: {sum(v2_scores)/len(v2_scores):.1f}')
    print(f'v1 min: {min(v1_scores)}, max: {max(v1_scores)}')
    print(f'v2 min: {min(v2_scores)}, max: {max(v2_scores)}')
    improved = sum(1 for a, b in zip(v1_scores, v2_scores) if b > a)
    same = sum(1 for a, b in zip(v1_scores, v2_scores) if b == a)
    worsened = sum(1 for a, b in zip(v1_scores, v2_scores) if b < a)
    print(f'improved: {improved}, same: {same}, worsened: {worsened}')
