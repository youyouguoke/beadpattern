#!/usr/bin/env python3
"""Pixel Character Composer v2.0

Goal: upgrade from shape generator to character designer.
Strategy: keep v1.1's strong animal-specific silhouettes but parameterize them
with a CharacterSkeleton, then add FeatureMorphing (eye/ear/mouth/pose variants)
and ColorBlocking (muzzle, belly, inner ear, panda patches).

Backwards compatible: same grid format as v1.1.
"""

from __future__ import annotations

import json
import random
from collections import Counter
from copy import deepcopy
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from composer import (
    HEX_MAP,
    QualityValidator,
    render_grid as v1_render_grid,
    to_color_palette as v1_to_color_palette,
    to_hex_grid as v1_to_hex_grid,
)

OUT_DIR = Path('/tmp/bead-character-v2')
OUT_DIR.mkdir(parents=True, exist_ok=True)


# ============= Layer Composer =============

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
                    if 0.85 <= val <= 1.15:
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

    def force_symmetric(self, axis: Optional[int] = None) -> None:
        mid = axis if axis is not None else self.w // 2
        for y in range(self.h):
            for x in range(mid):
                self.set(self.w - 1 - x, y, self.grid[y][x])

    def mirror_left(self, src: 'LayerComposer') -> None:
        for y in range(self.h):
            for x in range(self.w // 2 + 1):
                self.set(x, y, src.grid[y][x])
                self.set(self.w - 1 - x, y, src.grid[y][x])

    def flood_fill(self, sx: int, sy: int, target: str, replacement: str) -> None:
        stack = [(sx, sy)]
        while stack:
            x, y = stack.pop()
            if 0 <= x < self.w and 0 <= y < self.h and self.grid[y][x] == target:
                self.grid[y][x] = replacement
                stack.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])

    def replace(self, old: str, new: str) -> None:
        for y in range(self.h):
            for x in range(self.w):
                if self.grid[y][x] == old:
                    self.grid[y][x] = new

    def clone(self) -> 'LayerComposer':
        return LayerComposer(deepcopy(self.grid))


def make_canvas(width: int, height: int) -> LayerComposer:
    return LayerComposer([['.' for _ in range(width)] for _ in range(height)])


# ============= Character Skeleton =============

class CharacterSkeleton:
    def __init__(
        self,
        animal: str,
        head_ratio: float = 0.55,
        body_ratio: float = 0.45,
        pose: str = 'sitting',
        ear_type: str = 'round',
        ear_size: float = 0.32,
        eye_distance: float = 0.28,
        nose_y: float = 0.58,
        body_shape: str = 'oval',
        accessories: Optional[List[str]] = None,
        seed: int = 0,
    ):
        self.animal = animal
        self.head_ratio = head_ratio
        self.body_ratio = body_ratio
        self.pose = pose
        self.ear_type = ear_type
        self.ear_size = ear_size
        self.eye_distance = eye_distance
        self.nose_y = nose_y
        self.body_shape = body_shape
        self.accessories = accessories or []
        self.rng = random.Random(seed)

    @classmethod
    def for_animal(cls, animal: str, pose: str = 'sitting', seed: int = 0) -> 'CharacterSkeleton':
        defaults = {
            'cat': {'head_ratio': 0.50, 'body_ratio': 0.50, 'ear_type': 'pointy', 'ear_size': 0.38},
            'panda': {'head_ratio': 0.52, 'body_ratio': 0.48, 'ear_type': 'round', 'ear_size': 0.34},
            'dog': {'head_ratio': 0.50, 'body_ratio': 0.50, 'ear_type': 'floppy', 'ear_size': 0.40},
            'fox': {'head_ratio': 0.52, 'body_ratio': 0.48, 'ear_type': 'pointy', 'ear_size': 0.45},
            'rabbit': {'head_ratio': 0.45, 'body_ratio': 0.55, 'ear_type': 'floppy', 'ear_size': 0.50},
            'bear': {'head_ratio': 0.55, 'body_ratio': 0.45, 'ear_type': 'round', 'ear_size': 0.36},
            'penguin': {'head_ratio': 0.45, 'body_ratio': 0.55, 'ear_type': 'none', 'ear_size': 0.0},
            'owl': {'head_ratio': 0.55, 'body_ratio': 0.45, 'ear_type': 'tufted', 'ear_size': 0.25},
            'frog': {'head_ratio': 0.50, 'body_ratio': 0.50, 'ear_type': 'none', 'ear_size': 0.0},
            'turtle': {'head_ratio': 0.42, 'body_ratio': 0.58, 'ear_type': 'none', 'ear_size': 0.0},
            'koala': {'head_ratio': 0.55, 'body_ratio': 0.45, 'ear_type': 'round', 'ear_size': 0.42},
            'lion': {'head_ratio': 0.55, 'body_ratio': 0.45, 'ear_type': 'round', 'ear_size': 0.40},
        }
        d = defaults.get(animal, {})
        return cls(
            animal=animal,
            head_ratio=d.get('head_ratio', 0.55),
            body_ratio=d.get('body_ratio', 0.45),
            pose=pose,
            ear_type=d.get('ear_type', 'round'),
            ear_size=d.get('ear_size', 0.35),
            seed=seed,
        )


