"""Round 5: 20 varied style explorations - wide range of approaches"""
import json, urllib.request, time, uuid, shutil, os

COMFYUI_URL = "http://127.0.0.1:8188"
COMFYUI_OUTPUT = "D:/ComfyUI/ComfyUI/output"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "concepts")
os.makedirs(OUTPUT_DIR, exist_ok=True)

def create_prompt(text, seed, w=768, h=768, prefix="c5"):
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
                return None
    return None

# 20 widely varied approaches
CONCEPTS = [
    # Style A: Shadow silhouette (Shadow Fight inspired)
    {
        "prompt": "pure black shadow silhouette of a ninja warrior, completely flat black cutout shape, human proportions, katana on back, dynamic standing pose, gold glowing eyes only visible feature, thin gold outline on katana handle, dark navy blue background with subtle glow behind figure, mobile game character, dramatic minimalist, no detail inside silhouette, no text",
        "filename": "80_shadow_silhouette_ninja",
        "seed": 9001,
    },
    {
        "prompt": "black shadow silhouette ninja in action slash pose, pure flat black cutout, katana drawn creating golden arc trail, crimson scarf ribbon flowing as silhouette detail, athletic human proportions, dark navy background with radial gold light behind, stylish dramatic game character, completely flat 2D, no text",
        "filename": "81_shadow_slash_action",
        "seed": 9002,
    },
    # Style B: Thick outline cartoon (Samurai Jack / Genndy style)
    {
        "prompt": "ninja character in Samurai Jack animation style, very thick black outlines, angular stylized proportions, long legs narrow body, sharp chin, simple flat color fills, black outfit with gold accents, katana on back, crimson headband, bold graphic novel style, dark moody background, dynamic pose, no text",
        "filename": "82_samurai_jack_style",
        "seed": 9003,
    },
    {
        "prompt": "stylized ninja warrior thick bold outlines like animated TV show, exaggerated proportions wide shoulders long legs, angular face with sharp features hidden behind mask, two gold slits for eyes, simple flat black body color, katana handle over shoulder, crimson sash, graphic bold art style, dark navy background, game character concept, no text",
        "filename": "83_bold_animated_style",
        "seed": 9004,
    },
    # Style C: Pixel art (Katana ZERO / Hyper Light Drifter)
    {
        "prompt": "pixel art ninja character 32x32 style enlarged, clean crisp pixels, dark ninja outfit, katana on back with gold handle visible, red scarf, simple pixel face with glowing eyes, retro game sprite style, dark navy background, nostalgic but modern pixel art, limited color palette black gold crimson navy, no text",
        "filename": "84_pixel_ninja_32bit",
        "seed": 9005,
    },
    {
        "prompt": "pixel art ninja character sprite sheet, 4 frames: idle standing, running, jumping, attacking with katana slash, clean pixel art style like Celeste or Katana ZERO, dark ninja colors with gold and crimson accents, each frame clearly separated, dark background, retro modern game sprite, no text",
        "filename": "85_pixel_sprite_sheet",
        "seed": 9006,
    },
    # Style D: Paper cutout / craft style
    {
        "prompt": "paper cutout style ninja character, looks like cut from black paper with scissors, layered paper craft aesthetic, simple human shape, katana cut from gold paper on back, crimson paper strip scarf, slight paper texture visible, dark navy paper background, handmade craft game character style, charming and unique, no text",
        "filename": "86_paper_cutout_ninja",
        "seed": 9007,
    },
    # Style E: Chibi but sharp (not round - angular chibi)
    {
        "prompt": "chibi ninja character with angular sharp features not round, big head small body but all edges are sharp and angular, determined narrow eyes, black outfit with gold trim details, katana strapped on back bigger than body, crimson short scarf, stylized anime chibi but cool not cute, flat colors bold outlines, dark navy background, mobile game character, no text",
        "filename": "87_sharp_chibi_ninja",
        "seed": 9008,
    },
    {
        "prompt": "angular chibi ninja, oversized head with sharp jaw and pointed features, compact muscular body, large katana on back with gold wrapping, narrow intense gold eyes behind dark mask, crimson accent belt, cool intimidating chibi style not kawaii, flat solid colors, thick outlines, dark navy background, action game character design, no text",
        "filename": "88_intimidating_chibi",
        "seed": 9009,
    },
    # Style F: Ink brush / sumi-e inspired
    {
        "prompt": "ninja character painted in Japanese sumi-e ink brush style, single confident brush stroke forming body silhouette, splatter ink details, katana as thin precise line on back, red ink stamp seal accent, minimal brush strokes suggesting human form in action, traditional Japanese calligraphy art meets game character, off-white rice paper texture on dark background, no text",
        "filename": "89_sumi_e_ink_ninja",
        "seed": 9010,
    },
    {
        "prompt": "dynamic ninja figure in bold ink brush calligraphy style, black ink splashes forming warrior shape, katana slash rendered as single sweeping gold ink stroke, crimson ink drops as blood or scarf accent, Japanese brush painting aesthetic game character, dramatic and artistic, dark navy background, no text",
        "filename": "90_ink_brush_dynamic",
        "seed": 9011,
    },
    # Style G: N++ / very minimal stick figure enhanced
    {
        "prompt": "extremely minimal ninja character like enhanced stick figure, simple line body with slight thickness, rectangular head, thin limbs, but with added ninja details: small katana line on back, tiny scarf lines flowing, gold dot eyes, entire character drawn with minimal white lines on dark navy background, elegant simplicity, game character, no text",
        "filename": "91_minimal_line_ninja",
        "seed": 9012,
    },
    # Style H: Flat design illustration (modern app/web style)
    {
        "prompt": "modern flat design illustration ninja character, clean vector art style like Slack or Notion illustrations, slightly elongated proportions, friendly but professional look, black ninja outfit with warm gold accents, katana on back, simple face with minimal features, flat solid colors with one subtle shadow layer, light-hearted but skilled warrior feel, dark navy background, no text",
        "filename": "92_modern_flat_design",
        "seed": 9013,
    },
    {
        "prompt": "flat design vector ninja character for mobile app, clean geometric construction, warm black and gold color scheme, athletic build, katana across back, face covered by mask showing only determined eyes, modern illustration style seen in tech company branding, one flat shadow color for depth, dark background, professional game character, no text",
        "filename": "93_vector_app_style",
        "seed": 9014,
    },
    # Style I: Neon outline on dark (cyberpunk-ninja)
    {
        "prompt": "ninja character as glowing neon outline on pure dark background, thin luminous gold lines forming the body shape, crimson neon glow for scarf and belt, katana outlined in bright white neon on back, face is dark void with two gold neon dot eyes, cyberpunk meets traditional ninja, glowing line art game character, dark navy black background, no text",
        "filename": "94_neon_outline_ninja",
        "seed": 9015,
    },
    # Style J: Woodblock print style
    {
        "prompt": "ninja character in Japanese woodblock print ukiyo-e style, bold flat color areas with black key lines, limited color palette of black gold crimson and navy, traditional art style depicting ninja warrior with katana, stylized proportions, strong graphic quality suitable for game character, dark background, artistic game design, no text",
        "filename": "95_ukiyoe_woodblock",
        "seed": 9016,
    },
    # Style K: Trophy/figure/chess piece
    {
        "prompt": "ninja character designed like a chess piece or trophy figurine, solid black matte form, clean sculptural shape, human silhouette simplified to essential form, katana detail on back in gold, sitting on small circular base, elegant minimal object design, dark navy background with subtle spotlight, premium game character token design, no text",
        "filename": "96_chess_piece_ninja",
        "seed": 9017,
    },
    # Style L: Emoji/symbol-like
    {
        "prompt": "ninja character simplified to emoji or symbol level, instantly readable at any size, black filled shape with gold accent marks for eyes and katana handle, crimson mark for scarf, designed to work at 16x16 pixels up to full screen, universal symbol quality, dark navy background, the simplest possible cool ninja icon, no text",
        "filename": "97_emoji_symbol_ninja",
        "seed": 9018,
    },
    # Style M: Limbo / Inside game style
    {
        "prompt": "ninja character in style of Limbo or Inside game, dark atmospheric silhouette, subtle details visible within shadow form, eerie beautiful minimalism, small figure with human proportions, katana barely visible as slightly lighter shadow on back, two tiny glowing gold eyes, moody dark environment, cinematic game character, haunting and cool, no text",
        "filename": "98_limbo_style_ninja",
        "seed": 9019,
    },
    # Style N: Geometric low-poly flat (not 3D, but faceted 2D)
    {
        "prompt": "ninja character made of flat geometric facets like low-poly but completely 2D, triangular faces creating angular human form, each triangle a slightly different shade of black and dark gray, gold triangles for eye area and katana handle, crimson triangle for scarf, mosaic-like geometric portrait, dark navy background, modern artistic game character, no text",
        "filename": "99_flat_lowpoly_facets",
        "seed": 9020,
    },
]

if __name__ == "__main__":
    print(f"=== Round 5: {len(CONCEPTS)} Varied Style Explorations ===")
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
