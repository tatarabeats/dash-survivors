"""
忍者サバイバーズ SFX - Freesound.org CC0ダウンロード
Freesound APIキーなしでプレビューmp3を取得
"""
import urllib.request
import json
import os
import time
from pathlib import Path

OUT_DIR = Path("C:/Users/shunp/dash-survivors/public/sounds")
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Freesound CC0 sound IDs（事前に調査済み）
# 形式: (ファイル名, sound_id, 説明)
SOUNDS = [
    ("slash",        "671203", "sword slash swoosh"),
    ("shuriken",     "476177", "shuriken throwing star whoosh"),
    ("dash",         "399095", "quick air whoosh dash"),
    ("hit",          "108615", "impact hit thud"),
    ("enemy_die",    "352661", "enemy death crumple"),
    ("levelup",      "270402", "level up chime ascending"),
    ("xp_pickup",    "341695", "pickup coin chime"),
    ("skill_use",    "403165", "magic skill activation whoosh"),
    ("shadow_clone", "320655", "ethereal ghost effect"),
    ("wave_clear",   "270528", "victory fanfare short"),
    ("wave_start",   "106769", "taiko drum hit"),
    ("skill_select", "414209", "menu select click"),
    ("boss_appear",  "277403", "ominous hit drum"),
    ("game_over",    "270404", "game over sad tone"),
]

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}

def download_preview(name, sound_id):
    # Freesound APIでサウンド情報取得（認証不要のプレビュー）
    api_url = f"https://freesound.org/apiv2/sounds/{sound_id}/?fields=name,previews,license"

    req = urllib.request.Request(api_url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())

        preview_url = data["previews"]["preview-hq-mp3"]
        out_path = OUT_DIR / f"{name}.mp3"

        req2 = urllib.request.Request(preview_url, headers=headers)
        with urllib.request.urlopen(req2, timeout=15) as resp2:
            out_path.write_bytes(resp2.read())

        print(f"  [{name}] OK → {out_path.name} ({out_path.stat().st_size//1024}KB)")
        return True
    except Exception as e:
        print(f"  [{name}] ERROR: {e}")
        return False

# Freesound APIキーなしで使えるエンドポイントを試す
print("=== 忍者サバイバーズ SFX ダウンロード ===")
print(f"出力先: {OUT_DIR}\n")

# APIキーが必要な場合の代替: 直接URLリスト
DIRECT_URLS = [
    ("slash",        "https://cdn.freesound.org/previews/671/671203_5674468-hq.mp3"),
    ("shuriken",     "https://cdn.freesound.org/previews/476/476177_9158069-hq.mp3"),
    ("dash",         "https://cdn.freesound.org/previews/399/399095_5121236-hq.mp3"),
    ("hit",          "https://cdn.freesound.org/previews/108/108615_1537207-hq.mp3"),
    ("enemy_die",    "https://cdn.freesound.org/previews/352/352661_5121236-hq.mp3"),
    ("levelup",      "https://cdn.freesound.org/previews/270/270402_5123851-hq.mp3"),
    ("xp_pickup",    "https://cdn.freesound.org/previews/341/341695_5858296-hq.mp3"),
    ("skill_use",    "https://cdn.freesound.org/previews/403/403165_6142149-hq.mp3"),
    ("shadow_clone", "https://cdn.freesound.org/previews/320/320655_5260872-hq.mp3"),
    ("wave_clear",   "https://cdn.freesound.org/previews/270/270528_5123851-hq.mp3"),
    ("wave_start",   "https://cdn.freesound.org/previews/106/106769_1537207-hq.mp3"),
    ("skill_select", "https://cdn.freesound.org/previews/414/414209_7037527-hq.mp3"),
    ("boss_appear",  "https://cdn.freesound.org/previews/277/277403_4397472-hq.mp3"),
    ("game_over",    "https://cdn.freesound.org/previews/270/270404_5123851-hq.mp3"),
]

ok = 0
for name, url in DIRECT_URLS:
    out_path = OUT_DIR / f"{name}.mp3"
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = resp.read()
        out_path.write_bytes(data)
        print(f"[{name}] OK ({len(data)//1024}KB)")
        ok += 1
    except Exception as e:
        print(f"[{name}] FAILED: {e}")
    time.sleep(0.5)

print(f"\n完了: {ok}/{len(DIRECT_URLS)}")
if ok > 0:
    print(f"保存先: {OUT_DIR}")
