#!/usr/bin/env python3
"""
Pixel Template Composer v1.1 (stable baseline)

Pipeline: Template -> Grid -> Refine -> Render
"""

from __future__ import annotations

import json
import random
from copy import deepcopy
from pathlib import Path
from typing import Dict, List, Tuple, Optional

from PIL import Image, ImageDraw


OUT_DIR = Path('/tmp/bead-template-v3')
OUT_DIR.mkdir(parents=True, exist_ok=True)


COLORS: Dict[str, Optional[Tuple[int, int, int, int]]] = {
    'K': (0x1a, 0x1a, 0x1a, 255),   # outline black
    'S': (0x66, 0x66, 0x66, 255),   # shadow
    'Z': (0xd0, 0xd0, 0xd0, 255),   # highlight
    'X': (0x33, 0x33, 0x33, 255),   # deep shadow
    'D': (0x44, 0x44, 0x44, 255),   # deep shadow alt
    'H': (0xee, 0xee, 0xee, 255),   # bright highlight
    'L': (0xc6, 0xe0, 0xa6, 255),   # light green
    'W': (0xf5, 0xf5, 0xf5, 255),   # white body
    'P': (0xf0, 0x62, 0x92, 255),   # pink
    'Q': (0xf8, 0xbb, 0xd0, 255),   # light pink
    'R': (0x8d, 0x6e, 0x63, 255),   # brown
    'T': (0xbc, 0xaa, 0xa4, 255),   # tan
    'O': (0xff, 0x98, 0x00, 255),   # orange
    'Y': (0xff, 0xd7, 0x4d, 255),   # yellow
    'B': (0x87, 0xce, 0xeb, 255),   # light blue
    'N': (0x4c, 0xaf, 0x50, 255),   # green
    'V': (0xa5, 0xd6, 0xa7, 255),   # light green
    'G': (0x42, 0x42, 0x42, 255),   # dark gray
    'A': (0xff, 0xca, 0x28, 255),   # gold
    'C': (0x61, 0x61, 0x61, 255),   # gray
    '.': None,                       # transparent
}

HEX_MAP = {
    'K': '#1a1a1a', 'S': '#666666', 'Z': '#d0d0d0', 'X': '#333333', 'D': '#444444', 'H': '#eeeeee', 'L': '#c6e0a6',
    'W': '#f5f5f5', 'P': '#f06292', 'Q': '#f8bbd0', 'R': '#8d6e63', 'T': '#bcaaa4', 'O': '#ff9800', 'Y': '#ffd74d',
    'B': '#87ceeb', 'N': '#4caf50', 'V': '#a5d6a7', 'G': '#424242', 'A': '#ffca28', 'C': '#616161', '.': None,
}


class Canvas:
    def __init__(self, width: int, height: int):
        self.width = width
        self.height = height

    def create(self) -> List[List[str]]:
        return [['.' for _ in range(self.width)] for _ in range(self.height)]


class LayerComposer:
    def __init__(self, grid: List[List[str]]):
        self.grid = grid
        self.h = len(grid)
        self.w = len(grid[0])

    def set(self, x: int, y: int, ch: str) -> None:
        if 0 <= x < self.w and 0 <= y < self.h:
            self.grid[y][x] = ch

    def get(self, x: int, y: int) -> str:
        return self.grid[y][x] if 0 <= x < self.w and 0 <= y < self.h else '.'

    def fill_ellipse(self, cx: int, cy: int, rx: int, ry: int, ch: str, border_only: bool = False) -> None:
        for y in range(self.h):
            for x in range(self.w):
                dx = x - cx
                dy = y - cy
                val = (dx * dx) / max(1, rx * rx) + (dy * dy) / max(1, ry * ry)
                if border_only:
                    if 0.80 <= val <= 1.20:
                        self.set(x, y, ch)
                elif val <= 1.0:
                    self.set(x, y, ch)

    def fill_circle(self, cx: int, cy: int, r: int, ch: str) -> None:
        self.fill_ellipse(cx, cy, r, r, ch)

    def draw_line(self, x1: int, y1: int, x2: int, y2: int, ch: str) -> None:
        dx = abs(x2 - x1)
        dy = abs(y2 - y1)
        sx = 1 if x1 < x2 else -1
        sy = 1 if y1 < y2 else -1
        err = dx - dy
        while True:
            self.set(x1, y1, ch)
            if x1 == x2 and y1 == y2:
                break
            e2 = 2 * err
            if e2 > -dy:
                err -= dy
                x1 += sx
            if e2 < dx:
                err += dx
                y1 += sy

    def force_symmetric(self) -> None:
        mid = self.w // 2
        for y in range(self.h):
            for x in range(mid):
                self.set(self.w - 1 - x, y, self.grid[y][x])

    def fill_body_inside_silhouette(self, outline: str, body: str, cx: int, cy: int) -> None:
        for y in range(self.h):
            for x in range(self.w):
                if self.grid[y][x] != outline:
                    self.grid[y][x] = body
        self.flood_fill(cx, cy, '.', body)

    def flood_fill(self, sx: int, sy: int, target: str, replacement: str) -> None:
        stack = [(sx, sy)]
        while stack:
            x, y = stack.pop()
            if 0 <= x < self.w and 0 <= y < self.h and self.grid[y][x] == target:
                self.grid[y][x] = replacement
                stack.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])


