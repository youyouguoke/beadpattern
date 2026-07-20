"""Semantic Lock: protect features and silhouette during refinement."""

from __future__ import annotations

from copy import deepcopy
from dataclasses import dataclass, field
from typing import Dict, List, Set, Tuple, Optional


@dataclass
class SemanticLock:
    """Snapshot of semantic positions that must be preserved."""

    eye_positions: List[Tuple[int, int]] = field(default_factory=list)
    nose_positions: List[Tuple[int, int]] = field(default_factory=list)
    mouth_positions: List[Tuple[int, int]] = field(default_factory=list)
    feature_pixels: Set[Tuple[int, int]] = field(default_factory=set)
    silhouette_bbox: Tuple[int, int, int, int] = (0, 0, 0, 0)

    @staticmethod
    def from_grid(grid: List[List[str]]) -> 'SemanticLock':
        """Heuristic feature detection for the animal composers.

        We rely on the fact that features are drawn with 'K' (outline) after
        the body is filled. Feature pixels are small, dense black clusters
        in the upper/middle region of the grid.
        """
        h, w = len(grid), len(grid[0])
        lock = SemanticLock()
        # Collect K pixels that are not part of the outer silhouette boundary.
        # A simple heuristic: K pixels that have at least one non-K, non-'.' neighbor
        # are likely feature/outlines. We then cluster them.
        feature_candidates: Set[Tuple[int, int]] = set()
        for y in range(h):
            for x in range(w):
                if grid[y][x] != 'K':
                    continue
                # If this K is adjacent to a body color, it's part of the drawing.
                has_body_neighbor = any(
                    0 <= nx < w and 0 <= ny < h and grid[ny][nx] not in ('.', 'K')
                    for nx, ny in [(x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)]
                )
                if has_body_neighbor:
                    feature_candidates.add((x, y))

        # Separate the outer silhouette from features by flood-filling the border.
        # Any K connected to the grid edge is silhouette.
        visited = set()
        stack = []
        for y in range(h):
            for x in [0, w - 1]:
                if grid[y][x] == 'K' and (x, y) not in visited:
                    stack.append((x, y))
        for x in range(w):
            for y in [0, h - 1]:
                if grid[y][x] == 'K' and (x, y) not in visited:
                    stack.append((x, y))
        while stack:
            x, y = stack.pop()
            if (x, y) in visited:
                continue
            visited.add((x, y))
            for nx, ny in [(x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)]:
                if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in visited and grid[ny][nx] == 'K':
                    stack.append((nx, ny))

        lock.feature_pixels = {(x, y) for x, y in feature_candidates if (x, y) not in visited}
        # Re-add any K pixels that are not part of the silhouette.
        # This protects all internal black features.
        # But if there are too many, it might over-protect. Keep heuristic simple.
        if len(lock.feature_pixels) < 5:
            lock.feature_pixels = set(feature_candidates)

        lock.silhouette_bbox = SemanticLock._bbox(grid)
        lock.eye_positions, lock.nose_positions, lock.mouth_positions = SemanticLock._guess_features(grid, lock.feature_pixels)
        return lock

    @staticmethod
    def _bbox(grid: List[List[str]]) -> Tuple[int, int, int, int]:
        h, w = len(grid), len(grid[0])
        min_x, min_y, max_x, max_y = w, h, 0, 0
        for y in range(h):
            for x in range(w):
                if grid[y][x] != '.':
                    min_x = min(min_x, x)
                    min_y = min(min_y, y)
                    max_x = max(max_x, x)
                    max_y = max(max_y, y)
        return min_x, min_y, max_x, max_y

    @staticmethod
    def _guess_features(grid: List[List[str]], feature_pixels: Set[Tuple[int, int]]) -> Tuple[List[Tuple[int, int]], List[Tuple[int, int]], List[Tuple[int, int]]]:
        """Roughly partition feature pixels into eyes/nose/mouth by vertical position."""
        if not feature_pixels:
            return [], [], []
        ys = [y for _, y in feature_pixels]
        mid_y = sum(ys) / len(ys)
        eyes = [(x, y) for x, y in feature_pixels if y < mid_y - 1]
        nose = [(x, y) for x, y in feature_pixels if mid_y - 1 <= y <= mid_y + 1]
        mouth = [(x, y) for x, y in feature_pixels if y > mid_y + 1]
        return eyes, nose, mouth

    def is_feature(self, x: int, y: int) -> bool:
        return (x, y) in self.feature_pixels

    def validate(self, before: List[List[str]], after: List[List[str]]) -> Tuple[bool, List[str]]:
        """Return (ok, reasons)."""
        reasons = []
        # Feature count preserved
        lost = [(x, y) for x, y in self.feature_pixels if after[y][x] == '.']
        if lost:
            reasons.append(f'feature_lost={lost}')
        # Bbox preserved (allow one pixel shrink/grow due to rounding)
        bx, by, bw, bh = self.silhouette_bbox
        ax, ay, aw, ah = SemanticLock._bbox(after)
        if abs(ax - bx) > 2 or abs(ay - by) > 2 or abs(aw - bw) > 2 or abs(ah - bh) > 2:
            reasons.append(f'bbox_changed={self.silhouette_bbox}->{(ax, ay, aw, ah)}')
        # Eye positions preserved
        for x, y in self.eye_positions:
            if after[y][x] == '.':
                reasons.append(f'eye_erased=({x},{y})')
        for x, y in self.nose_positions:
            if after[y][x] == '.':
                reasons.append(f'nose_erased=({x},{y})')
        for x, y in self.mouth_positions:
            if after[y][x] == '.':
                reasons.append(f'mouth_erased=({x},{y})')
        return len(reasons) == 0, reasons

    def apply_mask(self, grid: List[List[str]]) -> List[List[str]]:
        """Restore protected pixels from the original grid."""
        grid = deepcopy(grid)
        for x, y in self.feature_pixels:
            grid[y][x] = self._original.get((x, y), grid[y][x])
        return grid

    _original: Dict[Tuple[int, int], str] = field(default_factory=dict, repr=False)

    def capture_original(self, grid: List[List[str]]) -> None:
        self._original = {(x, y): grid[y][x] for x, y in self.feature_pixels}
