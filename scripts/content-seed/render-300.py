#!/usr/bin/env python3
"""Render 300 seed patterns from hex grid_data to cover/finished PNG images."""

from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path('/root/projects/BeadPatternAI/bead-pattern-ai-backend')
DATA = ROOT / 'scripts/content-seed/data/patterns-all-300.json'
OUT = Path('/tmp/bead-pattern-300')
OUT.mkdir(parents=True, exist_ok=True)

BEAD_SIZE = 30


def hex_to_rgb(hex_color: str) -> tuple[int, int, int]:
    h = hex_color.lstrip('#')
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


def render_cover(grid: list[list[str]]) -> Image.Image:
    h = len(grid)
    w = len(grid[0])
    img = Image.new('RGBA', (w * BEAD_SIZE, h * BEAD_SIZE), (255, 255, 255, 255))
    draw = ImageDraw.Draw(img)
    for y, row in enumerate(grid):
        for x, hex_color in enumerate(row):
            rgb = hex_to_rgb(hex_color)
            # draw bead with subtle border
            x0, y0 = x * BEAD_SIZE, y * BEAD_SIZE
            draw.rounded_rectangle([x0, y0, x0 + BEAD_SIZE - 1, y0 + BEAD_SIZE - 1], radius=6, fill=rgb, outline=(0,0,0,30))
    return img


def render_finished(grid: list[list[str]]) -> Image.Image:
    h = len(grid)
    w = len(grid[0])
    img = Image.new('RGBA', (w * BEAD_SIZE, h * BEAD_SIZE), (255, 255, 255, 255))
    draw = ImageDraw.Draw(img)
    for y, row in enumerate(grid):
        for x, hex_color in enumerate(row):
            rgb = hex_to_rgb(hex_color)
            x0, y0 = x * BEAD_SIZE, y * BEAD_SIZE
            # bead base
            draw.rounded_rectangle([x0, y0, x0 + BEAD_SIZE - 1, y0 + BEAD_SIZE - 1], radius=6, fill=rgb)
            # inner highlight (ironed look)
            draw.rounded_rectangle([x0+4, y0+4, x0 + BEAD_SIZE - 5, y0 + BEAD_SIZE - 5], radius=4, fill=(*rgb, 220))
            # small gloss
            draw.ellipse([x0+6, y0+6, x0+12, y0+12], fill=(255,255,255,80))
    return img


def main():
    with open(DATA) as f:
        payload = json.load(f)
    patterns = payload['patterns']
    print(f'Rendering {len(patterns)} patterns...')
    for p in patterns:
        slug = p['slug']
        grid = p['grid_data']
        cover = render_cover(grid)
        finished = render_finished(grid)
        cover.save(OUT / f'{slug}-cover.png')
        finished.save(OUT / f'{slug}-finished.png')
    print(f'Images saved to {OUT}')


if __name__ == '__main__':
    main()