# ============= Feature Morphing =============

class FeatureMorphing:
    @staticmethod
    def paint_eyes(comp: LayerComposer, head_cy: int, head_rx: int, style: dict, eye_distance: float) -> None:
        eye_y = head_cy - 1
        left_cx = comp.w // 2 - int(head_rx * eye_distance)
        right_cx = comp.w // 2 + int(head_rx * eye_distance)
        eye_type = style.get('eye', 'round')

        if eye_type == 'dot':
            comp.set(left_cx, eye_y, 'K')
            comp.set(right_cx, eye_y, 'K')
        elif eye_type == 'round':
            comp.fill_circle(left_cx, eye_y, 2, 'K')
            comp.fill_circle(right_cx, eye_y, 2, 'K')
            comp.set(left_cx - 1, eye_y - 1, 'Z')
            comp.set(right_cx + 1, eye_y - 1, 'Z')
        elif eye_type == 'big':
            comp.fill_circle(left_cx, eye_y, 3, 'K')
            comp.fill_circle(right_cx, eye_y, 3, 'K')
            comp.set(left_cx - 2, eye_y - 2, 'Z')
            comp.set(left_cx - 1, eye_y - 1, 'Z')
            comp.set(right_cx + 2, eye_y - 2, 'Z')
            comp.set(right_cx + 1, eye_y - 1, 'Z')
        elif eye_type == 'sleepy_line':
            for x in range(left_cx - 2, left_cx + 2):
                comp.set(x, eye_y, 'K')
            for x in range(right_cx - 1, right_cx + 3):
                comp.set(x, eye_y, 'K')
        elif eye_type == 'sleepy_curve':
            comp.set(left_cx - 2, eye_y, 'K')
            comp.set(left_cx - 1, eye_y - 1, 'K')
            comp.set(left_cx, eye_y - 1, 'K')
            comp.set(left_cx + 1, eye_y - 1, 'K')
            comp.set(left_cx + 2, eye_y, 'K')
            comp.set(right_cx - 2, eye_y, 'K')
            comp.set(right_cx - 1, eye_y - 1, 'K')
            comp.set(right_cx, eye_y - 1, 'K')
            comp.set(right_cx + 1, eye_y - 1, 'K')
            comp.set(right_cx + 2, eye_y, 'K')
        elif eye_type == 'wink':
            comp.fill_circle(right_cx, eye_y, 2, 'K')
            comp.set(right_cx + 1, eye_y - 1, 'Z')
            for x in range(left_cx - 2, left_cx + 2):
                comp.set(x, eye_y, 'K')
        elif eye_type == 'heart':
            for dx, dy in [(-1, 0), (0, 0), (0, -1), (0, 1), (1, 0)]:
                comp.set(left_cx + dx, eye_y + dy, 'P')
                comp.set(right_cx + dx, eye_y + dy, 'P')
            comp.set(left_cx, eye_y - 2, 'P')
            comp.set(right_cx, eye_y - 2, 'P')
        elif eye_type == 'sparkle':
            for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                comp.set(left_cx + dx, eye_y + dy, 'B')
                comp.set(right_cx + dx, eye_y + dy, 'B')
            comp.set(left_cx, eye_y, 'W')
            comp.set(right_cx, eye_y, 'W')
        comp.force_symmetric()

    @staticmethod
    def paint_nose(comp: LayerComposer, head_cy: int, nose_y: float, head_rx: int, color: str = 'K') -> None:
        cy = head_cy + int(head_rx * (nose_y - 0.5))
        cx = comp.w // 2
        comp.set(cx - 1, cy, color)
        comp.set(cx, cy, color)
        comp.set(cx + 1, cy, color)
        comp.set(cx - 1, cy + 1, color)
        comp.set(cx + 1, cy + 1, color)
        comp.force_symmetric()

    @staticmethod
    def paint_mouth(comp: LayerComposer, head_cy: int, nose_y: float, head_rx: int, style: dict) -> None:
        cy = head_cy + int(head_rx * (nose_y - 0.45))
        cx = comp.w // 2
        mouth = style.get('mouth', 'smile')
        if mouth == 'smile':
            comp.set(cx - 2, cy, 'K')
            comp.set(cx - 1, cy + 1, 'K')
            comp.set(cx, cy + 1, 'K')
            comp.set(cx + 1, cy + 1, 'K')
            comp.set(cx + 2, cy, 'K')
        elif mouth == 'cat':
            comp.set(cx - 1, cy + 1, 'K')
            comp.set(cx, cy, 'K')
            comp.set(cx + 1, cy + 1, 'K')
        elif mouth == 'open':
            comp.set(cx - 1, cy, 'K')
            comp.set(cx, cy, 'K')
            comp.set(cx - 1, cy + 1, 'K')
            comp.set(cx, cy + 1, 'K')
            comp.set(cx - 1, cy + 2, 'K')
            comp.set(cx, cy + 2, 'K')
        elif mouth == 'tiny':
            comp.set(cx - 1, cy + 1, 'K')
            comp.set(cx, cy + 1, 'K')
            comp.set(cx + 1, cy + 1, 'K')
        elif mouth == 'tongue':
            comp.set(cx - 1, cy, 'K')
            comp.set(cx, cy, 'K')
            comp.set(cx - 1, cy + 1, 'P')
            comp.set(cx, cy + 1, 'P')
            comp.set(cx - 1, cy + 2, 'P')
            comp.set(cx, cy + 2, 'P')
        elif mouth == 'laugh':
            comp.set(cx - 2, cy, 'K')
            comp.set(cx - 1, cy, 'K')
            comp.set(cx, cy, 'K')
            comp.set(cx + 1, cy, 'K')
            comp.set(cx + 2, cy, 'K')
            comp.set(cx - 1, cy + 1, 'W')
            comp.set(cx, cy + 1, 'W')
            comp.set(cx + 1, cy + 1, 'W')
        comp.force_symmetric()

    @staticmethod
    def paint_blush(comp: LayerComposer, head_cy: int, head_rx: int) -> None:
        left_cx = comp.w // 2 - int(head_rx * 0.5)
        right_cx = comp.w // 2 + int(head_rx * 0.5)
        cy = head_cy + 2
        for x in range(left_cx - 1, left_cx + 2):
            comp.set(x, cy, 'Q')
        for x in range(right_cx - 1, right_cx + 2):
            comp.set(x, cy, 'Q')
        comp.force_symmetric()

    @staticmethod
    def paint_whiskers(comp: LayerComposer, head_cy: int, head_rx: int) -> None:
        left_cx = comp.w // 2 - int(head_rx * 0.55)
        right_cx = comp.w // 2 + int(head_rx * 0.55)
        cy = head_cy + 2
        for x in range(left_cx - 4, left_cx - 1):
            comp.set(x, cy, 'K')
        for x in range(right_cx + 2, right_cx + 5):
            comp.set(x, cy, 'K')
        comp.force_symmetric()

    @staticmethod
    def paint_arms(comp: LayerComposer, body_cy: int, pose: str, base: str = 'W') -> None:
        if pose not in ('waving', 'hugging', 'eating'):
            return
        cx = comp.w // 2
        arm_y = body_cy - 2
        if pose == 'waving':
            # Right arm raised higher, more visible
            comp.set(cx + 1, arm_y - 1, base)
            comp.set(cx + 2, arm_y - 2, base)
            comp.set(cx + 3, arm_y - 3, base)
            comp.set(cx + 4, arm_y - 4, base)
            comp.set(cx + 3, arm_y - 5, 'K')
            comp.set(cx + 2, arm_y, base)
            comp.set(cx - 2, arm_y, base)
            comp.set(cx - 3, arm_y - 1, base)
        elif pose == 'hugging':
            comp.set(cx - 2, arm_y, base)
            comp.set(cx - 1, arm_y - 1, base)
            comp.set(cx, arm_y - 2, base)
            comp.set(cx + 1, arm_y - 1, base)
            comp.set(cx + 2, arm_y, base)
        elif pose == 'eating':
            comp.set(cx - 1, arm_y - 3, base)
            comp.set(cx, arm_y - 4, base)
            comp.set(cx + 1, arm_y - 3, base)
            comp.set(cx, arm_y - 5, 'N')
            comp.set(cx - 1, arm_y - 6, 'N')
        comp.force_symmetric()