# ============= Feature Library =============

class FeatureLibrary:
    @staticmethod
    def paint_eyes(composer: LayerComposer, style: dict, eye_y: int, left_x: int, right_x: int) -> None:
        eye_type = style.get('eye', 'round')
        if eye_type == 'shut_line':
            FeatureLibrary._paint_shut_line(composer, eye_y, left_x, right_x, style)
        elif eye_type == 'shut_curve':
            FeatureLibrary._paint_shut_curve(composer, eye_y, left_x, right_x, style)
        elif eye_type == 'tiny':
            composer.fill_circle(left_x, eye_y, 1, 'K')
            composer.fill_circle(right_x, eye_y, 1, 'K')
        elif eye_type == 'round':
            composer.fill_circle(left_x, eye_y, 2, 'K')
            composer.fill_circle(right_x, eye_y, 2, 'K')
            composer.set(left_x - 1, eye_y - 1, 'Z')
            composer.set(right_x + 1, eye_y - 1, 'Z')
        elif eye_type == 'big':
            composer.fill_circle(left_x, eye_y, 3, 'K')
            composer.fill_circle(right_x, eye_y, 3, 'K')
            composer.set(left_x - 1, eye_y - 1, 'Z')
            composer.set(left_x - 2, eye_y - 2, 'Z')
            composer.set(right_x + 1, eye_y - 1, 'Z')
            composer.set(right_x + 2, eye_y - 2, 'Z')
        elif eye_type == 'heart':
            for dx, dy in [(-1, 0), (0, 0), (0, -1), (0, 1), (1, 0)]:
                composer.set(left_x + dx, eye_y + dy, 'P')
                composer.set(right_x + dx, eye_y + dy, 'P')
            composer.set(left_x, eye_y - 2, 'P')
            composer.set(right_x, eye_y - 2, 'P')
        elif eye_type == 'wink':
            composer.fill_circle(right_x, eye_y, 2, 'K')
            composer.set(right_x + 1, eye_y - 1, 'Z')
            for x in range(left_x - 2, left_x + 2):
                composer.set(x, eye_y, 'K')
        composer.force_symmetric()

    @staticmethod
    def _paint_shut_line(composer, eye_y, left_x, right_x, style):
        for x in range(left_x - 2, left_x + 2):
            composer.set(x, eye_y, 'K')
        for x in range(right_x - 1, right_x + 3):
            composer.set(x, eye_y, 'K')
        if style.get('sleepy_line_down'):
            for x in range(left_x - 2, left_x + 2):
                composer.set(x, eye_y + 1, 'K')
            for x in range(right_x - 1, right_x + 3):
                composer.set(x, eye_y + 1, 'K')

    @staticmethod
    def _paint_shut_curve(composer, eye_y, left_x, right_x, style):
        composer.set(left_x - 2, eye_y, 'K')
        composer.set(left_x - 1, eye_y - 1, 'K')
        composer.set(left_x, eye_y - 1, 'K')
        composer.set(left_x + 1, eye_y - 1, 'K')
        composer.set(left_x + 2, eye_y, 'K')
        composer.set(right_x - 2, eye_y, 'K')
        composer.set(right_x - 1, eye_y - 1, 'K')
        composer.set(right_x, eye_y - 1, 'K')
        composer.set(right_x + 1, eye_y - 1, 'K')
        composer.set(right_x + 2, eye_y, 'K')

    @staticmethod
    def paint_nose(composer: LayerComposer, cx: int, cy: int, color: str = 'K') -> None:
        composer.set(cx - 1, cy, color)
        composer.set(cx, cy, color)
        composer.set(cx + 1, cy, color)
        composer.set(cx - 1, cy + 1, color)
        composer.set(cx + 1, cy + 1, color)
        composer.force_symmetric()

    @staticmethod
    def paint_mouth(composer: LayerComposer, style: dict, cy: int, cx: int) -> None:
        mouth = style.get('mouth', 'smile')
        if mouth == 'smile':
            composer.set(cx - 2, cy, 'K')
            composer.set(cx - 1, cy + 1, 'K')
            composer.set(cx, cy + 1, 'K')
            composer.set(cx + 1, cy + 1, 'K')
            composer.set(cx + 2, cy, 'K')
        elif mouth == 'cat':
            composer.set(cx - 1, cy + 1, 'K')
            composer.set(cx, cy, 'K')
            composer.set(cx + 1, cy + 1, 'K')
        elif mouth == 'open':
            composer.set(cx - 1, cy, 'K')
            composer.set(cx, cy, 'K')
            composer.set(cx - 1, cy + 1, 'K')
            composer.set(cx, cy + 1, 'K')
            composer.set(cx - 1, cy + 2, 'K')
            composer.set(cx, cy + 2, 'K')
        elif mouth == 'tiny':
            composer.set(cx - 1, cy + 1, 'K')
            composer.set(cx, cy + 1, 'K')
            composer.set(cx + 1, cy + 1, 'K')
        composer.force_symmetric()

    @staticmethod
    def paint_whiskers(composer: LayerComposer, cy: int, left_x: int, right_x: int) -> None:
        for x in range(left_x - 5, left_x - 1):
            composer.set(x, cy, 'K')
        for x in range(right_x + 2, right_x + 6):
            composer.set(x, cy, 'K')
        composer.force_symmetric()

    @staticmethod
    def paint_blush(composer: LayerComposer, cy: int, left_x: int, right_x: int) -> None:
        for x in range(left_x - 1, left_x + 2):
            composer.set(x, cy, 'Q')
        for x in range(right_x - 1, right_x + 2):
            composer.set(x, cy, 'Q')
        composer.force_symmetric()


