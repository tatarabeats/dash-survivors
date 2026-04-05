import { getSprite, drawFrame, drawSprite } from "./sprites";

export const CANVAS_WIDTH = 390;
export const CANVAS_HEIGHT = 750;

// Horizontal 3-card layout
const CARD_GAP = 8;
const CARD_MARGIN = 12;
const CARD_W = Math.floor((CANVAS_WIDTH - CARD_MARGIN * 2 - CARD_GAP * 2) / 3); // ~118
const CARD_H = 320;
const CARD_Y = 190;

export const UPGRADE_CARD = {
  x: CARD_MARGIN,
  y: CARD_Y,
  width: CARD_W,
  height: CARD_H,
  gap: CARD_GAP,
};

export const RESTART_BUTTON = {
  x: CANVAS_WIDTH / 2 - 92,
  y: CANVAS_HEIGHT / 2 + 84,
  width: 184,
  height: 56,
};

export const REROLL_BUTTON = {
  x: CANVAS_WIDTH / 2 - 72,
  y: CANVAS_HEIGHT - 94,
  width: 144,
  height: 40,
};

type UiSkill = {
  key: string;
  name: string;
  icon: string;
  level: number;
  color: string;
  readyRatio: number;
};

const UI_FONT = '"Noto Sans JP", "Hiragino Sans", sans-serif';
const DISPLAY_FONT = '"Shippori Mincho", "Yu Mincho", serif';

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function mix(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function hash(value: number) {
  return (Math.sin(value * 127.1) * 43758.5453123) % 1;
}

function seeded(index: number) {
  const value = hash(index);
  return value < 0 ? value + 1 : value;
}

function drawWaveBand(
  ctx: CanvasRenderingContext2D,
  y: number,
  radius: number,
  alpha: number,
  offset: number,
) {
  ctx.strokeStyle = `rgba(214, 180, 94, ${alpha})`;
  ctx.lineWidth = 1;
  for (
    let x = -radius * 2 + offset;
    x < CANVAS_WIDTH + radius * 2;
    x += radius
  ) {
    ctx.beginPath();
    ctx.arc(x, y, radius, Math.PI, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + radius / 2, y, radius, Math.PI, 0);
    ctx.stroke();
  }
}

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  cameraX: number,
  cameraY: number,
  time: number,
  danger: number,
) {
  // Try to draw AI-generated background
  const bgSprite = getSprite("bgBamboo");
  if (bgSprite) {
    // Tile the background with parallax
    const parallaxX = -(cameraX * 0.1) % CANVAS_WIDTH;
    ctx.drawImage(bgSprite.img, parallaxX, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.drawImage(
      bgSprite.img,
      parallaxX + CANVAS_WIDTH,
      0,
      CANVAS_WIDTH,
      CANVAS_HEIGHT,
    );
    // Light overlay for readability (much brighter than before)
    ctx.fillStyle = `rgba(3,4,8,${0.1 + danger * 0.003})`;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    // Danger red tint
    if (danger > 3) {
      ctx.fillStyle = `rgba(120,18,22,${Math.min(0.15, danger * 0.012)})`;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
    return;
  }
  // Fallback: procedural background (brighter, warmer)
  const bg = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  bg.addColorStop(0, "#1a2838");
  bg.addColorStop(0.42, "#1e2a36");
  bg.addColorStop(1, "#2d2218");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const moonX = CANVAS_WIDTH * 0.74;
  const moonY = 112;
  const moon = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, 88);
  moon.addColorStop(0, "rgba(255, 249, 224, 1.0)");
  moon.addColorStop(0.58, "rgba(216, 190, 132, 0.45)");
  moon.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = moon;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.strokeStyle = "rgba(168, 30, 33, 0.2)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(moonX, moonY, 54 + Math.sin(time * 0.7) * 1.5, 0, Math.PI * 2);
  ctx.stroke();

  ctx.globalAlpha = 0.6;
  for (let index = 0; index < 3; index += 1) {
    const cloudY = 80 + index * 44;
    const drift = ((cameraX * 0.02 + time * (4 + index)) % 520) - 120;
    ctx.fillStyle = "rgba(18, 19, 28, 0.5)";
    ctx.beginPath();
    ctx.ellipse(drift, cloudY, 72, 18, -0.12, 0, Math.PI * 2);
    ctx.ellipse(drift + 46, cloudY - 4, 56, 14, 0.08, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const seigaihaOffset = (cameraX * 0.18 + time * 8) % 54;
  for (let band = 0; band < 5; band += 1) {
    drawWaveBand(ctx, CANVAS_HEIGHT - 38 - band * 32, 28, 0.06, seigaihaOffset);
  }

  const redFog = ctx.createRadialGradient(
    CANVAS_WIDTH * 0.5,
    CANVAS_HEIGHT * 0.64,
    0,
    CANVAS_WIDTH * 0.5,
    CANVAS_HEIGHT * 0.64,
    240,
  );
  redFog.addColorStop(0, `rgba(120, 18, 22, ${0.08 + danger * 0.01})`);
  redFog.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = redFog;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  for (let layer = 0; layer < 3; layer += 1) {
    const depth = 0.2 + layer * 0.22;
    const spacing = 52 - layer * 6;
    const shift = ((cameraX * depth) % spacing) + spacing;
    ctx.globalAlpha = 0.18 + layer * 0.12;
    for (let x = -spacing; x < CANVAS_WIDTH + spacing; x += spacing) {
      const index = Math.floor((cameraX * depth + x) / spacing) + layer * 100;
      const seed = seeded(index);
      const height = mix(120, 280, seed);
      const baseX = x - shift + CANVAS_WIDTH * 0.5;
      const baseY = CANVAS_HEIGHT + 24;
      const sway = Math.sin(time * (0.4 + depth) + index) * (6 + layer * 3);
      const width = 4 + layer * 1.5 + seed * 2;

      ctx.strokeStyle =
        layer === 2 ? "rgba(34, 62, 38, 0.85)" : "rgba(48, 82, 54, 0.70)";
      ctx.lineWidth = width;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(baseX, baseY);
      ctx.lineTo(baseX + sway, baseY - height);
      ctx.stroke();

      ctx.strokeStyle = "rgba(42, 71, 47, 0.22)";
      ctx.lineWidth = 1;
      for (let node = 1; node < 6; node += 1) {
        const y = baseY - node * (height / 6);
        ctx.beginPath();
        ctx.moveTo(baseX - width * 0.9, y);
        ctx.lineTo(baseX + width * 0.9, y + sway * 0.02);
        ctx.stroke();
      }
    }
  }
  ctx.globalAlpha = 1;

  const mistShift = (cameraY * 0.03 + time * 12) % 180;
  for (let index = 0; index < 5; index += 1) {
    ctx.fillStyle = "rgba(255,255,255,0.02)";
    ctx.beginPath();
    ctx.ellipse(
      40 + index * 84 - mistShift,
      CANVAS_HEIGHT - 160 - (index % 2) * 40,
      90,
      18 + (index % 3) * 5,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
}

export function drawFlamePatch(
  ctx: CanvasRenderingContext2D,
  flame: {
    x: number;
    y: number;
    radius: number;
    life: number;
    maxLife: number;
  },
  time: number,
) {
  const t = clamp(flame.life / flame.maxLife, 0, 1);
  ctx.save();
  ctx.globalAlpha = t;
  const glow = ctx.createRadialGradient(
    flame.x,
    flame.y,
    0,
    flame.x,
    flame.y,
    flame.radius * 1.7,
  );
  glow.addColorStop(0, "rgba(255,244,214,0.75)");
  glow.addColorStop(0.32, "rgba(229,121,35,0.55)");
  glow.addColorStop(0.72, "rgba(151,26,18,0.18)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(flame.x, flame.y, flame.radius * 1.7, 0, Math.PI * 2);
  ctx.fill();

  for (let index = 0; index < 3; index += 1) {
    const wave = Math.sin(time * 9 + flame.x * 0.08 + index) * 3;
    ctx.fillStyle =
      index === 0
        ? "rgba(255, 241, 212, 0.6)"
        : index === 1
          ? "rgba(255, 145, 62, 0.55)"
          : "rgba(174, 31, 22, 0.48)";
    ctx.beginPath();
    ctx.ellipse(
      flame.x + wave * (index - 1) * 0.6,
      flame.y - index * 5,
      flame.radius * (0.45 + index * 0.1),
      flame.radius * (0.28 + index * 0.14),
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.restore();
}

export function drawSlashEffect(
  ctx: CanvasRenderingContext2D,
  slash: {
    x: number;
    y: number;
    angle: number;
    radius: number;
    span: number;
    life: number;
    maxLife: number;
    color: string;
  },
) {
  const t = clamp(slash.life / slash.maxLife, 0, 1);
  // Animated swing progress (0→1 over lifetime)
  const swing = 1 - t;

  ctx.save();
  ctx.globalAlpha = t;

  // Outer white slash arc (expanding)
  ctx.strokeStyle = `rgba(255,255,255,${0.35 + t * 0.45})`;
  ctx.lineWidth = 8 * t + 2;
  ctx.lineCap = "round";
  ctx.shadowColor = "rgba(255,255,255,0.8)";
  ctx.shadowBlur = 22 * t;
  const outerR = slash.radius * (0.7 + swing * 0.4);
  const swingOffset = swing * slash.span * 0.3; // arc sweeps as it fades
  ctx.beginPath();
  ctx.arc(
    slash.x,
    slash.y,
    outerR,
    slash.angle - slash.span + swingOffset,
    slash.angle + slash.span + swingOffset,
  );
  ctx.stroke();

  // Inner colored arc
  ctx.strokeStyle = slash.color;
  ctx.lineWidth = 3.5 * t + 1;
  ctx.shadowColor = slash.color;
  ctx.shadowBlur = 14 * t;
  const innerR = outerR * 0.88;
  ctx.beginPath();
  ctx.arc(
    slash.x,
    slash.y,
    innerR,
    slash.angle - slash.span * 0.82 + swingOffset,
    slash.angle + slash.span * 0.82 + swingOffset,
  );
  ctx.stroke();

  // Sword blade line along the leading edge of the arc
  if (t > 0.4) {
    const bladeAlpha = clamp((t - 0.4) / 0.6, 0, 1);
    const bladeTip = slash.angle + slash.span + swingOffset;
    const bladeLen = slash.radius * 0.6;
    const bx1 = slash.x + Math.cos(bladeTip) * (outerR - bladeLen * 0.3);
    const by1 = slash.y + Math.sin(bladeTip) * (outerR - bladeLen * 0.3);
    const bx2 = slash.x + Math.cos(bladeTip) * (outerR + bladeLen * 0.3);
    const by2 = slash.y + Math.sin(bladeTip) * (outerR + bladeLen * 0.3);

    ctx.globalAlpha = bladeAlpha * t;
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 2.5;
    ctx.shadowColor = "rgba(255,255,255,0.9)";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(bx1, by1);
    ctx.lineTo(bx2, by2);
    ctx.stroke();

    // Blade highlight
    ctx.strokeStyle = slash.color;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(bx1, by1);
    ctx.lineTo(bx2, by2);
    ctx.stroke();
  }

  // Speed lines emanating from center (sword swing feel)
  if (t > 0.5) {
    const lineAlpha = (t - 0.5) * 2;
    ctx.globalAlpha = lineAlpha * 0.3;
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 1;
    ctx.shadowBlur = 0;
    for (let i = 0; i < 3; i++) {
      const la = slash.angle + (i - 1) * slash.span * 0.4 + swingOffset;
      const lr1 = outerR * 0.5;
      const lr2 = outerR * 1.15;
      ctx.beginPath();
      ctx.moveTo(slash.x + Math.cos(la) * lr1, slash.y + Math.sin(la) * lr1);
      ctx.lineTo(slash.x + Math.cos(la) * lr2, slash.y + Math.sin(la) * lr2);
      ctx.stroke();
    }
  }

  ctx.restore();
}

export function drawLightning(
  ctx: CanvasRenderingContext2D,
  bolt: {
    points: Array<{ x: number; y: number }>;
    life: number;
    maxLife: number;
  },
) {
  const t = clamp(bolt.life / bolt.maxLife, 0, 1);
  if (bolt.points.length < 2) return;
  ctx.save();
  ctx.globalAlpha = t;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = `rgba(255,246,174,${0.45 + t * 0.45})`;
  ctx.lineWidth = 6 * t + 1.5;
  ctx.shadowColor = "rgba(255, 226, 110, 0.9)";
  ctx.shadowBlur = 20 * t;
  ctx.beginPath();
  ctx.moveTo(bolt.points[0].x, bolt.points[0].y);
  for (let index = 1; index < bolt.points.length; index += 1) {
    ctx.lineTo(bolt.points[index].x, bolt.points[index].y);
  }
  ctx.stroke();

  ctx.strokeStyle = `rgba(255,255,255,${0.65 + t * 0.25})`;
  ctx.lineWidth = 2.5 * t + 1;
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.moveTo(bolt.points[0].x, bolt.points[0].y);
  for (let index = 1; index < bolt.points.length; index += 1) {
    ctx.lineTo(bolt.points[index].x, bolt.points[index].y);
  }
  ctx.stroke();
  ctx.restore();
}

export function drawOrb(
  ctx: CanvasRenderingContext2D,
  orb: { x: number; y: number; value: number },
  time: number,
) {
  const pulse = 0.82 + Math.sin(time * 5 + orb.x * 0.07) * 0.16;
  const radius = (4 + orb.value * 1.4) * pulse;
  ctx.save();
  ctx.shadowColor = "#f4cf74";
  ctx.shadowBlur = 14 * pulse;
  const gradient = ctx.createRadialGradient(
    orb.x,
    orb.y,
    0,
    orb.x,
    orb.y,
    radius,
  );
  gradient.addColorStop(0, "#fff9de");
  gradient.addColorStop(0.45, "#f3cf72");
  gradient.addColorStop(1, "#b87b19");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(orb.x, orb.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawGoldCoin(
  ctx: CanvasRenderingContext2D,
  coin: { x: number; y: number; value: number; life: number },
  time: number,
) {
  const pulse = 0.85 + Math.sin(time * 6 + coin.x * 0.1) * 0.15;
  const radius = (5 + Math.min(coin.value, 15) * 0.3) * pulse;
  const fadeIn = Math.min(1, (12 - coin.life + 0.3) / 0.3);
  const fadeOut = coin.life < 2 ? coin.life / 2 : 1;
  const alpha = fadeIn * fadeOut;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.shadowColor = "#f5d57e";
  ctx.shadowBlur = 12 * pulse;
  // Coin body
  const grad = ctx.createRadialGradient(
    coin.x,
    coin.y,
    0,
    coin.x,
    coin.y,
    radius,
  );
  grad.addColorStop(0, "#fff5c0");
  grad.addColorStop(0.4, "#f5d57e");
  grad.addColorStop(0.75, "#d4a520");
  grad.addColorStop(1, "#8b6914");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(coin.x, coin.y, radius, 0, Math.PI * 2);
  ctx.fill();
  // Inner ring
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(coin.x, coin.y, radius * 0.6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export function drawScroll(
  ctx: CanvasRenderingContext2D,
  scroll: {
    kind: "storm" | "blood" | "shadow";
    x: number;
    y: number;
    radius: number;
  },
  time: number,
) {
  const bob = Math.sin(time * 4 + scroll.x * 0.03) * 2.5;
  const glow =
    scroll.kind === "storm"
      ? "rgba(245,213,126,0.85)"
      : scroll.kind === "blood"
        ? "rgba(207,46,47,0.82)"
        : "rgba(163,155,189,0.85)";
  const sigil =
    scroll.kind === "storm" ? "雷" : scroll.kind === "blood" ? "血" : "影";
  ctx.save();
  ctx.translate(scroll.x, scroll.y + bob);
  ctx.shadowColor = glow;
  ctx.shadowBlur = 18;

  const paper = ctx.createLinearGradient(-12, -8, 12, 8);
  paper.addColorStop(0, "#fbf1d9");
  paper.addColorStop(1, "#c99d54");
  ctx.fillStyle = paper;
  ctx.beginPath();
  ctx.roundRect(-11, -8, 22, 16, 5);
  ctx.fill();

  ctx.fillStyle = "#704514";
  ctx.fillRect(-13, -8, 3, 16);
  ctx.fillRect(10, -8, 3, 16);

  ctx.fillStyle = glow.replace("0.85", "1").replace("0.82", "1");
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `800 11px ${UI_FONT}`;
  ctx.fillText(sigil, 0, 1);
  ctx.restore();
}

export function drawProjectile(
  ctx: CanvasRenderingContext2D,
  projectile: {
    kind: "kunai" | "wind";
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    life: number;
    maxLife: number;
    color: string;
  },
) {
  const alpha = clamp(projectile.life / projectile.maxLife, 0, 1);
  const angle = Math.atan2(projectile.vy, projectile.vx);
  ctx.save();
  ctx.translate(projectile.x, projectile.y);
  ctx.rotate(angle);
  ctx.globalAlpha = alpha;
  ctx.shadowColor = projectile.color;
  ctx.shadowBlur = 10;

  if (projectile.kind === "kunai") {
    ctx.fillStyle = "#f7f3e8";
    ctx.beginPath();
    ctx.moveTo(projectile.radius * 1.8, 0);
    ctx.lineTo(-projectile.radius * 1.3, projectile.radius * 0.75);
    ctx.lineTo(-projectile.radius * 0.5, 0);
    ctx.lineTo(-projectile.radius * 1.3, -projectile.radius * 0.75);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#9aa0a6";
    ctx.fillRect(-projectile.radius * 1.6, -1.2, projectile.radius * 1.3, 2.4);
  } else {
    ctx.strokeStyle = projectile.color;
    ctx.lineWidth = projectile.radius * 0.9;
    ctx.beginPath();
    ctx.arc(0, 0, projectile.radius * 1.4, -0.9, 0.9);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255,255,255,0.75)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(2, 0, projectile.radius * 0.85, -0.8, 0.8);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawShuriken(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  rotation: number,
) {
  // Try sprite
  if (
    drawSprite(
      ctx,
      "shuriken",
      x - radius,
      y - radius,
      radius * 2,
      radius * 2,
      rotation,
    )
  )
    return;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.shadowColor = "rgba(255,255,255,0.5)";
  ctx.shadowBlur = 9;

  const metal = ctx.createLinearGradient(-radius, -radius, radius, radius);
  metal.addColorStop(0, "#fbfaf6");
  metal.addColorStop(0.55, "#b8bec6");
  metal.addColorStop(1, "#525960");
  ctx.fillStyle = metal;
  ctx.beginPath();
  for (let index = 0; index < 4; index += 1) {
    const angle = (Math.PI * 2 * index) / 4;
    ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
    ctx.lineTo(
      Math.cos(angle + Math.PI / 4) * radius * 0.22,
      Math.sin(angle + Math.PI / 4) * radius * 0.22,
    );
  }
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#12161f";
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Weapon-specific sprite map
const WEAPON_SPRITE_MAP: Record<string, string> = {
  katana: "ninjaIdle",
  yari: "ninjaBlue",
  kusarigama: "ninjaGreen",
  shuriken: "ninjaPurple",
};

// Weapon visual colors
const WEAPON_GLOW: Record<string, string> = {
  katana: "rgba(232,224,208,0.9)",
  yari: "rgba(196,163,90,0.9)",
  kusarigama: "rgba(139,115,85,0.9)",
  shuriken: "rgba(160,168,184,0.9)",
};

function drawWeaponOverlay(
  ctx: CanvasRenderingContext2D,
  weapon: string,
  radius: number,
  time: number,
  isDashing: boolean,
  isCharging: boolean,
  chargeLevel: number,
) {
  const r = radius;
  ctx.save();

  if (weapon === "katana") {
    // Katana blade — extends to the right, swings during dash
    const swingAngle = isDashing
      ? Math.sin(time * 24) * 0.8
      : isCharging
        ? -0.3 - chargeLevel * 0.4
        : Math.sin(time * 1.5) * 0.1;
    ctx.rotate(swingAngle);
    const bladeLen = isDashing
      ? r * 2.8
      : isCharging
        ? r * 2.2 + chargeLevel * r
        : r * 1.8;
    const grad = ctx.createLinearGradient(r * 0.5, 0, r * 0.5 + bladeLen, 0);
    grad.addColorStop(0, "rgba(200,200,210,0.9)");
    grad.addColorStop(0.7, "rgba(240,240,250,0.95)");
    grad.addColorStop(1, "rgba(255,255,255,0.4)");
    ctx.strokeStyle = grad;
    ctx.lineWidth = isDashing ? 3.5 : 2.5;
    ctx.lineCap = "round";
    ctx.shadowColor = isDashing ? "#fff" : "rgba(200,200,255,0.5)";
    ctx.shadowBlur = isDashing ? 12 : 4;
    ctx.beginPath();
    ctx.moveTo(r * 0.3, 0);
    ctx.lineTo(r * 0.3 + bladeLen, isDashing ? -3 : 0);
    ctx.stroke();
    // Tsuba (guard)
    ctx.fillStyle = "#8b7355";
    ctx.fillRect(r * 0.2, -4, 5, 8);
  } else if (weapon === "yari") {
    // Spear — long shaft with triangular head
    const thrustOffset = isDashing
      ? Math.sin(time * 20) * 8
      : isCharging
        ? chargeLevel * 12
        : 0;
    const spearLen = r * 2.5 + thrustOffset;
    ctx.strokeStyle = "#8b6914";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(r * 0.2, 0);
    ctx.lineTo(r * 0.2 + spearLen, 0);
    ctx.stroke();
    // Spearhead
    const hx = r * 0.2 + spearLen;
    ctx.fillStyle = isDashing ? "#fff" : "#c0c0c8";
    ctx.shadowColor = isDashing ? "#fff" : "rgba(200,200,200,0.5)";
    ctx.shadowBlur = isDashing ? 10 : 3;
    ctx.beginPath();
    ctx.moveTo(hx, -5);
    ctx.lineTo(hx + 12, 0);
    ctx.lineTo(hx, 5);
    ctx.closePath();
    ctx.fill();
  } else if (weapon === "kusarigama") {
    // Chain sickle — curved blade + chain that swings
    const chainAngle = isDashing
      ? time * 12
      : isCharging
        ? time * 3 + chargeLevel * Math.PI
        : Math.sin(time * 2) * 0.4;
    // Sickle blade
    ctx.strokeStyle = "#c0c0c8";
    ctx.lineWidth = 2.5;
    ctx.shadowColor = isDashing ? "#fff" : "rgba(180,180,180,0.4)";
    ctx.shadowBlur = isDashing ? 8 : 2;
    ctx.beginPath();
    ctx.arc(r * 0.6, -2, r * 0.7, -0.8, 0.3);
    ctx.stroke();
    // Chain links
    ctx.strokeStyle = "rgba(160,140,100,0.7)";
    ctx.lineWidth = 1.5;
    const chainLen = isDashing ? r * 2 : r * 1.2;
    for (let i = 0; i < 5; i++) {
      const t = i / 5;
      const cx = r * 0.3 + Math.cos(chainAngle + t * 2) * chainLen * t;
      const cy = Math.sin(chainAngle + t * 2) * chainLen * t * 0.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 2, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (weapon === "shuriken") {
    // Orbiting shuriken indicators
    const orbCount = 3;
    for (let i = 0; i < orbCount; i++) {
      const a = time * 3 + (i / orbCount) * Math.PI * 2;
      const orbitR = isCharging ? r * 1.2 + chargeLevel * r * 0.5 : r * 1.0;
      const sx = Math.cos(a) * orbitR;
      const sy = Math.sin(a) * orbitR;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(time * 8);
      // 4-pointed star
      ctx.fillStyle = isDashing ? "#fff" : "rgba(160,168,184,0.8)";
      ctx.shadowColor = isDashing ? "#a0a8b8" : "rgba(160,168,184,0.3)";
      ctx.shadowBlur = isDashing ? 8 : 3;
      ctx.beginPath();
      for (let p = 0; p < 4; p++) {
        const pa = (p / 4) * Math.PI * 2;
        ctx.lineTo(Math.cos(pa) * 5, Math.sin(pa) * 5);
        const pb = ((p + 0.5) / 4) * Math.PI * 2;
        ctx.lineTo(Math.cos(pb) * 2, Math.sin(pb) * 2);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }
  ctx.restore();
}

export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  player: {
    x: number;
    y: number;
    radius: number;
    invulnerable: number;
  },
  dashDir: { x: number; y: number } | null,
  time: number,
  weapon = "katana",
  chargeLevel = 0,
  isCharging = false,
) {
  const angle = dashDir
    ? Math.atan2(dashDir.y, dashDir.x)
    : Math.sin(time * 1.6) * 0.06;
  const isDashing = Boolean(dashDir);

  // Select weapon-specific sprite or fall back to default
  const spriteName = WEAPON_SPRITE_MAP[weapon] || "ninjaIdle";
  const ninjaSprite = getSprite(spriteName as never) || getSprite("ninjaIdle");
  if (ninjaSprite) {
    const size = player.radius * 3.5;
    const flipX = dashDir ? dashDir.x < 0 : false;
    // Breathing/bobbing animation
    const bob = isDashing
      ? Math.sin(time * 18) * 3
      : isCharging
        ? Math.sin(time * 6) * 2 // tense wobble when charging
        : Math.sin(time * 2.8) * 5;
    // Squash/stretch — more dramatic for each state
    let squashX = 1 + Math.sin(time * 4.5) * 0.04;
    let squashY = 1 - Math.sin(time * 4.5) * 0.04;
    if (isDashing) {
      squashX = 1.25;
      squashY = 0.78;
    } else if (isCharging) {
      // Tense compression during charge
      squashX = 1 - chargeLevel * 0.08;
      squashY = 1 + chargeLevel * 0.1;
    }
    // Tilt
    const tilt =
      isDashing && dashDir
        ? Math.atan2(dashDir.y, dashDir.x) * 0.15
        : isCharging
          ? -0.05 - chargeLevel * 0.1 // Lean back while charging
          : Math.sin(time * 1.6) * 0.03;

    // Ground shadow
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.beginPath();
    ctx.ellipse(
      player.x,
      player.y + player.radius * 1.3,
      player.radius * 1.2,
      player.radius * 0.35,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    // Charge glow circle
    if (isCharging && chargeLevel > 0.1) {
      const glowR = player.radius * (1.2 + chargeLevel * 0.8);
      const glowAlpha = chargeLevel * 0.35;
      const glowColor = WEAPON_GLOW[weapon] || "rgba(255,255,255,0.5)";
      ctx.save();
      ctx.globalAlpha = glowAlpha;
      const chargeGrad = ctx.createRadialGradient(
        player.x,
        player.y,
        player.radius * 0.5,
        player.x,
        player.y,
        glowR,
      );
      chargeGrad.addColorStop(0, glowColor);
      chargeGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = chargeGrad;
      ctx.beginPath();
      ctx.arc(player.x, player.y, glowR, 0, Math.PI * 2);
      ctx.fill();
      // Charge shake effect
      if (chargeLevel > 0.6) {
        const shake = (chargeLevel - 0.6) * 8;
        ctx.translate(
          (Math.random() - 0.5) * shake,
          (Math.random() - 0.5) * shake,
        );
      }
      ctx.restore();
    }

    // Invulnerability blink
    if (player.invulnerable > 0 && !isDashing && Math.sin(time * 14) > 0) {
      ctx.globalAlpha = 0.4;
    }

    // Dashing glow + aura
    if (isDashing) {
      ctx.shadowColor = "rgba(207,46,47,0.9)";
      ctx.shadowBlur = 28;
    }

    // Apply squash/stretch + tilt transform
    ctx.translate(player.x, player.y + bob);
    ctx.rotate(tilt);
    ctx.scale(squashX, squashY);

    // Draw character sprite
    drawFrame(ctx, ninjaSprite, 0, -size / 2, -size / 2, size, size, flipX);

    // Draw weapon overlay on top of character
    ctx.save();
    if (flipX) ctx.scale(-1, 1); // weapon follows facing direction
    drawWeaponOverlay(
      ctx,
      weapon,
      player.radius,
      time,
      isDashing,
      isCharging,
      chargeLevel,
    );
    ctx.restore();

    ctx.restore();
    return;
  }

  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(angle);

  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.beginPath();
  ctx.ellipse(
    0,
    player.radius * 1.15,
    player.radius * 0.95,
    player.radius * 0.32,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  if (isDashing) {
    const streak = ctx.createLinearGradient(-46, 0, 12, 0);
    streak.addColorStop(0, "rgba(255,255,255,0)");
    streak.addColorStop(0.45, "rgba(255,255,255,0.18)");
    streak.addColorStop(1, "rgba(211,28,31,0.42)");
    ctx.fillStyle = streak;
    ctx.beginPath();
    ctx.moveTo(-44, -10);
    ctx.quadraticCurveTo(-10, 0, -44, 10);
    ctx.closePath();
    ctx.fill();
  }

  const body = ctx.createRadialGradient(-3, -6, 0, 0, 0, player.radius * 1.2);
  body.addColorStop(0, isDashing ? "#fcf9f1" : "#222833");
  body.addColorStop(1, isDashing ? "#aeb4bb" : "#0c1018");
  ctx.fillStyle = body;
  ctx.shadowColor = isDashing
    ? "rgba(255,255,255,0.75)"
    : "rgba(207,31,35,0.38)";
  ctx.shadowBlur = isDashing ? 24 : 12;
  ctx.beginPath();
  ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#0f141d";
  ctx.beginPath();
  ctx.ellipse(
    0,
    1,
    player.radius * 0.74,
    player.radius * 0.85,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  ctx.strokeStyle = "#cf1f23";
  ctx.lineWidth = 3.6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(0, -2, player.radius * 0.78, Math.PI * 0.72, Math.PI * 0.28, true);
  ctx.stroke();

  ctx.fillStyle = "#cf1f23";
  ctx.beginPath();
  ctx.arc(player.radius * 0.7, -2, 2.8, 0, Math.PI * 2);
  ctx.fill();

  const scarfSwing = dashDir
    ? Math.atan2(-dashDir.y, -dashDir.x)
    : Math.PI * 0.18 + Math.sin(time * 3) * 0.18;
  ctx.strokeStyle = "#cf1f23";
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(player.radius * 0.7, -2);
  ctx.quadraticCurveTo(
    player.radius * 1.15 + Math.cos(scarfSwing) * 10,
    -8 + Math.sin(scarfSwing) * 10,
    player.radius * 1.05 + Math.cos(scarfSwing + 0.25) * 24,
    -6 + Math.sin(scarfSwing + 0.25) * 20,
  );
  ctx.stroke();

  ctx.shadowColor = isDashing ? "#ffffff" : "#ff3c3c";
  ctx.shadowBlur = 10;
  ctx.fillStyle = "#fff5f5";
  const eyeAlpha =
    player.invulnerable > 0 && !isDashing
      ? 0.45 + Math.sin(time * 14) * 0.25
      : 1;
  ctx.globalAlpha = eyeAlpha;
  ctx.beginPath();
  ctx.ellipse(-4.2, -4.4, 2.4, 1.35, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(4.2, -4.4, 2.4, 1.35, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
}

export function drawAfterimage(
  ctx: CanvasRenderingContext2D,
  ghost: {
    x: number;
    y: number;
    angle: number;
    life: number;
    maxLife: number;
    isShadow?: boolean;
  },
) {
  const t = clamp(ghost.life / ghost.maxLife, 0, 1);

  // Try drawing ninja sprite as semi-transparent copy
  const ninjaSprite = getSprite("ninjaAttack") || getSprite("ninjaReady");
  if (ninjaSprite) {
    const size = ghost.isShadow ? 56 : 42;
    const flipX = Math.cos(ghost.angle) < 0;
    ctx.save();
    ctx.globalAlpha = t * (ghost.isShadow ? 0.55 : 0.35);
    if (ghost.isShadow) {
      // Purple tint for shadow clones
      ctx.shadowColor = "rgba(163,155,189,0.8)";
      ctx.shadowBlur = 18 * t;
    } else {
      ctx.shadowColor = "rgba(207,46,47,0.6)";
      ctx.shadowBlur = 12 * t;
    }
    drawFrame(
      ctx,
      ninjaSprite,
      0,
      ghost.x - size / 2,
      ghost.y - size / 2,
      size,
      size,
      flipX,
    );
    ctx.restore();

    // Motion trail
    ctx.save();
    ctx.translate(ghost.x, ghost.y);
    ctx.rotate(ghost.angle);
    ctx.globalAlpha = t * 0.3;
    const tc = ghost.isShadow ? "163,155,189" : "207,46,47";
    const trail = ctx.createLinearGradient(-36, 0, 0, 0);
    trail.addColorStop(0, `rgba(${tc},0)`);
    trail.addColorStop(1, `rgba(${tc},0.4)`);
    ctx.fillStyle = trail;
    ctx.beginPath();
    ctx.moveTo(-36, -14);
    ctx.quadraticCurveTo(-8, 0, -36, 14);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    return;
  }

  // Fallback procedural rendering
  ctx.save();
  ctx.translate(ghost.x, ghost.y);
  ctx.rotate(ghost.angle);
  ctx.globalAlpha = t * 0.42;
  const gradient = ctx.createLinearGradient(-24, 0, 18, 0);
  gradient.addColorStop(0, "rgba(255,255,255,0)");
  gradient.addColorStop(0.4, "rgba(255,255,255,0.18)");
  gradient.addColorStop(1, "rgba(207,31,35,0.55)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(-24, -12);
  ctx.quadraticCurveTo(8, 0, -24, 12);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(245, 239, 227, 0.28)";
  ctx.beginPath();
  ctx.ellipse(0, 0, 12, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawEnemy(
  ctx: CanvasRenderingContext2D,
  enemy: {
    kind:
      | "samurai"
      | "shinobi"
      | "ronin"
      | "yurei"
      | "kappa"
      | "oni"
      | "tengu"
      | "boss";
    x: number;
    y: number;
    radius: number;
    hitFlash: number;
    hp: number;
    maxHp: number;
    primary: string;
    secondary: string;
    elite: boolean;
    buffed: number;
    dying: boolean;
    deathTimer: number;
  },
  time: number,
) {
  const flash = clamp(enemy.hitFlash / 0.16, 0, 1);

  // Death animation — shrink, spin, fade out
  if (enemy.dying) {
    const deathProgress = 1 - clamp(enemy.deathTimer / 0.3, 0, 1);
    const scale = 1 - deathProgress * 0.8;
    const alpha = 1 - deathProgress;
    const spin = deathProgress * Math.PI * 2;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(enemy.x, enemy.y);
    ctx.rotate(spin);
    ctx.scale(scale, scale);
    // Draw a simple shrinking version
    ctx.fillStyle = enemy.primary;
    ctx.beginPath();
    ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  // Try sprite rendering — idle + attack pose switching
  const idleMap: Record<string, string> = {
    samurai: "samurai",
    shinobi: "shinobi",
    ronin: "ronin",
    yurei: "yurei",
    kappa: "kappa",
    oni: "oni",
    tengu: "tengu",
    boss: "bossSamurai",
  };
  const atkMap: Record<string, string> = {
    samurai: "samuraiAtk",
    shinobi: "shinobiAtk",
    ronin: "roninAtk",
    yurei: "yureiAtk",
    kappa: "kappaAtk",
    oni: "oniAtk",
    tengu: "tenguAtk",
    boss: "samuraiAtk",
  };
  // Switch to attack pose when hit (flash) or when close to being hit
  const useAttackPose = flash > 0.3;
  const spriteNameStr = useAttackPose
    ? atkMap[enemy.kind]
    : idleMap[enemy.kind];
  const spriteName = spriteNameStr as
    | import("./sprites").SpriteName
    | undefined;
  if (spriteName) {
    const sprite =
      getSprite(spriteName) ||
      getSprite(idleMap[enemy.kind] as import("./sprites").SpriteName);
    if (sprite) {
      const size = enemy.radius * 3.2;
      ctx.save();
      // Ground shadow
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.beginPath();
      ctx.ellipse(
        enemy.x,
        enemy.y + enemy.radius * 1.0,
        enemy.radius * 1.0,
        enemy.radius * 0.3,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      // Hit flash (white tint)
      if (flash > 0) {
        ctx.globalAlpha = 1;
        ctx.filter = `brightness(${1 + flash * 2})`;
      }
      // Elite glow
      if (enemy.elite) {
        ctx.shadowColor = "rgba(245,213,126,0.6)";
        ctx.shadowBlur = 12;
      }
      // Breathing + wobble animation
      const bob = Math.sin(time * 2.2 + enemy.x * 0.03) * 2.5;
      const lean = Math.sin(time * 1.5 + enemy.y * 0.02) * 0.04;
      ctx.translate(enemy.x, enemy.y + bob);
      ctx.rotate(lean);
      drawFrame(ctx, sprite, 0, -size / 2, -size / 2, size, size);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.filter = "none";
      // Boss HP bar
      if (enemy.kind === "boss") {
        const hpRatio = clamp(enemy.hp / enemy.maxHp, 0, 1);
        ctx.fillStyle = "rgba(10,12,20,0.72)";
        ctx.beginPath();
        ctx.roundRect(
          enemy.x - enemy.radius * 1.35,
          enemy.y - enemy.radius - 22,
          enemy.radius * 2.7,
          7,
          4,
        );
        ctx.fill();
        ctx.fillStyle = "#cf332b";
        ctx.beginPath();
        ctx.roundRect(
          enemy.x - enemy.radius * 1.35,
          enemy.y - enemy.radius - 22,
          enemy.radius * 2.7 * hpRatio,
          7,
          4,
        );
        ctx.fill();
      }
      ctx.restore();
      return;
    }
  }

  ctx.save();
  ctx.translate(enemy.x, enemy.y);

  ctx.fillStyle = "rgba(0,0,0,0.24)";
  ctx.beginPath();
  ctx.ellipse(
    0,
    enemy.radius * 0.82,
    enemy.radius * 0.82,
    enemy.radius * 0.28,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  const body = ctx.createRadialGradient(
    -enemy.radius * 0.22,
    -enemy.radius * 0.3,
    0,
    0,
    0,
    enemy.radius * 1.2,
  );
  body.addColorStop(0, flash > 0 ? "#fff7ef" : enemy.primary);
  body.addColorStop(1, flash > 0 ? "#f2d8cc" : enemy.secondary);
  ctx.fillStyle = body;

  if (enemy.kind === "yurei") {
    ctx.beginPath();
    ctx.arc(0, -enemy.radius * 0.18, enemy.radius * 0.82, Math.PI, 0);
    ctx.quadraticCurveTo(
      enemy.radius * 0.84,
      enemy.radius * 0.55,
      enemy.radius * 0.32,
      enemy.radius + Math.sin(time * 5) * 3,
    );
    ctx.quadraticCurveTo(
      0,
      enemy.radius * 0.46 + Math.sin(time * 5 + 1.1) * 4,
      -enemy.radius * 0.32,
      enemy.radius + Math.sin(time * 5 + 2) * 3,
    );
    ctx.quadraticCurveTo(
      -enemy.radius * 0.84,
      enemy.radius * 0.55,
      -enemy.radius * 0.84,
      0,
    );
    ctx.fill();
  } else if (enemy.kind === "shinobi") {
    // Dark origami ninja shape
    ctx.beginPath();
    ctx.ellipse(
      0,
      0,
      enemy.radius * 0.88,
      enemy.radius * 0.78,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    // Purple belt
    ctx.fillStyle = "#6e4a8e";
    ctx.fillRect(
      -enemy.radius * 0.6,
      enemy.radius * 0.1,
      enemy.radius * 1.2,
      enemy.radius * 0.18,
    );
  } else if (enemy.kind === "ronin") {
    // Ronin with straw hat
    ctx.beginPath();
    ctx.ellipse(
      0,
      0,
      enemy.radius * 0.86,
      enemy.radius * 0.94,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    // Straw hat triangle
    ctx.fillStyle = "#c4a35a";
    ctx.beginPath();
    ctx.moveTo(-enemy.radius * 0.7, -enemy.radius * 0.5);
    ctx.lineTo(0, -enemy.radius * 1.3);
    ctx.lineTo(enemy.radius * 0.7, -enemy.radius * 0.5);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  if (enemy.kind === "samurai" || enemy.kind === "boss") {
    // Gold helmet crest
    ctx.fillStyle = "#d8ac56";
    ctx.beginPath();
    ctx.moveTo(-enemy.radius * 0.42, -enemy.radius * 0.72);
    ctx.lineTo(-enemy.radius * 0.15, -enemy.radius * 1.34);
    ctx.lineTo(enemy.radius * 0.02, -enemy.radius * 0.66);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(enemy.radius * 0.42, -enemy.radius * 0.72);
    ctx.lineTo(enemy.radius * 0.15, -enemy.radius * 1.34);
    ctx.lineTo(-enemy.radius * 0.02, -enemy.radius * 0.66);
    ctx.closePath();
    ctx.fill();
  }

  if (enemy.kind === "ronin") {
    // Katana at hip
    ctx.strokeStyle = "#c0c0c0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(enemy.radius * 0.5, 0);
    ctx.lineTo(enemy.radius * 1.2, -enemy.radius * 0.3);
    ctx.stroke();
  }

  ctx.fillStyle = enemy.kind === "yurei" ? "#10141b" : "#f4d471";
  ctx.shadowColor =
    enemy.kind === "yurei"
      ? "rgba(255,255,255,0.35)"
      : "rgba(244, 212, 113, 0.65)";
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.ellipse(
    -enemy.radius * 0.26,
    -enemy.radius * 0.16,
    enemy.radius * 0.12,
    enemy.radius * 0.12,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(
    enemy.radius * 0.26,
    -enemy.radius * 0.16,
    enemy.radius * 0.12,
    enemy.radius * 0.12,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.shadowBlur = 0;

  if (enemy.kind === "samurai" || enemy.kind === "boss") {
    // Angry mouth
    ctx.strokeStyle = "#f5c274";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, enemy.radius * 0.15, enemy.radius * 0.34, 0.2, Math.PI - 0.2);
    ctx.stroke();
  }

  if (enemy.kind === "boss") {
    const aura = 1 + Math.sin(time * 2.8) * 0.08;
    ctx.strokeStyle = "rgba(214, 64, 55, 0.5)";
    ctx.lineWidth = 3;
    ctx.shadowColor = "rgba(214, 64, 55, 0.6)";
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(0, 0, enemy.radius * 1.22 * aura, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    const hpRatio = clamp(enemy.hp / enemy.maxHp, 0, 1);
    ctx.fillStyle = "rgba(10, 12, 20, 0.72)";
    ctx.beginPath();
    ctx.roundRect(
      -enemy.radius * 1.35,
      -enemy.radius - 22,
      enemy.radius * 2.7,
      7,
      4,
    );
    ctx.fill();
    ctx.fillStyle = "#cf332b";
    ctx.beginPath();
    ctx.roundRect(
      -enemy.radius * 1.35,
      -enemy.radius - 22,
      enemy.radius * 2.7 * hpRatio,
      7,
      4,
    );
    ctx.fill();
  }

  if (enemy.elite && enemy.kind !== "boss") {
    const aura = 1 + Math.sin(time * 3.2) * 0.08;
    ctx.strokeStyle = "rgba(245,213,126,0.78)";
    ctx.lineWidth = 2.4;
    ctx.shadowColor = "rgba(245,213,126,0.72)";
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(0, 0, enemy.radius * 1.18 * aura, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
  if (enemy.buffed > 0 && !enemy.elite && enemy.kind !== "boss") {
    ctx.strokeStyle = `rgba(245,213,126,${0.28 + enemy.buffed * 0.9})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, enemy.radius * 1.08, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawHazard(
  ctx: CanvasRenderingContext2D,
  hazard: {
    x: number;
    y: number;
    radius: number;
    life: number;
    telegraph: number;
    active: number;
    color: string;
  },
  time: number,
) {
  const telegraphing = hazard.life > hazard.active;
  const ratio = telegraphing
    ? clamp((hazard.life - hazard.active) / hazard.telegraph, 0, 1)
    : clamp(hazard.life / hazard.active, 0, 1);
  const pulse = 1 + Math.sin(time * 10 + hazard.x * 0.03) * 0.05;
  ctx.save();
  ctx.globalAlpha = telegraphing ? 0.26 + (1 - ratio) * 0.18 : 0.42 * ratio;
  ctx.fillStyle = telegraphing ? "rgba(135, 18, 20, 0.24)" : hazard.color;
  ctx.beginPath();
  ctx.arc(hazard.x, hazard.y, hazard.radius * pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = telegraphing ? 0.75 : 1;
  ctx.strokeStyle = hazard.color;
  ctx.lineWidth = telegraphing ? 2 : 4;
  ctx.shadowColor = hazard.color;
  ctx.shadowBlur = telegraphing ? 10 : 18;
  ctx.beginPath();
  ctx.arc(hazard.x, hazard.y, hazard.radius * pulse, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export function drawParticle(
  ctx: CanvasRenderingContext2D,
  particle: {
    x: number;
    y: number;
    size: number;
    life: number;
    maxLife: number;
    color: string;
    glow: number;
  },
) {
  const alpha = clamp(particle.life / particle.maxLife, 0, 1);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.shadowColor = particle.color;
  ctx.shadowBlur = particle.glow;
  ctx.fillStyle = particle.color;
  ctx.beginPath();
  ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawPaperShred(
  ctx: CanvasRenderingContext2D,
  shred: {
    x: number;
    y: number;
    w: number;
    h: number;
    rot: number;
    life: number;
    maxLife: number;
    color: string;
  },
) {
  const alpha = clamp(shred.life / shred.maxLife, 0, 1);
  ctx.save();
  ctx.globalAlpha = alpha * alpha;
  ctx.translate(shred.x, shred.y);
  ctx.rotate(shred.rot);
  ctx.fillStyle = shred.color;
  ctx.fillRect(-shred.w / 2, -shred.h / 2, shred.w, shred.h);
  // fold crease line
  ctx.strokeStyle = "rgba(0,0,0,0.3)";
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(-shred.w / 2, 0);
  ctx.lineTo(shred.w / 2, 0);
  ctx.stroke();
  ctx.restore();
}

export function drawShockwave(
  ctx: CanvasRenderingContext2D,
  wave: {
    x: number;
    y: number;
    radius: number;
    life: number;
    maxLife: number;
    color: string;
  },
) {
  const alpha = clamp(wave.life / wave.maxLife, 0, 1);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = wave.color;
  ctx.lineWidth = 2 + alpha * 4;
  ctx.shadowColor = wave.color;
  ctx.shadowBlur = 16 * alpha;
  ctx.beginPath();
  ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export function drawAimGuide(
  ctx: CanvasRenderingContext2D,
  start: { x: number; y: number },
  current: { x: number; y: number },
  player: { x: number; y: number; dashDistance: number },
) {
  const dx = current.x - start.x;
  const dy = current.y - start.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 4) return;

  const aimX = -dx / dist;
  const aimY = -dy / dist;
  const dashLen = Math.min(player.dashDistance, 90 + dist * 0.6);
  const endX = player.x + aimX * dashLen;
  const endY = player.y + aimY * dashLen;
  const strength = clamp(dist / 110, 0, 1);

  ctx.save();
  ctx.strokeStyle = `rgba(255,255,255,${0.2 + strength * 0.4})`;
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.lineTo(endX, endY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = `rgba(212, 28, 31, ${0.35 + strength * 0.35})`;
  ctx.beginPath();
  ctx.arc(endX, endY, 8 + strength * 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(242, 207, 122, 0.8)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(endX - aimX * 14 + aimY * 7, endY - aimY * 14 - aimX * 7);
  ctx.lineTo(endX - aimX * 14 - aimY * 7, endY - aimY * 14 + aimX * 7);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

export function drawHud(
  ctx: CanvasRenderingContext2D,
  data: {
    hp: number;
    maxHp: number;
    xp: number;
    xpToNext: number;
    level: number;
    wave: number;
    time: number;
    killCount: number;
    gold: number;
    dashCooldownRatio: number;
    ultimateRatio: number;
    ultimateReady: boolean;
    skills: UiSkill[];
    hintAlpha: number;
    boss: { hp: number; maxHp: number; rank: number } | null;
    bossWarning: number;
  },
) {
  ctx.save();
  ctx.fillStyle = "rgba(5, 7, 13, 0.68)";
  ctx.beginPath();
  ctx.roundRect(16, 16, CANVAS_WIDTH - 32, 74, 18);
  ctx.fill();
  ctx.strokeStyle = "rgba(214, 180, 94, 0.22)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(16, 16, CANVAS_WIDTH - 32, 74, 18);
  ctx.stroke();

  const hpRatio = clamp(data.hp / data.maxHp, 0, 1);
  const hpGradient = ctx.createLinearGradient(28, 0, CANVAS_WIDTH - 28, 0);
  hpGradient.addColorStop(0, hpRatio > 0.35 ? "#74181b" : "#471010");
  hpGradient.addColorStop(1, hpRatio > 0.35 ? "#cf2e2f" : "#b61d1f");
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.beginPath();
  ctx.roundRect(28, 30, CANVAS_WIDTH - 56, 12, 8);
  ctx.fill();
  ctx.fillStyle = hpGradient;
  ctx.beginPath();
  ctx.roundRect(28, 30, (CANVAS_WIDTH - 56) * hpRatio, 12, 8);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.beginPath();
  ctx.roundRect(28, 48, CANVAS_WIDTH - 56, 7, 5);
  ctx.fill();
  ctx.fillStyle = "#d8b45e";
  ctx.beginPath();
  ctx.roundRect(
    28,
    48,
    (CANVAS_WIDTH - 56) * clamp(data.xp / data.xpToNext, 0, 1),
    7,
    5,
  );
  ctx.fill();

  ctx.font = `700 14px ${UI_FONT}`;
  ctx.fillStyle = "#f5efe3";
  ctx.textAlign = "left";
  ctx.fillText(`Lv.${data.level}`, 28, 75);
  ctx.textAlign = "center";
  ctx.fillStyle = "#d8b45e";
  ctx.fillText(`第${data.wave}波`, CANVAS_WIDTH / 2, 75);
  ctx.textAlign = "right";
  const remaining = Math.max(0, 900 - data.time);
  const minutes = Math.floor(remaining / 60);
  const seconds = Math.floor(remaining % 60);
  ctx.fillStyle =
    remaining <= 60 ? "#cf2e2f" : remaining <= 180 ? "#f5d57e" : "#f5efe3";
  ctx.fillText(
    `${minutes}:${seconds.toString().padStart(2, "0")}`,
    CANVAS_WIDTH - 28,
    75,
  );

  ctx.textAlign = "left";
  ctx.font = `500 11px ${UI_FONT}`;
  ctx.fillStyle = "rgba(255,255,255,0.58)";
  ctx.fillText(`討伐 ${data.killCount}`, 28, 90);
  if (data.gold > 0) {
    ctx.textAlign = "right";
    ctx.fillStyle = "#f5d57e";
    ctx.fillText(`🪙 ${data.gold}`, CANVAS_WIDTH - 28, 90);
  }

  const readyRingX = CANVAS_WIDTH - 46;
  const readyRingY = CANVAS_HEIGHT - 46;
  ctx.fillStyle = "rgba(8,10,18,0.82)";
  ctx.beginPath();
  ctx.arc(readyRingX, readyRingY, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = data.ultimateReady ? "#f5d57e" : "rgba(255,255,255,0.14)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(
    readyRingX,
    readyRingY,
    24,
    -Math.PI / 2,
    -Math.PI / 2 + Math.PI * 2 * clamp(data.ultimateRatio, 0, 1),
  );
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(readyRingX, readyRingY, 18, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = data.dashCooldownRatio >= 1 ? "#f5efe3" : "#cf2e2f";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(
    readyRingX,
    readyRingY,
    18,
    -Math.PI / 2,
    -Math.PI / 2 + Math.PI * 2 * data.dashCooldownRatio,
  );
  ctx.stroke();
  ctx.fillStyle = "rgba(8,10,18,0.92)";
  ctx.beginPath();
  ctx.arc(readyRingX, readyRingY, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f5efe3";
  ctx.font = `700 9px ${UI_FONT}`;
  ctx.fillText("Dash", readyRingX, readyRingY + 4);
  ctx.font = `700 8px ${UI_FONT}`;
  ctx.fillStyle = data.ultimateReady ? "#f5d57e" : "rgba(255,255,255,0.55)";
  ctx.fillText("ULT", readyRingX, readyRingY - 18);
  if (data.ultimateReady) {
    ctx.fillStyle = "#f5d57e";
    ctx.fillText("2 TAP", readyRingX, readyRingY + 16);
  }

  let skillX = 20;
  const skillY = CANVAS_HEIGHT - 72;
  for (const skill of data.skills) {
    ctx.fillStyle = "rgba(6,8,14,0.78)";
    ctx.beginPath();
    ctx.roundRect(skillX, skillY, 58, 50, 16);
    ctx.fill();
    ctx.strokeStyle = `rgba(255,255,255,${0.1 + skill.readyRatio * 0.28})`;
    ctx.beginPath();
    ctx.roundRect(skillX, skillY, 58, 50, 16);
    ctx.stroke();

    ctx.fillStyle = skill.color;
    ctx.font = `700 12px ${UI_FONT}`;
    ctx.textAlign = "left";
    ctx.fillText(skill.icon, skillX + 10, skillY + 20);
    ctx.fillStyle = "#f5efe3";
    ctx.font = `700 9px ${UI_FONT}`;
    ctx.fillText(skill.name, skillX + 10, skillY + 34);
    ctx.fillStyle = "#d8b45e";
    ctx.fillText(`Lv.${skill.level}`, skillX + 10, skillY + 44);

    ctx.strokeStyle = skill.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(skillX + 8, skillY + 48);
    ctx.lineTo(skillX + 8 + 42 * skill.readyRatio, skillY + 48);
    ctx.stroke();
    skillX += 64;
  }

  if (data.boss) {
    const ratio = clamp(data.boss.hp / data.boss.maxHp, 0, 1);
    ctx.fillStyle = "rgba(5,7,13,0.8)";
    ctx.beginPath();
    ctx.roundRect(52, 104, CANVAS_WIDTH - 104, 14, 8);
    ctx.fill();
    ctx.fillStyle = "#cf2e2f";
    ctx.beginPath();
    ctx.roundRect(52, 104, (CANVAS_WIDTH - 104) * ratio, 14, 8);
    ctx.fill();
    ctx.strokeStyle = "rgba(216, 180, 94, 0.35)";
    ctx.beginPath();
    ctx.roundRect(52, 104, CANVAS_WIDTH - 104, 14, 8);
    ctx.stroke();
    ctx.fillStyle = "#f1ddbb";
    ctx.textAlign = "center";
    ctx.font = `700 11px ${DISPLAY_FONT}`;
    ctx.fillText("BOSS", CANVAS_WIDTH / 2, 99);
  }

  if (data.boss) {
    ctx.fillStyle = "rgba(5,7,13,0.85)";
    ctx.beginPath();
    ctx.roundRect(CANVAS_WIDTH / 2 - 78, 86, 156, 16, 8);
    ctx.fill();
    ctx.fillStyle = "#f1ddbb";
    ctx.textAlign = "center";
    ctx.font = `700 11px ${DISPLAY_FONT}`;
    ctx.fillText(`BOSS RANK ${data.boss.rank}`, CANVAS_WIDTH / 2, 98);
  }

  if (data.hintAlpha > 0.02) {
    ctx.globalAlpha = data.hintAlpha;
    ctx.fillStyle = "rgba(8,10,18,0.72)";
    ctx.beginPath();
    ctx.roundRect(26, CANVAS_HEIGHT - 142, 230, 42, 14);
    ctx.fill();
    ctx.strokeStyle = "rgba(216, 180, 94, 0.22)";
    ctx.beginPath();
    ctx.roundRect(26, CANVAS_HEIGHT - 142, 230, 42, 14);
    ctx.stroke();
    ctx.fillStyle = "#f5efe3";
    ctx.textAlign = "left";
    ctx.font = `700 12px ${UI_FONT}`;
    ctx.fillText(
      "引っぱって離すと、逆方向へ斬撃ダッシュ",
      38,
      CANVAS_HEIGHT - 116,
    );
  }

  if (data.bossWarning > 0) {
    const alpha = clamp(data.bossWarning / 1.5, 0, 1);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(163, 21, 24, 0.16)";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = "#f1ddbb";
    ctx.textAlign = "center";
    ctx.font = `800 24px ${DISPLAY_FONT}`;
    ctx.fillText("怨気、迫る", CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.36);
  }

  ctx.restore();
}

export function drawRewardBanner(
  ctx: CanvasRenderingContext2D,
  data: {
    title: string;
    subtitle: string;
    color: string;
    life: number;
    maxLife: number;
  },
) {
  const alpha = clamp(data.life / data.maxLife, 0, 1);
  const rise = (1 - alpha) * 18;
  ctx.save();
  ctx.globalAlpha = alpha;
  const width = 280;
  const x = CANVAS_WIDTH / 2 - width / 2;
  const y = 126 - rise;
  const glow = ctx.createLinearGradient(x, y, x + width, y + 56);
  glow.addColorStop(0, "rgba(8,10,18,0.82)");
  glow.addColorStop(1, "rgba(35,12,16,0.9)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.roundRect(x, y, width, 56, 18);
  ctx.fill();
  ctx.strokeStyle = data.color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x, y, width, 56, 18);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = data.color;
  ctx.font = `800 10px ${UI_FONT}`;
  ctx.fillText("NEW POWER", CANVAS_WIDTH / 2, y + 16);
  ctx.fillStyle = "#fff7ea";
  ctx.font = `800 20px ${DISPLAY_FONT}`;
  ctx.fillText(data.title, CANVAS_WIDTH / 2, y + 35);
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.font = `600 11px ${UI_FONT}`;
  ctx.fillText(data.subtitle, CANVAS_WIDTH / 2, y + 49);
  ctx.restore();
}

export function drawScreenFlash(
  ctx: CanvasRenderingContext2D,
  strength: number,
  color = "255,255,255",
) {
  if (strength <= 0) return;
  const alpha = clamp(strength, 0, 1) * 0.22;
  ctx.save();
  ctx.fillStyle = `rgba(${color}, ${alpha})`;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.restore();
}

function drawUpgradeGlyph(
  ctx: CanvasRenderingContext2D,
  icon: string,
  x: number,
  y: number,
  size: number,
  color: string,
) {
  const radius = size / 2;
  ctx.save();
  ctx.translate(x, y);

  // Outer decorative ring (hexagonal shape for premium feel)
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.3;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
    const px = Math.cos(a) * (radius + 4);
    const py = Math.sin(a) * (radius + 4);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Background circle with richer gradient
  const bg = ctx.createRadialGradient(0, -6, 0, 0, 0, radius);
  bg.addColorStop(0, "rgba(40,38,52,0.95)");
  bg.addColorStop(0.6, "rgba(18,20,32,0.98)");
  bg.addColorStop(1, "rgba(6,8,14,0.99)");
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  // Inner glow ring
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.shadowColor = color;
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.arc(0, 0, radius - 2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Subtle inner highlight
  const highlight = ctx.createRadialGradient(
    0,
    -radius * 0.3,
    0,
    0,
    0,
    radius * 0.7,
  );
  highlight.addColorStop(0, "rgba(255,255,255,0.08)");
  highlight.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = highlight;
  ctx.beginPath();
  ctx.arc(0, 0, radius - 3, 0, Math.PI * 2);
  ctx.fill();

  // Icon with shadow for depth
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${Math.floor(size * 0.5)}px sans-serif`;
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 2;
  ctx.fillText(icon, 0, 2);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  ctx.restore();
}

export function drawUpgradeOverlay(
  ctx: CanvasRenderingContext2D,
  data: {
    choices: Array<{
      id: string;
      title: string;
      description: string;
      icon: string;
      kind: string;
      rarity: string;
      rarityColor: string;
      current?: string;
      next?: string;
      kicker?: string;
    }>;
    guardTimer: number;
    rerolls: number;
  },
) {
  ctx.save();
  ctx.fillStyle = "rgba(3,4,8,0.92)";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Title
  ctx.fillStyle = "#f1ddbb";
  ctx.textAlign = "center";
  ctx.font = `800 28px ${DISPLAY_FONT}`;
  ctx.shadowColor = "rgba(216,180,94,0.4)";
  ctx.shadowBlur = 16;
  ctx.fillText("強化を選べ", CANVAS_WIDTH / 2, 130);
  ctx.shadowBlur = 0;
  ctx.font = `500 12px ${UI_FONT}`;
  ctx.fillStyle = data.guardTimer > 0 ? "rgba(255,255,255,0.52)" : "#d8b45e";
  ctx.fillText(
    data.guardTimer > 0
      ? `誤タップ防止 ${data.guardTimer.toFixed(1)}s`
      : "タップして取得",
    CANVAS_WIDTH / 2,
    152,
  );

  // Rarity-specific visual config
  const rarityVfx: Record<
    string,
    {
      glowColor: string;
      glowIntensity: number;
      borderWidth: number;
      bgTop: string;
      bgBot: string;
      particleCount: number;
      cardBgSprite: string | null;
    }
  > = {
    COMMON: {
      glowColor: "rgba(216,180,94,0.3)",
      glowIntensity: 8,
      borderWidth: 1.5,
      bgTop: "rgba(22,26,36,0.97)",
      bgBot: "rgba(38,30,20,0.97)",
      particleCount: 0,
      cardBgSprite: "cardCommon",
    },
    RARE: {
      glowColor: "rgba(135,221,217,0.5)",
      glowIntensity: 16,
      borderWidth: 2,
      bgTop: "rgba(12,28,34,0.97)",
      bgBot: "rgba(18,38,42,0.97)",
      particleCount: 3,
      cardBgSprite: "cardRare",
    },
    EPIC: {
      glowColor: "rgba(183,130,255,0.6)",
      glowIntensity: 24,
      borderWidth: 2.5,
      bgTop: "rgba(24,12,38,0.97)",
      bgBot: "rgba(36,14,46,0.97)",
      particleCount: 6,
      cardBgSprite: "cardEpic",
    },
  };

  data.choices.forEach((choice, index) => {
    const cx = UPGRADE_CARD.x + index * (UPGRADE_CARD.width + UPGRADE_CARD.gap);
    const cy = UPGRADE_CARD.y;
    const cw = UPGRADE_CARD.width;
    const ch = UPGRADE_CARD.height;
    const vfx = rarityVfx[choice.rarity] || rarityVfx.COMMON;

    ctx.globalAlpha = data.guardTimer > 0 ? 0.42 : 1;

    // Outer glow (rarity-dependent)
    if (data.guardTimer <= 0 && vfx.glowIntensity > 0) {
      ctx.shadowColor = vfx.glowColor;
      ctx.shadowBlur = vfx.glowIntensity;
    }

    // Card background
    const cardGrad = ctx.createLinearGradient(cx, cy, cx, cy + ch);
    cardGrad.addColorStop(0, vfx.bgTop);
    cardGrad.addColorStop(1, vfx.bgBot);
    ctx.fillStyle = cardGrad;
    ctx.beginPath();
    ctx.roundRect(cx, cy, cw, ch, 14);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Try card background sprite
    const bgSprite = vfx.cardBgSprite
      ? getSprite(vfx.cardBgSprite as never)
      : null;
    if (bgSprite) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(cx, cy, cw, ch, 14);
      ctx.clip();
      ctx.globalAlpha = (data.guardTimer > 0 ? 0.42 : 1) * 0.35;
      ctx.drawImage(
        bgSprite.img,
        0,
        0,
        bgSprite.frameW,
        bgSprite.frameH,
        cx,
        cy,
        cw,
        ch,
      );
      ctx.restore();
    }

    // Animated rarity particles (RARE/EPIC)
    if (data.guardTimer <= 0) {
      const now = performance.now() / 1000;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(cx, cy, cw, ch, 14);
      ctx.clip();
      for (let p = 0; p < vfx.particleCount; p++) {
        const phase = p * 2.1 + now * 0.8;
        const px = cx + (Math.sin(phase * 1.3 + p) * 0.5 + 0.5) * cw;
        const py = cy + ((phase * 0.15 + p * 0.3) % 1) * ch;
        const pSize = 1.5 + Math.sin(phase * 2) * 0.8;
        ctx.globalAlpha = 0.35 + Math.sin(phase * 3) * 0.2;
        ctx.fillStyle = choice.rarityColor;
        ctx.beginPath();
        ctx.arc(px, py, pSize, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Border (rarity glow)
    ctx.strokeStyle =
      data.guardTimer > 0 ? "rgba(255,255,255,0.08)" : choice.rarityColor;
    ctx.lineWidth = data.guardTimer > 0 ? 1 : vfx.borderWidth;
    if (data.guardTimer <= 0) {
      ctx.shadowColor = choice.rarityColor;
      ctx.shadowBlur = vfx.glowIntensity * 0.7;
    }
    ctx.beginPath();
    ctx.roundRect(cx, cy, cw, ch, 14);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Rarity badge at top
    const badgeW = cw - 16;
    ctx.fillStyle = choice.rarityColor;
    ctx.beginPath();
    ctx.roundRect(cx + 8, cy + 10, badgeW, 20, 10);
    ctx.fill();
    ctx.fillStyle = "#090b12";
    ctx.textAlign = "center";
    ctx.font = `800 10px ${UI_FONT}`;
    ctx.fillText(choice.rarity, cx + cw / 2, cy + 24);

    // Kind badge
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.beginPath();
    ctx.roundRect(cx + 8, cy + 36, badgeW, 18, 9);
    ctx.fill();
    ctx.fillStyle = "#f5efe3";
    ctx.font = `700 9px ${UI_FONT}`;
    ctx.fillText(choice.kind, cx + cw / 2, cy + 49);

    // Icon glyph (centered, large)
    drawUpgradeGlyph(
      ctx,
      choice.icon,
      cx + cw / 2,
      cy + 100,
      62,
      choice.rarityColor,
    );

    // Title (centered, wrapped if needed)
    ctx.fillStyle = "#f5efe3";
    ctx.textAlign = "center";
    ctx.font = `700 14px ${UI_FONT}`;
    ctx.fillText(choice.title, cx + cw / 2, cy + 150);

    // Description (wrapped text)
    ctx.font = `500 10px ${UI_FONT}`;
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    const descWords = choice.description.split("");
    const maxCharsPerLine = Math.floor(cw / 10);
    let line1 = "";
    let line2 = "";
    for (const char of descWords) {
      if (line1.length < maxCharsPerLine) line1 += char;
      else line2 += char;
    }
    ctx.fillText(line1, cx + cw / 2, cy + 172);
    if (line2) ctx.fillText(line2, cx + cw / 2, cy + 186);

    // Current → Next stat
    if (choice.current && choice.next) {
      const statY = cy + 210;
      ctx.fillStyle = "rgba(216, 180, 94, 0.18)";
      ctx.beginPath();
      ctx.roundRect(cx + 6, statY, cw - 12, 20, 7);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.88)";
      ctx.font = `700 9px ${UI_FONT}`;
      ctx.fillText(
        `${choice.current} → ${choice.next}`,
        cx + cw / 2,
        statY + 14,
      );
    }

    // Kicker text
    if (choice.kicker) {
      const kickY = choice.current ? cy + 238 : cy + 210;
      ctx.fillStyle = "rgba(255,255,255,0.1)";
      ctx.beginPath();
      ctx.roundRect(cx + 6, kickY, cw - 12, 20, 7);
      ctx.fill();
      ctx.fillStyle = choice.rarityColor;
      ctx.font = `600 8px ${UI_FONT}`;
      // Wrap kicker text
      const kickChars = choice.kicker.split("");
      const kickMax = Math.floor((cw - 12) / 8);
      let k1 = "",
        k2 = "";
      for (const c of kickChars) {
        if (k1.length < kickMax) k1 += c;
        else k2 += c;
      }
      ctx.fillText(k1, cx + cw / 2, kickY + 13);
      if (k2) ctx.fillText(k2, cx + cw / 2, kickY + 24);
    }

    // EPIC shimmer line at bottom
    if (choice.rarity === "EPIC" && data.guardTimer <= 0) {
      const now = performance.now() / 1000;
      const shimmerX = cx + ((now * 0.5) % 1) * cw;
      const shimGrad = ctx.createLinearGradient(
        shimmerX - 20,
        0,
        shimmerX + 20,
        0,
      );
      shimGrad.addColorStop(0, "rgba(183,130,255,0)");
      shimGrad.addColorStop(0.5, "rgba(183,130,255,0.3)");
      shimGrad.addColorStop(1, "rgba(183,130,255,0)");
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(cx, cy, cw, ch, 14);
      ctx.clip();
      ctx.fillStyle = shimGrad;
      ctx.fillRect(cx, cy + ch - 4, cw, 4);
      ctx.restore();
    }
  });

  const rerollEnabled = data.rerolls > 0 && data.guardTimer <= 0;
  ctx.globalAlpha = rerollEnabled ? 1 : 0.45;
  ctx.fillStyle = rerollEnabled ? "rgba(18,24,34,0.92)" : "rgba(12,14,20,0.82)";
  ctx.beginPath();
  ctx.roundRect(
    REROLL_BUTTON.x,
    REROLL_BUTTON.y,
    REROLL_BUTTON.width,
    REROLL_BUTTON.height,
    14,
  );
  ctx.fill();
  ctx.strokeStyle = rerollEnabled
    ? "rgba(135,221,217,0.65)"
    : "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(
    REROLL_BUTTON.x,
    REROLL_BUTTON.y,
    REROLL_BUTTON.width,
    REROLL_BUTTON.height,
    14,
  );
  ctx.stroke();
  ctx.fillStyle = rerollEnabled ? "#87ddd9" : "rgba(255,255,255,0.55)";
  ctx.textAlign = "center";
  ctx.font = `700 13px ${UI_FONT}`;
  ctx.fillText(
    `候補を更新  ${data.rerolls}`,
    CANVAS_WIDTH / 2,
    REROLL_BUTTON.y + 25,
  );

  ctx.restore();
}

export function drawGameOver(
  ctx: CanvasRenderingContext2D,
  data: {
    time: number;
    level: number;
    killCount: number;
    wave: number;
    runGold: number;
    totalGold: number;
    nearestAchievement: { name: string; desc: string; progress: number } | null;
    victory: boolean;
  },
) {
  ctx.save();
  ctx.fillStyle = data.victory ? "rgba(8,12,24,0.88)" : "rgba(3,4,8,0.86)";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Drip effect at top (gold for victory, blood for death)
  for (let i = 0; i < 8; i++) {
    const x = 30 + i * 48 + Math.sin(i * 2.3) * 14;
    const dripLen = 40 + Math.sin(i * 1.7) * 25;
    const grad = ctx.createLinearGradient(x, 0, x, dripLen);
    const dripColor = data.victory
      ? "rgba(216,180,94,0.6)"
      : "rgba(160,20,20,0.6)";
    grad.addColorStop(0, dripColor);
    grad.addColorStop(
      1,
      data.victory ? "rgba(216,180,94,0)" : "rgba(160,20,20,0)",
    );
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(x - 3, 0);
    ctx.quadraticCurveTo(x, dripLen, x + 3, 0);
    ctx.fill();
  }

  const cx = CANVAS_WIDTH / 2;
  const baseY = CANVAS_HEIGHT / 2 - 120;

  ctx.fillStyle = data.victory ? "#f5d57e" : "#f1ddbb";
  ctx.textAlign = "center";
  ctx.shadowColor = data.victory
    ? "rgba(216,180,94,0.6)"
    : "rgba(207,46,47,0.6)";
  ctx.shadowBlur = 20;
  ctx.font = `800 38px ${DISPLAY_FONT}`;
  ctx.fillText(data.victory ? "生還" : "散華", cx, baseY);
  ctx.shadowBlur = 0;

  const minutes = Math.floor(data.time / 60);
  const seconds = Math.floor(data.time % 60);
  ctx.fillStyle = "rgba(255,255,255,0.88)";
  ctx.font = `600 17px ${UI_FONT}`;
  ctx.fillText(
    `生存 ${minutes}:${seconds.toString().padStart(2, "0")}`,
    cx,
    baseY + 50,
  );
  ctx.fillText(`Lv.${data.level}  討伐 ${data.killCount}`, cx, baseY + 80);
  ctx.fillStyle = "#d8b45e";
  ctx.fillText(`第${data.wave}波`, cx, baseY + 110);

  // Gold earned this run
  if (data.runGold > 0) {
    ctx.fillStyle = "#f5d57e";
    ctx.font = `700 20px ${UI_FONT}`;
    ctx.shadowColor = "rgba(245,213,126,0.5)";
    ctx.shadowBlur = 10;
    ctx.fillText(
      `🪙 +${data.runGold}${data.victory ? " (2倍!)" : ""}`,
      cx,
      baseY + 150,
    );
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(245,213,126,0.6)";
    ctx.font = `500 13px ${UI_FONT}`;
    ctx.fillText(`(合計: ${data.totalGold.toLocaleString()})`, cx, baseY + 172);
  }

  // Nearest achievement progress bar
  if (data.nearestAchievement) {
    const ach = data.nearestAchievement;
    const barW = 200;
    const barH = 14;
    const barX = cx - barW / 2;
    const barY = baseY + 196;
    // Label
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = `600 12px ${UI_FONT}`;
    ctx.fillText(`次: ${ach.name}`, cx, barY - 4);
    // Bar background
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.beginPath();
    ctx.roundRect(barX, barY + 4, barW, barH, 7);
    ctx.fill();
    // Bar fill
    const fillGrad = ctx.createLinearGradient(
      barX,
      0,
      barX + barW * ach.progress,
      0,
    );
    fillGrad.addColorStop(0, "#d8b45e");
    fillGrad.addColorStop(1, "#f5d57e");
    ctx.fillStyle = fillGrad;
    ctx.beginPath();
    ctx.roundRect(barX, barY + 4, barW * clamp(ach.progress, 0, 1), barH, 7);
    ctx.fill();
    // Percentage
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = `500 10px ${UI_FONT}`;
    ctx.fillText(`${Math.floor(ach.progress * 100)}%`, cx, barY + barH + 16);
  }

  const buttonGradient = ctx.createLinearGradient(
    RESTART_BUTTON.x,
    RESTART_BUTTON.y,
    RESTART_BUTTON.x + RESTART_BUTTON.width,
    RESTART_BUTTON.y,
  );
  buttonGradient.addColorStop(0, "#6f1417");
  buttonGradient.addColorStop(1, "#c6282a");
  ctx.fillStyle = buttonGradient;
  ctx.shadowColor = "rgba(207,46,47,0.4)";
  ctx.shadowBlur = 16;
  ctx.beginPath();
  ctx.roundRect(
    RESTART_BUTTON.x,
    RESTART_BUTTON.y,
    RESTART_BUTTON.width,
    RESTART_BUTTON.height,
    16,
  );
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(241,221,187,0.38)";
  ctx.beginPath();
  ctx.roundRect(
    RESTART_BUTTON.x,
    RESTART_BUTTON.y,
    RESTART_BUTTON.width,
    RESTART_BUTTON.height,
    16,
  );
  ctx.stroke();

  ctx.fillStyle = "#fff8eb";
  ctx.font = `700 18px ${UI_FONT}`;
  ctx.fillText("もう一度、斬る", cx, RESTART_BUTTON.y + 35);
  ctx.restore();
}

// Post-processing: vignette overlay for atmosphere
export function drawVignette(ctx: CanvasRenderingContext2D, intensity = 0.45) {
  const cx = CANVAS_WIDTH / 2;
  const cy = CANVAS_HEIGHT / 2;
  const maxR = Math.hypot(cx, cy);
  const grad = ctx.createRadialGradient(cx, cy, maxR * 0.35, cx, cy, maxR);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(0.6, "rgba(0,0,0,0)");
  grad.addColorStop(1, `rgba(0,0,0,${intensity})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

// Draw floating dust/ember particles in the background
export function drawEmbers(
  ctx: CanvasRenderingContext2D,
  cameraX: number,
  cameraY: number,
  time: number,
) {
  ctx.save();
  for (let i = 0; i < 20; i++) {
    const seed = i * 137.508;
    const x =
      ((seed * 7.3 + time * (8 + i * 0.5) - cameraX * 0.05) %
        (CANVAS_WIDTH + 60)) -
      30;
    const y =
      ((seed * 3.7 + Math.sin(time * 0.5 + i) * 40 - cameraY * 0.03) %
        (CANVAS_HEIGHT + 40)) -
      20;
    const size = 1 + (i % 3) * 0.5;
    const alpha = 0.15 + Math.sin(time * 2 + i * 0.8) * 0.1;
    const isRed = i % 4 === 0;
    ctx.fillStyle = isRed
      ? `rgba(207,80,60,${alpha})`
      : `rgba(216,180,94,${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
