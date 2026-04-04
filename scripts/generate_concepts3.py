"""Round 3: Refined direction - geometric human-shaped ninja with katana on back, sharp + iconic"""
import json, urllib.request, time, uuid, shutil, os

COMFYUI_URL = "http://127.0.0.1:8188"
COMFYUI_OUTPUT = "D:/ComfyUI/ComfyUI/output"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "concepts")
os.makedirs(OUTPUT_DIR, exist_ok=True)

def create_prompt(text, seed, w=768, h=768, prefix="concept3"):
    return {
        "1": {"class_type": "UnetLoaderGGUF", "inputs": {"unet_name": "flux-2-klein-9b-Q5_K_M.gguf"}},
        "2": {"class_type": "CLIPLoader", "inputs": {"clip_name": "qwen_3_8b_fp8mixed.safetensors", "type": "flux2"}},
        "3": {"class_type": "VAELoader", "inputs": {"vae_name": "flux2-vae.safetensors"}},
        "4": {"class_type": "CLIPTextEncode", "inputs": {"text": text, "clip": ["2", 0]}},
        "5": {"class_type": "EmptyLatentImage", "inputs": {"width": w, "height": h, "batch_size": 1}},
        "6": {"class_type": "KSampler", "inputs": {
            "model": ["1", 0], "positive": ["4", 0], "negative": ["4", 0],
            "latent_image": ["5", 0], "seed": seed, "steps": 4,
            "cfg": 1.0, "sampler_name": "euler", "scheduler": "simple", "denoise": 1.0
        }},
        "7": {"class_type": "VAEDecode", "inputs": {"samples": ["6", 0], "vae": ["3", 0]}},
        "8": {"class_type": "SaveImage", "inputs": {"images": ["7", 0], "filename_prefix": prefix}}
    }