# ============= Color Blocking =============

class ColorBlocking:
    def __init__(self, comp: LayerComposer, skeleton: CharacterSkeleton, base_color: str):
        self.comp = comp
        self.s = skeleton
        self.base = base_color

    def apply(self, head_cy: int, head_rx: int, head_ry: int, body_cy: int, body_rx: int, body_ry: int) -> None:
        cx = self.comp.w // 2

        # Muzzle / snout (lighter patch on lower face)
        if self.s.animal in ('dog', 'fox', 'bear', 'rabbit', 'cat'):
            self.comp.fill_ellipse(cx, head_cy + int(head_ry * 0.45), max(2, int(head_rx * 0.5)), max(2, int(head_ry * 0.35)), 'W')

        # Belly (lighter patch on body)
        if self.s.animal in ('panda', 'penguin', 'bear', 'rabbit'):
            self.comp.fill_ellipse(cx, body_cy, max(2, int(body_rx * 0.55)), max(2, int(body_ry * 0.65)), 'W')

        # Panda eye patches
        if self.s.animal == 'panda':
            patch_y = head_cy - int(head_ry * 0.1)
            left_eye = cx - int(head_rx * 0.4)
            right_eye = cx + int(head_rx * 0.4)
            self.comp.fill_ellipse(left_eye, patch_y, max(2, int(head_rx * 0.25)), max(2, int(head_ry * 0.22)), 'G')
            self.comp.fill_ellipse(right_eye, patch_y, max(2, int(head_rx * 0.25)), max(2, int(head_ry * 0.22)), 'G')

        # Inner ears (pink)
        if self.s.animal in ('cat', 'dog', 'rabbit', 'bear', 'fox'):
            left_ear_cx = cx - int(head_rx * 0.55)
            right_ear_cx = cx + int(head_rx * 0.55)
            ear_cy = head_cy - int(head_ry * 0.75)
            self.comp.fill_ellipse(left_ear_cx, ear_cy, max(1, int(head_rx * 0.12)), max(1, int(head_ry * 0.12)), 'Q')
            self.comp.fill_ellipse(right_ear_cx, ear_cy, max(1, int(head_rx * 0.12)), max(1, int(head_ry * 0.12)), 'Q')


