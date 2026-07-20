#!/usr/bin/env python3
"""
Generate improved 32x32 bead grids for sleepy-cat, cute-panda, playful-dog.
Uses template-driven pixel art with:
- 5-6 color layers (outline, body, shadow, highlight, nose, eye detail)
- eyes, whiskers, face symmetry
- 32x32 canvas
"""

from PIL import Image, ImageDraw
import json
import os
from pathlib import Path

OUT_DIR = Path('/tmp/bead-template-v3')
OUT_DIR.mkdir(parents=True, exist_ok=True)

# 6-color standard bead palette
COLORS = {
    'K': '#1a1a1a',  # outline / black
    'W': '#f5f5f5',  # body white
    'H': '#ffffff',  # highlight
    'S': '#757575',  # shadow gray
    'G': '#424242',  # dark gray (panda patches)
    'P': '#f06292',  # pink nose/inner ear
    'O': '#ff9800',  # orange accent (dog collar)
    'B': '#87ceeb',  # blue accent (dog eyes)
    '.': None,       # transparent/background
}

RGB = {k: tuple(int(h[i:i+2], 16) for i in (1,3,5)) + (255,) if h else None for k, h in COLORS.items()}
RGB['.'] = None


def hex_for(ch):
    return COLORS[ch]


def to_hex_grid(grid):
    return [[hex_for(ch) if ch != '.' else None for ch in row] for row in grid]


def to_color_palette(grid):
    counts = {}
    for row in grid:
        for ch in row:
            if ch and ch in COLORS:
                counts[ch] = counts.get(ch, 0) + 1
    items = []
    for ch in ['K', 'W', 'H', 'S', 'G', 'P', 'O', 'B']:
        if ch in counts:
            h = COLORS[ch]
            name = {'K':'black','W':'white','H':'highlight','S':'shadow gray','G':'dark gray','P':'pink','O':'orange','B':'light blue'}[ch]
            items.append({'name': name, 'hex': h, 'count': counts[ch]})
    return items


# 32x32 templates for cat, panda, dog
# Each row is 32 chars. '.' = transparent, letters = colors.
TEMPLATES = {
    'sleepy-cat': {
        'palette': ['K','W','H','S','P'],
        'grid': [
            "................................",
            "................................",
            "..........KK........KK..........",
            ".........KWWK......KWWK.........",
            "........KWWWWK....KWWWWK........",
            ".......KWWWWWWK..KWWWWWWK.......",
            "......KWWWWWWWWKKWWWWWWWWK......",
            ".....KWWWWWWWWWWWWWWWWWWWWK.....",
            "....KWWWWWWWWWWWWWWWWWWWWWWK....",
            "...KWWWWWWWWWWWWWWWWWWWWWWWWK...",
            "...KWWWWWWWKWWWWWWWWKWWWWWWWK...",
            "..KWWWWWWWKKWWWWWWWWKKWWWWWWWK..",
            "..KWWWWWWWKKWWWWWWWWKKWWWWWWWK..",
            "..KWWWWWWWWWWWWWWWWWWWWWWWWWWK..",
            ".KWWWWWWWWWWWWWWWWWWWWWWWWWWWWK.",
            ".KWWWWWWWWWWWWWWWWWWWWWWWWWWWWK.",
            ".KWWWWWKWWWWWWWWWWWWWWWWKWWWWWK.",
            ".KWWWWWKWWWWKWWWWWWKWWWWKWWWWWK.",
            ".KWWWWWKWWWWKWWWWWWKWWWWKWWWWWK.",
            ".KWWWWWWWWWWWWWWPPWWWWWWWWWWWWK.",
            ".KWWWWWWWWWWWWWPPPPWWWWWWWWWWWK.",
            "..KWWWWWWWWWWWWPPPPWWWWWWWWWWK..",
            "..KWWWWWWWWWWWWWWWWWWWWWWWWWWK..",
            "..KWWWWWWWWWKWWWWWWKWWWWWWWWWK..",
            "...KWWWWWWWWKWWWWWWKWWWWWWWWK...",
            "...KWWWWWWWWWWWWWWWWWWWWWWWWK...",
            "....KWWWWWWWWWWWWWWWWWWWWWWK....",
            "....KWWWWWWWWWWWWWWWWWWWWWK.....",
            ".....KWWWWWWWWWWWWWWWWWWWK......",
            "......KWWWWWWWWWWWWWWWWWK.......",
            ".......KWWWWWWWWWWWWWWWK........",
            "........KKWWWWWWWWWWKK..........",
        ],
    },
    'cute-panda': {
        'palette': ['K','W','H','G','P'],
        'grid': [
            "................................",
            "................................",
            "...........KK........KK.........",
            "..........KWWK......KWWK........",
            ".........KWWWWK....KWWWWK.......",
            "........KWWWWWWK..KWWWWWWK......",
            ".......KWWWWWWWWKKWWWWWWWWK.....",
            "......KWWWWWWWWWWWWWWWWWWWWK....",
            ".....KWWWWWWWWWWWWWWWWWWWWWWK...",
            "....KWWWWWWWWWWWWWWWWWWWWWWWWK..",
            "....KWWWWWKGGWWWWWWWWGGKWWWWWK..",
            "...KWWWWWKGGGWWWWWWWWGGGKWWWWWK.",
            "...KWWWWWKGGGWWWKKWWKGGGKWWWWWK.",
            "...KWWWWWWGGWWWWKWWWWKGGWWWWWWK.",
            "..KWWWWWWWGGWWWWKWWWWKGGWWWWWWWK",
            "..KWWWWWWWWGWWWWWWWWWWGWWWWWWWWK",
            "..KWWWWWWWWWWWWWWPPWWWWWWWWWWWWK",
            "..KWWWWWWWWWWWWWPPPPWWWWWWWWWWWK",
            "..KWWWWWWWWWWWWWPPPPWWWWWWWWWWWK",
            "..KWWWWWWWWWKWWWWWWWWKWWWWWWWWWK",
            "..KWWWWWWWWWKWWWWWWWWKWWWWWWWWWK",
            "...KWWWWWWWWWWWWWWWWWWWWWWWWWWK.",
            "...KWWWWWWWWWWWWWWWWWWWWWWWWWK..",
            "....KWWWWWWWWWWWWWWWWWWWWWWWK...",
            "....KWWWWWWWWWWWWWWWWWWWWWWK....",
            ".....KWWWWWWWWWWWWWWWWWWWWK.....",
            "......KWWWWWWWWWWWWWWWWWWK......",
            ".......KWWWWWWWWWWWWWWWWK.......",
            "........KWWWWWWWWWWWWWWK........",
            ".........KKWWWWWWWWWWKK.........",
            "...........KKWWWWKK.............",
            "................................",
        ],
    },
    'playful-dog': {
        'palette': ['K','W','H','S','O','B'],
        'grid': [
            "................................",
            "................................",
            "..........KKK........KKK........",
            ".........KWWWK.......KWWWK......",
            "........KWWWWWK.....KWWWWK......",
            ".......KWWWWWWWK...KWWWWWK......",
            "......KWWWWWWWWWK.KWWWWWWK......",
            ".....KWWWWWWWWWWWKWWWWWWWK......",
            "....KWWWWWWWWWWWWWWWWWWWWWK.....",
            "...KWWWWWWWWWWWWWWWWWWWWWWK.....",
            "...KWWWWWWKWWWWWWWWKWWWWWWK.....",
            "..KWWWWWWWKWWWWWWWWKWWWWWWWK....",
            "..KWWWWWWWKWWWWWWWWKWWWWWWWK....",
            "..KWWWWWWWWWWWWWWWWWWWWWWWWK....",
            ".KWWWWWWWWWWWWWWWWWWWWWWWWWWK...",
            ".KWWWWWWWWWWWWWWOOOWWWWWWWWWK...",
            ".KWWWWWWWWWWWWOOOOOOOWWWWWWWK...",
            ".KWWWWWWWWWWWWWOOOOOOOWWWWWWK...",
            ".KWWWWWWWWWWWWWWOOOWWWWWWWWWK...",
            "..KWWWWWWWWWWWWWWWWWWWWWWWWK....",
            "..KWWWWWWWWWWWWWWWWWWWWWWWWK....",
            "..KWWWWWWWWWWWWWWWWWWWWWWWK.....",
            "...KWWWWWWWWWKWWWWWWKWWWWK......",
            "...KWWWWWWWWWKWWWWWWKWWWWK......",
            "....KWWWWWWWWWWWWWWWWWWWWK......",
            "....KWWWWWWWWWWWWWWWWWWWK.......",
            ".....KWWWWWWWWWWWWWWWWWK........",
            "......KWWWWWWWWWWWWWWWK.........",
            ".......KWWWWWWWWWWWWK...........",
            "..........KKWWWWWWWWKK..........",
            "............KKWWWWKK............",
            "................................",
        ],
    },
}