def submit_and_wait(prompt_data, timeout=300):
    client_id = str(uuid.uuid4())
    payload = json.dumps({"prompt": prompt_data, "client_id": client_id}).encode()
    req = urllib.request.Request(f"{COMFYUI_URL}/prompt", data=payload, headers={"Content-Type": "application/json"})
    resp = json.loads(urllib.request.urlopen(req).read())
    prompt_id = resp["prompt_id"]
    for _ in range(timeout // 2):
        time.sleep(2)
        hist = json.loads(urllib.request.urlopen(f"{COMFYUI_URL}/history/{prompt_id}").read())
        if prompt_id in hist:
            result = hist[prompt_id]
            status = result.get("status", {})
            if status.get("completed", False):
                for output in result.get("outputs", {}).values():
                    if "images" in output:
                        return output["images"][0]["filename"]
            elif status.get("status_str") == "error":
                print(f"  ERROR: {status.get('messages', [])}")
                return None
    return None

# Direction: geometric human-shaped icon ninja, sharp triangles + rounded capsule body,
# katana strapped diagonally on back, simple shapes, black/gold/navy/crimson palette
CONCEPTS = [
    # Ninja character - various geometric human proportions with katana on back
    {
        "prompt": "simple geometric ninja character icon, human-shaped body made of simple shapes, rounded rectangle torso with triangle shoulders, capsule-shaped legs, round head with angular mask, katana sword strapped diagonally across back, black body with gold trim accents, crimson red eye slit, flat solid colors no gradients, thick bold outlines, dark navy background, mobile game character icon design, clean minimal vector art, no text",
        "filename": "40_geo_ninja_katana_back_v1",
        "seed": 7001,
    },
    {
        "prompt": "minimalist geometric ninja warrior icon, body built from basic shapes triangles and rectangles, angular sharp shoulders tapering to narrow waist, katana in sheath strapped diagonally on back visible behind shoulder, black silhouette body with gold edge details and crimson headband tails, simple dot eyes glowing gold, flat icon game character, dark navy blue background, clean bold design, no shading no gradients, no text",
        "filename": "41_geo_ninja_sharp_v2",
        "seed": 7002,
    },
    {
        "prompt": "stylized geometric ninja character, pill-shaped body slightly taller than wide giving human proportions, sharp angular arms, katana handle visible over right shoulder with blade going down diagonally behind back, matte black body, thin gold outline, small crimson scarf tails flowing, white slit eyes, simple clean shapes like a logo or app icon, flat colors, dark navy background, game mascot design, no text",
        "filename": "42_pill_ninja_katana_v3",
        "seed": 7003,
    },
    {
        "prompt": "geometric ninja icon character standing pose, trapezoid torso wider at shoulders narrow at waist, simple stick-like arms and legs with rounded ends, circular head with triangular mask covering lower face, long katana strapped diagonally across back from hip to shoulder, all black with gold katana handle and gold eyes, crimson belt sash, extremely clean flat design, bold black outlines, dark navy background, mobile game character, no text",
        "filename": "43_trapezoid_ninja_v4",
        "seed": 7004,
    },
    # Ninja with katana drawn - action pose variations
    {
        "prompt": "geometric ninja icon in action pose, same simple shape style, pulling katana from back sheath, dynamic slash motion, golden blade arc trail, body leaning forward aggressively, sharp angular pose, black body gold sword crimson scarf flowing, flat solid colors, bold thick outlines, dark navy background, game character attack animation keyframe, clean minimal design, no text",
        "filename": "44_ninja_drawing_katana",
        "seed": 7005,
    },
    {
        "prompt": "geometric ninja icon ultimate attack pose, katana fully drawn held in both hands overhead, powerful stance, golden energy aura radiating, crimson eyes blazing, simple geometric body shape but in dramatic action pose, slash lines around, flat icon art style, bold outlines, black gold crimson palette on dark navy background, game character power-up state, no text",
        "filename": "45_ninja_ultimate_pose",
        "seed": 7006,
    },
    # 3-pose sheet: idle (katana on back), ready (hand on handle), attack (sword out)
    {
        "prompt": "character design sheet showing 3 poses of same geometric ninja icon, left: standing idle with katana on back relaxed, center: ready stance hand gripping katana handle about to draw, right: attack pose katana fully drawn slashing forward with gold arc, all same simple geometric flat icon style, black body gold accents crimson details, dark navy background, game sprite reference sheet, clean flat art, no text",
        "filename": "46_ninja_3pose_sheet",
        "seed": 7007,
    },
    # Enemy designs matching the style
    {
        "prompt": "4 geometric yokai enemy icons in a row matching flat icon style, simple shapes: red trapezoid oni demon with gold horn triangles, green rounded kappa with circle shell on back, orange angular tengu with triangle beak nose, pale white wavy yurei ghost with no legs fading bottom, all extremely simple geometric icon characters, bold outlines flat colors, dark navy background, game enemy lineup, no text",
        "filename": "47_geo_enemies_matching",
        "seed": 7008,
    },
    {
        "prompt": "4 simple geometric yokai enemy icons, each distinctly shaped for instant recognition: oni is a wide angry red pentagon with tiny gold horns, kappa is a green circle with darker circle shell bump, tengu is an orange triangle pointing right with beak, yurei is a white teardrop shape floating with dark empty eyes, maximum simplicity bold color coding, flat art icon style, dark navy background, no text",
        "filename": "48_geo_enemies_distinct_shapes",
        "seed": 7009,
    },
    # Full game scene mockups
    {
        "prompt": "top-down mobile game screenshot mockup, geometric icon style ninja in center with katana on back, surrounded by approaching geometric yokai enemies, dark navy ground with subtle gold geometric Japanese wave pattern floor tiles, golden slash effects, simple flat art style throughout, high contrast, clean readable game scene, portrait smartphone orientation, health bar at top with gold accent, no text on game area",
        "filename": "49_full_game_scene_v1",
        "seed": 7010,
        "w": 512,
        "h": 896,
    },
    {
        "prompt": "top-down mobile game action screenshot, geometric flat ninja icon slashing through enemies with golden katana arc trail, red oni and green kappa enemies scattering, dark navy blue ground with faint gold hexagonal pattern, crimson and gold particle effects from combat, simple bold icon art style characters, high contrast dark background bright effects, clean readable mobile game, portrait orientation, no text",
        "filename": "50_full_game_combat_v2",
        "seed": 7011,
        "w": 512,
        "h": 896,
    },
    # Background variations - flat/geometric style matching characters
    {
        "prompt": "top-down game floor texture, dark navy blue base with geometric Japanese seigaiha wave pattern in thin gold lines, clean flat design matching icon art style game, no realistic textures, pure geometric pattern, high contrast gold on dark navy, tile-able game environment background, overhead view, no characters, no text",
        "filename": "51_bg_flat_seigaiha_gold",
        "seed": 7012,
    },
    {
        "prompt": "top-down game floor texture, dark charcoal black base with subtle geometric asanoha hemp leaf pattern in dark gold lines, Japanese traditional pattern as game floor, flat clean design not realistic, minimalist geometric tile pattern, warm gold on dark background, game environment matching flat icon art style, overhead view, no characters, no text",
        "filename": "52_bg_flat_asanoha_pattern",
        "seed": 7013,
    },
    {
        "prompt": "top-down game floor texture, dark navy gradient base with geometric Japanese kumiko woodwork pattern in thin crimson and gold lines, intersecting triangles and hexagons forming beautiful lattice, flat clean vector style not realistic, dark background with warm accent pattern lines, game floor tile design, overhead view, no characters, no text",
        "filename": "53_bg_flat_kumiko_pattern",
        "seed": 7014,
    },
    # Title screen concept
    {
        "prompt": "mobile game title screen, large geometric ninja icon character center with katana strapped on back, standing on dark navy ground, gold Japanese calligraphy style title area above, golden particles falling like cherry petals, crimson accent line separating title from character, start button area below in gold outline, dark sophisticated color scheme black navy gold crimson, flat icon art style, portrait smartphone orientation, stylish minimal game title, no readable text",
        "filename": "54_title_screen_v2",
        "seed": 7015,
        "w": 512,
        "h": 896,
    },
    # Skill/upgrade card concept
    {
        "prompt": "mobile game skill selection cards, 3 vertical cards side by side, dark navy card backgrounds with gold borders, each card has simple geometric skill icon at top lightning bolt fire flame wind spiral, card shows rarity with color coded glow gold for common teal for rare purple for epic, flat clean UI design matching icon art style, dark background, portrait orientation, game upgrade selection screen, no readable text",
        "filename": "55_skill_cards_concept",
        "seed": 7016,
        "w": 512,
        "h": 896,
    },
]

if __name__ == "__main__":
    print(f"=== Round 3: Generating {len(CONCEPTS)} Refined Concepts ===")
    ok = 0
    for i, c in enumerate(CONCEPTS):
        name = c["filename"]
        w = c.get("w", 768)
        h = c.get("h", 768)
        print(f"[{i+1}/{len(CONCEPTS)}] {name} ({w}x{h})")
        prompt_data = create_prompt(c["prompt"], c["seed"], w, h, name)
        filename = submit_and_wait(prompt_data)
        if filename:
            src = os.path.join(COMFYUI_OUTPUT, filename)
            dst = os.path.join(OUTPUT_DIR, f"{name}.png")
            shutil.copy2(src, dst)
            print(f"  OK -> {dst}")
            ok += 1
        else:
            print(f"  FAILED")
    print(f"\n=== Done! {ok}/{len(CONCEPTS)} generated ===")
