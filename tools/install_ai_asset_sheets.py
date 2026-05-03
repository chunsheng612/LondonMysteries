from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from PIL import Image


ROOT = Path("/Users/chunsheng/Desktop/遊戲拷貝")
GENERATED = ROOT / "tmp/ai_generated"


@dataclass(frozen=True)
class SheetSpec:
    source: str
    rows: int
    cols: int
    targets: list[str]
    transparent: bool = True


SHEETS = [
    SheetSpec(
        source="main_chars.png",
        rows=1,
        cols=6,
        targets=[
            "assets/char_alchemist.png",
            "assets/char_mentor.png",
            "assets/char_scout.png",
            "assets/char_broker.png",
            "assets/char_rival.png",
            "assets/char_client.png",
        ],
    ),
    SheetSpec(
        source="player_chars.png",
        rows=1,
        cols=6,
        targets=[
            "assets/chars/female_stage1.png",
            "assets/chars/female_stage2.png",
            "assets/chars/female_stage3.png",
            "assets/chars/male_stage1.png",
            "assets/chars/male_stage2.png",
            "assets/chars/male_stage3.png",
        ],
    ),
    SheetSpec(
        source="enemies.png",
        rows=2,
        cols=5,
        targets=[
            "assets/enemies/starry_slime.png",
            "assets/enemies/cinder_fox.png",
            "assets/enemies/leafy_dragon.png",
            "assets/enemies/moonlight_owl.png",
            "assets/enemies/solar_sprite.png",
            "assets/enemies/mist_jellyfish.png",
            "assets/enemies/crystal_turtle.png",
            "assets/enemies/shadow_cat.png",
            "assets/enemies/clockwork_bird.png",
            "assets/enemies/cloud_sheep.png",
        ],
    ),
    SheetSpec(
        source="item_icons.png",
        rows=1,
        cols=8,
        targets=[
            "assets/icons/coin.png",
            "assets/icons/potion_red.png",
            "assets/icons/potion_blue.png",
            "assets/icons/potion_green.png",
            "assets/icons/potion_yellow.png",
            "assets/icons/potion_purple.png",
            "assets/icons/star.png",
            "assets/icons/swirl.png",
        ],
    ),
    SheetSpec(
        source="nav_icons.png",
        rows=1,
        cols=6,
        targets=[
            "assets/icons/nav_home.png",
            "assets/icons/nav_story.png",
            "assets/icons/nav_daily.png",
            "assets/icons/nav_shop.png",
            "assets/icons/nav_inventory.png",
            "assets/icons/nav_settings.png",
        ],
    ),
]


def trim_alpha(image: Image.Image, padding: int = 12) -> Image.Image:
    alpha = image.getchannel("A")
    bbox = alpha.getbbox()
    if bbox is None:
        return image
    left = max(0, bbox[0] - padding)
    top = max(0, bbox[1] - padding)
    right = min(image.width, bbox[2] + padding)
    bottom = min(image.height, bbox[3] + padding)
    return image.crop((left, top, right, bottom))


def largest_alpha_component_bbox(image: Image.Image) -> tuple[int, int, int, int] | None:
    alpha = image.getchannel("A")
    pix = alpha.load()
    seen: set[tuple[int, int]] = set()
    best = None
    best_count = 0
    for y in range(image.height):
        for x in range(image.width):
            if pix[x, y] == 0 or (x, y) in seen:
                continue
            stack = [(x, y)]
            seen.add((x, y))
            min_x = max_x = x
            min_y = max_y = y
            count = 0
            while stack:
                cx, cy = stack.pop()
                count += 1
                min_x = min(min_x, cx)
                max_x = max(max_x, cx)
                min_y = min(min_y, cy)
                max_y = max(max_y, cy)
                for nx, ny in ((cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)):
                    if 0 <= nx < image.width and 0 <= ny < image.height and pix[nx, ny] > 0 and (nx, ny) not in seen:
                        seen.add((nx, ny))
                        stack.append((nx, ny))
            if count > best_count:
                best_count = count
                best = (min_x, min_y, max_x + 1, max_y + 1)
    return best


def crop_cell(image: Image.Image, row: int, col: int, rows: int, cols: int) -> Image.Image:
    cell_w = image.width / cols
    cell_h = image.height / rows
    left = round(col * cell_w)
    top = round(row * cell_h)
    right = round((col + 1) * cell_w)
    bottom = round((row + 1) * cell_h)
    cell = image.crop((left, top, right, bottom))
    bbox = largest_alpha_component_bbox(cell)
    if bbox is None:
        return cell
    pad = 12
    crop = cell.crop(
        (
            max(0, bbox[0] - pad),
            max(0, bbox[1] - pad),
            min(cell.width, bbox[2] + pad),
            min(cell.height, bbox[3] + pad),
        )
    )
    return trim_alpha(crop, padding=0)


def install_sheet(spec: SheetSpec) -> None:
    image = Image.open(GENERATED / spec.source).convert("RGBA")
    for index, target in enumerate(spec.targets):
        row = index // spec.cols
        col = index % spec.cols
        crop = crop_cell(image, row, col, spec.rows, spec.cols)
        out_path = ROOT / target
        out_path.parent.mkdir(parents=True, exist_ok=True)
        crop.save(out_path)
        print(out_path)


def install_background() -> None:
    out_path = ROOT / "assets/bg_detective_office.png"
    image = Image.open(GENERATED / "background.png").convert("RGBA")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    image.save(out_path)
    print(out_path)


def main() -> None:
    install_background()
    for spec in SHEETS:
        install_sheet(spec)


if __name__ == "__main__":
    main()
