"""Conservative Pixel Cluster Optimizer v1.0.

Rules (only touch non-feature body pixels):
1. Remove isolated beads (no same-color 4-neighbor).
2. Break 2x2 solid squares at convex corners.
3. Fill concave corners (diagonal-only adjacency).
4. Never change feature pixels.
5. Never change silhouette bounding box by more than 1 pixel.
"""

from __future__ import annotations

from copy import deepcopy
from typing import List, Set, Tuple

from .feature_guard import SemanticLock


class PixelClusterOptimizer:
    def __init__(self, grid: List[List[str]], lock: SemanticLock):
        self.grid = grid
        self.h = len(grid)
        self.w = len(grid[0])
        self.lock = lock
        self._bbox = lock.silhouette_bbox

    def _neighbors_4(self, x: int, y: int) -> List[Tuple[int, int]]:
        res = []
        for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nx, ny = x + dx, y + dy
            if 0 <= nx < self.w and 0 <= ny < self.h:
                res.append((nx, ny))
        return res

    def _neighbors_8(self, x: int, y: int) -> List[Tuple[int, int]]:
        res = []
        for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (1, -1), (-1, 1), (1, 1)]:
            nx, ny = x + dx, y + dy
            if 0 <= nx < self.w and 0 <= ny < self.h:
                res.append((nx, ny))
        return res

    def _allowed(self, x: int, y: int) -> bool:
        return not self.lock.is_feature(x, y)

    def _in_bbox_limit(self, x: int, y: int) -> bool:
        min_x, min_y, max_x, max_y = self._bbox
        return (min_x - 1) <= x <= (max_x + 1) and (min_y - 1) <= y <= (max_y + 1)

    def merge_isolated_beads(self) -> None:
        for y in range(self.h):
            for x in range(self.w):
                ch = self.grid[y][x]
                if ch == '.' or ch == 'K' or not self._allowed(x, y):
                    continue
                same = any(self.grid[ny][nx] == ch for nx, ny in self._neighbors_4(x, y))
                if same:
                    continue
                counts: dict = {}
                for nx, ny in self._neighbors_8(x, y):
                    c = self.grid[ny][nx]
                    if c != '.' and c != 'K' and c != ch and self._allowed(nx, ny):
                        counts[c] = counts.get(c, 0) + 1
                if counts:
                    self.grid[y][x] = max(counts.items(), key=lambda kv: kv[1])[0]

    def break_2x2_squares(self) -> None:
        """Break 2x2 solid squares if they are at an outer corner."""
        for y in range(self.h - 1):
            for x in range(self.w - 1):
                block = [self.grid[y][x], self.grid[y][x + 1], self.grid[y + 1][x], self.grid[y + 1][x + 1]]
                if any(self.lock.is_feature(x + dx, y + dy) for dx, dy in [(0,0),(1,0),(0,1),(1,1)]):
                    continue
                if not all(b == block[0] and b not in ('.', 'K') for b in block):
                    continue
                # outer corner: right or below is empty
                right_empty = (x + 2 >= self.w) or (self.grid[y][x + 2] == '.')
                down_empty = (y + 2 >= self.h) or (self.grid[y + 2][x] == '.')
                if right_empty or down_empty:
                    # remove the corner pixel that is outermost
                    self.grid[y + 1][x + 1] = '.'

    def fill_concave_corners(self) -> None:
        for y in range(1, self.h - 1):
            for x in range(1, self.w - 1):
                if self.grid[y][x] != '.' or not self._allowed(x, y):
                    continue
                pairs = [
                    (self.grid[y - 1][x], self.grid[y][x - 1]),
                    (self.grid[y - 1][x], self.grid[y][x + 1]),
                    (self.grid[y + 1][x], self.grid[y][x - 1]),
                    (self.grid[y + 1][x], self.grid[y][x + 1]),
                ]
                for a, b in pairs:
                    if a == b and a not in ('.', 'K') and self._in_bbox_limit(x, y):
                        self.grid[y][x] = a
                        break

    def optimize(self, iterations: int = 1) -> List[List[str]]:
        for _ in range(iterations):
            self.merge_isolated_beads()
            self.break_2x2_squares()
            self.fill_concave_corners()
            self.merge_isolated_beads()
        return self.grid

    def optimize_with_guard(self) -> List[List[str]]:
        """Run optimizer and rollback if semantic lock fails."""
        original = deepcopy(self.grid)
        self.optimize()
        # restore protected features
        for x, y in self.lock.feature_pixels:
            self.grid[y][x] = original[y][x]
        ok, reasons = self.lock.validate(original, self.grid)
        if not ok:
            # rollback
            self.grid = original
        return self.grid
