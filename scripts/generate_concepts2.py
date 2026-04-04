"""Generate round 2 concept images - Kirby-level simple, flat icon style variations"""
import json, urllib.request, time, uuid, shutil, os

COMFYUI_URL = "http://127.0.0.1:8188"
COMFYUI_OUTPUT = "D:/ComfyUI/ComfyUI/output"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "concepts")
os.makedirs(OUTPUT_DIR, exist_ok=True)

def create_prompt(text, seed, w=768, h=768, prefix="concept2"):
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

# Kirby-level simplicity: round shapes, minimal detail, bold silhouettes, maximum readability
CONCEPTS = [
    # Round blob ninja variations - Kirby simplicity
    {
        "prompt": "extremely simple round blob ninja character like Kirby, round body shape, tiny dot eyes, small black mask, minimal detail, cute simple ninja, solid black round body with gold headband, holding tiny katana, pure flat color, no shading, no gradients, solid dark navy background, mobile game mascot character, vector art style, clean simple shapes, no text",
        "filename": "20_blob_ninja_gold",
        "seed": 6001,
    },
    {
        "prompt": "extremely simple round blob ninja character like Kirby, round puffy body, dot eyes peeking over mask, minimal features, solid matte black body with crimson red scarf flowing, tiny katana, pure flat colors no gradients, simple cute but cool, dark navy blue background, Kirby level simplicity game character, clean vector shapes, no text",
        "filename": "21_blob_ninja_crimson",
        "seed": 6002,
    },
    {
        "prompt": "very simple round ninja character, bean-shaped body like Kirby or Among Us, black silhouette with glowing gold eyes and small red headband, extremely minimal design, maximum simplicity, cute but deadly ninja blob, solid flat colors, dark background, indie mobile game character icon, no detail no texture, bold simple shape, no text",
        "filename": "22_bean_ninja_glow",
        "seed": 6003,
    },
    {
        "prompt": "simple geometric ninja character, circle head on small trapezoid body like a game piece or chess pawn, black with gold trim, tiny angry eyes, red bandana tails flowing, extremely simplified flat design, bold thick outline, solid colors only, dark navy background, mobile game token character style, minimal cute warrior, no text",
        "filename": "23_geometric_pawn_ninja",
        "seed": 6004,
    },
    # Enemy lineup in same simple style
    {
        "prompt": "4 simple round blob yokai monsters in a row, Kirby-level simplicity, left to right: red round oni demon with tiny horns, green round kappa with bowl on head, brown round tengu with long nose, white round ghost yurei floating, all extremely simple cute blob shapes, dot eyes, minimal detail, flat colors no gradients, dark navy background, mobile game enemy character lineup, no text",
        "filename": "24_blob_enemies_lineup",
        "seed": 6005,
    },
    {
        "prompt": "4 simple geometric yokai monsters lineup, minimal shapes like Kirby enemies, red oni blob with gold horns and angry eyes, green kappa blob with shell pattern, orange tengu blob with beak shape, pale ghost yurei blob transparent and wavy, all extremely simplified cute game enemies, flat solid colors, bold outlines, dark background, game art, no text",
        "filename": "25_simple_enemies_v2",
        "seed": 6006,
    },
    # Full cast together - game feel
    {
        "prompt": "simple blob ninja fighting simple blob monsters, Kirby game art style, round black ninja with gold accents slashing at round red oni and round green kappa, golden slash effect arc, extremely simple flat art, cute action scene, minimal detail maximum readability, solid flat colors, dark navy background with subtle gold particles, mobile game screenshot style, no text",
        "filename": "26_action_scene_blobs",
        "seed": 6007,
    },
    {
        "prompt": "top-down mobile game screenshot concept, simple round blob ninja character in center, surrounded by simple round blob yokai enemies approaching from all sides, golden slash trails, dark navy blue ground with subtle tile pattern, health bar at top, extremely simple Kirby-level character design, flat colors, high contrast, clean game UI mockup, portrait orientation, no text",
        "filename": "27_gameplay_mockup_topdown",
        "seed": 6008,
        "w": 512,
        "h": 896,
    },
    # Different shape languages
    {
        "prompt": "triangle-based ninja character, angular sharp geometric design, black triangle body with gold edge highlights, sharp angular eyes, crimson scarf triangles flowing behind, extremely simple but cool angular design, flat solid colors, geometric minimal game character, dark navy background, stylish sharp shapes, no curves, mobile game art, no text",
        "filename": "28_angular_triangle_ninja",
        "seed": 6009,
    },
    {
        "prompt": "pill-shaped capsule ninja character, rounded rectangle body like a medicine capsule, top half black bottom half dark navy, gold belt line in middle, tiny white dot eyes, small red headband, holding simple rectangle katana, extremely minimal clean design, Kirby simplicity level, flat colors, solid shapes, dark background, cute simple game character, no text",
        "filename": "29_capsule_ninja",
        "seed": 6010,
    },
    # Color palette variations with simple characters
    {
        "prompt": "simple round ninja character design sheet, 4 color palette variations shown side by side, same Kirby-simple round blob ninja in different color schemes: black and gold, navy and crimson, charcoal and amber, midnight blue and bronze, all extremely simple flat design, dot eyes, minimal detail, game character color study, clean presentation, no text",
        "filename": "30_color_variations",
        "seed": 6011,
    },
    {
        "prompt": "simple round blob ninja character, black body with luminous gold outline glow, dark navy blue background, the ninja is like a shadow silhouette with bright gold edge lighting and small crimson eyes, extremely simple shape like Kirby, minimal detail, dramatic contrast between dark body and bright gold rim light, stylish minimal game character, no text",
        "filename": "31_silhouette_gold_rim",
        "seed": 6012,
    },
    # Background concepts for simple art style
    {
        "prompt": "top-down game environment for simple flat art style game, dark navy blue ground with subtle geometric Japanese wave pattern in gold lines, clean minimal background, seigaiha waves as floor pattern, high contrast dark and gold, suitable for simple blob characters, overhead view game level, clean tiles, no characters, no text",
        "filename": "32_bg_navy_gold_pattern",
        "seed": 6013,
    },
    {
        "prompt": "top-down game environment, dark charcoal ground with warm golden ambient lighting from edges, Japanese garden stone path pattern in muted tones, bamboo shadows cast on ground, minimal clean background for simple character game, overhead view, warm but dark, gold accent lighting, high visibility for gameplay, no characters, no text",
        "filename": "33_bg_warm_dark_garden",
        "seed": 6014,
    },
    {
        "prompt": "top-down game environment, gradient from deep navy center to dark crimson edges creating natural vignette, subtle Japanese hexagonal tile pattern on floor in faint gold lines, atmospheric game background, clean minimal dark surface, suitable for flat art style mobile game, overhead perspective, moody but visible, no characters, no text",
        "filename": "34_bg_navy_crimson_gradient",
        "seed": 6015,
    },
    {
        "prompt": "mobile game title screen concept, large simple round blob ninja character center, Kirby-level simple design, black body gold eyes and crimson scarf, Japanese calligraphy title text area above, dark navy background with falling golden particle effects like cherry blossom petals, start button area below, clean flat art style game title, portrait orientation, stylish minimal",
        "filename": "35_title_screen_concept",
        "seed": 6016,
        "w": 512,
        "h": 896,
    },
]

if __name__ == "__main__":
    print(f"=== Round 2: Generating {len(CONCEPTS)} Kirby-Simple Concepts ===")
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