# ============= Refiner =============

def _neighbors_8(grid, x, y):
    h, w = len(grid), len(grid[0])
    res = []
    for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (1, -1), (-1, 1), (1, 1)]:
        nx, ny = x + dx, y + dy
        if 0 <= nx < w and 0 <= ny < h:
            res.append(grid[ny][nx])
    return res


def _refine(grid: List[List[str]], base_colors: List[str], seed: int = 0) -> List[List[str]]:
    rng = random.Random(seed)
    grid = deepcopy(grid)
    h, w = len(grid), len(grid[0])
    shadows = {b: 'S' for b in base_colors}
    highlights = {b: 'Z' for b in base_colors}
    texture_prob = 0.02

    for y in range(h):
        for x in range(w):
            ch = grid[y][x]
            if ch in shadows:
                below = grid[y + 1][x] if y + 1 < h else '.'
                right = grid[y][x + 1] if x + 1 < w else '.'
                is_outline = ch == 'K'
                if is_outline:
                    continue
                if below == '.' and not is_outline:
                    grid[y][x] = shadows[ch]
                elif right == '.' and below != '.':
                    grid[y][x] = shadows[ch]
                elif y > h // 2 and rng.random() < 0.25:
                    grid[y][x] = shadows[ch]
                elif y < h // 3 and x < w // 2 and rng.random() < 0.15:
                    grid[y][x] = highlights[ch]

    for y in range(h):
        for x in range(w):
            ch = grid[y][x]
            if ch in base_colors and rng.random() < texture_prob:
                same_ortho = sum(1 for dx, dy in [(-1,0),(1,0),(0,-1),(0,1)]
                                  if 0 <= x+dx < w and 0 <= y+dy < h and grid[y+dy][x+dx] == ch)
                if same_ortho >= 3:
                    grid[y][x] = highlights[ch] if rng.random() < 0.5 else shadows[ch]

    for y in range(h):
        for x in range(w):
            ch = grid[y][x]
            if ch == '.':
                continue
            same = any(grid[y+dy][x+dx] == ch for dx, dy in [(-1,0),(1,0),(0,-1),(0,1)]
                       if 0 <= x+dx < w and 0 <= y+dy < h)
            if not same:
                counts = {}
                for n in _neighbors_8(grid, x, y):
                    if n != '.' and n != ch:
                        counts[n] = counts.get(n, 0) + 1
                if counts:
                    grid[y][x] = max(counts.items(), key=lambda kv: kv[1])[0]
    return grid