# ============= Shading =============

def add_shading(comp: LayerComposer, base_color: str, shadow: str = 'S', highlight: str = 'Z') -> None:
    h, w = comp.h, comp.w
    for y in range(h):
        for x in range(w):
            ch = comp.get(x, y)
            if ch != base_color:
                continue
            below = comp.get(x, y + 1) if y + 1 < h else '.'
            right = comp.get(x + 1, y) if x + 1 < w else '.'
            above = comp.get(x, y - 1) if y > 0 else '.'
            left = comp.get(x - 1, y) if x > 0 else '.'
            if below in ('.', 'K') or right in ('.', 'K'):
                comp.set(x, y, shadow)
            elif above in ('.', 'K') or left in ('.', 'K'):
                comp.set(x, y, highlight)


# ============= Animal-Specific Silhouettes (v1.1 enhanced) =============

def _mirror_left_half(comp: LayerComposer, comp_left: LayerComposer) -> None:
    for y in range(comp.h):
        for x in range(comp.w):
            comp.grid[y][x] = comp_left.grid[y][min(x, comp.w - 1 - x)]


def _outline_base(comp: LayerComposer, base: str, outline: str = 'K', thickness: int = 1) -> None:
    """Outline every contiguous region of base color. Only true outermost layer becomes outline."""
    h, w = comp.h, comp.w
    new_grid = deepcopy(comp.grid)
    for y in range(h):
        for x in range(w):
            if comp.get(x, y) != base:
                continue
            # A cell is on the boundary if at least one orthogonal neighbor is empty
            is_boundary = any(
                comp.get(x + dx, y + dy) == '.'
                for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]
            )
            if is_boundary:
                new_grid[y][x] = outline
    comp.grid = new_grid


def silhouette_cat(comp: LayerComposer, skeleton: CharacterSkeleton, base: str, outline: str = 'K') -> None:
    comp_left = comp.clone()
    comp_left.fill_ellipse(8, 13, 4, 5, base)
    comp_left.fill_ellipse(15, 17, 9, 8, base)
    comp_left.fill_ellipse(5, 4, 2, 3, base)
    comp_left.fill_ellipse(9, 6, 3, 4, base)
    _mirror_left_half(comp, comp_left)
    comp.force_symmetric()
    # Subtle body shading + paws
    for y in range(20, 24):
        for x in range(7, 25):
            if comp.grid[y][x] == base:
                comp.set(x, y, 'S')
    for x in [12, 13, 18, 19]:
        for y in [23, 24]:
            if comp.grid[y][x] in (base, 'S'):
                comp.set(x, y, 'P')
    comp.force_symmetric()


def silhouette_panda(comp: LayerComposer, skeleton: CharacterSkeleton, base: str, outline: str = 'K') -> None:
    comp_left = comp.clone()
    comp_left.fill_ellipse(8, 14, 6, 6, base)
    comp_left.fill_ellipse(15, 23, 8, 9, base)
    comp_left.fill_ellipse(4, 5, 3, 3, base)
    comp_left.fill_ellipse(6, 22, 2, 4, base)
    comp_left.fill_ellipse(12, 33, 2, 3, base)
    _mirror_left_half(comp, comp_left)
    comp.force_symmetric()
    comp.fill_ellipse(11, 14, 3, 4, 'G')
    comp.fill_ellipse(20, 14, 3, 4, 'G')
    for y in range(26, 30):
        for x in range(10, 22):
            if comp.grid[y][x] == base:
                comp.set(x, y, 'S')
    comp.force_symmetric()


def silhouette_dog(comp: LayerComposer, skeleton: CharacterSkeleton, base: str, outline: str = 'K') -> None:
    comp_left = comp.clone()
    comp_left.fill_ellipse(15, 17, 8, 7, base)
    comp_left.fill_ellipse(15, 24, 8, 7, base)
    comp_left.fill_ellipse(6, 16, 2, 6, base)
    comp_left.fill_ellipse(5, 21, 2, 3, base)
    _mirror_left_half(comp, comp_left)
    comp.force_symmetric()
    for y in range(21, 25):
        for x in range(7, 25):
            if comp.grid[y][x] == base:
                comp.set(x, y, 'S')
    for x in range(11, 21):
        if comp.grid[24][x] in (base, 'S'):
            comp.set(x, 24, 'O')
    comp.force_symmetric()