def render_grid(grid, palette, finished=False, size=1024, output_path=None):
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
            color = RGB[ch]
            px = offset_x + x * cell
            py = offset_y + y * cell

            if finished:
                # 3D bead with highlight and shadow
                draw.rounded_rectangle([px+1, py+1, px+cell-2, py+cell-2], radius=cell//4, fill=color)
                highlight = tuple(min(255, c+50) for c in color[:3]) + (255,)
                draw.rounded_rectangle([px+4, py+4, px+cell//2-1, py+cell//2-1], radius=cell//6, fill=highlight)
                shadow = tuple(max(0, c-50) for c in color[:3]) + (255,)
                draw.arc([px+cell-8, py+cell-8, px+cell-2, py+cell-2], 0, 90, fill=shadow, width=2)
            else:
                # flat cover with grid lines
                draw.rounded_rectangle([px+1, py+1, px+cell-2, py+cell-2], radius=cell//6, fill=color)
                outline = tuple(max(0, c-30) for c in color[:3]) + (255,)
                draw.rounded_rectangle([px+1, py+1, px+cell-2, py+cell-2], radius=cell//6, outline=outline, width=1)

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


def main():
    for slug, design in TEMPLATES.items():
        grid = design['grid']
        palette = design['palette']
        # Validate 32x32
        assert len(grid) == 32 and all(len(r) == 32 for r in grid), f"{slug} grid must be 32x32"

        cover_path = OUT_DIR / f"{slug}-cover.png"
        finished_path = OUT_DIR / f"{slug}-finished.png"
        render_grid(grid, palette, finished=False, output_path=cover_path)
        render_grid(grid, palette, finished=True, output_path=finished_path)

        # Write metadata
        meta = {
            'slug': slug,
            'grid_size': '32x32',
            'grid_data': to_hex_grid(grid),
            'color_palette': to_color_palette(grid),
        }
        (OUT_DIR / f"{slug}.json").write_text(json.dumps(meta, indent=2), encoding='utf-8')

        print(f"Generated {slug}: cover={cover_path}, finished={finished_path}")

if __name__ == '__main__':
    main()
