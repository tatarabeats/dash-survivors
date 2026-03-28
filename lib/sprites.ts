// Sprite loading and rendering system

export type SpriteSheet = {
  img: HTMLImageElement;
  frameW: number;
  frameH: number;
  cols: number;
  rows: number;
  total: number;
};

export type AnimState = {
  sheet: SpriteSheet;
  frame: number;
  timer: number;
  fps: number;
};

// All sprite definitions
const SPRITE_DEFS = {
  // Player - AI generated, 3 poses (rembg processed)
  ninjaIdle: {
    path: "/sprites/generated/ninja_idle.png",
    frameW: 1024,
    frameH: 1024,
  },
  ninjaReady: {
    path: "/sprites/generated/ninja_ready.png",
    frameW: 1024,
    frameH: 1024,
  },
  ninjaAttack: {
    path: "/sprites/generated/ninja_slash.png",
    frameW: 1024,
    frameH: 1024,
  },
  // Enemies - idle poses (rembg processed)
  oni: { path: "/sprites/generated/oni_v2.png", frameW: 1024, frameH: 1024 },
  kappa: {
    path: "/sprites/generated/kappa_v2.png",
    frameW: 1024,
    frameH: 1024,
  },
  tengu: {
    path: "/sprites/generated/tengu_v2.png",
    frameW: 1024,
    frameH: 1024,
  },
  yurei: {
    path: "/sprites/generated/yurei_v2.png",
    frameW: 1024,
    frameH: 1024,
  },
  bossOni: {
    path: "/sprites/generated/oni_v2.png",
    frameW: 1024,
    frameH: 1024,
  },
  // Enemies - attack poses (rembg processed)
  oniAtk: {
    path: "/sprites/generated/oni_attack.png",
    frameW: 1024,
    frameH: 1024,
  },
  kappaAtk: {
    path: "/sprites/generated/kappa_attack.png",
    frameW: 1024,
    frameH: 1024,
  },
  tenguAtk: {
    path: "/sprites/generated/tengu_attack.png",
    frameW: 1024,
    frameH: 1024,
  },
  yureiAtk: {
    path: "/sprites/generated/yurei_attack.png",
    frameW: 1024,
    frameH: 1024,
  },
  // Backgrounds - TOP-DOWN perspective (matching character view)
  bgBamboo: {
    path: "/sprites/generated/bg_topdown_bamboo.png",
    frameW: 1024,
    frameH: 1024,
  },
  bgCastle: {
    path: "/sprites/generated/bg_topdown_castle.png",
    frameW: 1024,
    frameH: 1024,
  },
  // Items (keep existing)
  shuriken: { path: "/sprites/shuriken.png", frameW: 48, frameH: 48 },
  scroll: { path: "/sprites/scroll.png", frameW: 48, frameH: 48 },
  xpGem: { path: "/sprites/xp-gem.png", frameW: 48, frameH: 48 },
  healthOrb: { path: "/sprites/health-orb.png", frameW: 48, frameH: 48 },
} as const;

export type SpriteName = keyof typeof SPRITE_DEFS;

// Global sprite atlas
const sprites: Partial<Record<SpriteName, SpriteSheet>> = {};
let loaded = false;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load: ${src}`));
    img.src = src;
  });
}

export async function loadAllSprites(): Promise<void> {
  if (loaded) return;
  const entries = Object.entries(SPRITE_DEFS) as [
    SpriteName,
    (typeof SPRITE_DEFS)[SpriteName],
  ][];
  await Promise.all(
    entries.map(async ([name, def]) => {
      try {
        const img = await loadImage(def.path);
        const cols = Math.max(1, Math.floor(img.width / def.frameW));
        const rows = Math.max(1, Math.floor(img.height / def.frameH));
        sprites[name] = {
          img,
          frameW: def.frameW,
          frameH: def.frameH,
          cols,
          rows,
          total: cols * rows,
        };
      } catch {
        // Silent fail — game can fall back to procedural rendering
      }
    }),
  );
  loaded = true;
}

export function getSprite(name: SpriteName): SpriteSheet | null {
  return sprites[name] ?? null;
}

export function hasSprites(): boolean {
  return loaded;
}

// Draw a single frame from a sprite sheet
export function drawFrame(
  ctx: CanvasRenderingContext2D,
  sheet: SpriteSheet,
  frame: number,
  x: number,
  y: number,
  w: number,
  h: number,
  flipX = false,
) {
  const f = frame % sheet.total;
  const col = f % sheet.cols;
  const row = Math.floor(f / sheet.cols);
  const sx = col * sheet.frameW;
  const sy = row * sheet.frameH;

  ctx.save();
  if (flipX) {
    ctx.translate(x + w / 2, y);
    ctx.scale(-1, 1);
    ctx.drawImage(
      sheet.img,
      sx,
      sy,
      sheet.frameW,
      sheet.frameH,
      -w / 2,
      0,
      w,
      h,
    );
  } else {
    ctx.drawImage(sheet.img, sx, sy, sheet.frameW, sheet.frameH, x, y, w, h);
  }
  ctx.restore();
}

// Draw a static sprite (single image, no sheet)
export function drawSprite(
  ctx: CanvasRenderingContext2D,
  name: SpriteName,
  x: number,
  y: number,
  w: number,
  h: number,
  rotation = 0,
  alpha = 1,
) {
  const sheet = sprites[name];
  if (!sheet) return false;

  ctx.save();
  ctx.globalAlpha = alpha;
  if (rotation !== 0) {
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(rotation);
    ctx.drawImage(
      sheet.img,
      0,
      0,
      sheet.frameW,
      sheet.frameH,
      -w / 2,
      -h / 2,
      w,
      h,
    );
  } else {
    ctx.drawImage(sheet.img, 0, 0, sheet.frameW, sheet.frameH, x, y, w, h);
  }
  ctx.restore();
  return true;
}

// Animated sprite helper
export function createAnim(name: SpriteName, fps = 8): AnimState | null {
  const sheet = sprites[name];
  if (!sheet) return null;
  return { sheet, frame: 0, timer: 0, fps };
}

export function updateAnim(anim: AnimState, dt: number): void {
  anim.timer += dt;
  const frameDur = 1 / anim.fps;
  while (anim.timer >= frameDur) {
    anim.timer -= frameDur;
    anim.frame = (anim.frame + 1) % anim.sheet.total;
  }
}

export function drawAnim(
  ctx: CanvasRenderingContext2D,
  anim: AnimState,
  x: number,
  y: number,
  w: number,
  h: number,
  flipX = false,
) {
  drawFrame(ctx, anim.sheet, anim.frame, x, y, w, h, flipX);
}
