#!/usr/bin/env python3
"""Generate cover/finished bead images for 3 example patterns.

- Reads pattern grid_data + palette from production D1 via admin API
- Designs recognizable 15x15 grids by hand for 3 slugs
- Renders cover (clean grid on light background) and finished (bead photo effect)
- Uploads to R2 using S3-compatible API
- Updates D1 cover_image/finished_image

Run from bead-pattern-ai-backend directory after sourcing ~/.cloudflare_env.
"""

import json
import os
import ssl
import sys
import urllib.request
import urllib.error
import hashlib
from pathlib import Path

try:
    from PIL import Image, ImageDraw
except ImportError:
    print("Pillow not installed. Run: pip install Pillow")
    sys.exit(1)

BASE_URL = "https://bead-pattern-ai.youyouguoke.workers.dev"
ADMIN_API_KEY = os.environ.get("ADMIN_API_KEY")
if not ADMIN_API_KEY:
    print("ADMIN_API_KEY not set")
    sys.exit(1)

# R2 S3-compatible endpoint
R2_ACCOUNT_ID = "b183c58c7fa8b50d9a8a8e6ac8d42a31"
R2_BUCKET = "beadpatternai"
R2_PUBLIC_URL = "https://pub-98e050954fa34ccebe6d2e8911f520a3.r2.dev"
R2_ENDPOINT = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

PATTERNS = ["sleepy-cat", "cute-panda", "playful-dog"]

COLORS = {
    "K": (0, 0, 0, 255),
    "W": (255, 255, 255, 255),
    "G": (200, 200, 200, 255),  # gray
    "O": (255, 165, 0, 255),    # orange
    "P": (255, 105, 180, 255),  # pink
    "B": (135, 206, 235, 255),  # light blue
    "Y": (255, 215, 0, 255),    # yellow
    "T": (0, 0, 0, 0),          # transparent
}

# 15x15 hand-designed grids. '.' = transparent.
# Try to make them recognizable.
GRIDS = {
    "sleepy-cat": {
        "palette": ["K", "W", "O", "P"],
        "grid": [
            "...............",
            ".............",
            "....KK...KK...",
            "...KWWK.KWWK..",
            "..KWWWWKWWWWK.",
            "..KWWWWWWWWWK.",
            ".KWWWWWWWWWWWK",
            ".KWWWWKKWWWWWK",
            ".KWWWWKKWWWWWK",
            ".KWWWWWWWWWWWK",
            "..KWWWOOWWWWK.",
            "..KWWWOOWWWWK.",
            "...KWWWWWWWK..",
            "....KKWWWWKK...",
            ".......WW......",
            ".......WW......",
            "...............",
        ],
    },
    "cute-panda": {
        "palette": ["K", "W", "P", "B"],
        "grid": [
            "...............",
            "....KK.....KK...",
            "...KWWK...KWWK..",
            "..KWWWWK.KWWWWK.",
            "..KWWWWWWWWWWWK.",
            ".KWWWWWWWWWWWWWK",
            ".KWWWWWWWWWWWWWK",
            ".KWWWKWWWWWKWWWK",
            ".KWWWKWWWWWKWWWK",
            ".KWWWWKKKKWWWWWK",
            "..KWWWWPPWWWWWK.",
            "..KWWWWPPWWWWWK.",
            "...KWWWWWWWWWK..",
            "....KKWWWWKK...",
            ".......WW......",
            ".......WW......",
            "...............",
        ],
    },
    "playful-dog": {
        "palette": ["K", "W", "O", "B"],
        "grid": [
            "...............",
            "........KK.....",
            ".......KWWK...",
            "......KWWWWK...",
            "....KKWWWWWWK..",
            "...KWWWWWWWWWK.",
            "..KWWWWWWWWWWWK",
            "..KWWWWKWWKWWWK",
            "..KWWWWKWWKWWWK",
            ".KWWWWWWWWWWWWWK",
            ".KWWWWWWWWWWWWWK",
            "..KWWWWOOOWWWWK.",
            "...KWWWOOWWWWK.",
            "....KWWWWWWWK..",
            ".....KKWWKK...",
            ".......WW......",
            "...............",
        ],
    },
}


def api_get(path):
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {ADMIN_API_KEY}"})
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    with urllib.request.urlopen(req, context=ctx, timeout=30) as res:
        return json.loads(res.read().decode())


def api_put(path, body):
    url = f"{BASE_URL}{path}"
    data = json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, headers={
        "Authorization": f"Bearer {ADMIN_API_KEY}",
        "Content-Type": "application/json",
    }, method="PUT")
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    with urllib.request.urlopen(req, context=ctx, timeout=30) as res:
        return json.loads(res.read().decode())


def parse_color_palette(raw):
    if not raw:
        return []
    try:
        parsed = json.loads(raw) if isinstance(raw, str) else raw
        if not isinstance(parsed, list):
            return []
        out = []
        for item in parsed:
            if isinstance(item, str):
                out.append(item)
            elif isinstance(item, dict):
                out.append(item.get("hex", ""))
        return out
    except Exception:
        return []


def hex_to_rgba(hex_str):
    hex_str = hex_str.lstrip("#")
    if len(hex_str) == 3:
        hex_str = "".join([c * 2 for c in hex_str])
    return tuple(int(hex_str[i:i + 2], 16) for i in (0, 2, 4)) + (255,)


