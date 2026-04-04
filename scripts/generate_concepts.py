"""Generate concept images for visual redesign using ComfyUI API"""
import json, urllib.request, time, uuid, shutil, os

COMFYUI_URL = "http://127.0.0.1:8188"
COMFYUI_OUTPUT = "D:/ComfyUI/ComfyUI/output"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "concepts")
os.makedirs(OUTPUT_DIR, exist_ok=True)

def create_prompt(text, seed, w=768, h=768, prefix="concept"):
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
    # A. Character Art Styles (6)
    {
        "prompt": "ninja character design sheet, flat icon style, simple geometric shapes, thick black outlines, solid flat colors, black outfit with gold accents and dark crimson headband, holding katana, mobile game character art, clean vector-like illustration, dark navy background, minimalist design, no gradients, bold shapes, game icon style, no text",
        "filename": "01_flat_icon_ninja",
        "seed": 5001,
    },
    {
        "prompt": "chibi super deformed ninja character, cute 2-head-tall proportions, oversized katana weapon, big expressive eyes, black ninja outfit with gold trim and burgundy scarf, adorable but cool, Japanese chibi game art style, dark navy blue background, kawaii warrior design, mobile game character, no text",
        "filename": "02_chibi_sd_ninja",
        "seed": 5002,
    },
    {
        "prompt": "anime cel-shaded ninja warrior character design, clean sharp line art, anime style shading with hard shadows, black ninja suit with gold patterns and dark crimson sash, wielding gleaming katana, dynamic action pose, Genshin Impact mobile game art style, dark navy background, Japanese anime illustration, no text",
        "filename": "03_anime_celshade_ninja",
        "seed": 5003,
    },
    {
        "prompt": "pixel art ninja character sprite, 64x64 pixel art style scaled up, retro 16-bit game aesthetic, black ninja with gold and crimson accents, pixel sword, dark navy blue background, Vampire Survivors indie game pixel art style, clean pixelated edges, nostalgic retro game character, no text",
        "filename": "04_pixelart_ninja",
        "seed": 5004,
    },
    {
        "prompt": "Japanese ink wash painting style ninja, sumi-e brush stroke art, watercolor and ink traditional style, bold black ink strokes forming ninja silhouette, gold and burgundy accent splashes, minimalist zen aesthetic, traditional Japanese art meets game character design, washi paper texture background, Okami game inspired, no text",
        "filename": "05_sumi_ink_ninja",
        "seed": 5005,
    },
    {
        "prompt": "neon Japanese cyberpunk ninja character, dark black background with glowing gold and crimson neon outlines, stylized silhouette with luminous edge lighting, katana glowing with golden energy, futuristic traditional Japanese fusion, neon wireframe style game character art, dark navy and black with gold burgundy glow lines, no text",
        "filename": "06_neon_ninja",
        "seed": 5006,
    },
    # B. Color Palettes & Composition (4)
    {
        "prompt": "mobile game character lineup design, dark color palette showcase, black and gold and dark navy blue color scheme, ninja warrior and yokai monsters oni demon kappa tengu yurei ghost, all characters in flat stylized game art, golden accents on dark backgrounds, character design reference sheet, game art direction concept, no text",
        "filename": "07_palette_black_gold_navy",
        "seed": 5007,
    },
    {
        "prompt": "mobile game character lineup design, dark navy blue and burgundy crimson and gold color scheme, stylized ninja and Japanese yokai enemies red oni green kappa crow tengu pale ghost yurei, bold contrasting colors, game character art direction, high contrast visibility, icon-style simplified characters, no text",
        "filename": "08_palette_navy_crimson_gold",
        "seed": 5008,
    },
    {
        "prompt": "Japanese washi paper textured game scene, warm cream and beige paper background with subtle fiber texture, ink-style ninja character and yokai enemies rendered in bold dark strokes, gold and crimson accent colors, traditional Japanese game art on aged paper, warm natural tones, calligraphic aesthetic, no text",
        "filename": "09_palette_washi_paper",
        "seed": 5009,
    },
    {
        "prompt": "cyberpunk Japanese neon game scene, pure black background with glowing neon outlines, ninja character with gold glowing edges fighting oni demons with crimson neon glow, dark navy blue energy effects, stylized silhouette combat scene, neon wireframe action game aesthetic, high contrast glow-on-dark, no text",
        "filename": "10_palette_neon_japan",
        "seed": 5010,
    },
    # C. UI/HUD (2)
    {
        "prompt": "mobile game HUD UI design mockup, minimal clean interface, dark navy blue transparent health bar at top, gold accent XP bar, small skill icons at bottom of screen, ninja action game screenshot with minimalist overlay, black gold and crimson color scheme UI elements, modern mobile game interface design, portrait orientation smartphone layout, clean",
        "filename": "11_hud_minimal",
        "seed": 5011,
        "w": 512,
        "h": 896,
    },
    {
        "prompt": "mobile game HUD UI design mockup, Survivor.io style compact top status bar, dark navy translucent panels, gold borders and crimson accents, skill icons with cooldown indicators at bottom, wave counter and timer, ninja action roguelike game screenshot, professional mobile game UI layout, portrait orientation smartphone, polished game interface",
        "filename": "12_hud_gaming",
        "seed": 5012,
        "w": 512,
        "h": 896,
    },
    # D. Full Game Screens (2)
    {
        "prompt": "top-down view Japanese bamboo forest game level, bright daytime scene with strong sunlight casting sharp shadows, vibrant green bamboo and golden light beams, high contrast bright game environment, stylized 2D game background for mobile action game, overhead perspective, warm golden sunshine with dark shadows, clear visibility, no characters, no text",
        "filename": "13_screen_bright_day",
        "seed": 5013,
    },
    {
        "prompt": "top-down view Japanese castle courtyard at night, dramatically lit by large golden moon, moonlight flooding the entire ground with warm gold glow, dark navy blue sky, stone paths and wooden structures visible in golden light, high visibility night scene for mobile game, bright enough to see all details clearly, stylized 2D game environment, overhead perspective, no characters, no text",
        "filename": "14_screen_bright_night",
        "seed": 5014,
    },
]

if __name__ == "__main__":
    print(f"=== Generating {len(CONCEPTS)} Concept Images ===")
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
