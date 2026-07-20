"""Stable v1.1 composer and feature library. Do not modify."""

from __future__ import annotations

from copy import deepcopy
import random
from typing import List, Tuple


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


def _mirror_left_half(comp: LayerComposer, comp_left: LayerComposer) -> None:
    for y in range(comp.h):
        for x in range(comp.w // 2):
            comp.grid[y][x] = comp_left.grid[y][x]
            comp.grid[y][comp.w - 1 - x] = comp_left.grid[y][x]


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
                for nx, ny in [(-1,0),(1,0),(0,-1),(0,1),(-1,-1),(1,-1),(-1,1),(1,1)]:
                    xx, yy = x+nx, y+ny
                    if 0 <= xx < w and 0 <= yy < h:
                        n = grid[yy][xx]
                        if n != '.' and n != ch:
                            counts[n] = counts.get(n, 0) + 1
                if counts:
                    grid[y][x] = max(counts.items(), key=lambda kv: kv[1])[0]
    return grid


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
