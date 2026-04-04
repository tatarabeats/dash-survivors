"""Extract ninja - use ISNet model which handles dark-on-dark better"""
from PIL import Image
from rembg import remove, new_session
import os

SRC = "C:/Users/shunp/dash-survivors/public/concepts/nb2_generated/adopted_ninja_3_color_group.jpeg"
OUT = "C:/Users/shunp/dash-survivors/public/sprites/generated"

img = Image.open(SRC)  # 768 x 1376

# Try isnet-general-use model for better dark character extraction
session = new_session("isnet-general-use")

# Center ninja (big, black, gold eyes) - PLAYER character
player_box = (180, 50, 580, 780)

# Left ninja (grey/blue, green belt)
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
    crop_rgba = remove(crop, session=session)
    out_path = os.path.join(OUT, f"{name}.png")
    crop_rgba.save(out_path)
    print(f"  Saved: {out_path} ({crop_rgba.size})")

print("Done!")
