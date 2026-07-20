#!/usr/bin/env python3
"""Pixel Character Composer v2.6

Goal: Animal Identity Upgrade. Move from color-swapped round animals to
animals with distinct anatomy (head, ears, snout, body, tail, limbs).

Backwards compatible: same grid format as v1.1/v2.0/v2.5.
"""

from __future__ import annotations

import json
import random
from collections import Counter
from copy import deepcopy
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from composer import (
    HEX_MAP,
    QualityValidator,
    render_grid as v1_render_grid,
    to_color_palette as v1_to_color_palette,
    to_hex_grid as v1_to_hex_grid,
)

OUT_DIR = Path('/tmp/bead-character-v2_6')
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


# ============= Character Skeleton v2.6 =============

class CharacterSkeleton:
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
        material_style: str = 'premium',
        body_type: str = 'medium',
        face_type: str = 'standard',
        eye_type: str = 'round',
        flipper_angle: str = 'down',
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
        self.material_style = material_style
        self.body_type = body_type
        self.face_type = face_type
        self.eye_type = eye_type
        self.flipper_angle = flipper_angle
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
            'cat': {'base_color': 'W', 'accent_color': 'P'},
            'panda': {'base_color': 'W', 'accent_color': 'K'},
            'dog': {'base_color': 'N', 'accent_color': 'W'},
            'fox': {'base_color': 'O', 'accent_color': 'W'},
            'rabbit': {'base_color': 'W', 'accent_color': 'Q'},
            'bear': {'base_color': 'N', 'accent_color': 'W'},
            'penguin': {'base_color': 'K', 'accent_color': 'W'},
        }
        d = defaults.get(animal, {'base_color': 'W', 'accent_color': 'P'})
        pose_presets = POSE_PRESETS.get(pose, POSE_PRESETS['sitting'])
        return cls(
            animal=animal,
            pose=pose,
            body_shape=body_shape,
            body_rotation=pose_presets.get('body_rotation', 0),
            head_tilt=pose_presets.get('head_tilt', 0),
            arm_position=pose_presets.get('arm_position', 'side'),
            leg_position=pose_presets.get('leg_position', 'folded'),
            base_color=d.get('base_color', 'W'),
            accent_color=d.get('accent_color', 'P'),
            accessory=style.get('accessory'),
            material_style=style.get('material_style', 'premium'),
            body_type=style.get('body_type', 'medium'),
            face_type=style.get('face_type', 'standard'),
            eye_type=style.get('eye_type', 'round'),
            flipper_angle=style.get('flipper_angle', 'down'),
            seed=seed,
        )


# ============= Animal Anatomy Engine =============

@dataclass
class AnatomyProfile:
    animal: str
    head_shape: str          # round, oval, pointed, triangular, flat
    head_rx: int
    head_ry: int
    head_cy: float
    ear_shape: str           # round, pointed, long, floppy, none, tufted
    ear_rx: int
    ear_ry: int
    ear_offset_y: int
    snout_shape: str         # short, medium, long, pointed, flat, beak
    snout_rx: int
    snout_ry: int
    snout_offset_y: int
    body_shape: str          # chubby, slim, pear, athletic, oval
    body_rx: int
    body_ry: int
    body_cy: float
    tail_shape: str          # none, round, fluffy, long, tiny, curved
    limb_type: str           # paw, flipper, wing, none
    limb_short: bool
    accent_color: str
    signature_traits: List[str]


ANATOMY_PRESETS: Dict[str, AnatomyProfile] = {
    'cat': AnatomyProfile(
        animal='cat', head_shape='round', head_rx=12, head_ry=9, head_cy=0.32,
        ear_shape='pointed', ear_rx=5, ear_ry=8, ear_offset_y=2,
        snout_shape='short', snout_rx=3, snout_ry=2, snout_offset_y=2,
        body_shape='slim', body_rx=9, body_ry=8, body_cy=0.62,
        tail_shape='long', limb_type='paw', limb_short=False,
        accent_color='P', signature_traits=['pointed ears', 'slim body', 'long tail', 'whiskers'],
    ),
    'dog': AnatomyProfile(
        animal='dog', head_shape='oval', head_rx=13, head_ry=11, head_cy=0.32,
        ear_shape='floppy', ear_rx=4, ear_ry=5, ear_offset_y=2,
        snout_shape='medium', snout_rx=5, snout_ry=3, snout_offset_y=1,
        body_shape='athletic', body_rx=10, body_ry=9, body_cy=0.62,
        tail_shape='curved', limb_type='paw', limb_short=False,
        accent_color='W', signature_traits=['floppy ears', 'medium snout', 'curved tail'],
    ),
    'fox': AnatomyProfile(
        animal='fox', head_shape='polygon', head_rx=13, head_ry=11, head_cy=0.32,
        ear_shape='pointed', ear_rx=7, ear_ry=10, ear_offset_y=2,
        snout_shape='long_pointed', snout_rx=7, snout_ry=7, snout_offset_y=3,
        body_shape='slim', body_rx=9, body_ry=7, body_cy=0.62,
        tail_shape='fluffy', limb_type='paw', limb_short=False,
        accent_color='W', signature_traits=['pointed snout', 'large triangular ears', 'big fluffy tail'],
    ),
    'rabbit': AnatomyProfile(
        animal='rabbit', head_shape='round', head_rx=11, head_ry=9, head_cy=0.30,
        ear_shape='long', ear_rx=3, ear_ry=11, ear_offset_y=2,
        snout_shape='short', snout_rx=3, snout_ry=2, snout_offset_y=2,
        body_shape='pear', body_rx=9, body_ry=7, body_cy=0.64,
        tail_shape='round', limb_type='paw', limb_short=True,
        accent_color='Q', signature_traits=['long ears', 'pear body', 'cotton tail', 'big feet'],
    ),
    'bear': AnatomyProfile(
        animal='bear', head_shape='round', head_rx=14, head_ry=12, head_cy=0.34,
        ear_shape='round', ear_rx=4, ear_ry=4, ear_offset_y=2,
        snout_shape='short', snout_rx=4, snout_ry=3, snout_offset_y=2,
        body_shape='chubby', body_rx=12, body_ry=11, body_cy=0.63,
        tail_shape='tiny', limb_type='paw', limb_short=True,
        accent_color='W', signature_traits=['round head', 'chubby body', 'round ears', 'tiny tail'],
    ),
    'panda': AnatomyProfile(
        animal='panda', head_shape='round', head_rx=14, head_ry=12, head_cy=0.34,
        ear_shape='round', ear_rx=4, ear_ry=4, ear_offset_y=2,
        snout_shape='flat', snout_rx=5, snout_ry=4, snout_offset_y=2,
        body_shape='chubby', body_rx=12, body_ry=11, body_cy=0.63,
        tail_shape='tiny', limb_type='paw', limb_short=True,
        accent_color='W', signature_traits=['black eye patches', 'black ears', 'black limbs', 'white belly'],
    ),
    'penguin': AnatomyProfile(
        animal='penguin', head_shape='round', head_rx=7, head_ry=6, head_cy=0.24,
        ear_shape='none', ear_rx=0, ear_ry=0, ear_offset_y=0,
        snout_shape='beak', snout_rx=3, snout_ry=2, snout_offset_y=0,
        body_shape='oval', body_rx=11, body_ry=16, body_cy=0.62,
        tail_shape='none', limb_type='flipper', limb_short=True,
        accent_color='W', signature_traits=['tall oval body', 'flippers', 'webbed feet', 'orange beak'],
    ),
}


