"""Round 6: 15 character designs + 15 full game screen compositions = 30 total"""
import json, urllib.request, time, uuid, shutil, os

COMFYUI_URL = "http://127.0.0.1:8188"
COMFYUI_OUTPUT = "D:/ComfyUI/ComfyUI/output"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "concepts")
os.makedirs(OUTPUT_DIR, exist_ok=True)

def create_prompt(text, seed, w=768, h=768, prefix="c6"):
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

# ===== 15 CHARACTER DESIGNS (varied styles) =====
CHARACTERS = [
    # 1. Samurai Jack inspired - angular, long limbs, flat
    {
        "prompt": "ninja character in Samurai Jack cartoon style, angular body very long legs small torso, thick black outlines, flat color fills, wearing black gi with gold obi belt, katana on back, crimson headband tails, determined narrow eyes, standing heroic pose, extremely stylized proportions, pure 2D animation style, dark navy background, game protagonist design, no text",
        "filename": "ch01_samurai_jack_style",
        "seed": 10001,
    },
    # 2. Katana ZERO pixel style
    {
        "prompt": "pixel art ninja character 64x64 enlarged, clean crisp pixel art, dark black ninja outfit with flowing coat, katana sheathed on back, gold pixel eyes glowing behind mask, crimson pixel scarf, cool confident standing pose, inspired by Katana ZERO game aesthetic, dark moody pixel background, retro action game protagonist, no text",
        "filename": "ch02_katana_zero_pixel",
        "seed": 10002,
    },
    # 3. Pure shadow with gold accents (Shadow Fight)
    {
        "prompt": "ninja as pure black shadow silhouette, athletic human proportions, detailed pose visible only through outline shape, katana strapped on back visible in silhouette, only color details are two gold glowing eyes and thin gold line on katana, standing ready stance, completely flat solid black figure, dark navy background with subtle blue rim light behind, game character, no text",
        "filename": "ch03_pure_shadow_gold",
        "seed": 10003,
    },
    # 4. Ink brush sumi-e
    {
        "prompt": "ninja character painted with bold Japanese ink brush strokes, sumi-e calligraphy style, body formed by three sweeping brush marks, head as single circle stroke, katana as precise thin ink line on back, red ink seal stamp on chest, dynamic artistic brushwork, off-white paper texture background area on dark navy, game character meets traditional art, no text",
        "filename": "ch04_sumi_e_brush",
        "seed": 10004,
    },
    # 5. Neon wireframe outline
    {
        "prompt": "ninja character as thin glowing neon outline only, no fill just luminous gold wireframe lines forming body head arms legs, katana outline on back in brighter white, crimson neon dots for eyes, standing in dark void, cyberpunk minimal aesthetic, game character made of light lines only, pure dark background, stylish and modern, no text",
        "filename": "ch05_neon_wireframe",
        "seed": 10005,
    },
    # 6. Chibi but angular and cool
    {
        "prompt": "chibi ninja with sharp angular features, big head but with pointed chin and sharp edges, small compact body with angular shoulders, oversized katana on back taller than body, gold narrow angry eyes, black outfit with crimson trim details, cool intimidating expression not cute, flat 2D bold outlines, dark navy background, anime game character, no text",
        "filename": "ch06_sharp_chibi",
        "seed": 10006,
    },
    # 7. Paper craft / cardboard style
    {
        "prompt": "ninja character made of cut paper layers, black paper body with visible paper edges and slight shadow between layers, gold metallic paper katana on back, crimson paper scarf strip, paper craft aesthetic like Tearaway game, handmade feel, layered cutout construction visible, dark navy paper background, unique tactile game character style, no text",
        "filename": "ch07_paper_craft",
        "seed": 10007,
    },
    # 8. Hyper Light Drifter geometric
    {
        "prompt": "ninja character in Hyper Light Drifter art style, small geometric pixel figure, diamond and rhombus shapes forming body, limited but vibrant color palette, dark indigo body with bright gold cape accent and crimson pixel details, mysterious masked figure with katana, atmospheric pixel art, dark gradient background, game protagonist, no text",
        "filename": "ch08_hyper_light_style",
        "seed": 10008,
    },
    # 9. Flat design modern vector (Slack/Notion illustration style)
    {
        "prompt": "modern flat design illustration of ninja character, clean vector art like tech startup illustrations, slightly elongated friendly proportions, smooth curves, black outfit with warm gold accents, katana on back, simple smiling eyes behind mask, one subtle flat shadow layer for depth, bright and approachable but still ninja, muted dark background, no text",
        "filename": "ch09_modern_flat_vector",
        "seed": 10009,
    },
    # 10. Woodblock ukiyo-e
    {
        "prompt": "ninja character in traditional Japanese woodblock print ukiyo-e style, bold flat color areas separated by black key lines, limited palette of black indigo gold and crimson, stylized proportions typical of Edo period prints, katana on back, dramatic pose, artistic quality of Hokusai or Hiroshige applied to game character, dark background, no text",
        "filename": "ch10_ukiyoe_style",
        "seed": 10010,
    },
    # 11. Stencil / spray paint street art
    {
        "prompt": "ninja character as street art stencil, spray paint aesthetic, rough edges and paint drips, black stencil silhouette with gold spray paint accents for eyes and katana details, crimson paint splatter as scarf, urban graffiti art style game character, concrete wall texture fading to dark background, edgy cool rebellious, no text",
        "filename": "ch11_stencil_street_art",
        "seed": 10011,
    },
    # 12. Limbo / Inside atmospheric
    {
        "prompt": "small ninja figure in atmospheric dark environment, Limbo game inspired, tiny dark silhouette with human proportions, barely visible katana on back as slightly different shade, two tiny gold pinpoint eyes only color in image, fog and particles in air, moody cinematic lighting from above, eerie beautiful minimal, game character in environment, no text",
        "filename": "ch12_limbo_atmospheric",
        "seed": 10012,
    },
    # 13. Bold thick outline cel-shaded
    {
        "prompt": "ninja character with very thick black outlines like cartoon network animation, cel-shaded flat colors inside outlines, angular body design, wide stance, katana handle visible over shoulder, gold details pop against black outfit, crimson eyes and belt, bold graphic style like Dexter's Lab or Powerpuff Girls era Cartoon Network, dark background, game character, no text",
        "filename": "ch13_cel_shade_bold",
        "seed": 10013,
    },
    # 14. Minimalist logo / emblem
    {
        "prompt": "ninja character simplified to work as a logo or emblem, single unified shape readable at any size, negative space used cleverly to show mask eyes katana and scarf details within solid black form, gold and crimson minimal accent marks, designed like a sports team logo or app icon, perfectly balanced composition, dark navy background, premium brand quality, no text",
        "filename": "ch14_logo_emblem",
        "seed": 10014,
    },
    # 15. Dead Cells / roguelike action style
    {
        "prompt": "ninja character in Dead Cells pixel art action style, detailed pixel art with fluid animation quality, dark ninja with tattered cloak, katana on back with visible handle wrapping, glowing gold eyes behind hood, crimson energy particles around body, dynamic ready stance, atmospheric dark background with color lighting, roguelike action game protagonist, no text",
        "filename": "ch15_dead_cells_style",
        "seed": 10015,
    },
]

