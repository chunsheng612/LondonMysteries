from __future__ import annotations

from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image


ROOT = Path("/Users/chunsheng/Desktop/遊戲拷貝")
ATLAS = ROOT / "assets/source_atlas_reference.png"


ROWS = [
    {
        "y1": 0,
        "y2": 355,
        "cells": [
            (0, 296, "assets/bg_detective_office.png"),
            (296, 456, "assets/char_alchemist.png"),
            (456, 606, "assets/char_mentor.png"),
            (606, 782, "assets/char_scout.png"),
            (782, 944, "assets/char_broker.png"),
            (944, 1088, "assets/char_rival.png"),
            (1088, 1254, "assets/char_client.png"),
        ],
    },
    {
        "y1": 338,
        "y2": 618,
        "cells": [
            (0, 214, "assets/chars/female_stage1.png"),
            (214, 404, "assets/chars/female_stage2.png"),
            (404, 600, "assets/chars/female_stage3.png"),
            (600, 782, "assets/chars/male_stage1.png"),
            (782, 1032, "assets/chars/male_stage2.png"),
            (1032, 1254, "assets/chars/male_stage3.png"),
        ],
    },
    {
        "y1": 615,
        "y2": 810,
        "cells": [
            (0, 236, "assets/enemies/starry_slime.png"),
            (236, 430, "assets/enemies/cinder_fox.png"),
            (430, 708, "assets/enemies/leafy_dragon.png"),
            (708, 978, "assets/enemies/moonlight_owl.png"),
            (978, 1254, "assets/enemies/solar_sprite.png"),
        ],
    },
    {
        "y1": 805,
        "y2": 972,
        "cells": [
            (0, 224, "assets/enemies/mist_jellyfish.png"),
            (224, 470, "assets/enemies/crystal_turtle.png"),
            (470, 744, "assets/enemies/shadow_cat.png"),
            (744, 1032, "assets/enemies/clockwork_bird.png"),
            (1032, 1254, "assets/enemies/cloud_sheep.png"),
        ],
    },
    {
        "y1": 965,
        "y2": 1116,
        "cells": [
            (0, 142, "assets/icons/coin.png"),
            (142, 286, "assets/icons/potion_red.png"),
            (286, 434, "assets/icons/potion_blue.png"),
            (434, 592, "assets/icons/potion_green.png"),
            (592, 744, "assets/icons/potion_yellow.png"),
            (744, 902, "assets/icons/potion_purple.png"),
            (902, 1074, "assets/icons/star.png"),
            (1074, 1254, "assets/icons/swirl.png"),
        ],
    },
    {
        "y1": 1106,
        "y2": 1254,
        "cells": [
            (0, 188, "assets/icons/nav_home.png"),
            (188, 394, "assets/icons/nav_story.png"),
            (394, 584, "assets/icons/nav_daily.png"),
            (584, 778, "assets/icons/nav_shop.png"),
            (778, 982, "assets/icons/nav_inventory.png"),
            (982, 1254, "assets/icons/nav_settings.png"),
        ],
    },
]


CHECKER_A = np.array([238, 238, 238], dtype=np.int16)
CHECKER_B = np.array([224, 224, 224], dtype=np.int16)


def non_checker_mask(rgb: np.ndarray, threshold: int = 18) -> np.ndarray:
    delta_a = np.abs(rgb.astype(np.int16) - CHECKER_A).sum(axis=2)
    delta_b = np.abs(rgb.astype(np.int16) - CHECKER_B).sum(axis=2)
    return (delta_a > threshold) & (delta_b > threshold)


def largest_component_bbox(mask: np.ndarray) -> tuple[int, int, int, int]:
    h, w = mask.shape
    seen = np.zeros((h, w), dtype=bool)
    best = None
    best_count = 0
    for y in range(h):
        for x in range(w):
            if not mask[y, x] or seen[y, x]:
                continue
            q = deque([(y, x)])
            seen[y, x] = True
            min_x = max_x = x
            min_y = max_y = y
            count = 0
            while q:
                cy, cx = q.popleft()
                count += 1
                min_x = min(min_x, cx)
                max_x = max(max_x, cx)
                min_y = min(min_y, cy)
                max_y = max(max_y, cy)
                for ny, nx in ((cy - 1, cx), (cy + 1, cx), (cy, cx - 1), (cy, cx + 1)):
                    if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        q.append((ny, nx))
            if count > best_count:
                best_count = count
                best = (min_x, min_y, max_x + 1, max_y + 1)
    if best is None:
        raise RuntimeError("No foreground component found in atlas cell")
    return best


def rgba_crop_from_cell(cell_image: Image.Image, keep_opaque_bg: bool = False) -> Image.Image:
    rgb = np.array(cell_image.convert("RGB"))
    mask = non_checker_mask(rgb)
    x1, y1, x2, y2 = largest_component_bbox(mask)
    crop_rgb = rgb[y1:y2, x1:x2]
    crop_mask = mask[y1:y2, x1:x2]

    rgba = np.zeros((crop_rgb.shape[0], crop_rgb.shape[1], 4), dtype=np.uint8)
    rgba[:, :, :3] = crop_rgb
    if keep_opaque_bg:
        rgba[:, :, 3] = 255
    else:
        rgba[:, :, 3] = np.where(crop_mask, 255, 0).astype(np.uint8)
    return Image.fromarray(rgba, "RGBA")


def main() -> None:
    atlas = Image.open(ATLAS).convert("RGBA")
    for row in ROWS:
        y1 = row["y1"]
        y2 = row["y2"]
        for x1, x2, rel_path in row["cells"]:
            cell = atlas.crop((x1, y1, x2, y2))
            out_path = ROOT / rel_path
            out_path.parent.mkdir(parents=True, exist_ok=True)
            image = rgba_crop_from_cell(cell, keep_opaque_bg=rel_path.endswith("bg_detective_office.png"))
            image.save(out_path)
            print(out_path)


if __name__ == "__main__":
    main()