def get_anatomy(animal: str) -> AnatomyProfile:
    return ANATOMY_PRESETS.get(animal, ANATOMY_PRESETS['cat'])


# ============= Pose Engine v2 =============

POSE_PRESETS: Dict[str, dict] = {
    'sitting': {'body_rotation': 0, 'head_tilt': 0, 'arm_position': 'side', 'leg_position': 'folded'},
    'standing': {'body_rotation': 0, 'head_tilt': 0, 'arm_position': 'side', 'leg_position': 'straight'},
    'hugging': {'body_rotation': 5, 'head_tilt': -3, 'arm_position': 'front', 'leg_position': 'folded'},
    'holding': {'body_rotation': 8, 'head_tilt': 2, 'arm_position': 'raised', 'leg_position': 'folded'},
    'sleeping': {'body_rotation': 0, 'head_tilt': 12, 'arm_position': 'folded', 'leg_position': 'folded'},
    'waving': {'body_rotation': 6, 'head_tilt': -4, 'arm_position': 'up', 'leg_position': 'straight'},
    'eating': {'body_rotation': 0, 'head_tilt': 6, 'arm_position': 'front', 'leg_position': 'folded'},
    'puppy': {'body_rotation': 0, 'head_tilt': 3, 'arm_position': 'front', 'leg_position': 'folded'},
    'floppy': {'body_rotation': 0, 'head_tilt': 5, 'arm_position': 'side', 'leg_position': 'folded'},
    'lying': {'body_rotation': 0, 'head_tilt': 8, 'arm_position': 'folded', 'leg_position': 'crossed'},
}


# ============= Feature Library v2 =============

class FeatureLibrary:
    @staticmethod
    def paint_eye_stamp(comp: LayerComposer, cx: int, cy: int, eye_type: str) -> None:
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
        elif eye_type == 'cat_slit':
            comp.fill_circle(cx, cy, 3, 'K')
            comp.set(cx - 1, cy, 'W')
            comp.set(cx, cy, 'W')
            comp.set(cx + 1, cy, 'W')
            comp.set(cx, cy + 1, 'K')
            comp.set(cx - 2, cy + 1, 'K')
            comp.set(cx + 2, cy + 1, 'K')
            # Slanted eyelid line top
            comp.set(cx - 1, cy - 2, 'K')
            comp.set(cx, cy - 2, 'K')
            comp.set(cx + 1, cy - 2, 'K')
            comp.set(cx + 2, cy - 1, 'K')
            comp.set(cx - 2, cy - 1, 'K')
        elif eye_type == 'slanted':
            # Fox / almond eye
            for x in range(cx - 3, cx + 4):
                comp.set(x, cy, 'K')
            for x in range(cx - 2, cx + 3):
                comp.set(x, cy - 1, 'K')
                comp.set(x, cy + 1, 'K')
            comp.set(cx - 3, cy - 1, 'K')
            comp.set(cx + 3, cy - 1, 'K')
            comp.set(cx, cy, 'W')
            comp.set(cx - 1, cy, 'W')
            comp.set(cx + 1, cy, 'W')
        elif eye_type == 'sleepy_dot':
            comp.fill_circle(cx, cy, 2, 'K')
            comp.set(cx - 1, cy - 1, 'W')
            comp.set(cx + 1, cy - 1, 'W')
        elif eye_type == 'sleepy':
            for x in range(cx - 2, cx + 3):
                comp.set(x, cy + 1, 'K')
            comp.set(cx - 1, cy, 'K')
            comp.set(cx, cy, 'K')
            comp.set(cx + 1, cy, 'K')
        elif eye_type == 'wink':
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


# ============= Expression Engine =============

EXPRESSIONS = {
    'happy': {'eye': 'sparkly', 'mouth': 'open_smile', 'cheek': 'big'},
    'cute': {'eye': 'big_round', 'mouth': 'small_w', 'cheek': 'pink'},
    'sleepy': {'eye': 'sleepy', 'mouth': 'sleep', 'cheek': 'none'},
    'surprised': {'eye': 'big_round', 'mouth': 'surprised', 'cheek': 'none'},
    'sad': {'eye': 'crying', 'mouth': 'line', 'cheek': 'none'},
    'cool': {'eye': 'tiny', 'mouth': 'smirk', 'cheek': 'none'},
    'love': {'eye': 'heart', 'mouth': 'small_w', 'cheek': 'shiny'},
    'excited': {'eye': 'sparkly', 'mouth': 'open_smile', 'cheek': 'big'},
    'calm': {'eye': 'big_round', 'mouth': 'tiny', 'cheek': 'pink'},
}


# ============= Silhouette Composer v2.6 =============

