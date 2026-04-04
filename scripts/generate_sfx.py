"""
忍者サバイバーズ SFX生成スクリプト
ElevenLabs Sound Effects API
"""
import requests
import os
from pathlib import Path
import time

API_KEY = "sk_b1e3c5ae6ca1dad6427d66f6e5860260ec1bc9b38a4740a3"
OUT_DIR = Path("C:/Users/shunp/dash-survivors/public/sounds")
OUT_DIR.mkdir(parents=True, exist_ok=True)

SFX_LIST = [
    ("slash",         "Sharp ninja sword slash, fast blade swoosh with metallic ring, short and crisp", 1.5),
    ("shuriken",      "Shuriken throwing star spinning whoosh, fast projectile flying through air", 1.0),
    ("dash",          "Quick ninja dash movement, fast air displacement whoosh, swift speed burst", 0.8),
    ("hit",           "Paper being slashed and crumpled, origami impact hit, short thud", 0.5),
    ("enemy_die",     "Origami paper crumpling and folding, enemy defeated rustling collapse", 1.0),
    ("levelup",       "Japanese koto string ascending arpeggio, level up chime, triumphant short melody", 2.0),
    ("xp_pickup",     "Small light pickup chime, soft sparkle coin sound, brief magical tinkle", 0.5),
    ("skill_use",     "Mystical ninja technique activation, ethereal whoosh with deep resonant impact", 1.5),
    ("shadow_clone",  "Shadow clone split echo, ethereal ninja multiply sound, ghostly duplicate effect", 1.5),
    ("wave_clear",    "Victory fanfare short, triumphant Japanese shamisen pluck with reverb, wave complete", 2.0),
    ("wave_start",    "Taiko drum hit, deep Japanese war drum single strike, battle begins", 1.0),
    ("skill_select",  "Scroll unrolling, parchment paper rustle, menu selection soft click", 0.8),
    ("boss_appear",   "Ominous taiko drum roll, dark Japanese horror sting, boss enemy appears", 2.5),
    ("game_over",     "Somber Japanese flute descending, sad short melody, defeat game over", 2.0),
]

def generate_sfx(name, prompt, duration):
    print(f"[{name}] 生成中... ", end="", flush=True)

    response = requests.post(
        "https://api.elevenlabs.io/v1/sound-generation",
        headers={
            "xi-api-key": API_KEY,
            "Content-Type": "application/json",
        },
        json={
            "text": prompt,
            "duration_seconds": duration,
            "prompt_influence": 0.3,
        }
    )

    if response.status_code == 200:
        out_path = OUT_DIR / f"{name}.mp3"
        out_path.write_bytes(response.content)
        print(f"OK ({len(response.content)//1024}KB) → {out_path.name}")
        return True
    else:
        print(f"ERROR {response.status_code}: {response.text[:100]}")
        return False

print(f"出力先: {OUT_DIR}")
print(f"生成数: {len(SFX_LIST)}種\n")

ok = 0
for i, (name, prompt, duration) in enumerate(SFX_LIST, 1):
    print(f"[{i}/{len(SFX_LIST)}] ", end="")
    if generate_sfx(name, prompt, duration):
        ok += 1
    time.sleep(1)

print(f"\n完了: {ok}/{len(SFX_LIST)} 生成成功")
print(f"保存先: {OUT_DIR}")
