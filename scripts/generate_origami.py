"""Generate origami washi paper style concepts"""
import json, urllib.request, uuid, os, shutil, time

COMFYUI_URL = "http://127.0.0.1:8188"
COMFY_OUT = "D:/ComfyUI/ComfyUI/output"
DST = os.path.join(os.path.dirname(__file__), "..", "public", "concepts")

def make_prompt(text, seed, w=768, h=768, prefix="origami"):
    return {
        "1": {"class_type": "UnetLoaderGGUF", "inputs": {"unet_name": "flux-2-klein-9b-Q5_K_M.gguf"}},
        "2": {"class_type": "CLIPLoader", "inputs": {"clip_name": "qwen_3_8b_fp8mixed.safetensors", "type": "flux2"}},
        "3": {"class_type": "VAELoader", "inputs": {"vae_name": "flux2-vae.safetensors"}},
        "4": {"class_type": "CLIPTextEncode", "inputs": {"text": text, "clip": ["2", 0]}},
        "5": {"class_type": "EmptyLatentImage", "inputs": {"width": w, "height": h, "batch_size": 1}},
        "6": {"class_type": "KSampler", "inputs": {
            "model": ["1", 0], "positive": ["4", 0], "negative": ["4", 0],
            "latent_image": ["5", 0], "seed": seed, "steps": 2,
            "cfg": 1.0, "sampler_name": "euler", "scheduler": "simple", "denoise": 1.0
        }},
        "7": {"class_type": "VAEDecode", "inputs": {"samples": ["6", 0], "vae": ["3", 0]}},
        "8": {"class_type": "SaveImage", "inputs": {"images": ["7", 0], "filename_prefix": prefix}}
    }

def gen_one(text, seed, name, w=768, h=768):
    p = make_prompt(text, seed, w, h, name)
    cid = str(uuid.uuid4())
    payload = json.dumps({"prompt": p, "client_id": cid}).encode()
    req = urllib.request.Request(f"{COMFYUI_URL}/prompt", data=payload, headers={"Content-Type": "application/json"})
    resp = json.loads(urllib.request.urlopen(req).read())
    pid = resp["prompt_id"]
    for _ in range(120):
        time.sleep(2)
        try:
            hist = json.loads(urllib.request.urlopen(f"{COMFYUI_URL}/history/{pid}").read())
        except:
            return False
        if pid in hist:
            st = hist[pid].get("status", {})
            if st.get("completed", False):
                for out in hist[pid].get("outputs", {}).values():
                    if "images" in out:
                        src = os.path.join(COMFY_OUT, out["images"][0]["filename"])
                        dst_path = os.path.join(DST, f"{name}.png")
                        shutil.copy2(src, dst_path)
                        return True
            if st.get("status_str") == "error":
                return False
    return False

