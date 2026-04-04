"""Extract 3 enemy characters from adopted_samurai_ninja_ronin.jpeg using rembg"""
from PIL import Image
from rembg import remove
import os

SRC = "C:/Users/shunp/dash-survivors/public/concepts/nb2_generated/adopted_samurai_ninja_ronin.jpeg"
OUT = "C:/Users/shunp/dash-survivors/public/sprites/generated"
os.makedirs(OUT, exist_ok=True)

img = Image.open(SRC)
w, h = img.size  # 768 x 1376

# Crop regions (estimated from visual inspection)
# Samurai (left) - red armor, gold helmet
samurai_box = (0, 30, 310, 1050)
# Ninja (center) - black origami, yellow eyes
ninja_box = (210, 250, 530, 1050)
# Ronin (right) - green hat, katana
ronin_box = (430, 50, 768, 1050)

crops = {
    "enemy_samurai": samurai_box,
    "enemy_ninja_player": ninja_box,
    "enemy_ronin": ronin_box,
}

for name, box in crops.items():
    print(f"Processing {name}...")
    crop = img.crop(box)
    # Remove background
    crop_rgba = remove(crop)
    # Save as PNG with transparency
    out_path = os.path.join(OUT, f"{name}.png")
    crop_rgba.save(out_path)
    print(f"  Saved: {out_path} ({crop_rgba.size})")

# Also extract the full image with bg removed as boss variant
print("Processing boss (full samurai, larger)...")
boss_crop = img.crop((0, 0, 350, 1100))
boss_rgba = remove(boss_crop)
boss_rgba.save(os.path.join(OUT, "enemy_boss_samurai.png"))
print(f"  Saved boss variant")

print("Done! All enemy sprites extracted.")
