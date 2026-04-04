"""Round 4: Pawapuro-style circle-parts ninja based on user sketch reference"""
import json, urllib.request, time, uuid, shutil, os

COMFYUI_URL = "http://127.0.0.1:8188"
COMFYUI_OUTPUT = "D:/ComfyUI/ComfyUI/output"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "concepts")
os.makedirs(OUTPUT_DIR, exist_ok=True)

def create_prompt(text, seed, w=768, h=768, prefix="concept4"):
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

CONCEPTS = [
    # Pawapuro-style circle/sphere body ninja - standing with katana on back
    {
        "prompt": "simple character made of circles and ovals like Jikkyou Powerful Pro Baseball Pawapuro style, round head circle, oval body, small circle hands and circle feet, cute simple human proportions, ninja outfit in solid black, katana sword strapped diagonally on back, gold headband, crimson scarf, flat 2D art no 3D no shading, dark navy background, game character design, front view standing, bold outlines, no text",
        "filename": "60_pawapro_ninja_stand",
        "seed": 8001,
    },
    {
        "prompt": "cute chibi character made entirely of simple circles and ovals, Pawapuro baseball game character style body proportions, round head with ninja mask, oval torso, small oval arms and legs, wearing black ninja outfit, katana on back diagonal with gold handle showing, gold glowing eye slit, small crimson bandana tails, completely flat 2D solid colors, no gradients no 3D, dark navy background, mobile game character icon, no text",
        "filename": "61_pawapro_ninja_v2",
        "seed": 8002,
    },
    {
        "prompt": "minimalist game character like Pawapuro made of basic circles, sphere head on oval body with small circle limbs, ninja design, all matte black with thin gold outline details, katana handle visible behind right shoulder, small red headband ribbons, white dot eyes with determined expression, extremely simple flat 2D design, solid colors only, dark navy background, cute but cool ninja mascot, no text",
        "filename": "62_pawapro_ninja_minimal",
        "seed": 8003,
    },
    # Action poses - running, dashing, slashing
    {
        "prompt": "simple circle-body character in running pose, Pawapuro style round head oval body small circle limbs, ninja in black, leaning forward running, arms back legs forward in dynamic sprint pose, crimson scarf flowing behind, katana bouncing on back, flat 2D solid colors no shading, dark navy background, game character sprite action pose, motion lines behind, no text",
        "filename": "63_pawapro_ninja_run",
        "seed": 8004,
    },
    {
        "prompt": "simple circle-body ninja character in dash attack pose, Pawapuro style proportions, body lunging forward fast, katana drawn from back and slashing forward with golden arc trail, dynamic action pose, crimson scarf stretched by speed, flat 2D solid colors, motion blur lines, dark navy background, game attack animation keyframe, no text",
        "filename": "64_pawapro_ninja_slash",
        "seed": 8005,
    },
    {
        "prompt": "simple circle-body ninja ultimate attack pose, Pawapuro style, standing powerful stance, katana held high overhead with both hands, golden energy aura radiating outward, crimson eyes blazing, dramatic but simple flat 2D art, circle and oval body parts, solid black body gold and crimson accents, dark navy background, game character power-up moment, no text",
        "filename": "65_pawapro_ninja_ultimate",
        "seed": 8006,
    },
    # 3-pose reference sheet
    {
        "prompt": "character reference sheet 3 poses side by side, Pawapuro style circle-body ninja: LEFT standing idle katana on back relaxed pose, CENTER running forward dynamic pose, RIGHT slashing katana with gold arc trail attack pose, all same simple circle oval body design, black body gold crimson accents, flat 2D solid colors no shading, dark navy background, game sprite sheet, no text",
        "filename": "66_pawapro_3pose_sheet",
        "seed": 8007,
    },
    # Enemies in matching Pawapuro style
    {
        "prompt": "4 simple circle-body yokai enemies in Pawapuro style, each made of circles and ovals with unique shape and color: red round ONI with circle horns angry expression, green rounder KAPPA with flat circle on head, orange tall oval TENGU with pointy triangle nose, white transparent YUREI ghost with wavy bottom no legs, all flat 2D solid colors bold outlines, dark navy background, game enemy lineup, no text",
        "filename": "67_pawapro_enemies",
        "seed": 8008,
    },
    {
        "prompt": "4 cute circle-body yokai enemy characters Pawapuro game style, distinct silhouettes for instant recognition: wide angry red oni blob with gold horn dots, squat green kappa with bowl circle on head, tall orange tengu with long oval beak, floating pale white yurei ghost teardrop shape with dark dot eyes, simple flat 2D art, bold thick outlines, dark navy background, mobile game enemies, no text",
        "filename": "68_pawapro_enemies_v2",
        "seed": 8009,
    },
    # Full game scene with Pawapuro characters
    {
        "prompt": "top-down mobile game screenshot, Pawapuro style circle-body ninja in center of screen, simple circle-body yokai enemies approaching from all sides, dark navy floor with thin gold Japanese wave pattern, golden slash arc effects, simple flat 2D art throughout, portrait 9:16 smartphone layout, health bar at top, skill icons at bottom, cute but intense action game, high contrast, no text",
        "filename": "69_pawapro_game_scene",
        "seed": 8010,
        "w": 512,
        "h": 896,
    },
    # Close-up character detail with katana
    {
        "prompt": "close-up detailed view of simple circle-body ninja character, Pawapuro style, showing katana strapped on back with gold handle and crimson cord wrap, character has round head with black ninja mask covering lower face, gold slit eyes, oval black body, small circle arms, flat 2D design with clean bold outlines, dark navy background, character design detail reference, no text",
        "filename": "70_pawapro_ninja_closeup",
        "seed": 8011,
    },
    # Color and style variations
    {
        "prompt": "4 color variations of same Pawapuro style circle-body ninja, side by side comparison: version 1 pure black with gold accents, version 2 dark navy with gold trim, version 3 charcoal gray with crimson accents, version 4 black with both gold and crimson details, all same simple circle oval body design, flat 2D, dark background, game character color study, no text",
        "filename": "71_pawapro_color_study",
        "seed": 8012,
    },
]

if __name__ == "__main__":
    print(f"=== Round 4: Generating {len(CONCEPTS)} Pawapuro-Style Concepts ===")
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
