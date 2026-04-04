"""Final origami style generation - based on confirmed ori01 reference"""
import json, urllib.request, uuid, os, shutil, time

COMFYUI_URL = "http://127.0.0.1:8188"
COMFY_OUT = "D:/ComfyUI/ComfyUI/output"
DST = os.path.join(os.path.dirname(__file__), "..", "public", "concepts")

def make_prompt(text, seed, w=512, h=512, prefix="orifinal"):
    return {
        "1": {"class_type": "UnetLoaderGGUF", "inputs": {"unet_name": "flux-2-klein-9b-Q5_K_M.gguf"}},
        "2": {"class_type": "CLIPLoader", "inputs": {"clip_name": "qwen_3_8b_fp8mixed.safetensors", "type": "flux2"}},
        "3": {"class_type": "VAELoader", "inputs": {"vae_name": "flux2-vae.safetensors"}},
        "4": {"class_type": "CLIPTextEncode", "inputs": {"text": text, "clip": ["2", 0]}},
        "5": {"class_type": "EmptyLatentImage", "inputs": {"width": w, "height": h, "batch_size": 1}},
        "6": {"class_type": "KSampler", "inputs": {
            "model": ["1", 0], "positive": ["4", 0], "negative": ["4", 0],
            "latent_image": ["5", 0], "seed": seed, "steps": 3,
            "cfg": 1.0, "sampler_name": "euler", "scheduler": "simple", "denoise": 1.0
        }},
        "7": {"class_type": "VAEDecode", "inputs": {"samples": ["6", 0], "vae": ["3", 0]}},
        "8": {"class_type": "SaveImage", "inputs": {"images": ["7", 0], "filename_prefix": prefix}}
    }

def gen_one(text, seed, name, w=512, h=512):
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

# Base style description matching ori01
BASE_STYLE = "origami character made of folded dark black washi paper, visible fold creases and paper edges, paper texture visible, gold metallic paper accents, crimson dark red washi paper belt sash, dark navy crumpled washi paper background, handcrafted paper craft game character"

CONCEPTS = [
    # Same ninja different seeds for variation
    {
        "prompt": f"origami ninja character made of folded dark black washi paper, visible fold creases and paper edges, round fierce gold eyes with black pupils behind paper mask, two gold metallic paper katana crossed on back, crimson washi paper belt sash, compact warrior stance, paper texture visible, dark navy washi paper background, handcrafted game character, front view, no text",
        "seed": 13001, "name": "final01_ninja_v2",
    },
    {
        "prompt": f"origami ninja character made of folded dark black washi paper, visible fold creases, angry determined gold eyes behind mask, gold metallic paper katana strapped diagonally on back, crimson dark red origami belt, standing ready battle pose, paper craft texture, dark navy crumpled paper background, game character front view, no text",
        "seed": 13002, "name": "final02_ninja_v3",
    },
    # Running pose
    {
        "prompt": f"origami ninja in running pose, folded from dark black washi paper, visible fold creases, gold eyes focused forward, gold katana bouncing on back, crimson belt sash flowing, legs in stride motion, paper craft texture throughout, dark navy paper background, dynamic action game character, no text",
        "seed": 13003, "name": "final03_ninja_run",
    },
    # Slash attack pose
    {
        "prompt": f"origami ninja in slash attack pose, folded from dark black washi paper, gold katana drawn and slashing forward with golden paper arc trail, fierce gold eyes, crimson belt flowing with motion, dynamic lunging pose, paper fold creases visible, ink splatter effects, dark navy paper background, action game character, no text",
        "seed": 13004, "name": "final04_ninja_slash",
    },
    # Drawing katana pose
    {
        "prompt": f"origami ninja drawing katana from back sheath, folded from dark black washi paper, one hand pulling gold metallic katana handle, intense gold eyes, crimson belt, half-drawn blade catching light, ready stance, paper craft texture, dark navy paper background, game character, no text",
        "seed": 13005, "name": "final05_ninja_draw",
    },
    # Enemies - ONI
    {
        "prompt": f"origami oni demon made of folded deep red washi paper, visible fold creases, angry round gold eyes, gold metallic paper horns on head, wide stocky body, crimson and black paper accents, menacing stance, paper craft texture, dark navy paper background, game enemy character, no text",
        "seed": 13006, "name": "final06_oni",
    },
    # Enemies - KAPPA
    {
        "prompt": f"origami kappa water creature made of folded green washi paper, visible fold creases, curious round eyes, flat circular paper plate on head, compact round body, yellow-green paper shell on back, paper craft texture, dark navy paper background, cute but dangerous game enemy character, no text",
        "seed": 13007, "name": "final07_kappa",
    },
    # Enemies - TENGU
    {
        "prompt": f"origami tengu bird demon made of folded orange-brown washi paper, visible fold creases, sharp angular gold eyes, long pointed paper beak nose, tall imposing body, paper feather details, paper craft texture, dark navy paper background, game enemy character, no text",
        "seed": 13008, "name": "final08_tengu",
    },
    # Enemies - YUREI
    {
        "prompt": f"origami yurei ghost made of folded white washi paper, visible fold creases, dark hollow eye holes, no legs body fading into torn paper wisps at bottom, floating eerie pose, translucent paper quality, paper craft texture, dark navy paper background, spooky game enemy character, no text",
        "seed": 13009, "name": "final09_yurei",
    },
    # Boss ONI
    {
        "prompt": f"large origami oni boss demon made of folded deep crimson red washi paper, visible angular fold creases, fierce glowing gold eyes, large gold metallic paper horns, massive imposing body twice size of normal enemy, dark ink splatter aura around, paper craft texture, dark navy paper background, game boss character, no text",
        "seed": 13010, "name": "final10_oni_boss",
    },
]

if __name__ == "__main__":
    ok = 0
    for i, c in enumerate(CONCEPTS):
        name = c["name"]
        print(f"[{i+1}/{len(CONCEPTS)}] {name}...", end=" ", flush=True)
        if gen_one(c["prompt"], c["seed"], name):
            ok += 1
            print("OK", flush=True)
        else:
            print("FAIL", flush=True)
        time.sleep(3)
    print(f"\nDone! {ok}/{len(CONCEPTS)}")
