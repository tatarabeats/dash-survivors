"""Extract dark ninja player - enhance contrast before rembg"""
from PIL import Image, ImageEnhance
from rembg import remove, new_session
import os

SRC = "C:/Users/shunp/dash-survivors/public/concepts/nb2_generated/adopted_ninja_3_color_group.jpeg"
OUT = "C:/Users/shunp/dash-survivors/public/sprites/generated"

img = Image.open(SRC)

# Crop the center ninja
player_box = (180, 50, 580, 780)
crop = img.crop(player_box)

# Boost brightness and contrast to differentiate the dark ninja from dark bg
enhancer = ImageEnhance.Brightness(crop)
bright = enhancer.enhance(1.6)
enhancer2 = ImageEnhance.Contrast(bright)
boosted = enhancer2.enhance(1.8)

# Use isnet model
session = new_session("isnet-general-use")
result = remove(boosted, session=session)

# Now composite: use the alpha mask from the boosted version, but original colors
# Get alpha channel from boosted removal
alpha = result.split()[3]

# Apply alpha to original crop (not brightness-boosted)
original_rgba = crop.convert("RGBA")
original_rgba.putalpha(alpha)

out_path = os.path.join(OUT, "ninja_player.png")
original_rgba.save(out_path)
print(f"Saved: {out_path} ({original_rgba.size})")

# Also try the 4-color lineup for backup player sprite
SRC2 = "C:/Users/shunp/dash-survivors/public/concepts/nb2_generated/adopted_ninja_4_color_belts.jpeg"
img2 = Image.open(SRC2)
print(f"4-color belts image size: {img2.size}")