def render_grid_to_image(grid, palette, size=1024, finished=False):
    rows = len(grid)
    cols = len(grid[0])
    img_size = 1024
    cell = img_size // max(rows, cols)
    offset_x = (img_size - cols * cell) // 2
    offset_y = (img_size - rows * cell) // 2

    if finished:
        bg = (40, 40, 50, 255)  # dark bead-board background
    else:
        bg = (248, 249, 250, 255)  # light cover background

    img = Image.new("RGBA", (img_size, img_size), bg)
    draw = ImageDraw.Draw(img)

    for y, row in enumerate(grid):
        for x, ch in enumerate(row):
            if ch == ".":
                continue
            idx = palette.index(ch)
            color = COLORS[ch]
            px = offset_x + x * cell
            py = offset_y + y * cell
            bead_margin = 2
            if finished:
                # 3D bead effect with highlight and shadow
                draw.rounded_rectangle([px, py, px + cell - 1, py + cell - 1], radius=cell // 4, fill=color)
                highlight = tuple(min(255, c + 40) for c in color[:3]) + (255,)
                draw.rounded_rectangle([px + bead_margin, py + bead_margin, px + cell // 2, py + cell // 2], radius=cell // 6, fill=highlight)
                shadow = tuple(max(0, c - 40) for c in color[:3]) + (255,)
                draw.arc([px + cell - bead_margin - 6, py + cell - bead_margin - 6, px + cell - bead_margin, py + cell - bead_margin], 0, 90, fill=shadow, width=2)
            else:
                # flat clean grid with thin outline
                draw.rounded_rectangle([px + 1, py + 1, px + cell - 2, py + cell - 2], radius=cell // 6, fill=color)
                outline = tuple(max(0, c - 30) for c in color[:3]) + (255,)
                draw.rounded_rectangle([px + 1, py + 1, px + cell - 2, py + cell - 2], radius=cell // 6, outline=outline, width=1)

    if not finished:
        # draw grid lines
        line_color = (220, 220, 220, 255)
        for i in range(cols + 1):
            x = offset_x + i * cell
            draw.line([(x, offset_y), (x, offset_y + rows * cell)], fill=line_color, width=1)
        for i in range(rows + 1):
            y = offset_y + i * cell
            draw.line([(offset_x, y), (offset_x + cols * cell, y)], fill=line_color, width=1)

    return img


def upload_to_r2(key, image_bytes):
    import boto3
    s3 = boto3.client(
        "s3",
        endpoint_url=R2_ENDPOINT,
        aws_access_key_id=os.environ["R2_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["R2_SECRET_ACCESS_KEY"],
    )
    s3.put_object(Bucket=R2_BUCKET, Key=key, Body=image_bytes, ContentType="image/png")


def main():
    # Read patterns from admin API
    for slug in PATTERNS:
        print(f"\n=== {slug} ===")
        try:
            res = api_get(f"/api/admin/patterns/{slug}")
        except Exception as e:
            print(f"  failed to fetch pattern: {e}")
            continue
        if not res.get("success") or not res.get("data"):
            print(f"  API error: {res}")
            continue
        pattern = res["data"]
        pattern_id = pattern.get("id")
        print(f"  id={pattern_id}")

        # Use our hand-designed grid for these 3 examples
        design = GRIDS[slug]
        grid = design["grid"]
        palette = design["palette"]

        # Convert grid to hex data and update pattern
        hex_grid = []
        for row in grid:
            hex_row = []
            for ch in row:
                if ch == ".":
                    hex_row.append(None)
                else:
                    hex_row.append(COLORS[ch])
            hex_grid.append(hex_row)

        # Render cover and finished images
        cover_img = render_grid_to_image(grid, palette, finished=False)
        finished_img = render_grid_to_image(grid, palette, finished=True)

        cover_key = f"covers/{slug}.png"
        finished_key = f"finished/{slug}.png"

        import io
        cover_buf = io.BytesIO()
        cover_img.save(cover_buf, format="PNG")
        cover_buf.seek(0)
        upload_to_r2(cover_key, cover_buf.read())
        print(f"  uploaded {cover_key}")

        finished_buf = io.BytesIO()
        finished_img.save(finished_buf, format="PNG")
        finished_buf.seek(0)
        upload_to_r2(finished_key, finished_buf.read())
        print(f"  uploaded {finished_key}")

        # Update pattern fields
        new_cover = f"{R2_PUBLIC_URL}/{cover_key}"
        new_finished = f"{R2_PUBLIC_URL}/{finished_key}"

        # Also update grid_data and color_palette in DB to match the designed grid
        color_palette = [{"name": c, "hex": f"#{''.join(f'{v:02x}' for v in COLORS[c][:3])}", "count": 0} for c in palette]
        for row in grid:
            for ch in row:
                if ch != "." and ch in palette:
                    idx = palette.index(ch)
                    color_palette[idx]["count"] += 1

        body = {
            "cover_image": new_cover,
            "finished_image": new_finished,
            "grid_data": json.dumps([[c if c != "." else None for c in row] for row in grid]),
            "color_palette": json.dumps(color_palette),
        }
        try:
            api_put(f"/api/admin/patterns/{pattern_id}", body)
            print(f"  updated DB cover/finished/grid/palette")
        except Exception as e:
            print(f"  failed to update pattern: {e}")


if __name__ == "__main__":
    main()