CONCEPTS = [
    {
        "prompt": "origami ninja character made of folded washi paper, visible fold creases and paper edges, dark black washi paper body, round expressive eyes visible through mask cutout, gold washi paper katana on back, crimson washi paper scarf, paper texture visible, layered paper construction, dark navy washi paper background, handcrafted game character, no text",
        "seed": 12001, "name": "ori01_ninja_eyes",
    },
    {
        "prompt": "origami ninja warrior folded from dark washi paper, angular origami folds creating human body shape, two big round white eyes with black pupils peeking from mask, gold foil katana strapped on back, small crimson origami scarf, visible paper creases and shadows between layers, dark cardboard background, paper craft game character design, no text",
        "seed": 12002, "name": "ori02_ninja_big_eyes",
    },
    {
        "prompt": "cute origami ninja with fierce determined round eyes, body folded from matte black washi paper with visible fold lines, compact warrior stance, origami katana on back made of gold metallic paper, dark red washi belt, paper texture throughout, slightly crumpled paper edges for character, dark navy torn paper background, mobile game mascot, no text",
        "seed": 12003, "name": "ori03_ninja_fierce_eyes",
    },
    {
        "prompt": "origami ninja in dash attack pose, black washi paper body lunging forward, origami katana drawn creating golden paper trail arc, round determined eyes, crimson paper scarf stretched by motion, paper fold creases visible, ink splatter effects like sumi-e on paper, dark washi paper background, dynamic paper craft action game character, no text",
        "seed": 12004, "name": "ori04_ninja_dash_attack",
    },
    {
        "prompt": "origami ninja pulling katana from back, black washi paper body in ready stance, one hand reaching behind to gold origami katana handle, round focused eyes, paper layers separating slightly with movement, ink splash accents, dark background with torn paper edges, game character attack preparation pose, no text",
        "seed": 12005, "name": "ori05_ninja_draw_katana",
    },
    {
        "prompt": "4 origami yokai enemies in a row, each folded from different colored washi paper: red origami oni demon with gold paper horns and angry round eyes, green origami kappa with paper bowl on head and curious eyes, orange origami tengu with pointed paper beak and sharp eyes, white origami yurei ghost with dark hollow eye holes, all with visible fold creases, paper craft game enemies, dark background, no text",
        "seed": 12006, "name": "ori06_enemies_lineup",
    },
    {
        "prompt": "origami oni demon boss, large imposing figure folded from deep red washi paper, visible angular fold creases, gold metallic paper horns, fierce round eyes with rage, paper texture prominent, layered paper construction showing depth, dark ink splatter aura, dark navy background, paper craft game boss character, no text",
        "seed": 12007, "name": "ori07_oni_boss",
    },
    {
        "prompt": "top-down mobile game screenshot with origami paper craft visual style, all characters are folded washi paper figures, dark black origami ninja center fighting red origami oni enemies, dark cardboard background with subtle washi paper texture, golden ink splash effects from attacks, sumi-e ink splatter combat effects, paper layers visible, portrait 9:16, atmospheric paper craft action game, no text",
        "seed": 12008, "name": "ori08_game_screen_v1", "w": 512, "h": 896,
    },
    {
        "prompt": "top-down mobile game with washi paper origami characters, dark moody atmosphere like Limbo but with paper craft aesthetic, small origami ninja with glowing eyes in center, origami yokai approaching from darkness, golden paper slash trails, ink brush stroke effects, fog made of torn paper wisps, dark background, portrait 9:16, beautiful dark paper craft game, no text",
        "seed": 12009, "name": "ori09_game_dark_limbo", "w": 512, "h": 896,
    },
    {
        "prompt": "top-down mobile game screenshot, origami paper craft style, dark washi paper ground with gold ink Japanese wave pattern, origami ninja slashing through origami enemies with golden paper arc trails, sumi-e ink splatter blood effects, paper crumple and tear effects from damage, health bar with paper texture at top, portrait 9:16, premium paper craft mobile game, no text",
        "seed": 12010, "name": "ori10_game_combat", "w": 512, "h": 896,
    },
    {
        "prompt": "top-down game floor made of dark washi paper layers, handmade paper texture visible, subtle gold ink brushed Japanese seigaiha wave pattern, torn paper edges creating depth between layers, ink splatter stains scattered, dark navy and charcoal paper tones, atmospheric handcrafted paper environment, game background overhead view, no characters, no text",
        "seed": 12011, "name": "ori11_bg_washi_floor",
    },
    {
        "prompt": "mobile game title screen with origami paper craft aesthetic, large origami ninja character center made of folded black washi paper with round eyes and gold katana, dark washi paper background with gold ink calligraphy style title area, crimson paper accent strips, falling gold paper confetti, torn paper border frame, portrait 9:16, premium paper craft game title, no text",
        "seed": 12012, "name": "ori12_title_screen", "w": 512, "h": 896,
    },
    {
        "prompt": "mobile game skill selection screen with 3 vertical paper cards, each card is a piece of folded washi paper with different tint, gold ink skill icons drawn on each card in brush style, paper texture visible on cards, dark torn paper background, rarity shown by paper quality common rough rare smooth epic metallic gold, portrait 9:16, paper craft game UI, no text",
        "seed": 12013, "name": "ori13_skill_cards", "w": 512, "h": 896,
    },
    {
        "prompt": "close-up detailed origami ninja character face and upper body, folded from dark washi paper, visible fold creases creating angular features, two large round expressive eyes white with black pupils behind paper mask, subtle paper fiber texture, gold metallic paper accent on forehead protector, crimson paper scarf detail, dark background, paper craft character portrait, no text",
        "seed": 12014, "name": "ori14_ninja_closeup",
    },
    {
        "prompt": "4 origami ninja characters side by side, each folded from different washi paper: classic black with gold trim, dark navy with silver trim, deep crimson with gold trim, dark green with bronze trim, all with round expressive eyes, katana on back, same origami fold style, character skin color variations for game, dark background, no text",
        "seed": 12015, "name": "ori15_ninja_skins",
    },
]

if __name__ == "__main__":
    ok = 0
    for i, c in enumerate(CONCEPTS):
        name = c["name"]
        w = c.get("w", 768)
        h = c.get("h", 768)
        print(f"[{i+1}/{len(CONCEPTS)}] {name}...", end=" ", flush=True)
        if gen_one(c["prompt"], c["seed"], name, w, h):
            ok += 1
            print("OK", flush=True)
        else:
            print("FAIL", flush=True)
        time.sleep(1)
    print(f"\nDone! {ok}/{len(CONCEPTS)}")
