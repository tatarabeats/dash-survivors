"""Generate game assets using ComfyUI API with Flux.2 Klein 9B GGUF"""
import json, urllib.request, urllib.parse, time, sys, os, uuid, shutil

COMFYUI_URL = "http://127.0.0.1:8188"
COMFYUI_OUTPUT = "D:/ComfyUI/ComfyUI/output"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "sprites", "generated")
os.makedirs(OUTPUT_DIR, exist_ok=True)

def create_prompt(text, seed, w=1024, h=1024, prefix="game_asset"):
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
                msgs = status.get("messages", [])
                print(f"  ERROR: {msgs}")
                return None
    return None

# Game assets to generate
ASSETS = [
    {
        "prompt": (
            "dark ninja warrior character design sheet, full body front view, "
            "black ninja outfit with red headband flowing in wind, glowing crimson eyes, "
            "holding a gleaming katana in ready stance, "
            "Japanese dark fantasy game character illustration, "
            "highly detailed 2D game art, dramatic rim lighting, "
            "solid pure black background, no text, no watermark"
        ),
        "filename": "ninja_hero",
        "seed": 42,
    },
    {
        "prompt": (
            "fearsome red oni demon warrior, massive muscular body, "
            "two curved horns on head, wild mane of dark hair, glowing yellow eyes, "
            "wielding a massive iron spiked kanabo club, "
            "traditional Japanese yokai monster design, dark fantasy game enemy character, "
            "menacing aggressive stance, highly detailed 2D game art illustration, "
            "solid pure black background, no text, no watermark"
        ),
        "filename": "oni_enemy",
        "seed": 1337,
    },
    {
        "prompt": (
            "Japanese kappa water demon creature, green scaly amphibian skin, "
            "turtle shell on its back, water-filled dish depression on top of head, "
            "webbed clawed hands, menacing sharp-toothed grin, "
            "yokai monster design, dark fantasy 2D game enemy character illustration, "
            "solid pure black background, no text, no watermark"
        ),
        "filename": "kappa_enemy",
        "seed": 7777,
    },
    {
        "prompt": (
            "Japanese tengu crow demon, fierce red face with extremely long pointed nose, "
            "large black feathered wings spread wide, "
            "wearing traditional yamabushi mountain monk robes, "
            "holding a magical feathered hauchiwa fan, "
            "yokai monster, dark fantasy 2D game character illustration, "
            "solid pure black background, no text, no watermark"
        ),
        "filename": "tengu_enemy",
        "seed": 9999,
    },
    {
        "prompt": (
            "Japanese yurei vengeful ghost woman, extremely long straight black hair "
            "flowing and covering parts of her pale white face, "
            "wearing tattered white burial kimono, "
            "ghostly translucent lower body fading into mist, eerie blue-white supernatural glow, "
            "yokai spirit, dark fantasy 2D game character illustration, "
            "solid pure black background, no text, no watermark"
        ),
        "filename": "yurei_enemy",
        "seed": 2024,
    },
    {
        "prompt": (
            "dark bamboo forest at night, dense tall bamboo stalks, "
            "moonlight filtering through creating dramatic light shafts, "
            "misty fog at ground level, fallen leaves, "
            "Japanese atmospheric landscape, 2D game background environment art, "
            "moody dark green and deep blue tones, cinematic composition, "
            "high quality digital painting, no text, no watermark"
        ),
        "filename": "bg_bamboo",
        "seed": 888,
        "w": 1024,
        "h": 576,
    },
    {
        "prompt": (
            "ancient Japanese castle rooftop at night under full moon, "
            "traditional dark wooden architecture with curved tiled roofs, "
            "cherry blossom petals floating in moonlight, dark storm clouds, "
            "2D game background environment art, dramatic dark atmosphere, "
            "high quality digital painting, cinematic, no text, no watermark"
        ),
        "filename": "bg_castle",
        "seed": 555,
        "w": 1024,
        "h": 576,
    },
]

if __name__ == "__main__":
    print("=== Generating Game Assets ===")
    for i, asset in enumerate(ASSETS):
        name = asset["filename"]
        w = asset.get("w", 1024)
        h = asset.get("h", 1024)
        print(f"\n[{i+1}/{len(ASSETS)}] {name} ({w}x{h})")
        prompt_data = create_prompt(asset["prompt"], asset["seed"], w, h, name)
        filename = submit_and_wait(prompt_data)
        if filename:
            src = os.path.join(COMFYUI_OUTPUT, filename)
            dst = os.path.join(OUTPUT_DIR, f"{name}.png")
            shutil.copy2(src, dst)
            print(f"  OK -> {dst}")
        else:
            print(f"  FAILED")
    print(f"\n=== Done! Assets in {OUTPUT_DIR} ===")
