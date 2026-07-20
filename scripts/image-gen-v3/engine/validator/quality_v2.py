"""Quality Validator v2.0.

Goals:
- Keep Shape 30, Feature 25, Craftability 20 unchanged for backwards compatibility.
- Replace Color-count-based Visual Appeal with a visual-aware scoring model.
- Add new dimensions: Palette Harmony, Contrast Balance, Depth Perception, Pixel Art Style.
- Output both score_v1 (legacy) and score_v2 (new) for comparison.
"""

from __future__ import annotations

from collections import defaultdict
from typing import Dict, List, Set, Tuple, Any

from .quality import CraftabilityChecker  # reuse craftability unchanged


# Color wheel positions (degrees) for harmony scoring.
COLOR_HUE = {
    'K': None, 'S': None, 'Z': None, 'X': None, 'D': None, 'M': None, 'L': None, 'H': None,
    'W': 0, 'P': 330, 'Q': 330, 'R': 30, 'T': 30, 'O': 30, 'Y': 60, 'B': 200, 'N': 120, 'V': 120,
    'G': None, 'A': 50, 'C': None, '.': None,
}


class QualityValidatorV2:
    def __init__(self, grid: List[List[str]], rules: dict):
        self.grid = grid
        self.rules = rules
        self.h = len(grid)
        self.w = len(grid[0])
        self.craft = CraftabilityChecker(grid)

    # ==================== Shared helpers ====================

    def _color_counts(self) -> Dict[str, int]:
        counts: Dict[str, int] = defaultdict(int)
        for row in self.grid:
            for ch in row:
                if ch != '.':
                    counts[ch] += 1
        return counts

    def _bbox(self) -> Tuple[int, int, int, int]:
        min_x, min_y, max_x, max_y = self.w, self.h, 0, 0
        for y in range(self.h):
            for x in range(self.w):
                if self.grid[y][x] != '.':
                    min_x = min(min_x, x)
                    min_y = min(min_y, y)
                    max_x = max(max_x, x)
                    max_y = max(max_y, y)
        return min_x, min_y, max_x, max_y

    # ==================== Legacy score_v1 ====================

    def score_v1(self) -> Tuple[int, List[str]]:
        score = 0
        reasons = []
        filled = sum(1 for row in self.grid for ch in row if ch != '.')
        ratio = filled / (self.h * self.w)
        if 0.20 <= ratio <= 0.65:
            shape_score = 30
        else:
            shape_score = max(0, int(30 - abs(0.42 - ratio) * 80))
        score += shape_score
        reasons.append(f'shape_ratio={ratio:.2f} ({shape_score}/30)')

        required = self.rules.get('required', [])
        feature_score = 0
        for feat in required:
            if feat == 'ears':
                has_ear = any(self.grid[y][x] != '.' for y in [2, 3, 4] for x in [6, 7, 8, 9, 10])
                if has_ear:
                    feature_score += 8
            elif feat == 'eyes':
                has_eyes = self.grid[self.h // 2][self.w // 3] != '.' and self.grid[self.h // 2][2 * self.w // 3] != '.'
                if has_eyes:
                    feature_score += 8
            elif feat == 'nose':
                mid = self.w // 2
                has_nose = self.grid[self.h // 2 + 2][mid] != '.' and self.grid[self.h // 2 + 2][mid - 1] != '.'
                if has_nose:
                    feature_score += 8
        feature_score = min(25, feature_score)
        score += feature_score
        reasons.append(f'feature_score={feature_score}/25')

        craft_score, craft_reasons = self.craft.check()
        craft_norm = min(20, craft_score // 5)
        score += craft_norm
        reasons.extend(craft_reasons)
        reasons.append(f'craftability={craft_norm}/20')

        colors = set(self._color_counts().keys())
        unique_colors = len(colors)
        if unique_colors >= 8:
            color_score = 15
        elif unique_colors >= 6:
            color_score = 12
        elif unique_colors >= 4:
            color_score = 8
        else:
            color_score = max(0, unique_colors * 2)
        score += color_score
        reasons.append(f'colors={unique_colors} ({color_score}/15)')

        appeal = 0
        has_blush = 'Q' in colors or 'P' in colors
        has_shadow = 'S' in colors
        has_highlight = 'Z' in colors
        if has_blush:
            appeal += 2
        if has_shadow and has_highlight:
            appeal += 3
        if 4 <= unique_colors <= 12:
            appeal += 2
        if any(c in colors for c in ['P', 'Q', 'B', 'O', 'Y']):
            appeal += 3
        appeal = min(10, appeal)
        score += appeal
        reasons.append(f'visual_appeal={appeal}/10')

        return score, reasons

    # ==================== New v2 components ====================

    def _palette_harmony(self, colors: Set[str]) -> int:
        """Score based on how colors relate on the color wheel."""
        hues = [COLOR_HUE[c] for c in colors if COLOR_HUE.get(c) is not None]
        if len(hues) <= 1:
            return 3  # monochrome is valid and intentional
        if len(hues) == 2:
            diff = abs(hues[0] - hues[1])
            diff = min(diff, 360 - diff)
            if diff <= 30:
                return 3
            if diff <= 120:
                return 3
            return 2
        # More colors: reward analogous groups and penalize random chaos.
        hues_sorted = sorted(hues)
        diffs = [(hues_sorted[(i + 1) % len(hues_sorted)] - hues_sorted[i]) % 360 for i in range(len(hues_sorted))]
        avg_diff = sum(diffs) / len(diffs)
        if avg_diff <= 60:
            return 3
        if avg_diff <= 150:
            return 2
        return 1

    def _contrast_balance(self, counts: Dict[str, int]) -> int:
        """Score based on foreground/background separation.

        Treat outline ('K') as foreground and all other filled colors as body.
        Shadow/highlight ramp colors are considered part of the body.
        """
        if not counts:
            return 0
        non_outline = {c: n for c, n in counts.items() if c != 'K'}
        if not non_outline:
            return 0
        body_color = max(non_outline.items(), key=lambda kv: kv[1])[0]
        outline_count = counts.get('K', 0)
        body_count = sum(non_outline.values())
        total = sum(counts.values())
        body_ratio = body_count / total
        outline_ratio = outline_count / total
        # Good: body (including shadows/highlights) is 25-90% of shape, outline not too heavy
        if 0.25 <= body_ratio <= 0.90 and outline_ratio <= 0.35:
            return 3
        if 0.20 <= body_ratio <= 0.95:
            return 2
        return 1

    def _pixel_cluster_score(self) -> int:
        """Score based on how pixel clusters form continuous, readable shapes.

        Ignore shadow/highlight ramp pixels ('S','Z','X','D','H','L') when counting
        isolated beads, because they are intentionally sparse.
        """
        # Build a virtual grid where ramp colors are merged with their surrounding body color.
        virtual = [row[:] for row in self.grid]
        for y in range(self.h):
            for x in range(self.w):
                ch = virtual[y][x]
                if ch in ('S', 'Z', 'X', 'D', 'H'):
                    # replace with most common non-ramp, non-K, non-. neighbor
                    counts = {}
                    for nx, ny in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)]:
                        if 0 <= nx < self.w and 0 <= ny < self.h:
                            n = virtual[ny][nx]
                            if n not in ('.', 'K', 'S', 'Z', 'X', 'D', 'H'):
                                counts[n] = counts.get(n, 0) + 1
                    if counts:
                        virtual[y][x] = max(counts.items(), key=lambda kv: kv[1])[0]
        checker = CraftabilityChecker(virtual)
        iso = checker.isolated_beads()
        thin = checker.thin_line_pixels()
        if iso == 0 and thin == 0:
            return 2
        if iso <= 3 and thin <= 3:
            return 1
        return 0

    def _depth_perception(self, colors: Set[str]) -> int:
        """Score depth perception based on distinct shadow/highlight shades.

        0 = no depth
        2 = one shade present (e.g. S or Z)
        3 = multiple distinct shades (e.g. S + Z, or X + S + H)
        """
        shades = {'S', 'Z', 'X', 'D', 'H'} & colors
        if not shades:
            return 0
        if len(shades) == 1:
            return 2
        return 3

    def score_v2(self) -> Tuple[int, Dict[str, Any]]:
        """New scoring: 30 shape + 25 feature + 20 craft + 15 color + 10 visual."""
        v1_score, _ = self.score_v1()
        # Start with v1 components, then override color/visual.
        # We recalculate shape/feature/craft exactly the same way.
        reasons = []
        score = 0

        # Shape: same as v1
        filled = sum(1 for row in self.grid for ch in row if ch != '.')
        ratio = filled / (self.h * self.w)
        shape_score = 30 if 0.20 <= ratio <= 0.65 else max(0, int(30 - abs(0.42 - ratio) * 80))
        score += shape_score
        reasons.append(f'shape={shape_score}/30')

        # Feature: same as v1
        required = self.rules.get('required', [])
        feature_score = 0
        for feat in required:
            if feat == 'ears':
                has_ear = any(self.grid[y][x] != '.' for y in [2, 3, 4] for x in [6, 7, 8, 9, 10])
                if has_ear:
                    feature_score += 8
            elif feat == 'eyes':
                has_eyes = self.grid[self.h // 2][self.w // 3] != '.' and self.grid[self.h // 2][2 * self.w // 3] != '.'
                if has_eyes:
                    feature_score += 8
            elif feat == 'nose':
                mid = self.w // 2
                has_nose = self.grid[self.h // 2 + 2][mid] != '.' and self.grid[self.h // 2 + 2][mid - 1] != '.'
                if has_nose:
                    feature_score += 8
        feature_score = min(25, feature_score)
        score += feature_score
        reasons.append(f'feature={feature_score}/25')

        # Craftability: same as v1
        craft_score, _ = self.craft.check()
        craft_norm = min(20, craft_score // 5)
        score += craft_norm
        reasons.append(f'craft={craft_norm}/20')

        # Color v2: still 15 points, but reward quality over quantity.
        colors = set(self._color_counts().keys())
        counts = self._color_counts()
        unique_colors = len(colors)
        # Usefulness: at least 3 distinct meaningful colors (outline + body + accent)
        useful_color_score = 0
        if unique_colors >= 3:
            useful_color_score = 5
        elif unique_colors >= 2:
            useful_color_score = 3
        else:
            useful_color_score = 1
        # No over-coloring penalty
        if unique_colors > 12:
            useful_color_score -= 1
        color_score = min(15, useful_color_score + self._palette_harmony(colors) + self._contrast_balance(counts))
        score += color_score
        reasons.append(f'color_v2={color_score}/15')

        # Visual Appeal v2: 10 points from new dimensions.
        harmony = self._palette_harmony(colors)
        contrast = self._contrast_balance(counts)
        depth = self._depth_perception(colors)
        cluster = self._pixel_cluster_score()
        visual_score = min(10, harmony + contrast + depth + cluster)
        score += visual_score
        reasons.append(f'visual_v2={visual_score}/10')

        return score, {
            'shape': shape_score,
            'feature': feature_score,
            'craft': craft_norm,
            'color': color_score,
            'visual': visual_score,
            'harmony': harmony,
            'contrast': contrast,
            'depth': depth,
            'cluster': cluster,
            'reasons': reasons,
        }

    def evaluate(self) -> Dict[str, object]:
        v1_score, v1_reasons = self.score_v1()
        v2_score, breakdown = self.score_v2()
        return {
            'score_v1': v1_score,
            'score_v2': v2_score,
            'v1_reasons': v1_reasons,
            'v2_breakdown': breakdown,
        }
