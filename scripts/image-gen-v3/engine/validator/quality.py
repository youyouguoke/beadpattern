"""Quality validator matching the v1.1 baseline."""

from __future__ import annotations

from typing import Dict, List, Tuple


class CraftabilityChecker:
    def __init__(self, grid: List[List[str]]):
        self.grid = grid
        self.h = len(grid)
        self.w = len(grid[0])

    def isolated_beads(self) -> int:
        count = 0
        for y in range(self.h):
            for x in range(self.w):
                ch = self.grid[y][x]
                if ch == '.':
                    continue
                same = any(self.grid[y+dy][x+dx] == ch for dx, dy in [(-1,0),(1,0),(0,-1),(0,1)]
                           if 0 <= x+dx < self.w and 0 <= y+dy < self.h)
                if not same:
                    count += 1
        return count

    def thin_line_pixels(self) -> int:
        count = 0
        for y in range(self.h):
            for x in range(self.w):
                ch = self.grid[y][x]
                if ch == '.':
                    continue
                ortho = any(self.grid[y+dy][x+dx] == ch for dx, dy in [(-1,0),(1,0),(0,-1),(0,1)]
                            if 0 <= x+dx < self.w and 0 <= y+dy < self.h)
                diag = any(self.grid[y+dy][x+dx] == ch for dx, dy in [(-1,-1),(1,-1),(-1,1),(1,1)]
                           if 0 <= x+dx < self.w and 0 <= y+dy < self.h)
                if not ortho and diag:
                    count += 1
        return count

    def check(self) -> Tuple[int, List[str]]:
        score = 100
        reasons = []
        iso = self.isolated_beads()
        if iso > 0:
            score -= min(30, iso * 5)
            reasons.append(f'isolated_beads={iso}')
        thin = self.thin_line_pixels()
        if thin > 0:
            score -= min(20, thin * 2)
            reasons.append(f'thin_line_pixels={thin}')
        return max(0, score), reasons


class QualityValidator:
    def __init__(self, grid: List[List[str]], rules: dict):
        self.grid = grid
        self.rules = rules
        self.h = len(grid)
        self.w = len(grid[0])
        self.craft = CraftabilityChecker(grid)

    def evaluate(self) -> Tuple[int, List[str]]:
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

        colors = set(ch for row in self.grid for ch in row if ch != '.')
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
