"""Extract ninja characters from adopted_ninja_3_color_group.jpeg"""
from PIL import Image
from rembg import remove
import os

SRC = "C:/Users/shunp/dash-survivors/public/concepts/nb2_generated/adopted_ninja_3_color_group.jpeg"
OUT = "C:/Users/shunp/dash-survivors/public/sprites/generated"

img = Image.open(SRC)  # 768 x 1376

# Center ninja (big, black, gold eyes) - PLAYER character
# This is the main ninja, positioned center-top
player_box = (180, 50, 580, 780)

# Left ninja (grey/blue, green belt, shuriken)
left_box = (0, 350, 320, 1050)

# Right ninja (dark, purple belt)
right_box = (420, 380, 768, 1100)

crops = {
    "ninja_player": player_box,
    "enemy_shinobi_grey": left_box,
    "enemy_shinobi_purple": right_box,
}

for name, box in crops.items():
    print(f"Processing {name}...")
    crop = img.crop(box)
    # Use rembg with alpha matting for dark characters on dark bg
    crop_rgba = remove(crop, alpha_matting=True, alpha_matting_foreground_threshold=240, alpha_matting_background_threshold=10)
    out_path = os.path.join(OUT, f"{name}.png")
    crop_rgba.save(out_path)
    print(f"  Saved: {out_path} ({crop_rgba.size})")

print("Done!")