def silhouette_fox(comp: LayerComposer, skeleton: CharacterSkeleton, base: str, outline: str = 'K') -> None:
    comp_left = comp.clone()
    comp_left.fill_ellipse(15, 17, 8, 7, base)
    comp_left.fill_ellipse(15, 24, 7, 6, base)
    comp_left.fill_ellipse(7, 8, 2, 5, base)
    _mirror_left_half(comp, comp_left)
    comp.force_symmetric()
    comp.fill_ellipse(15, 21, 5, 3, 'W')
    comp.fill_ellipse(15, 25, 4, 2, 'W')
    comp.fill_ellipse(15, 26, 3, 3, 'W')
    comp.force_symmetric()


def silhouette_rabbit(comp: LayerComposer, skeleton: CharacterSkeleton, base: str, outline: str = 'K') -> None:
    comp_left = comp.clone()
    comp_left.fill_ellipse(15, 25, 8, 7, base)
    comp_left.fill_ellipse(15, 34, 7, 5, base)
    comp_left.fill_ellipse(10, 8, 3, 10, base)
    _mirror_left_half(comp, comp_left)
    comp.force_symmetric()
    comp.fill_ellipse(10, 8, 1, 7, 'Q')
    comp.fill_ellipse(21, 8, 1, 7, 'Q')
    comp.fill_ellipse(15, 34, 4, 3, 'W')
    comp.force_symmetric()


def silhouette_bear(comp: LayerComposer, skeleton: CharacterSkeleton, base: str, outline: str = 'K') -> None:
    comp_left = comp.clone()
    comp_left.fill_ellipse(15, 18, 10, 9, base)
    comp_left.fill_ellipse(15, 28, 8, 7, base)
    comp_left.fill_ellipse(6, 5, 4, 4, base)
    _mirror_left_half(comp, comp_left)
    comp.force_symmetric()
    # Snout with strong contrast
    comp.fill_ellipse(15, 22, 5, 3, 'W')
    comp.fill_ellipse(15, 21, 2, 1, 'K')
    # Belly
    comp.fill_ellipse(15, 28, 4, 3, 'W')
    # Inner ears
    comp.fill_ellipse(6, 5, 2, 2, 'W')
    comp.fill_ellipse(25, 5, 2, 2, 'W')
    comp.force_symmetric()


def silhouette_penguin(comp: LayerComposer, skeleton: CharacterSkeleton, base: str, outline: str = 'K') -> None:
    comp_left = comp.clone()
    comp_left.fill_ellipse(15, 19, 10, 13, base)
    comp_left.fill_ellipse(15, 19, 6, 10, 'W')
    comp_left.fill_ellipse(15, 33, 7, 3, base)
    _mirror_left_half(comp, comp_left)
    comp.force_symmetric()
    # Beak
    for x in [15, 16]:
        for y in [16, 17]:
            comp.set(x, y, 'Y')
    # Feet
    for y in [37, 38]:
        for x in [11, 12]:
            comp.set(x, y, 'O')
    comp.force_symmetric()


SILHOUETTES = {
    'cat': silhouette_cat,
    'panda': silhouette_panda,
    'dog': silhouette_dog,
    'fox': silhouette_fox,
    'rabbit': silhouette_rabbit,
    'bear': silhouette_bear,
    'penguin': silhouette_penguin,
}


# ============= Quality Validator v2 =============