class SilhouetteComposer:
    def __init__(self, comp: LayerComposer, skeleton: CharacterSkeleton):
        self.comp = comp
        self.s = skeleton
        self.a = get_anatomy(skeleton.animal)
        self.body_cy = int(CANVAS_H * self.a.body_cy)

    def _base(self) -> str:
        return self.s.base_color or 'W'

    def _shadow(self) -> str:
        return 'S'

    def _rot(self, cx: int, cy: int, rx: int, ry: int, rotation: int, ch: str) -> None:
        for y in range(cy - ry - 4, cy + ry + 5):
            for x in range(cx - rx - 4, cx + rx + 5):
                dx = x - cx
                dy = y - cy
                rx_eff = max(1, rx + int(dy * rotation / 40))
                val = (dx * dx) / (rx_eff * rx_eff) + (dy * dy) / max(1, ry * ry)
                if val <= 1.0:
                    self.comp.set(x, y, ch)

    def draw_head(self, cx: int, cy: int) -> None:
        base = self._base()
        a = self.a
        # Apply face_type scaling
        rx, ry = a.head_rx, a.head_ry
        face_type = getattr(self.s, 'face_type', 'standard')
        if face_type == 'wide':
            rx = int(rx * 1.25)
            ry = int(ry * 0.95)
        elif face_type == 'narrow':
            rx = int(rx * 0.85)
            ry = int(ry * 1.0)
        elif face_type == 'long':
            rx = int(rx * 0.95)
            ry = int(ry * 1.15)
        elif face_type == 'baby':
            rx = int(rx * 1.1)
            ry = int(ry * 0.9)
        elif face_type == 'flat':
            rx = int(rx * 1.15)
            ry = int(ry * 0.85)
        rx = max(5, rx)
        ry = max(5, ry)

        # Shadow outline
        if a.head_shape == 'polygon':
            # Fox long polygonal face
            self._draw_polygon_head(cx, cy, rx + 1, ry + 1, 'S')
            self._draw_polygon_head(cx, cy, rx, ry, base)
        elif a.head_shape == 'triangular':
            # Triangle-ish head with rounded chin
            self._draw_triangle_head(cx, cy, rx + 1, ry + 1, 'S')
            self._draw_triangle_head(cx, cy, rx, ry, base)
        elif a.head_shape == 'oval':
            self._rot(cx, cy, rx + 1, ry + 1, self.s.body_rotation, 'S')
            self._rot(cx, cy, rx, ry, self.s.body_rotation, base)
        else:  # round
            self._rot(cx, cy, rx + 1, ry + 1, self.s.body_rotation, 'S')
            self._rot(cx, cy, rx, ry, self.s.body_rotation, base)

    def _draw_polygon_head(self, cx: int, cy: int, rx: int, ry: int, ch: str) -> None:
        # Fox face: wide top, taper to narrow chin, long muzzle area
        for y in range(cy - ry, cy + ry + 1):
            progress = (y - (cy - ry)) / max(1, 2 * ry)
            if progress < 0.35:
                # Upper wide head (forehead)
                half = int(rx * (1 - progress * 0.3))
            elif progress < 0.65:
                # Mid narrows slightly (eye region)
                half = int(rx * (0.9 - (progress - 0.35) * 0.4))
            else:
                # Long lower snout tapers to chin
                half = int(rx * (0.78 - (progress - 0.65) * 0.9))
            half = max(1, half)
            for x in range(cx - half, cx + half + 1):
                self.comp.set(x, y, ch)

    def _draw_triangle_head(self, cx: int, cy: int, rx: int, ry: int, ch: str) -> None:
        # Top center, tapering down to chin
        for y in range(cy - ry, cy + ry + 1):
            progress = (y - (cy - ry)) / max(1, 2 * ry)
            half_width = int(rx * (1 - progress * 0.5))
            for x in range(cx - half_width, cx + half_width + 1):
                self.comp.set(x, y, ch)

    def draw_body(self, cx: int, cy: int) -> int:
        base = self._base()
        a = self.a
        # Apply body_type variations for non-Bear animals
        body_rx, body_ry, body_cy = a.body_rx, a.body_ry, a.body_cy
        if self.s.body_type == 'chubby':
            body_rx = int(body_rx * 1.25)
            body_ry = int(body_ry * 1.15)
        elif self.s.body_type == 'slim':
            body_rx = int(body_rx * 0.85)
            body_ry = int(body_ry * 0.95)
        elif self.s.body_type == 'small':
            body_rx = int(body_rx * 0.75)
            body_ry = int(body_ry * 0.80)

        cy = int(CANVAS_H * body_cy)

        if a.body_shape == 'pear':
            # Upper narrow, lower wide
            self._draw_pear(cx, cy, body_rx + 1, body_ry + 1, 'S')
            self._draw_pear(cx, cy, body_rx, body_ry, base)
        elif a.body_shape == 'slim':
            self._rot(cx, cy, body_rx + 1, body_ry + 1, self.s.body_rotation, 'S')
            self._rot(cx, cy, body_rx, body_ry, self.s.body_rotation, base)
        elif a.body_shape == 'athletic':
            self._rot(cx, cy, body_rx + 1, body_ry + 1, self.s.body_rotation, 'S')
            self._rot(cx, cy, body_rx, body_ry, self.s.body_rotation, base)
        elif a.body_shape == 'oval':
            self._rot(cx, cy, body_rx + 1, body_ry + 1, self.s.body_rotation, 'S')
            self._rot(cx, cy, body_rx, body_ry, self.s.body_rotation, base)
        else:  # chubby
            self._rot(cx, cy, body_rx + 1, body_ry + 1, self.s.body_rotation, 'S')
            self._rot(cx, cy, body_rx, body_ry, self.s.body_rotation, base)

        return cy  # Return actual body center y for downstream use

    def _draw_pear(self, cx: int, cy: int, rx: int, ry: int, ch: str) -> None:
        for y in range(cy - ry, cy + ry + 1):
            progress = (y - (cy - ry)) / max(1, 2 * ry)
            half_width = int(rx * (0.7 + progress * 0.4))
            for x in range(cx - half_width, cx + half_width + 1):
                self.comp.set(x, y, ch)

    def draw_ears(self, cx: int, head_cy: int) -> None:
        base = self._base()
        a = self.a
        if a.ear_shape == 'none':
            return
        # Panda: black ears regardless of base color
        ear_base = 'K' if a.animal == 'panda' else base
        # Face type affects ear size
        rx, ry = a.ear_rx, a.ear_ry
        face_type = getattr(self.s, 'face_type', 'standard')
        if face_type == 'wide':
            rx = int(rx * 1.2)
        elif face_type == 'narrow':
            rx = int(rx * 0.85)
        elif face_type == 'baby':
            rx = int(rx * 0.8)
            ry = int(ry * 0.85)
        rx = max(2, rx)
        ry = max(2, ry)
        for side in [-1, 1]:
            ecx = cx + side * (a.head_rx + 1)
            ecy = head_cy - a.head_ry - a.ear_offset_y
            if a.ear_shape == 'long':
                # Rabbit long tapered ear
                self._draw_tapered_ear(ecx, ecy, rx, ry, side, ear_base)
                self._draw_tapered_ear(ecx, ecy, rx - 1, ry - 2, side, 'W')
                self._draw_tapered_ear(ecx, ecy + 1, rx - 2, ry - 4, side, 'Q')
                self.comp.set(ecx, ecy - ry, 'Z')
            elif a.ear_shape == 'pointed':
                # Triangle/cat/fox ear
                self._draw_triangle_ear(ecx, ecy, rx, ry, side, ear_base)
                self._draw_triangle_ear(ecx, ecy, rx - 2, ry - 2, side, 'Q')
                self.comp.set(ecx, ecy - ry, 'Z')
            elif a.ear_shape == 'floppy':
                # Dog floppy ear hanging down
                self.comp.fill_ellipse(ecx, ecy + ry // 2, rx, ry, ear_base)
                self.comp.fill_ellipse(ecx, ecy + ry // 2, rx - 1, ry - 2, 'Q')
                self.comp.set(ecx, ecy + ry, 'Z')
            elif a.ear_shape == 'round':
                # Bear/panda round ear
                self.comp.fill_ellipse(ecx, ecy, rx, ry, ear_base)
                self.comp.fill_ellipse(ecx, ecy, rx - 2, ry - 2, 'Q')
                self.comp.set(ecx, ecy - ry + 1, 'Z')
                # Panda ears: solid black outer, smaller white inner
                if a.animal == 'panda':
                    self.comp.fill_ellipse(ecx, ecy, rx - 1, ry - 1, 'K')
                    self.comp.fill_ellipse(ecx, ecy, rx - 3, ry - 3, 'W')

    def _draw_tapered_ear(self, cx: int, cy: int, rx: int, ry: int, side: int, ch: str) -> None:
        for y in range(cy - ry, cy + ry + 1):
            progress = (y - (cy - ry)) / max(1, 2 * ry)
            half_width = max(1, int(rx * (1.0 - progress * 0.7)))
            for x in range(cx - half_width, cx + half_width + 1):
                self.comp.set(x, y, ch)

    def _draw_triangle_ear(self, cx: int, cy: int, rx: int, ry: int, side: int, ch: str) -> None:
        for y in range(cy - ry, cy + 1):
            progress = (y - (cy - ry)) / max(1, ry)
            half_width = max(1, int(rx * (1.0 - progress)))
            for x in range(cx - half_width, cx + half_width + 1):
                self.comp.set(x, y, ch)

    def draw_snout(self, cx: int, head_cy: int) -> None:
        a = self.a
        if a.snout_shape == 'none':
            return
        base = self._base()
        sy = head_cy + a.snout_offset_y
        if a.snout_shape == 'pointed':
            # Fox pointed snout: sharp downward triangle
            for y in range(sy - a.snout_ry, sy + a.snout_ry + 1):
                progress = (y - (sy - a.snout_ry)) / max(1, 2 * a.snout_ry)
                half = max(1, int(a.snout_rx * (1 - progress * 0.85)))
                for x in range(cx - half, cx + half + 1):
                    self.comp.set(x, y, 'W')
            # Dark tip and nose bridge
            for y in range(sy - 1, sy + a.snout_ry - 1):
                self.comp.set(cx - 1, y, 'K')
                self.comp.set(cx, y, 'K')
                self.comp.set(cx + 1, y, 'K')
            # Orange-ish cheeks above snout
            self.comp.set(cx - a.snout_rx + 1, sy - 2, 'O')
            self.comp.set(cx + a.snout_rx - 1, sy - 2, 'O')
        elif a.snout_shape == 'long_pointed':
            # Fox long pointed muzzle: starts wide below eyes, tapers to dark tip
            for y in range(sy - a.snout_ry, sy + a.snout_ry + 1):
                progress = (y - (sy - a.snout_ry)) / max(1, 2 * a.snout_ry)
                half = max(1, int(a.snout_rx * (1 - progress * 0.75)))
                for x in range(cx - half, cx + half + 1):
                    self.comp.set(x, y, 'W')
            # Dark long nose bridge
            for y in range(sy - 2, sy + a.snout_ry - 2):
                self.comp.set(cx - 1, y, 'K')
                self.comp.set(cx, y, 'K')
                self.comp.set(cx + 1, y, 'K')
            # Black nose tip
            self.comp.set(cx - 1, sy + a.snout_ry - 2, 'K')
            self.comp.set(cx, sy + a.snout_ry - 2, 'K')
            self.comp.set(cx + 1, sy + a.snout_ry - 2, 'K')
            self.comp.set(cx, sy + a.snout_ry - 1, 'K')
            # White jaw sides + chin accent
            self.comp.set(cx - a.snout_rx + 1, sy + a.snout_ry - 2, 'W')
            self.comp.set(cx + a.snout_rx - 1, sy + a.snout_ry - 2, 'W')
        elif a.snout_shape == 'medium':
            # Dog snout: oval
            self.comp.fill_ellipse(cx, sy, a.snout_rx, a.snout_ry, 'W')
            self.comp.set(cx - 1, sy - 1, 'K')
            self.comp.set(cx, sy - 1, 'K')
            self.comp.set(cx + 1, sy - 1, 'K')
        elif a.snout_shape == 'short':
            # Cat/rabbit/bear small triangular nose + tiny muzzle
            self.comp.fill_ellipse(cx, sy, a.snout_rx, a.snout_ry, 'W')
            # Tiny cat nose triangle
            self.comp.set(cx, sy - 1, 'K')
            self.comp.set(cx - 1, sy, 'K')
            self.comp.set(cx, sy, 'K')
            self.comp.set(cx + 1, sy, 'K')
            self.comp.set(cx, sy + 1, 'K')
        elif a.snout_shape == 'flat':
            # Panda broad snout
            self.comp.fill_ellipse(cx, sy, a.snout_rx, a.snout_ry, 'W')
            self.comp.set(cx, sy - 1, 'K')
            self.comp.set(cx - 1, sy - 1, 'K')
            self.comp.set(cx + 1, sy - 1, 'K')
        elif a.snout_shape == 'beak':
            # Penguin beak (triangle) - drawn in draw_penguin_parts for better integration
            pass

    def draw_arms(self, cx: int, body_cy: int) -> None:
        base = self._base()
        a = self.a
        arm_y = body_cy - a.body_ry // 2
        pos = self.s.arm_position

        # Panda: black arms always
        arm_color = 'K' if a.animal == 'panda' else base

        if pos == 'side':
            for side in [-1, 1]:
                start_x = cx + side * (a.body_rx - 2)
                for dy in range(-2, 4):
                    self.comp.set(start_x + side * dy, arm_y + dy, arm_color)
                    self.comp.set(start_x + side * (dy + 1), arm_y + dy, 'S')
        elif pos == 'front':
            self.comp.set(cx - 2, arm_y, arm_color)
            self.comp.set(cx - 1, arm_y - 1, arm_color)
            self.comp.set(cx, arm_y - 2, arm_color)
            self.comp.set(cx + 1, arm_y - 1, arm_color)
            self.comp.set(cx + 2, arm_y, arm_color)
            self.comp.set(cx - 2, arm_y + 1, 'W')
            self.comp.set(cx + 2, arm_y + 1, 'W')
        elif pos == 'up':
            # Waving with body tilt
            tilt = self.s.body_rotation
            self.comp.set(cx + 2 + tilt, arm_y - 1, arm_color)
            self.comp.set(cx + 3 + tilt, arm_y - 3, arm_color)
            self.comp.set(cx + 4 + tilt, arm_y - 5, arm_color)
            self.comp.set(cx + 3 + tilt, arm_y - 6, 'W')
            self.comp.set(cx - 2 - tilt, arm_y, arm_color)
            self.comp.set(cx - 3 - tilt, arm_y - 1, arm_color)
        elif pos == 'raised':
            tilt = self.s.body_rotation
            self.comp.set(cx + 2 + tilt, arm_y - 2, arm_color)
            self.comp.set(cx + 3 + tilt, arm_y - 4, arm_color)
            self.comp.set(cx + 4 + tilt, arm_y - 6, arm_color)
            self.comp.set(cx + 3 + tilt, arm_y - 7, 'W')
            self.comp.set(cx - 2 - tilt, arm_y, arm_color)
            self.comp.set(cx - 3 - tilt, arm_y - 1, arm_color)
            if self.s.accessory == 'carrot':
                self.comp.set(cx + 4 + tilt, arm_y - 8, 'O')
                self.comp.set(cx + 4 + tilt, arm_y - 9, 'O')
                self.comp.set(cx + 5 + tilt, arm_y - 8, 'O')
                self.comp.set(cx + 3 + tilt, arm_y - 7, 'G')
        elif pos == 'folded':
            self.comp.set(cx - 2, arm_y, arm_color)
            self.comp.set(cx - 1, arm_y + 1, arm_color)
            self.comp.set(cx, arm_y + 2, arm_color)
            self.comp.set(cx + 1, arm_y + 1, arm_color)
            self.comp.set(cx + 2, arm_y, arm_color)

    def draw_legs(self, cx: int, body_cy: int) -> None:
        base = self._base()
        a = self.a
        leg_y = body_cy + a.body_ry - 2
        pos = self.s.leg_position

        # Panda: black legs always
        leg_color = 'K' if a.animal == 'panda' else base

        if a.limb_type == 'flipper':
            return
        if pos == 'folded':
            for side in [-1, 1]:
                for dy in range(0, 4):
                    self.comp.set(cx + side * (a.body_rx - 3) + side * dy, leg_y + dy, leg_color)
                    self.comp.set(cx + side * (a.body_rx - 3) + side * (dy + 1), leg_y + dy, 'W')
        elif pos == 'straight':
            for side in [-1, 1]:
                for dy in range(0, 4):
                    self.comp.set(cx + side * (a.body_rx - 3), leg_y + dy, leg_color)
                    self.comp.set(cx + side * (a.body_rx - 3) + side, leg_y + dy, 'W')
        elif pos == 'crossed':
            self.comp.set(cx - 2, leg_y, leg_color)
            self.comp.set(cx - 1, leg_y + 1, leg_color)
            self.comp.set(cx, leg_y + 2, leg_color)
            self.comp.set(cx + 1, leg_y + 1, leg_color)
            self.comp.set(cx + 2, leg_y, leg_color)
        # Rabbit big feet
        if self.s.animal == 'rabbit':
            for side in [-1, 1]:
                for dx in range(0, 3):
                    self.comp.set(cx + side * (a.body_rx - 2 + dx), leg_y + 3, 'W')
                    self.comp.set(cx + side * (a.body_rx - 2 + dx), leg_y + 4, 'W')
                    self.comp.set(cx + side * (a.body_rx - 2 + dx), leg_y + 5, 'W')
                # Hind leg bump
                for dy in range(1, 4):
                    self.comp.set(cx + side * (a.body_rx - 1), leg_y + dy, 'W')

    def draw_tail(self, cx: int, body_cy: int) -> None:
        base = self._base()
        a = self.a
        if a.tail_shape == 'none':
            return
        if a.tail_shape == 'round':
            # Rabbit cotton tail
            self.comp.fill_circle(cx - a.body_rx - 3, body_cy, 3, 'W')
            self.comp.set(cx - a.body_rx - 3, body_cy - 2, 'Z')
        elif a.tail_shape == 'fluffy':
            # Fox big fluffy tail (white tip, wider)
            for i in range(10):
                self.comp.set(cx + a.body_rx + 2 + i, body_cy - 3 + i, base)
                self.comp.set(cx + a.body_rx + 3 + i, body_cy - 3 + i, 'W')
                self.comp.set(cx + a.body_rx + 2 + i, body_cy - 4 + i, base)
                if i < 3:
                    self.comp.set(cx + a.body_rx + 4 + i, body_cy - 2 + i, base)
            # White tip
            for i in range(7, 10):
                self.comp.set(cx + a.body_rx + 2 + i, body_cy - 3 + i, 'W')
                self.comp.set(cx + a.body_rx + 3 + i, body_cy - 3 + i, 'W')
            self.comp.set(cx + a.body_rx + 10, body_cy + 5, 'Z')
        elif a.tail_shape == 'long':
            # Cat long tail curving up - wrapped if sitting
            if self.s.pose == 'sitting':
                # Tail wraps around left side of body
                for i in range(6):
                    self.comp.set(cx - a.body_rx - 1 - i, body_cy + 4 - i, base)
                    self.comp.set(cx - a.body_rx - 1 - i, body_cy + 5 - i, 'W')
                # Tail tip curls up
                self.comp.set(cx - a.body_rx - 6, body_cy - 2, 'Z')
            else:
                for i in range(7):
                    self.comp.set(cx - a.body_rx - 2 - i, body_cy + 2 + i, base)
                    self.comp.set(cx - a.body_rx - 2 - i, body_cy + 1 + i, 'W')
                self.comp.set(cx - a.body_rx - 7, body_cy + 6, 'Z')
        elif a.tail_shape == 'tiny':
            # Bear tiny tail
            self.comp.set(cx - a.body_rx - 2, body_cy + 2, base)
            self.comp.set(cx - a.body_rx - 3, body_cy + 3, base)
            self.comp.set(cx - a.body_rx - 2, body_cy + 3, 'W')
        elif a.tail_shape == 'curved':
            # Dog curved tail
            for i in range(4):
                self.comp.set(cx + a.body_rx + 1 + i, body_cy - 3 + i, base)
                self.comp.set(cx + a.body_rx + 1 + i, body_cy - 4 + i, 'W')
            self.comp.set(cx + a.body_rx + 4, body_cy - 1, 'Z')

    def draw_penguin_parts(self, cx: int, body_cy: int) -> None:
        a = self.a
        # White belly oval (smaller, merged into body silhouette)
        self.comp.fill_ellipse(cx, body_cy + 1, max(3, a.body_rx - 2), max(3, a.body_ry - 3), 'W')
        # Flippers - wider, attached to body sides, downward by default
        flip_y = body_cy - a.body_ry // 2
        angle = self.s.flipper_angle
        for side in [-1, 1]:
            base_x = cx + side * (a.body_rx + 1)
            if angle == 'down':
                # Downward hanging flippers (like real penguin)
                for dy in range(0, 8):
                    self.comp.set(base_x + side * (dy // 2), flip_y + dy, 'K')
                    self.comp.set(base_x + side * (dy // 2 + 1), flip_y + dy, 'K')
                    self.comp.set(base_x + side * (dy // 2 - 1), flip_y + dy, 'S')
                self.comp.set(base_x + side * 3, flip_y + 7, 'Z')
            elif angle == 'open':
                # Raised slightly open
                for dy in range(-2, 5):
                    self.comp.set(base_x + side * dy, flip_y + dy, 'K')
                    self.comp.set(base_x + side * (dy + 1), flip_y + dy, 'K')
                    self.comp.set(base_x + side * (dy - 1), flip_y + dy, 'S')
                self.comp.set(base_x + side * 5, flip_y + 4, 'Z')
            else:  # side (original)
                for dy in range(0, 7):
                    self.comp.set(base_x + side * dy, flip_y + dy, 'K')
                    self.comp.set(base_x + side * (dy + 1), flip_y + dy, 'K')
                    self.comp.set(base_x + side * (dy - 1), flip_y + dy, 'S')
                self.comp.set(base_x + side * 6, flip_y + 6, 'Z')
        # Beak: triangle orange
        beak_y = int(CANVAS_H * a.head_cy) + 2
        self.comp.set(cx - 1, beak_y, 'O')
        self.comp.set(cx, beak_y, 'O')
        self.comp.set(cx + 1, beak_y, 'O')
        self.comp.set(cx - 1, beak_y + 1, 'O')
        self.comp.set(cx, beak_y + 1, 'O')
        self.comp.set(cx + 1, beak_y + 1, 'O')
        self.comp.set(cx, beak_y + 2, 'Y')
        self.comp.set(cx - 1, beak_y + 3, 'Y')
        self.comp.set(cx, beak_y + 3, 'Y')
        self.comp.set(cx + 1, beak_y + 3, 'Y')
        # Feet - large orange webbed
        foot_y = body_cy + a.body_ry + 1
        for side in [-1, 1]:
            for dx in range(0, 4):
                self.comp.set(cx + side * (3 + dx), foot_y, 'O')
                self.comp.set(cx + side * (3 + dx), foot_y + 1, 'O')
            # Webbed toes
            self.comp.set(cx + side * 6, foot_y + 2, 'O')
            self.comp.set(cx + side * 5, foot_y + 2, 'O')
            self.comp.set(cx + side * 4, foot_y + 2, 'Z')

    def compose(self) -> LayerComposer:
        cx = self.comp.w // 2
        a = self.a
        head_cy = int(CANVAS_H * a.head_cy + self.s.head_tilt)

        # Body (returns actual center y adjusted for body_type)
        body_cy = self.draw_body(cx, int(CANVAS_H * a.body_cy))
        if a.animal == 'penguin':
            self.draw_penguin_parts(cx, body_cy)
        else:
            self.draw_legs(cx, body_cy)
            self.draw_arms(cx, body_cy)
            self.draw_tail(cx, body_cy)

        # Head
        self.draw_head(cx, head_cy)
        self.draw_ears(cx, head_cy)
        self.draw_snout(cx, head_cy)

        return self.comp


# ============= Color Blocking v2.6 =============

class ColorBlocking:
    def __init__(self, comp: LayerComposer, skeleton: CharacterSkeleton):
        self.comp = comp
        self.s = skeleton
        self.a = get_anatomy(skeleton.animal)

    def apply(self, head_cy: int, body_cy: int) -> None:
        cx = self.comp.w // 2
        base = self.s.base_color
        a = self.a
        style = self.s.material_style

        # Panda: special identity treatment (avoid white bear look)
        if a.animal == 'panda':
            # Angled black eye patches
            patch_y = head_cy - 1
            left_eye = cx - int(a.head_rx * 0.4)
            right_eye = cx + int(a.head_rx * 0.4)
            for dx, dy in [(-2, 1), (-1, 0), (0, -1), (1, -2), (-1, 1), (0, 0), (1, -1), (0, 1), (1, 0)]:
                self.comp.set(left_eye + dx, patch_y + dy, 'K')
            for dx, dy in [(2, 1), (1, 0), (0, -1), (-1, -2), (1, 1), (0, 0), (-1, -1), (0, 1), (-1, 0)]:
                self.comp.set(right_eye + dx, patch_y + dy, 'K')
            self.comp.set(left_eye, patch_y, 'W')
            self.comp.set(right_eye, patch_y, 'W')
            # Small white belly only
            self.comp.fill_ellipse(cx, body_cy, max(2, int(a.body_rx * 0.45)), max(2, int(a.body_ry * 0.5)), 'W')
            # Black limbs already drawn in draw_arms/draw_legs
            # Black ears already drawn in draw_ears

        # Premium / kawaii: belly patch for non-panda animals
        elif style in ('premium', 'kawaii') and a.animal in ('penguin', 'bear', 'rabbit', 'dog', 'cat'):
            self.comp.fill_ellipse(cx, body_cy, max(3, int(a.body_rx * 0.65)), max(3, int(a.body_ry * 0.75)), 'W')
            self.comp.set(cx, body_cy - a.body_ry // 2, 'Z')

        # Premium / kawaii: muzzle accents
        if style in ('premium', 'kawaii') and a.animal == 'dog':
            self.comp.set(cx - 2, head_cy + a.snout_offset_y + 1, 'Z')
            self.comp.set(cx + 2, head_cy + a.snout_offset_y + 1, 'Z')
        if style in ('premium', 'kawaii') and a.animal == 'fox':
            self.comp.set(cx - a.head_rx + 2, head_cy + 2, 'W')
            self.comp.set(cx + a.head_rx - 2, head_cy + 2, 'W')
        if style in ('premium', 'kawaii') and a.animal == 'rabbit':
            self.comp.set(cx - a.head_rx + 2, head_cy + 3, 'Q')
            self.comp.set(cx + a.head_rx - 2, head_cy + 3, 'Q')

        # Penguin white face (only premium/kawaii)
        if style in ('premium', 'kawaii') and a.animal == 'penguin':
            self.comp.fill_ellipse(cx - 3, head_cy - 1, 3, 4, 'W')
            self.comp.fill_ellipse(cx + 3, head_cy - 1, 3, 4, 'W')
            # Keep beak area clear of white belly
            beak_y = head_cy + 2
            for y in range(beak_y, beak_y + 4):
                for x in range(cx - 2, cx + 3):
                    self.comp.set(x, y, '.')

        # Premium only: bead highlights and edge shadows
        if style == 'premium':
            for y in range(body_cy - a.body_ry, body_cy + a.body_ry):
                for x in range(cx - a.body_rx, cx + a.body_rx):
                    if self.comp.get(x, y) == base:
                        if self.comp.get(x + 1, y) == '.' or self.comp.get(x, y + 1) == '.':
                            if self.s.rng.random() < 0.12:
                                self.comp.set(x, y, 'Z')

        # Mini: reduce to base + outline only, remove most color blocks
        if style == 'mini':
            base = self.s.base_color or 'W'
            for y in range(self.comp.h):
                for x in range(self.comp.w):
                    ch = self.comp.get(x, y)
                    if ch == 'Z':
                        self.comp.set(x, y, base)
                    elif ch == 'S':
                        self.comp.set(x, y, 'K')

        # Kawaii: reduce Z frequency, keep clean
        if style == 'kawaii':
            base = self.s.base_color or 'W'
            for y in range(self.comp.h):
                for x in range(self.comp.w):
                    if self.comp.get(x, y) == 'Z':
                        self.comp.set(x, y, base)


# ============= Feature Painter v2.6 =============

class FeaturePainter:
    def __init__(self, comp: LayerComposer, skeleton: CharacterSkeleton, style: dict):
        self.comp = comp
        self.s = skeleton
        self.a = get_anatomy(skeleton.animal)
        self.style = style

    def paint(self, head_cy: int) -> None:
        cx = self.comp.w // 2
        a = self.a
        eye_y = head_cy - 1
        left_cx = cx - int(a.head_rx * 0.38)
        right_cx = cx + int(a.head_rx * 0.38)

        # Expression override
        expression = self.style.get('expression')
        if expression and expression in EXPRESSIONS:
            self.style.update(EXPRESSIONS[expression])

        eye_type = self.style.get('eye', 'big_round')
        # Character DNA: animal-specific eye_type override when not explicitly set
        if self.s.eye_type not in (None, 'round', 'big_round') and self.s.eye_type not in self.style:
            eye_type = self.s.eye_type
        # Animal specific eye presets
        if a.animal == 'cat':
            eye_type = self.style.get('eye', self.s.eye_type or 'cat_slit')
            whisker_thick = True
        elif a.animal == 'fox':
            eye_type = self.style.get('eye', self.s.eye_type or 'slanted')
        elif a.animal == 'panda':
            eye_type = self.style.get('eye', self.s.eye_type or 'sleepy_dot')
        elif a.animal == 'penguin':
            eye_type = self.style.get('eye', self.s.eye_type or 'big_round')
        else:
            eye_type = self.style.get('eye', 'big_round')
        mouth_type = self.style.get('mouth', 'small_w')
        cheek_type = self.style.get('cheek', 'pink')

        # Material style simplification
        if self.s.material_style == 'mini':
            eye_type = 'big_round'
            mouth_type = 'small_w'
            cheek_type = 'pink' if self.style.get('cheek') != 'none' else 'none'
        elif self.s.material_style == 'kawaii':
            if eye_type not in ('big_round', 'sparkly', 'sleepy', 'wink', 'cat_slit', 'slanted', 'sleepy_dot'):
                eye_type = 'big_round'

        FeatureLibrary.paint_eye_stamp(self.comp, left_cx, eye_y, eye_type)
        FeatureLibrary.paint_eye_stamp(self.comp, right_cx, eye_y, eye_type)

        # Nose / beak
        nose_y = head_cy + a.snout_offset_y
        if a.snout_shape == 'beak':
            # Penguin beak drawn after color blocking to avoid being overwritten
            beak_y = head_cy + 2
            self.comp.set(cx - 1, beak_y, 'O')
            self.comp.set(cx, beak_y, 'O')
            self.comp.set(cx + 1, beak_y, 'O')
            self.comp.set(cx - 1, beak_y + 1, 'O')
            self.comp.set(cx, beak_y + 1, 'O')
            self.comp.set(cx + 1, beak_y + 1, 'O')
            self.comp.set(cx, beak_y + 2, 'Y')
            self.comp.set(cx - 1, beak_y + 3, 'Y')
            self.comp.set(cx, beak_y + 3, 'Y')
            self.comp.set(cx + 1, beak_y + 3, 'Y')
        else:
            self.comp.set(cx - 1, nose_y, 'K')
            self.comp.set(cx, nose_y, 'K')
            self.comp.set(cx + 1, nose_y, 'K')
            self.comp.set(cx - 1, nose_y + 1, 'K')
            self.comp.set(cx + 1, nose_y + 1, 'K')
            self.comp.set(cx, nose_y + 1, 'W')

        mouth_y = nose_y + 2
        FeatureLibrary.paint_mouth_stamp(self.comp, cx, mouth_y, mouth_type)

        cheek_y = head_cy + 3
        FeatureLibrary.paint_cheek(self.comp, left_cx - 2, right_cx + 2, cheek_y, cheek_type)

        # Whiskers
        if (self.style.get('whiskers', False) or a.animal == 'cat') and a.animal in ('cat', 'rabbit'):
            whisker_y = cheek_y
            # Thick cat whiskers: 3 lines each side
            for x in range(left_cx - 7, left_cx - 2):
                self.comp.set(x, whisker_y, 'K')
            for x in range(right_cx + 3, right_cx + 8):
                self.comp.set(x, whisker_y, 'K')
            # Cat: second and third whisker rows
            if a.animal == 'cat':
                for x in range(left_cx - 6, left_cx - 2):
                    self.comp.set(x, whisker_y + 1, 'K')
                for x in range(right_cx + 3, right_cx + 7):
                    self.comp.set(x, whisker_y + 1, 'K')
                for x in range(left_cx - 5, left_cx - 2):
                    self.comp.set(x, whisker_y - 1, 'K')
                for x in range(right_cx + 3, right_cx + 6):
                    self.comp.set(x, whisker_y - 1, 'K')


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

        ratio = self.filled / (self.w * self.h)
        if 0.22 <= ratio <= 0.60:
            shape_score = 30
        elif ratio < 0.22:
            shape_score = max(0, int(30 - (0.22 - ratio) * 100))
        else:
            shape_score = max(0, int(30 - (ratio - 0.60) * 80))
        score += shape_score
        reasons.append(f'shape_ratio={ratio:.2f} ({shape_score}/30)')

        required = self.rules.get('required', [])
        feature_score = 0
        a = get_anatomy(self.s.animal)
        for feat in required:
            if feat == 'ears':
                # Expand ear detection region to cover tall/cat ears and head tilts
                has = any(
                    self.grid[y][x] != '.'
                    for y in range(1, min(10, self.h))
                    for x in range(2, min(self.w - 2, self.w))
                )
                if has:
                    feature_score += 8
            elif feat == 'eyes':
                if self.s.animal == 'penguin':
                    head_cy = int(CANVAS_H * a.head_cy + self.s.head_tilt)
                    left_cx = self.w // 2 - int(a.head_rx * 0.38)
                    right_cx = self.w // 2 + int(a.head_rx * 0.38)
                    has = self.grid[head_cy][left_cx] != '.' and self.grid[head_cy][right_cx] != '.'
                else:
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
                if self.s.animal == 'penguin':
                    head_cy = int(CANVAS_H * a.head_cy + self.s.head_tilt)
                    has = self.grid[head_cy + 3][mid] != '.' and self.grid[head_cy + 2][mid] != '.'
                else:
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

        from composer import CraftabilityChecker
        craft_score, craft_reasons = CraftabilityChecker(self.grid).check()
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

def compose_animal_v2_8(skeleton: CharacterSkeleton, style: dict) -> List[List[str]]:
    comp = make_canvas()
    a = get_anatomy(skeleton.animal)

    sil = SilhouetteComposer(comp, skeleton)
    sil.compose()

    head_cy = int(CANVAS_H * a.head_cy + skeleton.head_tilt)
    body_cy = sil.body_cy

    ColorBlocking(comp, skeleton).apply(head_cy, body_cy)
    FeaturePainter(comp, skeleton, style).paint(head_cy)

    # Accessories: carrot, bamboo
    if skeleton.accessory == 'carrot':
        # Carrot in raised hand
        cx = comp.w // 2
        arm_y = body_cy - a.body_ry // 2
        tilt = skeleton.body_rotation
        for dy, dx_base in [(0, 4), (1, 4), (2, 5), (3, 5), (4, 6), (5, 6), (6, 5), (7, 5)]:
            comp.set(cx + dx_base + tilt, arm_y - 2 - dy, 'O')
            comp.set(cx + dx_base + tilt + 1, arm_y - 2 - dy, 'O')
        # Carrot leaves
        for dy in range(5, 8):
            comp.set(cx + 6 + tilt, arm_y - 2 - dy, 'G')
            comp.set(cx + 7 + tilt, arm_y - 2 - dy, 'G')
    elif skeleton.accessory == 'bamboo':
        # Bamboo held by panda
        cx = comp.w // 2
        arm_y = body_cy - a.body_ry // 2
        # Vertical bamboo stalk
        for dy in range(-6, 8):
            comp.set(cx + 7, arm_y + dy, 'G')
            comp.set(cx + 8, arm_y + dy, 'G')
        # Bamboo segments
        for seg_y in [arm_y - 4, arm_y, arm_y + 4]:
            comp.set(cx + 6, seg_y, 'G')
            comp.set(cx + 9, seg_y, 'G')
        # Panda paws gripping bamboo
        comp.set(cx + 6, arm_y - 1, 'K')
        comp.set(cx + 9, arm_y - 1, 'K')
        comp.set(cx + 6, arm_y + 1, 'K')
        comp.set(cx + 9, arm_y + 1, 'K')

    grid = cleanup_grid(comp.grid)
    return grid


# ============= Golden Samples =============

GOLDEN_SAMPLES: List[Tuple[str, str, str, dict]] = [
    # animal, pose, slug, style
    ('cat', 'sitting', 'cat-sitting', {'expression': 'cute', 'whiskers': True}),
    ('cat', 'standing', 'cat-standing', {'expression': 'happy', 'whiskers': True}),
    ('cat', 'waving', 'cat-waving', {'expression': 'excited', 'whiskers': True}),
    ('cat', 'sleeping', 'cat-sleeping', {'expression': 'sleepy', 'whiskers': False}),
    ('cat', 'hugging', 'cat-hugging', {'expression': 'love', 'whiskers': True}),
    ('dog', 'sitting', 'dog-sitting', {'expression': 'happy', 'whiskers': False}),
    ('dog', 'standing', 'dog-standing', {'expression': 'cute', 'whiskers': False}),
    ('dog', 'puppy', 'dog-puppy', {'expression': 'excited', 'whiskers': False}),
    ('dog', 'sleeping', 'dog-sleeping', {'expression': 'sleepy', 'whiskers': False}),
    ('dog', 'hugging', 'dog-hugging', {'expression': 'love', 'whiskers': False}),
    ('fox', 'sitting', 'fox-sitting', {'expression': 'cute', 'whiskers': False}),
    ('fox', 'standing', 'fox-standing', {'expression': 'happy', 'whiskers': False}),
    ('fox', 'waving', 'fox-waving', {'expression': 'excited', 'whiskers': False}),
    ('fox', 'sleeping', 'fox-sleeping', {'expression': 'sleepy', 'whiskers': False}),
    ('fox', 'hugging', 'fox-hugging', {'expression': 'love', 'whiskers': False}),
    ('rabbit', 'sitting', 'rabbit-sitting', {'expression': 'cute', 'whiskers': True}),
    ('rabbit', 'standing', 'rabbit-standing', {'expression': 'happy', 'whiskers': True}),
    ('rabbit', 'floppy', 'rabbit-floppy', {'expression': 'calm', 'whiskers': True}),
    ('rabbit', 'holding', 'rabbit-holding-carrot', {'expression': 'cute', 'whiskers': True, 'accessory': 'carrot'}),
    ('rabbit', 'sleeping', 'rabbit-sleeping', {'expression': 'sleepy', 'whiskers': False}),
    ('rabbit', 'hugging', 'rabbit-hugging', {'expression': 'love', 'whiskers': True}),
    ('bear', 'sitting', 'bear-sitting', {'expression': 'cute', 'whiskers': False}),
    ('bear', 'standing', 'bear-standing', {'expression': 'happy', 'whiskers': False}),
    ('bear', 'waving', 'bear-waving', {'expression': 'excited', 'whiskers': False}),
    ('bear', 'sleeping', 'bear-sleeping', {'expression': 'sleepy', 'whiskers': False}),
    ('bear', 'hugging', 'bear-hugging', {'expression': 'love', 'whiskers': False}),
    ('panda', 'sitting', 'panda-sitting', {'expression': 'cute', 'whiskers': False, 'accessory': 'bamboo'}),
    ('panda', 'eating', 'panda-eating', {'expression': 'happy', 'whiskers': False, 'accessory': 'bamboo'}),
    ('panda', 'waving', 'panda-waving', {'expression': 'excited', 'whiskers': False}),
    ('panda', 'sleeping', 'panda-sleeping', {'expression': 'sleepy', 'whiskers': False}),
    ('panda', 'hugging', 'panda-hugging', {'expression': 'love', 'whiskers': False, 'accessory': 'bamboo'}),
    ('penguin', 'standing', 'penguin-standing', {'expression': 'cute', 'whiskers': False, 'flipper_angle': 'down'}),
    ('penguin', 'waving', 'penguin-waving', {'expression': 'happy', 'whiskers': False, 'flipper_angle': 'open'}),
    ('penguin', 'lying', 'penguin-lying', {'expression': 'sleepy', 'whiskers': False, 'flipper_angle': 'down'}),
    ('penguin', 'hugging', 'penguin-hugging', {'expression': 'love', 'whiskers': False, 'flipper_angle': 'down'}),
    ('penguin', 'sleeping', 'penguin-sleeping', {'expression': 'sleepy', 'whiskers': False, 'flipper_angle': 'down'}),
]


def run_golden_samples():
    for animal, pose, slug, style in GOLDEN_SAMPLES:
        skeleton = CharacterSkeleton.for_animal(animal, pose=pose, style=style)
        grid = compose_animal_v2_8(skeleton, style)
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

    import glob
    all_files = sorted(glob.glob(str(OUT_DIR / '*.json')))
    all_files = [f for f in all_files if 'quality_score' in json.load(open(f))]
    scores = [json.load(open(f))['quality_score'] for f in all_files]
    v1_scores = [json.load(open(f))['v1_score'] for f in all_files]
    avg = sum(scores) / len(scores)
    v1_avg = sum(v1_scores) / len(v1_scores)
    print(f'\n=== Summary ===')
    print(f'V2 Average: {avg:.1f}')
    print(f'V1 Average: {v1_avg:.1f}')
    print(f'Min: {min(scores)}, Max: {max(scores)}')
    print(f'Low (<80): {[json.load(open(f))["slug"] for f in all_files if json.load(open(f))["quality_score"] < 80]}')
    print(f'Preview: {OUT_DIR}')


if __name__ == '__main__':
    run_golden_samples()
