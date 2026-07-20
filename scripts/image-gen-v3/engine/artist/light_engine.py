"""LightEngine v2.1: Directional Distance Field body-only lighting.

Design:
- Protect features (eyes, nose, mouth) and small decorative regions.
- Apply directional shading only to large body regions (area > 8 pixels).
- Use a blend of radial distance from boundary and light direction.
- Limit the number of new ramp colors per difficulty.
"""

from __future__ import annotations

from copy import deepcopy
from dataclasses import dataclass
from enum import Enum
from typing import Dict, List, Optional, Set, Tuple

from .feature_guard import SemanticLock


class Direction(Enum):
    TOP_LEFT = (-1, -1)
    TOP = (0, -1)
    TOP_RIGHT = (1, -1)
    LEFT = (-1, 0)
    RIGHT = (1, 0)
    BOTTOM_LEFT = (-1, 1)
    BOTTOM = (0, 1)
    BOTTOM_RIGHT = (1, 1)


@dataclass
class LightConfig:
    direction: Direction = Direction.TOP_LEFT
    strength: float = 0.25
    max_new_colors: int = 1  # 1 for easy, 2 for medium, 3 for hard
    apply_layers: Tuple[str, ...] = ('body', 'belly', 'snout', 'mane', 'shell')
    exclude_features: bool = True
    region_min_area: int = 8
    radial_weight: float = 0.6
    directional_weight: float = 0.4