# ===== 15 FULL GAME SCREEN COMPOSITIONS =====
SCREENS = [
    # 1. Dark + gold Japanese pattern floor - clean
    {
        "prompt": "top-down mobile game screenshot, dark navy blue floor with elegant gold Japanese wave pattern lines, small ninja character center surrounded by red oni and green kappa enemies approaching, golden slash arc effects, clean minimal art style, portrait 9:16, health bar at top, simple and readable, no text",
        "filename": "sc01_gold_wave_floor",
        "seed": 11001,
        "w": 512, "h": 896,
    },
    # 2. Shadow silhouette style gameplay
    {
        "prompt": "top-down mobile game with shadow silhouette characters, dark ground with subtle blue light, black ninja silhouette in center with gold eye glow dashing through black enemy silhouettes, golden slash trails, atmospheric dark gameplay, high contrast, portrait 9:16 mobile screen, dramatic lighting from above, no text",
        "filename": "sc02_shadow_gameplay",
        "seed": 11002,
        "w": 512, "h": 896,
    },
    # 3. Pixel art gameplay screen
    {
        "prompt": "top-down pixel art mobile game screenshot, crisp pixel art ninja fighting pixel yokai enemies, dark environment with neon gold accent lighting, pixel slash effects, retro but modern pixel art style like Katana ZERO overhead view, portrait 9:16 mobile layout, pixel UI elements, dark moody color palette, no text",
        "filename": "sc03_pixel_art_gameplay",
        "seed": 11003,
        "w": 512, "h": 896,
    },
    # 4. Ink brush / sumi-e atmosphere
    {
        "prompt": "top-down mobile game with Japanese ink painting aesthetic, brush stroke textures on ground, ink splash effects from combat, ninja character fighting enemies in sumi-e art style, gold ink highlights, crimson ink blood splatter effects, artistic calligraphy atmosphere, dark paper background, portrait 9:16, beautiful and violent, no text",
        "filename": "sc04_ink_brush_gameplay",
        "seed": 11004,
        "w": 512, "h": 896,
    },
    # 5. Neon on dark - cyberpunk ninja
    {
        "prompt": "top-down mobile game with neon glow aesthetics, dark black ground, ninja character outlined in gold neon light, enemies outlined in red neon, neon slash trails, cyberpunk meets ninja, glowing geometric floor pattern, portrait 9:16, high contrast neon on pure dark, futuristic ninja game, no text",
        "filename": "sc05_neon_dark_gameplay",
        "seed": 11005,
        "w": 512, "h": 896,
    },
    # 6. Warm dark with golden light
    {
        "prompt": "top-down mobile game screenshot, warm dark environment with golden ambient light from lanterns, Japanese garden path floor, ninja character fighting enemies, warm gold and crimson color palette, cozy but intense action, cherry blossom petals floating, portrait 9:16, atmospheric warm dark game, no text",
        "filename": "sc06_warm_golden_light",
        "seed": 11006,
        "w": 512, "h": 896,
    },
    # 7. Minimalist - almost abstract
    {
        "prompt": "extremely minimalist top-down mobile game, plain dark navy background, characters as simple colored shapes moving and fighting, gold slash lines, minimal UI, almost abstract art game, Downwell level simplicity applied to arena survivor game, portrait 9:16, high contrast few colors, no text",
        "filename": "sc07_ultra_minimal",
        "seed": 11007,
        "w": 512, "h": 896,
    },
    # 8. Thick outline cartoon gameplay
    {
        "prompt": "top-down mobile game in bold cartoon style, thick black outlines on all characters, flat bright colors, ninja character fighting colorful yokai enemies, energetic action with slash effects and explosions, Samurai Jack meets game, portrait 9:16, fun and stylish, animated TV show quality, no text",
        "filename": "sc08_cartoon_bold_gameplay",
        "seed": 11008,
        "w": 512, "h": 896,
    },
    # 9. Dark with crimson and gold only
    {
        "prompt": "top-down mobile game using only black crimson and gold colors, three color limited palette, dark black ground, gold ninja character, crimson enemies, gold slash effects, dramatic limited color scheme creates strong visual identity, portrait 9:16, bold color choice, no text",
        "filename": "sc09_three_color_only",
        "seed": 11009,
        "w": 512, "h": 896,
    },
    # 10. Paper texture / craft game
    {
        "prompt": "top-down mobile game with paper craft visual style, characters look like cut paper on dark cardboard background, paper texture visible, layered paper depth effect, ninja paper cutout fighting paper yokai enemies, gold foil accents, crimson paper elements, handmade aesthetic game, portrait 9:16, unique tactile feel, no text",
        "filename": "sc10_paper_craft_game",
        "seed": 11010,
        "w": 512, "h": 896,
    },
    # 11. Foggy atmospheric dark
    {
        "prompt": "top-down mobile game with heavy atmospheric fog, dark moody environment, ninja barely visible through mist fighting emerging enemies, volumetric fog effects, gold light cutting through darkness from slash attacks, eerie Japanese horror atmosphere, portrait 9:16, cinematic game lighting, no text",
        "filename": "sc11_foggy_atmospheric",
        "seed": 11011,
        "w": 512, "h": 896,
    },
    # 12. Geometric pattern floor - hexagonal
    {
        "prompt": "top-down mobile game on geometric hexagonal tile floor, dark navy hexagons with thin gold borders, ninja character in center fighting enemies on the hex grid, slash effects crossing hexagon boundaries, clean geometric background pattern, portrait 9:16, strategy meets action visual, no text",
        "filename": "sc12_hex_grid_gameplay",
        "seed": 11012,
        "w": 512, "h": 896,
    },
    # 13. Woodblock print game screen
    {
        "prompt": "top-down mobile game in Japanese woodblock print ukiyo-e style, flat color areas with bold black lines, ninja fighting oni demons, traditional art style applied to game screenshot, limited palette of indigo gold crimson black, artistic and unique visual identity, portrait 9:16, Edo period meets mobile game, no text",
        "filename": "sc13_ukiyoe_game_screen",
        "seed": 11013,
        "w": 512, "h": 896,
    },
    # 14. High contrast - white on black
    {
        "prompt": "top-down mobile game with inverted colors, mostly black screen with white and gold elements, ninja as white outlined figure on pure black, enemies as red outlined figures, golden slash effects, stark high contrast visual style, portrait 9:16, bold minimalist dark screen game, no text",
        "filename": "sc14_high_contrast_bw",
        "seed": 11014,
        "w": 512, "h": 896,
    },
    # 15. Cel-shaded anime game
    {
        "prompt": "top-down mobile game with anime cel-shaded art style, clean lines and flat colors with anime shading, ninja protagonist with flowing scarf fighting stylized yokai enemies, dynamic action lines and impact effects, gold and crimson energy effects, Japanese anime game aesthetic, portrait 9:16, polished anime mobile game, no text",
        "filename": "sc15_anime_cel_shade",
        "seed": 11015,
        "w": 512, "h": 896,
    },
]

ALL = CHARACTERS + SCREENS

if __name__ == "__main__":
    print(f"=== Round 6: {len(ALL)} images (15 chars + 15 screens) ===")
    ok = 0
    for i, c in enumerate(ALL):
        name = c["filename"]
        w = c.get("w", 768)
        h = c.get("h", 768)
        print(f"[{i+1}/{len(ALL)}] {name} ({w}x{h})")
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
    print(f"\n=== Done! {ok}/{len(ALL)} generated ===")
