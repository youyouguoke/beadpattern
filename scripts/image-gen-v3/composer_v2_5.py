#!/usr/bin/env python3
"""Pixel Character Composer v2.5

Goal: move from kawaii icon to Etsy-level bead character.
Strategy: add PoseEngine v2, FeatureLibrary v2, BodyShapeLibrary, and
MaterialPreview. Keep the same grid output as v1.1/v2.0.

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

OUT_DIR = Path('/tmp/bead-character-v2_5')
OUT_DIR.mkdir(parents=True, exist_ok=True)

CANVAS_W = 48
CANVAS_H = 48


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

    def clone(self) -> 'LayerComposer':
        return LayerComposer(deepcopy(self.grid))


def make_canvas(width: int = CANVAS_W, height: int = CANVAS_H) -> LayerComposer:
    return LayerComposer([['.' for _ in range(width)] for _ in range(height)])


# ============= Character Skeleton v2.5 =============

class CharacterSkeleton:
    """Pose-aware skeleton."""

    def __init__(
        self,
        animal: str,
        pose: str = 'sitting',
        body_shape: str = 'round',
        head_ratio: float = 0.50,
        body_ratio: float = 0.50,
        body_rotation: int = 0,
        head_tilt: int = 0,
        arm_position: str = 'side',
        leg_position: str = 'folded',
        base_color: Optional[str] = None,
        accent_color: Optional[str] = None,
        accessory: Optional[str] = None,
        seed: int = 0,
    ):
        self.animal = animal
        self.pose = pose
        self.body_shape = body_shape
        self.head_ratio = head_ratio
        self.body_ratio = body_ratio
        self.body_rotation = body_rotation
        self.head_tilt = head_tilt
        self.arm_position = arm_position
        self.leg_position = leg_position
        self.base_color = base_color
        self.accent_color = accent_color
        self.accessory = accessory
        self.rng = random.Random(seed)

    @classmethod
    def for_animal(
        cls,
        animal: str,
        pose: str = 'sitting',
        body_shape: str = 'round',
        style: Optional[dict] = None,
        seed: int = 0,
    ) -> 'CharacterSkeleton':
        style = style or {}
        defaults = {
            'cat': {
                'head_ratio': 0.50, 'body_ratio': 0.50,
                'base_color': 'W', 'accent_color': 'P',
            },
            'panda': {
                'head_ratio': 0.50, 'body_ratio': 0.50,
                'base_color': 'W', 'accent_color': 'K',
            },
            'dog': {
                'head_ratio': 0.50, 'body_ratio': 0.50,
                'base_color': 'N', 'accent_color': 'W',
            },
            'fox': {
                'head_ratio': 0.50, 'body_ratio': 0.50,
                'base_color': 'O', 'accent_color': 'W',
            },
            'rabbit': {
                'head_ratio': 0.45, 'body_ratio': 0.55,
                'base_color': 'W', 'accent_color': 'P',
            },
            'bear': {
                'head_ratio': 0.50, 'body_ratio': 0.50,
                'base_color': 'N', 'accent_color': 'W',
            },
            'penguin': {
                'head_ratio': 0.45, 'body_ratio': 0.55,
                'base_color': 'K', 'accent_color': 'W',
            },
        }
        d = defaults.get(animal, {'head_ratio': 0.50, 'body_ratio': 0.50, 'base_color': 'W', 'accent_color': 'P'})
        # Pose presets
        pose_presets = POSE_PRESETS.get(pose, POSE_PRESETS['sitting'])
        return cls(
            animal=animal,
            pose=pose,
            body_shape=body_shape,
            head_ratio=d.get('head_ratio', 0.50),
            body_ratio=d.get('body_ratio', 0.50),
            body_rotation=pose_presets.get('body_rotation', 0),
            head_tilt=pose_presets.get('head_tilt', 0),
            arm_position=pose_presets.get('arm_position', 'side'),
            leg_position=pose_presets.get('leg_position', 'folded'),
            base_color=d.get('base_color', 'W'),
            accent_color=d.get('accent_color', 'P'),
            accessory=style.get('accessory'),
            seed=seed,
        )


# ============= Pose Engine v2 =============

POSE_PRESETS: Dict[str, dict] = {
    'sitting': {'body_rotation': 0, 'head_tilt': 0, 'arm_position': 'side', 'leg_position': 'folded'},
    'standing': {'body_rotation': 0, 'head_tilt': 0, 'arm_position': 'side', 'leg_position': 'straight'},
    'hugging': {'body_rotation': 5, 'head_tilt': -3, 'arm_position': 'front', 'leg_position': 'folded'},
    'holding': {'body_rotation': 8, 'head_tilt': 2, 'arm_position': 'raised', 'leg_position': 'folded'},
    'sleeping': {'body_rotation': 0, 'head_tilt': 10, 'arm_position': 'folded', 'leg_position': 'folded'},
    'waving': {'body_rotation': 5, 'head_tilt': -3, 'arm_position': 'up', 'leg_position': 'straight'},
    'eating': {'body_rotation': 0, 'head_tilt': 4, 'arm_position': 'front', 'leg_position': 'folded'},
}


# ============= Feature Library v2 =============

class FeatureLibrary:
    """Stamp-based eye, mouth, cheek designs."""

    @staticmethod
    def paint_eye_stamp(comp: LayerComposer, cx: int, cy: int, eye_type: str, mirror: bool = False) -> None:
        """Paint an eye centered at (cx, cy). eye_type mirrored by left/right logic handled by caller."""
        if eye_type == 'big_round':
            comp.fill_circle(cx, cy, 3, 'K')
            comp.set(cx - 2, cy - 2, 'W')
            comp.set(cx - 1, cy - 1, 'W')
            comp.set(cx + 1, cy + 1, 'S')
        elif eye_type == 'sparkly':
            comp.fill_circle(cx, cy, 3, 'K')
            comp.set(cx - 2, cy - 2, 'W')
            comp.set(cx - 1, cy - 1, 'W')
            comp.set(cx + 1, cy - 2, 'W')
            comp.set(cx + 2, cy - 1, 'W')
        elif eye_type == 'sleepy':
            for x in range(cx - 2, cx + 3):
                comp.set(x, cy + 1, 'K')
            comp.set(cx - 1, cy, 'K')
            comp.set(cx, cy, 'K')
            comp.set(cx + 1, cy, 'K')
        elif eye_type == 'wink':
            # closed wink line
            for x in range(cx - 2, cx + 2):
                comp.set(x, cy, 'K')
            comp.set(cx - 1, cy - 1, 'K')
        elif eye_type == 'tiny':
            comp.set(cx, cy, 'K')
            comp.set(cx - 1, cy, 'K')
            comp.set(cx + 1, cy, 'K')
        elif eye_type == 'shy':
            comp.fill_circle(cx, cy + 1, 2, 'K')
            comp.set(cx - 1, cy - 1, 'W')
            comp.set(cx, cy - 1, 'W')
        elif eye_type == 'star':
            comp.set(cx, cy - 1, 'K')
            comp.set(cx, cy + 1, 'K')
            comp.set(cx - 1, cy, 'K')
            comp.set(cx + 1, cy, 'K')
            comp.set(cx, cy, 'W')
        elif eye_type == 'heart':
            comp.set(cx, cy - 1, 'P')
            comp.set(cx - 1, cy, 'P')
            comp.set(cx, cy, 'P')
            comp.set(cx + 1, cy, 'P')
            comp.set(cx, cy + 1, 'P')
        elif eye_type == 'closed_smile':
            comp.set(cx - 1, cy, 'K')
            comp.set(cx, cy - 1, 'K')
            comp.set(cx + 1, cy, 'K')
        elif eye_type == 'crying':
            comp.fill_circle(cx, cy, 2, 'K')
            comp.set(cx - 1, cy - 1, 'W')
            comp.set(cx, cy + 3, 'B')
            comp.set(cx - 1, cy + 4, 'B')

    @staticmethod
    def paint_mouth_stamp(comp: LayerComposer, cx: int, cy: int, mouth_type: str) -> None:
        if mouth_type == 'small_w':
            comp.set(cx - 1, cy, 'K')
            comp.set(cx, cy - 1, 'K')
            comp.set(cx + 1, cy, 'K')
        elif mouth_type == 'open_smile':
            comp.set(cx - 2, cy, 'K')
            comp.set(cx - 1, cy + 1, 'K')
            comp.set(cx, cy + 1, 'K')
            comp.set(cx + 1, cy + 1, 'K')
            comp.set(cx + 2, cy, 'K')
            comp.set(cx - 1, cy + 2, 'W')
            comp.set(cx, cy + 2, 'W')
            comp.set(cx + 1, cy + 2, 'W')
        elif mouth_type == 'tongue':
            comp.set(cx - 1, cy, 'K')
            comp.set(cx, cy, 'K')
            comp.set(cx + 1, cy, 'K')
            comp.set(cx, cy + 1, 'P')
            comp.set(cx - 1, cy + 1, 'P')
            comp.set(cx, cy + 2, 'P')
            comp.set(cx - 1, cy + 2, 'P')
        elif mouth_type == 'smirk':
            comp.set(cx - 2, cy, 'K')
            comp.set(cx - 1, cy + 1, 'K')
            comp.set(cx, cy + 1, 'K')
            comp.set(cx + 1, cy, 'K')
        elif mouth_type == 'sleep':
            comp.set(cx - 1, cy + 1, 'K')
            comp.set(cx, cy + 1, 'K')
            comp.set(cx + 1, cy + 1, 'K')
            comp.set(cx, cy + 2, 'W')
            comp.set(cx - 1, cy + 3, 'W')
        elif mouth_type == 'laugh':
            comp.set(cx - 2, cy, 'K')
            comp.set(cx - 1, cy, 'K')
            comp.set(cx, cy, 'K')
            comp.set(cx + 1, cy, 'K')
            comp.set(cx + 2, cy, 'K')
            comp.set(cx - 1, cy + 1, 'W')
            comp.set(cx, cy + 1, 'W')
            comp.set(cx + 1, cy + 1, 'W')
        elif mouth_type == 'tiny':
            comp.set(cx - 1, cy + 1, 'K')
            comp.set(cx, cy + 1, 'K')
            comp.set(cx + 1, cy + 1, 'K')
        elif mouth_type == 'cat':
            comp.set(cx - 1, cy + 1, 'K')
            comp.set(cx, cy, 'K')
            comp.set(cx + 1, cy + 1, 'K')
        elif mouth_type == 'surprised':
            comp.set(cx - 1, cy + 1, 'K')
            comp.set(cx, cy + 1, 'K')
            comp.set(cx - 1, cy + 2, 'K')
            comp.set(cx, cy + 2, 'K')
        elif mouth_type == 'line':
            for x in range(cx - 2, cx + 3):
                comp.set(x, cy + 1, 'K')

    @staticmethod
    def paint_cheek(comp: LayerComposer, left_cx: int, right_cx: int, cy: int, cheek_type: str) -> None:
        if cheek_type == 'none':
            return
        for x in range(left_cx - 1, left_cx + 2):
            comp.set(x, cy, 'Q')
        for x in range(right_cx - 1, right_cx + 2):
            comp.set(x, cy, 'Q')
        if cheek_type == 'big':
            comp.set(left_cx - 2, cy, 'Q')
            comp.set(left_cx + 2, cy, 'Q')
            comp.set(right_cx - 2, cy, 'Q')
            comp.set(right_cx + 2, cy, 'Q')
            comp.set(left_cx, cy + 1, 'Q')
            comp.set(right_cx, cy + 1, 'Q')
        elif cheek_type == 'freckles':
            comp.set(left_cx - 2, cy, 'P')
            comp.set(left_cx, cy + 1, 'P')
            comp.set(left_cx + 2, cy, 'P')
            comp.set(right_cx - 2, cy, 'P')
            comp.set(right_cx, cy + 1, 'P')
            comp.set(right_cx + 2, cy, 'P')
        elif cheek_type == 'shiny':
            comp.set(left_cx - 1, cy - 1, 'W')
            comp.set(right_cx + 1, cy - 1, 'W')


# ============= Body Shape Library =============

BODY_SHAPES: Dict[str, Dict[str, Tuple[int, int, int, int]]] = {
    'cat': {
        'round': (15, 11, 13, 11),
        'slim': (14, 13, 11, 9),
        'baby': (16, 10, 14, 9),
    },
    'panda': {
        'round': (16, 12, 14, 12),
        'chubby': (17, 12, 15, 13),
        'baby': (15, 10, 13, 10),
    },
    'dog': {
        'puppy': (15, 11, 13, 11),
        'slim': (14, 13, 12, 9),
        'chubby': (16, 12, 14, 12),
    },
    'fox': {
        'slim': (14, 13, 12, 9),
        'baby': (15, 10, 13, 10),
        'fluffy': (16, 11, 14, 11),
    },
    'rabbit': {
        'round': (15, 10, 13, 11),
        'slim': (14, 12, 12, 9),
        'baby': (16, 9, 14, 9),
    },
    'bear': {
        'teddy': (16, 12, 14, 12),
        'panda': (16, 12, 14, 12),
        'cub': (15, 10, 13, 10),
    },
    'penguin': {
        'chubby': (15, 13, 13, 12),
        'slim': (14, 15, 11, 11),
        'baby': (15, 11, 13, 11),
    },
}


def get_body_shape(animal: str, body_shape: str) -> Tuple[int, int, int, int]:
    return BODY_SHAPES.get(animal, {}).get(body_shape, (15, 11, 13, 11))


# ============= Silhouette Composer =============

class SilhouetteComposer:
    def __init__(self, comp: LayerComposer, skeleton: CharacterSkeleton):
        self.comp = comp
        self.s = skeleton

    def _base_color(self) -> str:
        return self.s.base_color or 'W'

    def _rotate_x(self, x: int, y: int, cx: int, rotation: int) -> int:
        if rotation == 0:
            return x
        return x + int((y - CANVAS_H // 2) * rotation / 40)

    def _apply_rotation(self, cx: int, cy: int, rx: int, ry: int, rotation: int, ch: str) -> None:
        # Approximate rotated ellipse by shifting x per y
        for y in range(cy - ry - 4, cy + ry + 5):
            for x in range(cx - rx - 4, cx + rx + 5):
                dx = x - cx
                dy = y - cy
                # rotation: shift x by dy * rotation / 40
                rx_eff = rx + int(dy * rotation / 40)
                val = (dx * dx) / max(1, rx_eff * rx_eff) + (dy * dy) / max(1, ry * ry)
                if val <= 1.0:
                    self.comp.set(x, y, ch)

    def draw_head(self, cx: int, cy: int, rx: int, ry: int) -> None:
        base = self._base_color()
        # Slightly smaller dark outline by drawing shadow first then base on top
        self._apply_rotation(cx, cy, rx + 1, ry + 1, self.s.body_rotation, 'S')
        self._apply_rotation(cx, cy, rx, ry, self.s.body_rotation, base)

    def draw_body(self, cx: int, cy: int, rx: int, ry: int) -> None:
        base = self._base_color()
        self._apply_rotation(cx, cy, rx + 1, ry + 1, self.s.body_rotation, 'S')
        self._apply_rotation(cx, cy, rx, ry, self.s.body_rotation, base)

    def draw_ears(self, cx: int, head_cy: int, head_rx: int, head_ry: int) -> None:
        base = self._base_color()
        if self.s.animal == 'rabbit':
            # Natural tapered ears: outer base, inner pink, layered
            left_cx = cx - head_rx - 2
            right_cx = cx + head_rx + 2
            ear_cy = head_cy - head_ry - 8
            for side in [-1, 1]:
                ecx = cx + side * (head_rx + 2)
                # Outer ear
                self.comp.fill_ellipse(ecx, ear_cy, 5, 10, base)
                # Inner lighter
                self.comp.fill_ellipse(ecx, ear_cy, 3, 8, 'W')
                # Inner pink
                self.comp.fill_ellipse(ecx, ear_cy + 1, 2, 6, 'Q')
                # Ear tip highlight
                self.comp.set(ecx, ear_cy - 8, 'Z')
        elif self.s.animal in ('cat', 'fox'):
            left_cx = cx - head_rx - 1
            right_cx = cx + head_rx + 1
            ear_cy = head_cy - head_ry - 2
            for side in [-1, 1]:
                ecx = cx + side * (head_rx + 1)
                # triangle-ish but rounded
                self.comp.fill_ellipse(ecx, ear_cy - 2, 4, 7, base)
                self.comp.fill_ellipse(ecx, ear_cy - 2, 2, 5, 'Q')
                self.comp.set(ecx, ear_cy - 7, 'Z')
        elif self.s.animal in ('dog', 'bear', 'panda'):
            left_cx = cx - head_rx - 2
            right_cx = cx + head_rx + 2
            ear_cy = head_cy - head_ry - 2
            for side in [-1, 1]:
                ecx = cx + side * (head_rx + 2)
                self.comp.fill_ellipse(ecx, ear_cy, 4, 5, base)
                self.comp.fill_ellipse(ecx, ear_cy, 2, 3, 'Q')
                self.comp.set(ecx, ear_cy - 4, 'Z')

    def draw_arms(self, cx: int, body_cy: int, body_rx: int, body_ry: int) -> None:
        base = self._base_color()
        arm_y = body_cy - body_ry // 2
        pos = self.s.arm_position
        if pos == 'side':
            # Arms down at sides
            for side in [-1, 1]:
                start_x = cx + side * (body_rx - 2)
                for dy in range(-2, 4):
                    self.comp.set(start_x + side * dy, arm_y + dy, base)
                    self.comp.set(start_x + side * (dy + 1), arm_y + dy, 'S')
        elif pos == 'front':
            # Arms forward, centered
            self.comp.set(cx - 2, arm_y, base)
            self.comp.set(cx - 1, arm_y - 1, base)
            self.comp.set(cx, arm_y - 2, base)
            self.comp.set(cx + 1, arm_y - 1, base)
            self.comp.set(cx + 2, arm_y, base)
            # paws
            self.comp.set(cx - 2, arm_y + 1, 'W')
            self.comp.set(cx + 2, arm_y + 1, 'W')
        elif pos == 'up':
            # Waving arm (right side raised)
            self.comp.set(cx + 2, arm_y - 1, base)
            self.comp.set(cx + 3, arm_y - 3, base)
            self.comp.set(cx + 4, arm_y - 5, base)
            self.comp.set(cx + 3, arm_y - 6, 'W')
            self.comp.set(cx - 2, arm_y, base)
            self.comp.set(cx - 3, arm_y - 1, base)
        elif pos == 'raised':
            # Holding arm (right side raised higher, holding accessory)
            self.comp.set(cx + 2, arm_y - 2, base)
            self.comp.set(cx + 3, arm_y - 4, base)
            self.comp.set(cx + 4, arm_y - 6, base)
            self.comp.set(cx + 3, arm_y - 7, 'W')
            self.comp.set(cx - 2, arm_y, base)
            self.comp.set(cx - 3, arm_y - 1, base)
            # Accessory in raised hand
            if self.s.accessory == 'carrot':
                self.comp.set(cx + 4, arm_y - 8, 'O')
                self.comp.set(cx + 4, arm_y - 9, 'O')
                self.comp.set(cx + 5, arm_y - 8, 'O')
                self.comp.set(cx + 3, arm_y - 7, 'G')
        elif pos == 'folded':
            # Arms folded (sleeping pose)
            self.comp.set(cx - 2, arm_y, base)
            self.comp.set(cx - 1, arm_y + 1, base)
            self.comp.set(cx, arm_y + 2, base)
            self.comp.set(cx + 1, arm_y + 1, base)
            self.comp.set(cx + 2, arm_y, base)

    def draw_legs(self, cx: int, body_cy: int, body_rx: int, body_ry: int) -> None:
        base = self._base_color()
        leg_y = body_cy + body_ry - 2
        pos = self.s.leg_position
        if pos == 'folded':
            for side in [-1, 1]:
                for dy in range(0, 4):
                    self.comp.set(cx + side * (body_rx - 3) + side * dy, leg_y + dy, base)
                    self.comp.set(cx + side * (body_rx - 3) + side * (dy + 1), leg_y + dy, 'W')
        elif pos == 'straight':
            for side in [-1, 1]:
                for dy in range(0, 4):
                    self.comp.set(cx + side * (body_rx - 3), leg_y + dy, base)
                    self.comp.set(cx + side * (body_rx - 3) + side, leg_y + dy, 'W')
        elif pos == 'crossed':
            self.comp.set(cx - 2, leg_y, base)
            self.comp.set(cx - 1, leg_y + 1, base)
            self.comp.set(cx, leg_y + 2, base)
            self.comp.set(cx + 1, leg_y + 1, base)
            self.comp.set(cx + 2, leg_y, base)

    def draw_tail(self, cx: int, body_cy: int, body_rx: int) -> None:
        base = self._base_color()
        if self.s.animal == 'rabbit':
            # small round tail
            self.comp.fill_circle(cx - body_rx - 3, body_cy, 3, 'W')
            self.comp.set(cx - body_rx - 3, body_cy - 2, 'Z')
        elif self.s.animal == 'fox':
            # fluffy tail
            for i in range(5):
                self.comp.set(cx + body_rx + 2 + i, body_cy + i, base)
                self.comp.set(cx + body_rx + 3 + i, body_cy + i, 'W')
            self.comp.set(cx + body_rx + 6, body_cy + 4, 'Z')
        elif self.s.animal in ('dog', 'cat', 'bear'):
            self.comp.set(cx - body_rx - 2, body_cy + 2, base)
            self.comp.set(cx - body_rx - 3, body_cy + 3, base)
            self.comp.set(cx - body_rx - 2, body_cy + 3, 'W')

    def draw_penguin_flippers(self, cx: int, body_cy: int, body_rx: int, body_ry: int) -> None:
        base = 'K'
        flip_y = body_cy - body_ry // 2
        for side in [-1, 1]:
            for dy in range(0, 5):
                self.comp.set(cx + side * (body_rx + 1) + side * dy, flip_y + dy, base)
                self.comp.set(cx + side * (body_rx + 2) + side * dy, flip_y + dy, 'S')

    def draw_penguin_feet(self, cx: int, body_cy: int, body_ry: int) -> None:
        foot_y = body_cy + body_ry + 1
        for side in [-1, 1]:
            for dx in range(0, 3):
                self.comp.set(cx + side * (4 + dx), foot_y, 'O')
                self.comp.set(cx + side * (4 + dx), foot_y + 1, 'O')
            self.comp.set(cx + side * 6, foot_y + 2, 'Z')

    def compose(self) -> LayerComposer:
        cx = self.comp.w // 2
        # Head and body geometry from shape library
        head_rx, head_ry, body_rx, body_ry = get_body_shape(self.s.animal, self.s.body_shape)

        # Head position (upper half, head_ratio determines vertical space)
        head_cy = int(CANVAS_H * 0.32 + self.s.head_tilt)
        body_cy = int(CANVAS_H * 0.62)

        # Draw body first so head overlaps slightly
        if self.s.animal == 'penguin':
            self.draw_body(cx, body_cy, body_rx, body_ry)
            self.draw_penguin_flippers(cx, body_cy, body_rx, body_ry)
            self.draw_penguin_feet(cx, body_cy, body_ry)
        else:
            self.draw_body(cx, body_cy, body_rx, body_ry)
            self.draw_legs(cx, body_cy, body_rx, body_ry)
            self.draw_arms(cx, body_cy, body_rx, body_ry)
            self.draw_tail(cx, body_cy, body_rx)

        # Head
        self.draw_head(cx, head_cy, head_rx, head_ry)
        self.draw_ears(cx, head_cy, head_rx, head_ry)

        return self.comp


# ============= Color Blocking v2.5 =============

class ColorBlocking:
    def __init__(self, comp: LayerComposer, skeleton: CharacterSkeleton):
        self.comp = comp
        self.s = skeleton

    def apply(self, head_cy: int, head_rx: int, head_ry: int, body_cy: int, body_rx: int, body_ry: int) -> None:
        cx = self.comp.w // 2
        base = self.s.base_color

        # Muzzle / snout
        if self.s.animal in ('dog', 'fox', 'bear', 'rabbit', 'cat', 'panda'):
            self.comp.fill_ellipse(cx, head_cy + int(head_ry * 0.45), max(3, int(head_rx * 0.55)), max(3, int(head_ry * 0.40)), 'W')
            # Muzzle shadow/highlight dots
            self.comp.set(cx - int(head_rx * 0.3), head_cy + int(head_ry * 0.35), 'Z')
            self.comp.set(cx + int(head_rx * 0.3), head_cy + int(head_ry * 0.35), 'Z')

        # Belly patch
        if self.s.animal in ('panda', 'penguin', 'bear', 'rabbit', 'dog', 'cat'):
            self.comp.fill_ellipse(cx, body_cy, max(3, int(body_rx * 0.65)), max(3, int(body_ry * 0.75)), 'W')
            self.comp.set(cx, body_cy - body_ry // 2, 'Z')

        # Panda eye patches
        if self.s.animal == 'panda':
            patch_y = head_cy - int(head_ry * 0.1)
            left_eye = cx - int(head_rx * 0.4)
            right_eye = cx + int(head_rx * 0.4)
            self.comp.fill_ellipse(left_eye, patch_y, max(3, int(head_rx * 0.28)), max(3, int(head_ry * 0.25)), 'G')
            self.comp.fill_ellipse(right_eye, patch_y, max(3, int(head_rx * 0.28)), max(3, int(head_ry * 0.25)), 'G')
            # Highlight on patches
            self.comp.set(left_eye - 1, patch_y - 2, 'Z')
            self.comp.set(right_eye + 1, patch_y - 2, 'Z')

        # Inner ears already done in silhouette, but add highlight
        if self.s.animal in ('cat', 'dog', 'rabbit', 'bear', 'fox', 'panda'):
            left_ear_cx = cx - int(head_rx * 0.55)
            right_ear_cx = cx + int(head_rx * 0.55)
            ear_cy = head_cy - int(head_ry * 0.75)
            self.comp.set(left_ear_cx, ear_cy - 3, 'Z')
            self.comp.set(right_ear_cx, ear_cy - 3, 'Z')

        # Add bead highlights to body
        for y in range(body_cy - body_ry, body_cy + body_ry):
            for x in range(cx - body_rx, cx + body_rx):
                if self.comp.get(x, y) == base:
                    if self.comp.get(x + 1, y) == '.' or self.comp.get(x, y + 1) == '.':
                        if self.rng.random() < 0.15:
                            self.comp.set(x, y, 'Z')

    @property
    def rng(self):
        return self.s.rng


# ============= Feature Painter =============

class FeaturePainter:
    def __init__(self, comp: LayerComposer, skeleton: CharacterSkeleton, style: dict):
        self.comp = comp
        self.s = skeleton
        self.style = style

    def paint(self, head_cy: int, head_rx: int, head_ry: int) -> None:
        cx = self.comp.w // 2
        eye_y = head_cy - int(head_ry * 0.10)
        left_cx = cx - int(head_rx * 0.38)
        right_cx = cx + int(head_rx * 0.38)
        eye_type = self.style.get('eye', 'big_round')
        mouth_type = self.style.get('mouth', 'small_w')
        cheek_type = self.style.get('cheek', 'pink')

        FeatureLibrary.paint_eye_stamp(self.comp, left_cx, eye_y, eye_type)
        FeatureLibrary.paint_eye_stamp(self.comp, right_cx, eye_y, eye_type)

        nose_y = head_cy + int(head_ry * 0.32)
        # nose
        self.comp.set(cx - 1, nose_y, 'K')
        self.comp.set(cx, nose_y, 'K')
        self.comp.set(cx + 1, nose_y, 'K')
        self.comp.set(cx - 1, nose_y + 1, 'K')
        self.comp.set(cx + 1, nose_y + 1, 'K')
        self.comp.set(cx, nose_y + 1, 'W')

        mouth_y = nose_y + 2
        FeatureLibrary.paint_mouth_stamp(self.comp, cx, mouth_y, mouth_type)

        cheek_y = head_cy + int(head_ry * 0.25)
        FeatureLibrary.paint_cheek(self.comp, left_cx - 2, right_cx + 2, cheek_y, cheek_type)

        # Whiskers (optional)
        if self.style.get('whiskers', False) and self.s.animal in ('cat', 'rabbit'):
            whisker_y = cheek_y
            for x in range(left_cx - 6, left_cx - 2):
                self.comp.set(x, whisker_y, 'K')
            for x in range(right_cx + 3, right_cx + 7):
                self.comp.set(x, whisker_y, 'K')


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
            counts = Counter()
            for dx, dy in [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]:
                n = comp.get(x + dx, y + dy)
                if n != '.' and n != ch:
                    counts[n] += 1
            if counts:
                comp.set(x, y, counts.most_common(1)[0][0])
            elif not same_diag:
                comp.set(x, y, '.')
    return comp.grid


# ============= Quality Validator v2 =============

class QualityValidatorV2:
    """Anatomy-aware validator."""

    def __init__(self, grid: List[List[str]], skeleton: CharacterSkeleton, rules: dict):
        self.grid = grid
        self.s = skeleton
        self.rules = rules
        self.h = len(grid)
        self.w = len(grid[0])
        self.filled = sum(1 for row in grid for ch in row if ch != '.')

    def evaluate(self) -> Tuple[int, List[str]]:
        score = 0
        reasons = []

        # Shape ratio: target 0.45-0.55 (head/body balance)
        ratio = self.filled / (self.w * self.h)
        if 0.30 <= ratio <= 0.55:
            shape_score = 30
        else:
            shape_score = max(0, int(30 - abs(0.42 - ratio) * 80))
        score += shape_score
        reasons.append(f'shape_ratio={ratio:.2f} ({shape_score}/30)')

        # Feature presence
        required = self.rules.get('required', [])
        feature_score = 0
        for feat in required:
            if feat == 'ears':
                has = any(self.grid[y][x] != '.' for y in [2, 3, 4, 5, 6, 7] for x in [5, 6, 7, 8, 9, 10, 11])
                if has:
                    feature_score += 8
            elif feat == 'eyes':
                has = self.grid[self.h // 2][self.w // 3] != '.' and self.grid[self.h // 2][2 * self.w // 3] != '.'
                if has:
                    feature_score += 8
            elif feat == 'nose':
                mid = self.w // 2
                has = self.grid[self.h // 2 + 2][mid] != '.' and self.grid[self.h // 2 + 2][mid - 1] != '.'
                if has:
                    feature_score += 8
            elif feat == 'beak':
                mid = self.w // 2
                has = self.grid[self.h // 2 + 2][mid] != '.' and self.grid[self.h // 2 + 3][mid] != '.'
                if has:
                    feature_score += 8
            elif feat == 'body':
                has = any(self.grid[y][x] != '.' for y in range(self.h // 2, self.h - 2) for x in range(self.w // 3, 2 * self.w // 3))
                if has:
                    feature_score += 8
        feature_score = min(25, feature_score)
        score += feature_score
        reasons.append(f'feature_score={feature_score}/25')

        # Craftability
        from composer import CraftabilityChecker
        craft_score, craft_reasons = CraftabilityChecker(self.grid).check()
        craft_norm = min(20, craft_score // 5)
        score += craft_norm
        reasons.extend(craft_reasons)
        reasons.append(f'craftability={craft_norm}/20')

        # Color richness
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

        # Visual appeal: blush, shadow, highlight
        appeal = 0
        has_blush = 'Q' in colors or 'P' in colors
        has_shadow = 'S' in colors
        has_highlight = 'Z' in colors
        has_belly = 'W' in colors
        if has_blush:
            appeal += 2
        if has_shadow and has_highlight:
            appeal += 3
        if has_belly:
            appeal += 2
        if 4 <= unique_colors <= 12:
            appeal += 2
        if any(c in colors for c in ['P', 'Q', 'B', 'O', 'Y']):
            appeal += 3
        appeal = min(10, appeal)
        score += appeal
        reasons.append(f'visual_appeal={appeal}/10')

        return score, reasons


# ============= Main Composition =============

def compose_animal_v2_5(skeleton: CharacterSkeleton, style: dict) -> List[List[str]]:
    comp = make_canvas()

    # Silhouette
    sil = SilhouetteComposer(comp, skeleton)
    sil.compose()

    # Geometry
    head_rx, head_ry, body_rx, body_ry = get_body_shape(skeleton.animal, skeleton.body_shape)
    head_cy = int(CANVAS_H * 0.32 + skeleton.head_tilt)
    body_cy = int(CANVAS_H * 0.62)

    # Color blocking
    ColorBlocking(comp, skeleton).apply(head_cy, head_rx, head_ry, body_cy, body_rx, body_ry)

    # Features
    FeaturePainter(comp, skeleton, style).paint(head_cy, head_rx, head_ry)

    # Cleanup
    grid = cleanup_grid(comp.grid)
    return grid


# ============= Golden Samples =============

GOLDEN_SAMPLES: List[Tuple[str, str, str, dict]] = [
    # animal, pose, slug, style
    ('cat', 'sitting', 'cat-sitting', {'eye': 'big_round', 'mouth': 'small_w', 'cheek': 'pink', 'whiskers': True}),
    ('cat', 'standing', 'cat-standing', {'eye': 'sparkly', 'mouth': 'open_smile', 'cheek': 'big', 'whiskers': True}),
    ('cat', 'waving', 'cat-waving', {'eye': 'wink', 'mouth': 'smirk', 'cheek': 'pink', 'whiskers': True}),
    ('cat', 'sleeping', 'cat-sleeping', {'eye': 'sleepy', 'mouth': 'sleep', 'cheek': 'none', 'whiskers': False}),
    ('cat', 'hugging', 'cat-hugging', {'eye': 'big_round', 'mouth': 'small_w', 'cheek': 'shiny', 'whiskers': True}),
    ('panda', 'sitting', 'panda-sitting', {'eye': 'big_round', 'mouth': 'open_smile', 'cheek': 'pink', 'whiskers': False}),
    ('panda', 'eating', 'panda-eating', {'eye': 'big_round', 'mouth': 'tongue', 'cheek': 'pink', 'whiskers': False}),
    ('panda', 'waving', 'panda-waving', {'eye': 'sparkly', 'mouth': 'small_w', 'cheek': 'big', 'whiskers': False}),
    ('panda', 'sleeping', 'panda-sleeping', {'eye': 'sleepy', 'mouth': 'sleep', 'cheek': 'none', 'whiskers': False}),
    ('panda', 'hugging', 'panda-hugging', {'eye': 'heart', 'mouth': 'small_w', 'cheek': 'pink', 'whiskers': False}),
    ('dog', 'sitting', 'dog-sitting', {'eye': 'big_round', 'mouth': 'open_smile', 'cheek': 'pink', 'whiskers': False}),
    ('dog', 'standing', 'dog-standing', {'eye': 'sparkly', 'mouth': 'tongue', 'cheek': 'big', 'whiskers': False}),
    ('dog', 'puppy', 'dog-puppy', {'eye': 'big_round', 'mouth': 'small_w', 'cheek': 'shiny', 'whiskers': False}),
    ('dog', 'sleeping', 'dog-sleeping', {'eye': 'sleepy', 'mouth': 'sleep', 'cheek': 'none', 'whiskers': False}),
    ('dog', 'hugging', 'dog-hugging', {'eye': 'heart', 'mouth': 'small_w', 'cheek': 'pink', 'whiskers': False}),
    ('fox', 'sitting', 'fox-sitting', {'eye': 'big_round', 'mouth': 'smirk', 'cheek': 'pink', 'whiskers': False}),
    ('fox', 'standing', 'fox-standing', {'eye': 'sparkly', 'mouth': 'small_w', 'cheek': 'big', 'whiskers': False}),
    ('fox', 'waving', 'fox-waving', {'eye': 'wink', 'mouth': 'open_smile', 'cheek': 'shiny', 'whiskers': False}),
    ('fox', 'sleeping', 'fox-sleeping', {'eye': 'sleepy', 'mouth': 'sleep', 'cheek': 'none', 'whiskers': False}),
    ('fox', 'hugging', 'fox-hugging', {'eye': 'heart', 'mouth': 'small_w', 'cheek': 'pink', 'whiskers': False}),
    ('rabbit', 'sitting', 'rabbit-sitting', {'eye': 'big_round', 'mouth': 'small_w', 'cheek': 'pink', 'whiskers': True}),
    ('rabbit', 'standing', 'rabbit-standing', {'eye': 'sparkly', 'mouth': 'open_smile', 'cheek': 'big', 'whiskers': True}),
    ('rabbit', 'floppy', 'rabbit-floppy', {'eye': 'wink', 'mouth': 'smirk', 'cheek': 'shiny', 'whiskers': True}),
    ('rabbit', 'holding', 'rabbit-holding-carrot', {'eye': 'big_round', 'mouth': 'tiny', 'cheek': 'pink', 'whiskers': True, 'accessory': 'carrot'}),
    ('rabbit', 'sleeping', 'rabbit-sleeping', {'eye': 'sleepy', 'mouth': 'sleep', 'cheek': 'none', 'whiskers': False}),
    ('rabbit', 'hugging', 'rabbit-hugging', {'eye': 'heart', 'mouth': 'small_w', 'cheek': 'pink', 'whiskers': True}),
    ('bear', 'sitting', 'bear-sitting', {'eye': 'big_round', 'mouth': 'small_w', 'cheek': 'pink', 'whiskers': False}),
    ('bear', 'standing', 'bear-standing', {'eye': 'sparkly', 'mouth': 'open_smile', 'cheek': 'big', 'whiskers': False}),
    ('bear', 'waving', 'bear-waving', {'eye': 'wink', 'mouth': 'smirk', 'cheek': 'shiny', 'whiskers': False}),
    ('bear', 'sleeping', 'bear-sleeping', {'eye': 'sleepy', 'mouth': 'sleep', 'cheek': 'none', 'whiskers': False}),
    ('bear', 'hugging', 'bear-hugging', {'eye': 'heart', 'mouth': 'small_w', 'cheek': 'pink', 'whiskers': False}),
    ('penguin', 'standing', 'penguin-standing', {'eye': 'big_round', 'mouth': 'small_w', 'cheek': 'pink', 'whiskers': False}),
    ('penguin', 'waving', 'penguin-waving', {'eye': 'sparkly', 'mouth': 'open_smile', 'cheek': 'big', 'whiskers': False}),
    ('penguin', 'lying', 'penguin-lying', {'eye': 'sleepy', 'mouth': 'sleep', 'cheek': 'none', 'whiskers': False}),
    ('penguin', 'hugging', 'penguin-hugging', {'eye': 'heart', 'mouth': 'small_w', 'cheek': 'pink', 'whiskers': False}),
    ('penguin', 'sleeping', 'penguin-sleeping', {'eye': 'sleepy', 'mouth': 'sleep', 'cheek': 'none', 'whiskers': False}),
]


def run_golden_samples():
    for animal, pose, slug, style in GOLDEN_SAMPLES:
        skeleton = CharacterSkeleton.for_animal(animal, pose=pose, style=style)
        grid = compose_animal_v2_5(skeleton, style)
        rules = {'required': ['beak', 'eyes'] if animal == 'penguin' else ['ears', 'eyes', 'nose', 'body']}
        score, reasons = QualityValidatorV2(grid, skeleton, rules).evaluate()
        v1_score, v1_reasons = QualityValidator(grid, rules).evaluate()

        data = {
            'animal': animal,
            'pose': pose,
            'slug': slug,
            'style': style,
            'quality_score': score,
            'quality_reasons': reasons,
            'v1_score': v1_score,
            'grid': grid,
            'color_palette': v1_to_color_palette(grid),
        }
        (OUT_DIR / f'{slug}.json').write_text(json.dumps(data, indent=2), encoding='utf-8')
        v1_render_grid(grid, finished=False, output_path=OUT_DIR / f'{slug}-cover.png')
        v1_render_grid(grid, finished=True, output_path=OUT_DIR / f'{slug}-finished.png')
        print(f'{slug}: v2={score}, v1={v1_score}')

    # Summary
    import glob
    all_files = sorted(glob.glob(str(OUT_DIR / '*.json')))
    scores = [json.load(open(f))['quality_score'] for f in all_files]
    avg = sum(scores) / len(scores)
    print(f'\n=== Summary ===')
    print(f'Average: {avg:.1f}')
    print(f'Min: {min(scores)}, Max: {max(scores)}')
    print(f'Low (<80): {[json.load(open(f))["slug"] for f in all_files if json.load(open(f))["quality_score"] < 80]}')
    print(f'Preview: {OUT_DIR}')


if __name__ == '__main__':
    run_golden_samples()