# ============= Craftability & Quality =============

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
            elif feat == 'beak':
                mid = self.w // 2
                has_beak = self.grid[self.h // 2 + 2][mid] != '.' and self.grid[self.h // 2 + 3][mid] != '.'
                if has_beak:
                    feature_score += 8
            elif feat == 'shell':
                has_shell = self.grid[self.h // 2][self.w // 2] != '.'
                if has_shell:
                    feature_score += 8
            elif feat == 'mane':
                has_mane = self.grid[2][self.w // 2] != '.' and self.grid[self.h - 3][self.w // 2] != '.'
                if has_mane:
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


# ============= Composers =============

def _mirror_left_half(comp: LayerComposer, comp_left: LayerComposer) -> None:
    for y in range(comp.h):
        for x in range(comp.w // 2):
            comp.grid[y][x] = comp_left.grid[y][x]
            comp.grid[y][comp.w - 1 - x] = comp_left.grid[y][x]


def compose_cat(style: dict) -> List[List[str]]:
    canvas = Canvas(32, 32)
    comp = LayerComposer(canvas.create())
    comp_left = LayerComposer(canvas.create())
    outline, body, shadow = 'K', 'W', 'S'
    comp_left.fill_ellipse(8, 13, 4, 5, body)
    comp_left.fill_ellipse(15, 17, 9, 8, body)
    comp_left.fill_ellipse(5, 4, 3, 4, body)
    comp_left.fill_ellipse(5, 4, 2, 3, 'P')
    comp_left.fill_ellipse(9, 6, 3, 4, body)
    comp_left.fill_ellipse(9, 6, 2, 3, 'P')
    comp_left.fill_ellipse(8, 13, 5, 6, outline, border_only=True)
    comp_left.fill_ellipse(15, 17, 10, 9, outline, border_only=True)
    comp_left.fill_ellipse(5, 4, 4, 5, outline, border_only=True)
    comp_left.fill_ellipse(9, 6, 4, 5, outline, border_only=True)
    _mirror_left_half(comp, comp_left)
    for y in range(20, 24):
        for x in range(7, 25):
            if comp.grid[y][x] == body:
                comp.set(x, y, shadow)
    for x in [12, 13, 18, 19]:
        for y in [23, 24]:
            if comp.grid[y][x] in (body, shadow):
                comp.set(x, y, 'P')
    comp.force_symmetric()
    FeatureLibrary.paint_eyes(comp, style, 14, 11, 20)
    FeatureLibrary.paint_nose(comp, 18, 15)
    FeatureLibrary.paint_mouth(comp, style, 20, 16)
    if style.get('whiskers', True):
        FeatureLibrary.paint_whiskers(comp, 18, 11, 20)
    if style.get('blush', False):
        FeatureLibrary.paint_blush(comp, 16, 11, 20)
    return _refine(comp.grid, [body], seed=hash('cat') % 9999)


def compose_panda(style: dict) -> List[List[str]]:
    canvas = Canvas(32, 40)
    comp = LayerComposer(canvas.create())
    comp_left = LayerComposer(canvas.create())
    outline, body, patch, inner = 'K', 'W', 'G', 'C'
    comp_left.fill_ellipse(8, 14, 6, 6, body)
    comp_left.fill_ellipse(15, 23, 8, 9, body)
    comp_left.fill_ellipse(4, 5, 3, 3, body)
    comp_left.fill_ellipse(4, 5, 1, 1, inner)
    comp_left.fill_ellipse(6, 22, 2, 4, body)
    comp_left.fill_ellipse(12, 33, 2, 3, body)
    comp_left.fill_ellipse(8, 14, 7, 7, outline, border_only=True)
    comp_left.fill_ellipse(15, 23, 9, 10, outline, border_only=True)
    comp_left.fill_ellipse(4, 5, 4, 4, outline, border_only=True)
    comp_left.fill_ellipse(6, 22, 3, 5, outline, border_only=True)
    comp_left.fill_ellipse(12, 33, 3, 4, outline, border_only=True)
    _mirror_left_half(comp, comp_left)
    comp.fill_body_inside_silhouette(outline, body, 8, 14)
    comp.fill_ellipse(11, 14, 3, 4, patch)
    comp.fill_ellipse(20, 14, 3, 4, patch)
    FeatureLibrary.paint_eyes(comp, style, 14, 11, 20)
    FeatureLibrary.paint_nose(comp, 18, 15)
    FeatureLibrary.paint_mouth(comp, style, 20, 16)
    for y in range(26, 30):
        for x in range(10, 22):
            if comp.grid[y][x] == body:
                comp.set(x, y, 'S')
    comp.force_symmetric()
    return _refine(comp.grid, [body, patch, inner], seed=hash('panda') % 9999)


def compose_dog(style: dict) -> List[List[str]]:
    canvas = Canvas(32, 32)
    comp = LayerComposer(canvas.create())
    comp_left = LayerComposer(canvas.create())
    outline, body, shadow, collar = 'K', 'W', 'S', 'O'
    comp_left.fill_ellipse(15, 17, 8, 7, body)
    comp_left.fill_ellipse(6, 16, 2, 6, body)
    comp_left.fill_ellipse(15, 17, 9, 8, outline, border_only=True)
    comp_left.fill_ellipse(6, 16, 3, 7, outline, border_only=True)
    _mirror_left_half(comp, comp_left)
    for y in range(21, 24):
        for x in range(7, 25):
            if comp.grid[y][x] == body:
                comp.set(x, y, shadow)
    comp.force_symmetric()
    FeatureLibrary.paint_eyes(comp, style, 14, 12, 19)
    FeatureLibrary.paint_nose(comp, 18, 15, 'P')
    FeatureLibrary.paint_mouth(comp, style, 19, 16)
    for x in range(11, 21):
        if comp.grid[24][x] in (body, shadow):
            comp.set(x, 24, collar)
    return _refine(comp.grid, [body], seed=hash('dog') % 9999)


def compose_fox(style: dict) -> List[List[str]]:
    canvas = Canvas(32, 32)
    comp = LayerComposer(canvas.create())
    comp_left = LayerComposer(canvas.create())
    outline, body, snout = 'K', 'O', 'W'
    comp_left.fill_ellipse(15, 17, 8, 7, body)
    comp_left.fill_ellipse(7, 10, 2, 5, body)
    comp_left.fill_ellipse(15, 17, 9, 8, outline, border_only=True)
    comp_left.fill_ellipse(7, 10, 3, 6, outline, border_only=True)
    _mirror_left_half(comp, comp_left)
    comp.fill_ellipse(15, 21, 5, 3, snout)
    comp.fill_ellipse(15, 25, 4, 2, snout)
    comp.force_symmetric()
    FeatureLibrary.paint_eyes(comp, style, 14, 12, 19)
    FeatureLibrary.paint_nose(comp, 17, 15, 'K')
    FeatureLibrary.paint_mouth(comp, style, 18, 16)
    return _refine(comp.grid, [body, snout], seed=hash('fox') % 9999)


def compose_rabbit(style: dict) -> List[List[str]]:
    canvas = Canvas(32, 40)
    comp = LayerComposer(canvas.create())
    comp_left = LayerComposer(canvas.create())
    outline, body, inner, accent = 'K', 'W', 'P', 'Q'
    comp_left.fill_ellipse(15, 25, 8, 7, outline)
    comp_left.fill_ellipse(10, 8, 3, 10, outline)
    _mirror_left_half(comp, comp_left)
    comp.fill_body_inside_silhouette(outline, body, 15, 25)
    comp.fill_ellipse(10, 8, 1, 7, inner)
    comp.fill_ellipse(21, 8, 1, 7, inner)
    for y in range(4, 12):
        for x in range(8, 11):
            if comp.grid[y][x] == inner:
                comp.set(x, y, accent)
    for y in range(4, 12):
        for x in range(21, 24):
            if comp.grid[y][x] == inner:
                comp.set(x, y, accent)
    comp.force_symmetric()
    FeatureLibrary.paint_eyes(comp, style, 22, 12, 19)
    FeatureLibrary.paint_nose(comp, 25, 15, 'P')
    FeatureLibrary.paint_mouth(comp, style, 26, 16)
    if style.get('mouth') == 'small_smile':
        comp.set(15, 27, 'W')
        comp.set(16, 27, 'W')
    return _refine(comp.grid, [body, inner, accent], seed=hash('rabbit') % 9999)


def compose_bear(style: dict) -> List[List[str]]:
    canvas = Canvas(32, 32)
    comp_left = LayerComposer(canvas.create())
    outline, body, snout, inner = 'K', 'R', 'T', 'C'
    comp_left.fill_ellipse(15, 17, 12, 11, outline)
    comp_left.fill_ellipse(5, 4, 5, 5, outline)
    comp_left.fill_ellipse(5, 4, 2, 2, inner)
    comp_left.fill_body_inside_silhouette(outline, body, 10, 17)
    comp = LayerComposer(canvas.create())
    _mirror_left_half(comp, comp_left)
    comp.fill_ellipse(15, 21, 6, 4, snout)
    comp.fill_ellipse(15, 20, 3, 2, 'K')
    FeatureLibrary.paint_eyes(comp, style, 14, 10, 21)
    FeatureLibrary.paint_mouth(comp, style, 22, 16)
    comp.set(14, 23, 'K')
    comp.set(16, 23, 'K')
    comp.force_symmetric()
    return _refine(comp.grid, [body, snout], seed=hash('bear') % 9999)


def compose_penguin(style: dict) -> List[List[str]]:
    canvas = Canvas(32, 40)
    comp = LayerComposer(canvas.create())
    comp_left = LayerComposer(canvas.create())
    outline, body, belly, beak, feet = 'K', 'K', 'W', 'Y', 'O'
    comp_left.fill_ellipse(15, 19, 10, 13, outline, border_only=True)
    comp_left.fill_ellipse(15, 19, 6, 10, belly)
    comp_left.fill_ellipse(15, 33, 7, 3, outline, border_only=True)
    comp_left.fill_ellipse(9, 8, 3, 4, outline, border_only=True)
    comp_left.fill_ellipse(5, 20, 2, 6, body)
    _mirror_left_half(comp, comp_left)
    comp.force_symmetric()
    for y in range(26, 30):
        for x in range(10, 22):
            if comp.grid[y][x] == belly:
                comp.set(x, y, 'Z')
    for x in [15, 16]:
        for y in [16, 17]:
            comp.set(x, y, beak)
    for y in [37, 38]:
        for x in [11, 12]:
            comp.set(x, y, feet)
    comp.force_symmetric()
    FeatureLibrary.paint_eyes(comp, style, 13, 12, 18)
    return _refine(comp.grid, [body, belly], seed=hash('penguin') % 9999)


def compose_owl(style: dict) -> List[List[str]]:
    canvas = Canvas(32, 32)
    comp = LayerComposer(canvas.create())
    comp_left = LayerComposer(canvas.create())
    outline, body, belly = 'K', 'R', 'T'
    comp_left.fill_ellipse(15, 18, 10, 9, outline)
    comp_left.fill_ellipse(7, 8, 3, 5, outline)
    _mirror_left_half(comp, comp_left)
    comp.fill_body_inside_silhouette(outline, body, 15, 18)
    comp.fill_ellipse(15, 22, 6, 4, belly)
    comp.fill_circle(11, 15, 3, 'W')
    comp.fill_circle(20, 15, 3, 'W')
    FeatureLibrary.paint_eyes(comp, style, 15, 11, 20)
    comp.set(15, 18, 'O')
    comp.set(16, 18, 'O')
    comp.set(15, 19, 'O')
    comp.set(16, 19, 'O')
    for y in range(16, 24):
        comp.set(5, y, outline)
        comp.set(26, y, outline)
    comp.force_symmetric()
    return _refine(comp.grid, [body, belly], seed=hash('owl') % 9999)


def compose_frog(style: dict) -> List[List[str]]:
    canvas = Canvas(32, 32)
    comp = LayerComposer(canvas.create())
    comp_left = LayerComposer(canvas.create())
    outline, body, belly = 'K', 'N', 'L'
    comp_left.fill_ellipse(15, 19, 13, 9, outline)
    comp_left.fill_ellipse(9, 10, 5, 6, outline)
    _mirror_left_half(comp, comp_left)
    comp.fill_body_inside_silhouette(outline, body, 15, 19)
    comp.fill_circle(9, 10, 2, 'W')
    comp.fill_circle(21, 10, 2, 'W')
    comp.fill_ellipse(15, 22, 6, 4, belly)
    for x in range(10, 22):
        for y in range(25, 29):
            if comp.grid[y][x] == body:
                comp.set(x, y, 'V')
    comp.force_symmetric()
    FeatureLibrary.paint_eyes(comp, style, 14, 10, 18)
    FeatureLibrary.paint_nose(comp, 17, 17, 'K')
    FeatureLibrary.paint_mouth(comp, style, 18, 18)
    return _refine(comp.grid, [body, belly], seed=hash('frog') % 9999)


def compose_turtle(style: dict) -> List[List[str]]:
    canvas = Canvas(32, 32)
    comp = LayerComposer(canvas.create())
    comp_left = LayerComposer(canvas.create())
    outline, body, shell = 'K', 'V', 'N'
    comp_left.fill_ellipse(15, 22, 10, 8, outline)
    comp_left.fill_ellipse(15, 11, 7, 6, outline)
    comp_left.fill_ellipse(15, 22, 9, 7, shell, border_only=True)
    _mirror_left_half(comp, comp_left)
    comp.fill_body_inside_silhouette(outline, body, 15, 22)
    comp.fill_ellipse(15, 11, 6, 5, body)
    comp.fill_ellipse(15, 11, 4, 3, 'W')
    comp.fill_ellipse(15, 22, 7, 5, 'N')
    for x in range(9, 23):
        comp.set(x, 15, 'N')
    for x in range(9, 23):
        comp.set(x, 29, 'V')
    comp.force_symmetric()
    FeatureLibrary.paint_eyes(comp, style, 13, 11, 19)
    FeatureLibrary.paint_nose(comp, 16, 15, 'K')
    FeatureLibrary.paint_mouth(comp, style, 17, 16)
    return _refine(comp.grid, [body, shell], seed=hash('turtle') % 9999)


def compose_koala(style: dict) -> List[List[str]]:
    canvas = Canvas(32, 32)
    comp = LayerComposer(canvas.create())
    comp_left = LayerComposer(canvas.create())
    outline, body, inner = 'K', 'G', 'C'
    comp_left.fill_ellipse(15, 17, 9, 8, body)
    comp_left.fill_ellipse(7, 8, 4, 5, body)
    comp_left.fill_ellipse(15, 17, 10, 9, outline, border_only=True)
    comp_left.fill_ellipse(7, 8, 5, 6, outline, border_only=True)
    _mirror_left_half(comp, comp_left)
    comp.fill_ellipse(7, 8, 2, 3, inner)
    comp.fill_ellipse(23, 8, 2, 3, inner)
    comp.fill_ellipse(15, 22, 5, 4, inner)
    comp.force_symmetric()
    FeatureLibrary.paint_eyes(comp, style, 14, 11, 19)
    FeatureLibrary.paint_nose(comp, 18, 16, 'K')
    FeatureLibrary.paint_mouth(comp, style, 19, 17)
    return _refine(comp.grid, [body, inner], seed=hash('koala') % 9999)


def compose_lion(style: dict) -> List[List[str]]:
    canvas = Canvas(32, 32)
    comp = LayerComposer(canvas.create())
    comp_left = LayerComposer(canvas.create())
    outline, body, mane, snout = 'K', 'Y', 'O', 'W'
    comp_left.fill_ellipse(15, 17, 11, 10, mane)
    comp_left.fill_ellipse(15, 17, 8, 7, outline, border_only=True)
    comp_left.fill_ellipse(7, 8, 3, 5, mane)
    _mirror_left_half(comp, comp_left)
    comp.fill_ellipse(15, 17, 7, 6, body)
    comp.fill_ellipse(15, 22, 5, 3, snout)
    comp.fill_ellipse(15, 20, 3, 2, 'K')
    comp.force_symmetric()
    FeatureLibrary.paint_eyes(comp, style, 14, 12, 19)
    FeatureLibrary.paint_nose(comp, 18, 17, 'K')
    FeatureLibrary.paint_mouth(comp, style, 19, 18)
    return _refine(comp.grid, [body, mane, snout], seed=hash('lion') % 9999)


COMPOSERS = {
    'cat': compose_cat,
    'panda': compose_panda,
    'dog': compose_dog,
    'fox': compose_fox,
    'rabbit': compose_rabbit,
    'bear': compose_bear,
    'penguin': compose_penguin,
    'owl': compose_owl,
    'frog': compose_frog,
    'turtle': compose_turtle,
    'koala': compose_koala,
    'lion': compose_lion,
}


# ============= Rendering =============

def render_grid(grid: List[List[str]], finished: bool = False, size: int = 1024, output_path: Optional[Path] = None) -> Image.Image:
    rows = len(grid)
    cols = len(grid[0])
    cell = size // max(rows, cols)
    offset_x = (size - cols * cell) // 2
    offset_y = (size - rows * cell) // 2

    bg = (40, 40, 50, 255) if finished else (248, 249, 250, 255)
    img = Image.new('RGBA', (size, size), bg)
    draw = ImageDraw.Draw(img)

    for y, row in enumerate(grid):
        for x, ch in enumerate(row):
            if ch == '.':
                continue
            color = COLORS[ch]
            px = offset_x + x * cell
            py = offset_y + y * cell

            if finished:
                draw.rounded_rectangle([px + 1, py + 1, px + cell - 2, py + cell - 2], radius=cell // 4, fill=color)
                highlight = tuple(min(255, c + 50) for c in color[:3]) + (255,)
                draw.rounded_rectangle([px + 4, py + 4, px + cell // 2 - 1, py + cell // 2 - 1], radius=cell // 6, fill=highlight)
                shadow = tuple(max(0, c - 50) for c in color[:3]) + (255,)
                draw.arc([px + cell - 8, py + cell - 8, px + cell - 2, py + cell - 2], 0, 90, fill=shadow, width=2)
            else:
                draw.rounded_rectangle([px + 1, py + 1, px + cell - 2, py + cell - 2], radius=cell // 6, fill=color)
                outline = tuple(max(0, c - 30) for c in color[:3]) + (255,)
                draw.rounded_rectangle([px + 1, py + 1, px + cell - 2, py + cell - 2], radius=cell // 6, outline=outline, width=1)

    if not finished:
        line_color = (220, 220, 220, 255)
        for i in range(cols + 1):
            x = offset_x + i * cell
            draw.line([(x, offset_y), (x, offset_y + rows * cell)], fill=line_color, width=1)
        for i in range(rows + 1):
            y = offset_y + i * cell
            draw.line([(offset_x, y), (offset_x + cols * cell, y)], fill=line_color, width=1)

    if output_path:
        img.save(output_path, 'PNG')
    return img


def to_hex_grid(grid: List[List[str]]) -> List[List[Optional[str]]]:
    return [[HEX_MAP[ch] for ch in row] for row in grid]


def to_color_palette(grid: List[List[str]]) -> List[dict]:
    counts: Dict[str, int] = {}
    for row in grid:
        for ch in row:
            if ch and ch in HEX_MAP and ch != '.':
                counts[ch] = counts.get(ch, 0) + 1
    items = []
    for ch in HEX_MAP:
        if ch != '.' and ch in counts:
            items.append({'name': ch, 'hex': HEX_MAP[ch], 'count': counts[ch]})
    return items


def slugify(title: str) -> str:
    return title.lower().replace(' ', '-')


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
                grid = COMPOSERS[subject](style)
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
    if low:
        print(f'Low (<80): {low}')
    else:
        print('Low (<80): []')