class LightEngine:
    def __init__(self, grid: List[List[str]], lock: SemanticLock, base_colors: List[str], config: Optional[LightConfig] = None):
        self.grid = deepcopy(grid)
        self.h = len(grid)
        self.w = len(grid[0])
        self.lock = lock
        self.base_colors = set(base_colors)
        self.config = config if config is not None else LightConfig()
        self._shadow_ramps: Dict[str, List[str]] = {
            'W': ['W', 'L', 'S'],   # white body -> light gray -> shadow
            'P': ['P', 'R'],        # pink -> dark pink
            'Q': ['Q', 'P'],
            'O': ['O', 'R'],        # orange -> brown
            'Y': ['Y', 'O'],
            'R': ['R', 'G'],        # brown -> dark gray
            'T': ['T', 'R'],
            'B': ['B', 'G'],
            'N': ['N', 'D'],
            'V': ['V', 'N'],
            'G': ['G', 'X'],
            'M': ['M', 'G'],
            'A': ['A', 'O'],
            'C': ['C', 'X'],
        }

    def _neighbors_4(self, x: int, y: int) -> List[Tuple[int, int]]:
        res = []
        for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nx, ny = x + dx, y + dy
            if 0 <= nx < self.w and 0 <= ny < self.h:
                res.append((nx, ny))
        return res

    def _body_mask(self) -> List[List[int]]:
        """Return region label mask for each body-color connected component."""
        mask = [[-1 for _ in range(self.w)] for _ in range(self.h)]
        label = 0
        for y in range(self.h):
            for x in range(self.w):
                ch = self.grid[y][x]
                if mask[y][x] == -1 and ch in self.base_colors and not self.lock.is_feature(x, y):
                    stack = [(x, y)]
                    region_color = ch
                    while stack:
                        cx, cy = stack.pop()
                        if mask[cy][cx] != -1 or self.grid[cy][cx] != region_color or self.lock.is_feature(cx, cy):
                            continue
                        mask[cy][cx] = label
                        for nx, ny in self._neighbors_4(cx, cy):
                            stack.append((nx, ny))
                    label += 1
        return mask

    def _distance_field(self, mask: List[List[int]], label: int) -> List[List[float]]:
        """Compute normalized distance from boundary for a given region."""
        dist = [[float('inf') for _ in range(self.w)] for _ in range(self.h)]
        for y in range(self.h):
            for x in range(self.w):
                if mask[y][x] != label:
                    continue
                at_edge = False
                for nx, ny in self._neighbors_4(x, y):
                    if mask[ny][nx] != label:
                        at_edge = True
                        break
                if at_edge or x == 0 or x == self.w - 1 or y == 0 or y == self.h - 1:
                    dist[y][x] = 0.0
        changed = True
        while changed:
            changed = False
            for y in range(self.h):
                for x in range(self.w):
                    if mask[y][x] != label or dist[y][x] == 0:
                        continue
                    min_neighbor = dist[y][x]
                    for nx, ny in self._neighbors_4(x, y):
                        if mask[ny][nx] == label and dist[ny][nx] + 1 < min_neighbor:
                            min_neighbor = dist[ny][nx] + 1
                    if min_neighbor < dist[y][x]:
                        dist[y][x] = min_neighbor
                        changed = True
        max_d = max(dist[y][x] for y in range(self.h) for x in range(self.w) if mask[y][x] == label)
        if max_d <= 0:
            return dist
        for y in range(self.h):
            for x in range(self.w):
                if mask[y][x] == label:
                    dist[y][x] = dist[y][x] / max_d
        return dist

    def _directional_score(self, x: int, y: int) -> float:
        dx, dy = self.config.direction.value
        if dx < 0:
            sx = (self.w - 1 - x) / (self.w - 1)
        elif dx > 0:
            sx = x / (self.w - 1)
        else:
            sx = 0.5
        if dy < 0:
            sy = (self.h - 1 - y) / (self.h - 1)
        elif dy > 0:
            sy = y / (self.h - 1)
        else:
            sy = 0.5
        return (sx + sy) / 2.0

    def _shadow_threshold(self) -> float:
        """Return the darkness threshold for a pixel to become shadow.

        Higher strength = more aggressive shadowing (lower threshold).
        """
        return 1.0 - min(0.8, self.config.strength)

    def _is_safe_shadow(self, x: int, y: int, base_color: str, candidates: Set[Tuple[int, int]]) -> bool:
        """Return true if turning (x,y) into shadow won't isolate any base-color neighbor."""
        # Check that at least one orthogonal neighbor is also a candidate
        has_shadow_neighbor = any((nx, ny) in candidates for nx, ny in self._neighbors_4(x, y))
        if not has_shadow_neighbor:
            return False
        # Check that no base-color neighbor would become isolated after this pixel is removed.
        for nx, ny in self._neighbors_4(x, y):
            if not (0 <= nx < self.w and 0 <= ny < self.h):
                continue
            if self.grid[ny][nx] != base_color or (nx, ny) in candidates:
                continue
            # Count how many base-color orthogonal neighbors this neighbor has, excluding (x,y)
            same = sum(1 for nnx, nny in self._neighbors_4(nx, ny)
                       if 0 <= nnx < self.w and 0 <= nny < self.h
                       and self.grid[nny][nnx] == base_color and (nnx, nny) != (x, y))
            if same < 1:
                return False
        return True
    def apply(self) -> List[List[str]]:
        """Apply body-only directional lighting and return the new grid."""
        mask = self._body_mask()
        new_grid = [row[:] for row in self.grid]

        for label in range(0, max(max(row) for row in mask) + 1):
            base_color = None
            for y in range(self.h):
                for x in range(self.w):
                    if mask[y][x] == label:
                        base_color = self.grid[y][x]
                        break
                if base_color:
                    break
            if base_color not in self._shadow_ramps:
                continue
            ramp = self._shadow_ramps[base_color][:self.config.max_new_colors + 1]
            if len(ramp) < 2:
                continue

            dist = self._distance_field(mask, label)
            # First pass: determine candidate shadow pixels based on threshold.
            candidates: Set[Tuple[int, int]] = set()
            for y in range(self.h):
                for x in range(self.w):
                    if mask[y][x] != label or self.lock.is_feature(x, y):
                        continue
                    radial = dist[y][x]
                    directional = self._directional_score(x, y)
                    light = self.config.radial_weight * radial + self.config.directional_weight * directional
                    # dark = 1 - light. We only shade pixels that are dark enough.
                    if (1.0 - light) > self._shadow_threshold():
                        candidates.add((x, y))

            # Second pass: only keep candidates that are safe to shadow.
            # (won't disconnect the body region or create isolated beads)
            shadow_pixels = set()
            for x, y in candidates:
                if self._is_safe_shadow(x, y, base_color, candidates):
                    shadow_pixels.add((x, y))

            # Apply the darkest shade to the shadow band.
            for x, y in shadow_pixels:
                new_grid[y][x] = ramp[-1]

        return new_grid

    def apply_with_guard(self, max_attempts: int = 1) -> List[List[str]]:
        original = [row[:] for row in self.grid]
        for _ in range(max_attempts):
            result = self.apply()
            for x, y in self.lock.feature_pixels:
                result[y][x] = original[y][x]
            ok, reasons = self.lock.validate(original, result)
            if ok:
                return result
        return original
