"""Last attempt: extreme brightness boost + gamma to force dark ninja visible"""
from PIL import Image, ImageEnhance, ImageOps
from rembg import remove, new_session
import numpy as np
import os

SRC = "C:/Users/shunp/dash-survivors/public/concepts/nb2_generated/adopted_ninja_3_color_group.jpeg"
OUT = "C:/Users/shunp/dash-survivors/public/sprites/generated"

img = Image.open(SRC)

# Center ninja
player_box = (180, 50, 580, 780)
crop = img.crop(player_box)

# Extreme gamma correction to make dark pixels visible
arr = np.array(crop, dtype=np.float32) / 255.0
gamma = 0.3  # Very strong gamma to brighten darks
arr = np.power(arr, gamma) * 255.0
boosted = Image.fromarray(arr.astype(np.uint8))

session = new_session("isnet-general-use")
result = remove(boosted, session=session)

# Get alpha from gamma-corrected version, apply to original
alpha = result.split()[3]
original_rgba = crop.convert("RGBA")
original_rgba.putalpha(alpha)
original_rgba.save(os.path.join(OUT, "ninja_player.png"))
print("Saved ninja_player.png")

# Also extract 4 ninjas from 4_color_belts for weapon variants
SRC4 = "C:/Users/shunp/dash-survivors/public/concepts/nb2_generated/adopted_ninja_4_color_belts.jpeg"
img4 = Image.open(SRC4)  # 768x1376

# These 4 ninjas have colored belts: blue, green, red/pink, purple (L-R)
# They sit on a rock shelf around y=400-1100
boxes = {
    "ninja_blue": (0, 400, 230, 1050),
    "ninja_green": (160, 380, 400, 1050),
    "ninja_red": (340, 380, 560, 1050),
    "ninja_purple": (490, 400, 720, 1050),
}

for name, box in boxes.items():
    crop4 = img4.crop(box)
    # Gamma boost for dark characters
    a4 = np.array(crop4, dtype=np.float32) / 255.0
    a4 = np.power(a4, 0.35) * 255.0
    boosted4 = Image.fromarray(a4.astype(np.uint8))
    r4 = remove(boosted4, session=session)
    alpha4 = r4.split()[3]
    orig4 = crop4.convert("RGBA")
    orig4.putalpha(alpha4)
    orig4.save(os.path.join(OUT, f"{name}.png"))
    print(f"Saved {name}.png ({orig4.size})")

print("All done!")