class QualityValidatorV2:
    def __init__(self, grid: List[List[str]], skeleton: CharacterSkeleton, rules: dict):
        self.grid = grid
        self.s = skeleton
        self.rules = rules
        self.h = len(grid)
        self.w = len(grid[0])
        from composer import CraftabilityChecker
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

        feature_score = 0
        required = self.rules.get('required', [])
        if filled > 0 and self._has_content_in_box(0, 0, self.w, self.h // 2):
            feature_score += 8
        if self._has_eyes():
            feature_score += 8
        if self._has_nose():
            feature_score += 8
        if 'ears' in required and self.s.ear_type != 'none':
            if self._has_ears():
                feature_score += 8
        if self._has_content_in_box(0, self.h // 2, self.w, self.h - self.h // 2):
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

    def _has_content_in_box(self, x0: int, y0: int, w: int, h: int) -> bool:
        for y in range(y0, min(self.h, y0 + h)):
            for x in range(x0, min(self.w, x0 + w)):
                if self.grid[y][x] != '.':
                    return True
        return False

    def _has_eyes(self) -> bool:
        left_region = any(self.grid[y][x] in 'KXD' for y in range(self.h // 3, 2 * self.h // 3) for x in range(0, self.w // 2 - 2))
        right_region = any(self.grid[y][x] in 'KXD' for y in range(self.h // 3, 2 * self.h // 3) for x in range(self.w // 2 + 2, self.w))
        return left_region and right_region

    def _has_nose(self) -> bool:
        mid = self.w // 2
        return any(self.grid[y][x] in 'KPX' for y in range(self.h // 2, 3 * self.h // 4) for x in range(mid - 2, mid + 3))

    def _has_ears(self) -> bool:
        left = any(self.grid[y][x] != '.' for y in range(0, self.h // 3) for x in range(0, self.w // 2 - 2))
        right = any(self.grid[y][x] != '.' for y in range(0, self.h // 3) for x in range(self.w // 2 + 2, self.w))
        return left and right


# ============= Cleanup =============

def cleanup_grid(grid: List[List[str]]) -> List[List[str]]:
    comp = LayerComposer(deepcopy(grid))
    h, w = comp.h, comp.w
    for y in range(h):
        for x in range(w):
            ch = comp.get(x, y)
            if ch == '.':
                continue
            same_ortho = any(
                comp.get(x + dx, y + dy) == ch
                for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]
            )
            same_diag = any(
                comp.get(x + dx, y + dy) == ch
                for dx, dy in [(-1, -1), (1, -1), (-1, 1), (1, 1)]
            )
            if same_ortho:
                continue
            # Merge thin-line or isolated pixels into the most common neighbor
            counts = Counter()
            for dx, dy in [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]:
                n = comp.get(x + dx, y + dy)
                if n != '.' and n != ch:
                    counts[n] += 1
            if counts:
                comp.set(x, y, counts.most_common(1)[0][0])
            else:
                comp.set(x, y, '.')
    return comp.grid


# ============= Main Composer =============

ANIMAL_COLORS = {
    'cat': ('W', 'S', 'Z'),
    'panda': ('W', 'G', 'S'),
    'dog': ('W', 'S', 'Z'),
    'fox': ('O', 'W', 'S'),
    'rabbit': ('W', 'P', 'Q'),
    'bear': ('R', 'T', 'S'),
    'penguin': ('K', 'W', 'Y'),
    'owl': ('R', 'T', 'W'),
    'frog': ('N', 'V', 'L'),
    'turtle': ('V', 'N', 'L'),
    'koala': ('G', 'C', 'S'),
    'lion': ('Y', 'O', 'S'),
}


def compose_animal_v2(skeleton: CharacterSkeleton, style: dict) -> List[List[str]]:
    animal = skeleton.animal
    base, _, _ = ANIMAL_COLORS[animal]
    width, height = (32, 40) if animal in ('rabbit', 'penguin') else (32, 32)
    comp = make_canvas(width, height)

    if animal in SILHOUETTES:
        SILHOUETTES[animal](comp, skeleton, base, outline='K')
    else:
        raise ValueError(f'No silhouette for {animal}')

    head_cy = int(height * 0.32)
    head_rx = int(width * 0.30)
    head_ry = int(height * 0.22)
    body_cy = int(height * 0.72)
    body_rx = int(width * 0.28)
    body_ry = int(height * 0.18)

    ColorBlocking(comp, skeleton, base).apply(head_cy, head_rx, head_ry, body_cy, body_rx, body_ry)
    add_shading(comp, base, shadow='S', highlight='Z')

    FeatureMorphing.paint_eyes(comp, head_cy, head_rx, style, eye_distance=skeleton.eye_distance)
    FeatureMorphing.paint_nose(comp, head_cy, skeleton.nose_y, head_rx, color='K')
    FeatureMorphing.paint_mouth(comp, head_cy, skeleton.nose_y, head_rx, style)
    if style.get('blush', False):
        FeatureMorphing.paint_blush(comp, head_cy, head_rx)
    if style.get('whiskers', False) and animal in ('cat', 'dog', 'rabbit', 'fox'):
        FeatureMorphing.paint_whiskers(comp, head_cy, head_rx)

    FeatureMorphing.paint_arms(comp, body_cy, skeleton.pose, base=base)

    comp = LayerComposer(cleanup_grid(comp.grid))
    return comp.grid


# ============= Golden Samples =============

GOLDEN_SAMPLES = [
    ('cat', 'sitting', 'cat-sitting', 'round', 'smile', True, True),
    ('cat', 'standing', 'cat-standing', 'big', 'smile', True, True),
    ('cat', 'waving', 'cat-waving', 'round', 'open', True, True),
    ('panda', 'sitting', 'panda-sitting', 'round', 'smile', True, False),
    ('panda', 'eating', 'panda-eating', 'sleepy_curve', 'tiny', True, False),
    ('panda', 'waving', 'panda-waving', 'big', 'smile', True, False),
    ('rabbit', 'sitting', 'rabbit-sitting', 'round', 'smile', True, False),
    ('rabbit', 'floppy', 'rabbit-floppy', 'big', 'smile', True, False),
    ('rabbit', 'standing', 'rabbit-standing', 'round', 'tiny', True, False),
    ('dog', 'sitting', 'dog-sitting', 'round', 'tongue', True, False),
    ('dog', 'puppy', 'dog-puppy', 'big', 'open', True, False),
    ('dog', 'standing', 'dog-standing', 'round', 'smile', True, False),
    ('fox', 'sitting', 'fox-sitting', 'round', 'smile', True, False),
    ('fox', 'standing', 'fox-standing', 'big', 'smile', True, False),
    ('fox', 'waving', 'fox-waving', 'wink', 'smile', True, False),
    ('penguin', 'standing', 'penguin-standing', 'round', 'smile', True, False),
    ('penguin', 'waving', 'penguin-waving', 'big', 'smile', True, False),
    ('penguin', 'lying', 'penguin-lying', 'round', 'smile', True, False),
    ('bear', 'sitting', 'bear-sitting', 'round', 'smile', True, False),
    ('bear', 'standing', 'bear-standing', 'big', 'smile', True, False),
]


def run_golden_samples():
    rules = {'required': ['ears', 'eyes', 'nose']}
    outputs = []

    for animal, pose, slug, eye, mouth, blush, whiskers in GOLDEN_SAMPLES:
        skeleton = CharacterSkeleton.for_animal(animal, pose=pose)
        style = {'eye': eye, 'mouth': mouth, 'blush': blush, 'whiskers': whiskers}
        grid = compose_animal_v2(skeleton, style)

        validator = QualityValidatorV2(grid, skeleton, rules)
        score, reasons = validator.evaluate()

        cover_path = OUT_DIR / f'{slug}-cover.png'
        finished_path = OUT_DIR / f'{slug}-finished.png'
        v1_render_grid(grid, finished=False, output_path=cover_path)
        v1_render_grid(grid, finished=True, output_path=finished_path)

        meta = {
            'slug': slug,
            'subject': animal,
            'pose': pose,
            'style': style,
            'skeleton': {
                'head_ratio': skeleton.head_ratio,
                'body_ratio': skeleton.body_ratio,
                'ear_type': skeleton.ear_type,
                'ear_size': skeleton.ear_size,
            },
            'grid_size': f'{len(grid[0])}x{len(grid)}',
            'grid_data': v1_to_hex_grid(grid),
            'color_palette': v1_to_color_palette(grid),
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

    with open(OUT_DIR / 'preview.html', 'w') as f:
        f.write('<html><head><style>img{width:128px;margin:4px;border:1px solid #ccc}</style></head><body>\n')
        for slug, _, _ in outputs:
            f.write(f'<div><b>{slug}</b><br><img src="{slug}-cover.png"><img src="{slug}-finished.png"></div>\n')
        f.write('</body></html>\n')
    print(f'Preview: {OUT_DIR / "preview.html"}')


def run_regression():
    """Compare v1.1 vs v2.0 on the same golden samples using v1.1's QualityValidator."""
    from composer import COMPOSERS, QualityValidator as QualityValidatorV1
    rules = {'required': ['ears', 'eyes', 'nose']}

    # Map v2 golden samples to v1.1 styles
    v1_style_map = {
        'round': {'eye': 'round', 'mouth': 'smile', 'blush': True, 'whiskers': True},
        'big': {'eye': 'round', 'mouth': 'smile', 'blush': True, 'whiskers': True},
        'sleepy_curve': {'eye': 'shut_curve', 'mouth': 'smile', 'blush': False, 'whiskers': True},
        'sleepy_line': {'eye': 'shut_line', 'mouth': 'tiny', 'blush': False, 'whiskers': True},
        'wink': {'eye': 'round', 'mouth': 'smile', 'blush': True, 'whiskers': True},
        'tongue': {'eye': 'round', 'mouth': 'smile', 'blush': True, 'whiskers': True},
        'open': {'eye': 'round', 'mouth': 'smile', 'blush': True, 'whiskers': True},
        'tiny': {'eye': 'round', 'mouth': 'tiny', 'blush': False, 'whiskers': True},
    }

    rows = []
    for animal, pose, slug, eye, mouth, blush, whiskers in GOLDEN_SAMPLES:
        # v2.0
        skeleton = CharacterSkeleton.for_animal(animal, pose=pose)
        style = {'eye': eye, 'mouth': mouth, 'blush': blush, 'whiskers': whiskers}
        grid_v2 = compose_animal_v2(skeleton, style)
        v2_rules = {'required': ['beak', 'eyes'] if animal == 'penguin' else ['ears', 'eyes', 'nose']}
        v2_score, v2_reasons = QualityValidatorV1(grid_v2, v2_rules).evaluate()
        v2_score_v2, v2_reasons_v2 = QualityValidatorV2(grid_v2, skeleton, v2_rules).evaluate()

        # v1.1
        v1_style = v1_style_map.get(eye, {'eye': 'round', 'mouth': 'smile', 'blush': True, 'whiskers': True})
        v1_rules = {'required': ['beak', 'eyes'] if animal == 'penguin' else ['ears', 'eyes', 'nose']}
        grid_v1 = COMPOSERS[animal](v1_style)
        v1_score, v1_reasons = QualityValidatorV1(grid_v1, v1_rules).evaluate()

        rows.append({
            'slug': slug,
            'animal': animal,
            'pose': pose,
            'v1_score': v1_score,
            'v1_reasons': v1_reasons,
            'v2_score': v2_score,
            'v2_reasons': v2_reasons,
            'v2_score_v2_validator': v2_score_v2,
            'v2_reasons_v2_validator': v2_reasons_v2,
            'delta': v2_score - v1_score,
            'grid_v1': grid_v1,
            'grid_v2': grid_v2,
        })

    # Print summary
    print('\n=== Regression: v1.1 vs v2.0 (V1 Validator) ===')
    v1_avg = sum(r['v1_score'] for r in rows) / len(rows)
    v2_avg = sum(r['v2_score'] for r in rows) / len(rows)
    print(f'v1.1 average: {v1_avg:.1f}')
    print(f'v2.0 average: {v2_avg:.1f}')
    print(f' delta: {v2_avg - v1_avg:+.1f}')

    print('\n=== Regression: v2.0 (V2 Validator) ===')
    v2_v2_avg = sum(r['v2_score_v2_validator'] for r in rows) / len(rows)
    print(f'v2.0 average: {v2_v2_avg:.1f}')

    print('\nPer-sample (V1 validator):')
    for r in rows:
        print(f'  {r["slug"]:20s} v1={r["v1_score"]:2d} v2={r["v2_score"]:2d} delta={r["delta"]:+3d}')

    # Extract分项
    def extract_score(reasons, prefix):
        for reason in reasons:
            if reason.startswith(prefix):
                return reason.split('=')[1].split()[0]
        return '0'

    print('\n=== Shape/Feature/Craft Breakdown (V1 validator) ===')
    print(f'{"sample":20s} shape_v1 shape_v2 feat_v1 feat_v2 craft_v1 craft_v2')
    for r in rows:
        s1 = extract_score(r['v1_reasons'], 'shape_ratio')
        s2 = extract_score(r['v2_reasons'], 'shape_ratio')
        f1 = extract_score(r['v1_reasons'], 'feature_score')
        f2 = extract_score(r['v2_reasons'], 'feature_score')
        c1 = extract_score(r['v1_reasons'], 'craftability')
        c2 = extract_score(r['v2_reasons'], 'craftability')
        print(f'  {r["slug"]:20s} {s1:8s} {s2:8s} {f1:7s} {f2:7s} {c1:8s} {c2:8s}')

    # Save report
    report = {
        'summary': {
            'v1_average': v1_avg,
            'v2_average_v1_validator': v2_avg,
            'v2_average_v2_validator': v2_v2_avg,
            'delta': v2_avg - v1_avg,
        },
        'samples': [
            {
                'slug': r['slug'],
                'animal': r['animal'],
                'pose': r['pose'],
                'v1_score': r['v1_score'],
                'v2_score': r['v2_score'],
                'v2_score_v2_validator': r['v2_score_v2_validator'],
                'delta': r['delta'],
                'v1_reasons': r['v1_reasons'],
                'v2_reasons': r['v2_reasons'],
                'v2_reasons_v2_validator': r['v2_reasons_v2_validator'],
            }
            for r in rows
        ],
    }
    (OUT_DIR / 'regression-report.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(f'\nReport saved: {OUT_DIR / "regression-report.json"}')

    # Generate side-by-side comparison image
    from PIL import Image, ImageDraw, ImageFont
    thumb = 128
    n_rows = len(rows)
    sheet = Image.new('RGB', (3 * thumb + 200, n_rows * thumb + 40), (255, 255, 255))
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 14)
        small = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 11)
    except Exception:
        font = small = ImageFont.load_default()

    draw.text((10, 8), 'v1.1 (left) vs v2.0 (right) - V1 Validator scores', fill=(0, 0, 0), font=font)
    for i, r in enumerate(rows):
        y = 35 + i * thumb
        # v1 cover
        v1_path = OUT_DIR / f'{r["slug"]}-v1-cover.png'
        v1_render_grid(r['grid_v1'], finished=False, output_path=v1_path)
        img1 = Image.open(v1_path).resize((thumb, thumb), Image.Resampling.LANCZOS)
        sheet.paste(img1, (0, y))
        # v2 cover
        v2_path = OUT_DIR / f'{r["slug"]}-cover.png'
        if not v2_path.exists():
            v1_render_grid(r['grid_v2'], finished=False, output_path=v2_path)
        img2 = Image.open(v2_path).resize((thumb, thumb), Image.Resampling.LANCZOS)
        sheet.paste(img2, (thumb, y))
        # text
        draw.text((2 * thumb + 4, y + 4), f'{r["slug"]}', fill=(0, 0, 0), font=font)
        draw.text((2 * thumb + 4, y + 22), f'v1={r["v1_score"]} v2={r["v2_score"]} ({"+" if r["delta"] >= 0 else ""}{r["delta"]})', fill=(0, 0, 0), font=small)

    sheet.save(OUT_DIR / 'regression-side-by-side.jpg', quality=90)
    print(f'Comparison image: {OUT_DIR / "regression-side-by-side.jpg"}')


if __name__ == '__main__':
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == 'regression':
        run_regression()
    else:
        run_golden_samples()
        run_regression()
