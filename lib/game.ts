"use client";

import { GameAudio } from "./audio";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  RESTART_BUTTON,
  REROLL_BUTTON,
  UPGRADE_CARD,
  drawAfterimage,
  drawAimGuide,
  drawBackground,
  drawEmbers,
  drawEnemy,
  drawHazard,
  drawFlamePatch,
  drawGameOver,
  drawHud,
  drawLightning,
  drawOrb,
  drawParticle,
  drawPlayer,
  drawProjectile,
  drawRewardBanner,
  drawScroll,
  drawScreenFlash,
  drawShuriken,
  drawShockwave,
  drawSlashEffect,
  drawUpgradeOverlay,
  drawVignette,
} from "./renderer";

export const GAME_WIDTH = CANVAS_WIDTH;
export const GAME_HEIGHT = CANVAS_HEIGHT;

type V = { x: number; y: number };
type EnemyKind = "oni" | "kappa" | "tengu" | "yurei" | "boss";
type SkillKey = "lightning" | "fire" | "shadow" | "wind" | "kunai";
type Player = {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  level: number;
  xp: number;
  xpToNext: number;
  killCount: number;
  invulnerable: number;
  dashCooldown: number;
  dashDamage: number;
  dashDistance: number;
  magnetRadius: number;
  shurikenCount: number;
  shurikenDamage: number;
  shurikenRadius: number;
  rerolls: number;
  ultimate: number;
};
type Dash = {
  from: V;
  to: V;
  dir: V;
  progress: number;
  hits: Set<number>;
  hitCount: number;
  ultimate: boolean;
};
type Enemy = {
  id: number;
  kind: EnemyKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  radius: number;
  speed: number;
  damage: number;
  xp: number;
  hit: number;
  orbit: number;
  seed: number;
  primary: string;
  secondary: string;
  elite: boolean;
  rank: number;
  attackTimer: number;
  scrollDrop: boolean;
  buffed: number;
};
type Projectile = {
  id: number;
  kind: "kunai" | "wind";
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  life: number;
  maxLife: number;
  pierce: number;
  homing: number;
  color: string;
  hits: Set<number>;
  ignite: boolean;
};
type Flame = {
  id: number;
  x: number;
  y: number;
  radius: number;
  damage: number;
  life: number;
  maxLife: number;
  tick: number;
};
type Orb = { id: number; x: number; y: number; value: number; magnet: boolean };
type ScrollKind = "storm" | "blood" | "shadow";
type Scroll = {
  id: number;
  kind: ScrollKind;
  x: number;
  y: number;
  radius: number;
  magnet: boolean;
  life: number;
  maxLife: number;
};
type Hazard = {
  id: number;
  x: number;
  y: number;
  radius: number;
  damage: number;
  telegraph: number;
  active: number;
  life: number;
  maxLife: number;
  color: string;
  hit: boolean;
};
type Slash = {
  id: number;
  x: number;
  y: number;
  angle: number;
  radius: number;
  span: number;
  color: string;
  life: number;
  maxLife: number;
};
type Bolt = { id: number; points: V[]; life: number; maxLife: number };
type Particle = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  glow: number;
  life: number;
  maxLife: number;
};
type Skill = { key: SkillKey; level: number; timer: number };
type Upgrade = {
  id: string;
  title: string;
  desc: string;
  icon: string;
  weight: number;
  kind: "新術" | "強化" | "機動" | "生存" | "補助";
  rarity: "COMMON" | "RARE" | "EPIC";
  current?: string;
  next?: string;
  kicker?: string;
  apply: (g: NinjaSurvivors) => void;
};
type Afterimage = {
  id: number;
  x: number;
  y: number;
  angle: number;
  life: number;
  maxLife: number;
};
type Shockwave = {
  id: number;
  x: number;
  y: number;
  radius: number;
  growth: number;
  color: string;
  life: number;
  maxLife: number;
};
type RewardBanner = {
  title: string;
  subtitle: string;
  color: string;
  life: number;
  maxLife: number;
};

const PLAYER_RADIUS = 15;
const DASH_DURATION = 0.13;
const DASH_COOLDOWN = 0.19;
const DASH_PULL_MIN = 22;
const WAVE_SECONDS = 18;
const UPGRADE_GUARD = 0.7;
const MAX_ENEMIES = 120;
const BASE_XP = 14;
const ULTIMATE_MAX = 100;

const ENEMY_DEF: Record<
  EnemyKind,
  {
    cost: number;
    hp: number;
    speed: number;
    damage: number;
    radius: number;
    xp: number;
    primary: string;
    secondary: string;
  }
> = {
  oni: {
    cost: 1,
    hp: 40,
    speed: 42,
    damage: 18,
    radius: 16,
    xp: 1,
    primary: "#cf2e2f",
    secondary: "#5d1115",
  },
  kappa: {
    cost: 1.1,
    hp: 28,
    speed: 72,
    damage: 13,
    radius: 13,
    xp: 1,
    primary: "#5cab56",
    secondary: "#244e2a",
  },
  tengu: {
    cost: 1.5,
    hp: 60,
    speed: 38,
    damage: 22,
    radius: 18,
    xp: 2,
    primary: "#b96a31",
    secondary: "#5c2416",
  },
  yurei: {
    cost: 0.95,
    hp: 24,
    speed: 54,
    damage: 11,
    radius: 14,
    xp: 1,
    primary: "#d9dde4",
    secondary: "#76808c",
  },
  boss: {
    cost: 6,
    hp: 780,
    speed: 24,
    damage: 28,
    radius: 34,
    xp: 28,
    primary: "#e2473e",
    secondary: "#611417",
  },
};
const SKILL_DEF: Record<
  SkillKey,
  { name: string; icon: string; color: string; cooldown: number }
> = {
  lightning: { name: "雷遁", icon: "雷", color: "#f5d57e", cooldown: 1.85 },
  fire: { name: "火遁", icon: "火", color: "#ef7d32", cooldown: 0 },
  shadow: { name: "影分身", icon: "影", color: "#a39bbd", cooldown: 3.9 },
  wind: { name: "風遁", icon: "風", color: "#87ddd9", cooldown: 1.2 },
  kunai: { name: "クナイ", icon: "刃", color: "#f5efe3", cooldown: 1.45 },
};

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const dist = (a: V, b: V) => Math.hypot(a.x - b.x, a.y - b.y);
const norm = (v: V) => {
  const m = Math.hypot(v.x, v.y) || 1;
  return { x: v.x / m, y: v.y / m };
};
const segDist = (p: V, a: V, b: V) => {
  const ab = { x: b.x - a.x, y: b.y - a.y };
  const ap = { x: p.x - a.x, y: p.y - a.y };
  const t = clamp(
    (ap.x * ab.x + ap.y * ab.y) / (ab.x * ab.x + ab.y * ab.y || 1),
    0,
    1,
  );
  return dist(p, { x: a.x + ab.x * t, y: a.y + ab.y * t });
};
const rand = (min: number, max: number) => min + Math.random() * (max - min);

export class NinjaSurvivors {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private audio = new GameAudio();
  private frame = 0;
  private last = 0;
  private dead = false;
  private id = 1;
  private player = this.makePlayer();
  private dash: Dash | null = null;
  private aimStart: V | null = null;
  private aimCurrent: V | null = null;
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private flames: Flame[] = [];
  private orbs: Orb[] = [];
  private scrolls: Scroll[] = [];
  private hazards: Hazard[] = [];
  private slashes: Slash[] = [];
  private bolts: Bolt[] = [];
  private particles: Particle[] = [];
  private afterimages: Afterimage[] = [];
  private shockwaves: Shockwave[] = [];
  private skills: Skill[] = [];
  private shurikenAngle = 0;
  private time = 0;
  private wave = 1;
  private spawnTimer = 0.4;
  private nextBossAt = 65;
  private bossWarning = 0;
  private trauma = 0;
  private freeze = 0;
  private hintTimer = 12;
  private fireTrailTimer = 0;
  private screenFlash = 0;
  private rewardBanner: RewardBanner | null = null;
  private upgrades: Upgrade[] | null = null;
  private unlockedSynergies = new Set<string>();
  private upgradeGuard = 0;
  private queuedLevelUps = 0;
  private paused = false;
  private manualPause = false;
  private gameOver = false;
  private lastTapTime = 0;
  private lastTapPos: V = { x: 0, y: 0 };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    this.openingParticles();
  }

  start() {
    this.frame = requestAnimationFrame((t) => this.loop(t));
  }

  destroy() {
    this.dead = true;
    cancelAnimationFrame(this.frame);
    this.audio.destroy();
  }

  resumeAudio() {
    void this.audio.unlock();
  }

  onTouchStart(x: number, y: number) {
    this.resumeAudio();
    // Pause button: top-right 50x50 area
    if (!this.gameOver && !this.upgrades && x >= CANVAS_WIDTH - 50 && y <= 50) {
      this.togglePause();
      return;
    }
    // Unpause by tapping anywhere
    if (this.manualPause) {
      this.manualPause = false;
      return;
    }
    if (this.gameOver || this.upgrades) return;
    // Double-tap detection for ultimate
    const now = performance.now();
    const dt = now - this.lastTapTime;
    const tapDist = Math.hypot(x - this.lastTapPos.x, y - this.lastTapPos.y);
    if (dt < 350 && tapDist < 60 && this.player.ultimate >= ULTIMATE_MAX) {
      this.castUltimate();
      this.lastTapTime = 0;
      return;
    }
    this.lastTapTime = now;
    this.lastTapPos = { x, y };
    this.aimStart = { x, y };
    this.aimCurrent = { x, y };
  }

  onTouchMove(x: number, y: number) {
    if (!this.aimStart) return;
    this.aimCurrent = { x, y };
  }

  cancelTouch() {
    this.aimStart = null;
    this.aimCurrent = null;
  }

  onTouchEnd(x: number, y: number) {
    if (!this.aimStart || this.gameOver || this.upgrades) {
      this.cancelTouch();
      return;
    }
    const dx = x - this.aimStart.x;
    const dy = y - this.aimStart.y;
    if (Math.hypot(dx, dy) >= DASH_PULL_MIN)
      this.startDash(norm({ x: -dx, y: -dy }));
    this.cancelTouch();
  }

  handleTap(x: number, y: number) {
    if (this.gameOver) {
      if (
        x >= RESTART_BUTTON.x &&
        x <= RESTART_BUTTON.x + RESTART_BUTTON.width &&
        y >= RESTART_BUTTON.y &&
        y <= RESTART_BUTTON.y + RESTART_BUTTON.height
      ) {
        this.restart();
        return true;
      }
      return false;
    }
    if (this.upgrades && this.upgradeGuard <= 0) {
      if (
        x >= REROLL_BUTTON.x &&
        x <= REROLL_BUTTON.x + REROLL_BUTTON.width &&
        y >= REROLL_BUTTON.y &&
        y <= REROLL_BUTTON.y + REROLL_BUTTON.height
      ) {
        this.rerollUpgrades();
        return true;
      }
      for (let i = 0; i < this.upgrades.length; i += 1) {
        const top =
          UPGRADE_CARD.y + i * (UPGRADE_CARD.height + UPGRADE_CARD.gap);
        if (
          x >= UPGRADE_CARD.x &&
          x <= UPGRADE_CARD.x + UPGRADE_CARD.width &&
          y >= top &&
          y <= top + UPGRADE_CARD.height
        ) {
          this.pickUpgrade(i);
          return true;
        }
      }
    }
    return false;
  }

  private makePlayer(): Player {
    return {
      x: 0,
      y: 0,
      hp: 120,
      maxHp: 120,
      level: 1,
      xp: 0,
      xpToNext: BASE_XP,
      killCount: 0,
      invulnerable: 0,
      dashCooldown: 0,
      dashDamage: 38,
      dashDistance: 138,
      magnetRadius: 72,
      shurikenCount: 2,
      shurikenDamage: 12,
      shurikenRadius: 54,
      rerolls: 2,
      ultimate: 0,
    };
  }

  private loop(t: number) {
    if (this.dead) return;
    const dt = this.last ? Math.min((t - this.last) / 1000, 0.05) : 1 / 60;
    this.last = t;
    this.update(dt);
    this.render();
    this.frame = requestAnimationFrame((n) => this.loop(n));
  }

  private update(dt: number) {
    this.audio.setIntensity(
      clamp(
        (this.enemies.length / 42 +
          this.wave / 12 +
          (this.hasBoss() ? 0.55 : 0)) /
          2,
        0,
        1,
      ),
    );
    this.bossWarning = Math.max(0, this.bossWarning - dt);
    if (!this.gameOver) this.hintTimer = Math.max(0, this.hintTimer - dt);
    this.updateFx(dt);
    if (this.gameOver) return;
    if (this.manualPause) return;
    if (this.paused) {
      this.upgradeGuard = Math.max(0, this.upgradeGuard - dt);
      return;
    }
    this.freeze = Math.max(0, this.freeze - dt);
    const sdt = this.freeze > 0 ? dt * 0.22 : dt;
    this.time += sdt;
    this.wave = 1 + Math.floor(this.time / WAVE_SECONDS);
    this.player.invulnerable = Math.max(0, this.player.invulnerable - sdt);
    this.player.dashCooldown = Math.max(0, this.player.dashCooldown - sdt);
    this.updateDash(sdt);
    this.updateShuriken(sdt);
    this.updateSkills(sdt);
    this.updateProjectiles(sdt);
    this.updateFlames(sdt);
    this.updateHazards(sdt);
    this.updateEnemyAuras();
    this.updateEnemies(sdt);
    this.updateScrolls(sdt);
    this.updateOrbs(sdt);
    this.spawn(sdt);
    this.maybeBoss();
    if (this.player.hp <= 0) {
      this.player.hp = 0;
      this.gameOver = true;
      this.audio.playGameOver();
    }
  }

  private updateDash(dt: number) {
    if (!this.dash) return;
    const prev = { x: this.player.x, y: this.player.y };
    this.dash.progress = clamp(this.dash.progress + dt / DASH_DURATION, 0, 1);
    const eased = 1 - (1 - this.dash.progress) ** 3;
    this.player.x = lerp(this.dash.from.x, this.dash.to.x, eased);
    this.player.y = lerp(this.dash.from.y, this.dash.to.y, eased);
    this.player.invulnerable = Math.max(this.player.invulnerable, 0.08);
    this.afterimages.push({
      id: this.next(),
      x: this.player.x,
      y: this.player.y,
      angle: Math.atan2(this.dash.dir.y, this.dash.dir.x),
      life: 0.16,
      maxLife: 0.16,
    });
    this.slashes.push({
      id: this.next(),
      x: this.player.x - this.dash.dir.x * 18,
      y: this.player.y - this.dash.dir.y * 18,
      angle: Math.atan2(this.dash.dir.y, this.dash.dir.x),
      radius: 20 + Math.random() * 8,
      span: 0.55,
      color: "rgba(207,46,47,0.85)",
      life: 0.12,
      maxLife: 0.12,
    });
    const fireLv = this.skillLevel("fire");
    if (fireLv > 0) {
      this.fireTrailTimer -= dt;
      if (this.fireTrailTimer <= 0) {
        this.flames.push({
          id: this.next(),
          x: this.player.x,
          y: this.player.y,
          radius: 16 + fireLv * 3,
          damage: 6 + fireLv * 3.5,
          life: 0.62 + fireLv * 0.08,
          maxLife: 0.62 + fireLv * 0.08,
          tick: 0.04,
        });
        this.fireTrailTimer = 0.022;
      }
    }
    for (const e of this.enemies) {
      if (
        this.dash.hits.has(e.id) ||
        segDist(e, prev, this.player) > e.radius + PLAYER_RADIUS + 8
      )
        continue;
      this.dash.hits.add(e.id);
      this.dash.hitCount += 1;
      e.hp -=
        (this.player.dashDamage + this.player.level * 2.2) *
        (this.dash.ultimate ? 2.75 : 1);
      e.hit = 0.16;
      const push = norm({ x: e.x - this.player.x, y: e.y - this.player.y });
      e.vx += push.x * 120;
      e.vy += push.y * 120;
      this.trauma = Math.min(1, this.trauma + 0.08);
      this.freeze = Math.max(this.freeze, 0.03);
      this.screenFlash = Math.max(this.screenFlash, 0.08);
      this.shockwaves.push({
        id: this.next(),
        x: e.x,
        y: e.y,
        radius: this.dash.ultimate ? 24 : 18,
        growth: this.dash.ultimate ? 170 : 120,
        color: this.dash.ultimate
          ? "rgba(245,213,126,0.86)"
          : "rgba(255,246,234,0.75)",
        life: this.dash.ultimate ? 0.24 : 0.18,
        maxLife: this.dash.ultimate ? 0.24 : 0.18,
      });
      this.impact(
        e.x,
        e.y,
        this.dash.ultimate ? "#f5d57e" : "#fff6ea",
        this.dash.ultimate ? 9 : 5,
        this.dash.ultimate ? 220 : 140,
      );
      this.gainUltimate(e.kind === "boss" ? 16 : e.elite ? 9 : 4);
    }
    if (this.dash.progress >= 1) {
      const hitCount = this.dash.hitCount;
      const wasUltimate = this.dash.ultimate;
      if (fireLv > 0) {
        this.audio.playSkill("fire");
        for (let i = 0; i < 4 + fireLv; i += 1) {
          const a = (Math.PI * 2 * i) / (4 + fireLv);
          this.flames.push({
            id: this.next(),
            x: this.player.x + Math.cos(a) * 14,
            y: this.player.y + Math.sin(a) * 14,
            radius: 16 + fireLv * 3,
            damage: 6 + fireLv * 3.5,
            life: 0.62 + fireLv * 0.08,
            maxLife: 0.62 + fireLv * 0.08,
            tick: 0.04,
          });
        }
      }
      this.dash = null;
      this.player.dashCooldown =
        DASH_COOLDOWN + (hitCount === 0 ? 0.1 : 0) + (wasUltimate ? 0.04 : 0);
      this.fireTrailTimer = 0;
      if (hitCount === 0) this.screenFlash = Math.max(this.screenFlash, 0.05);
      if (hitCount >= 4) this.gainUltimate(8 + Math.min(10, hitCount));
      if (wasUltimate) this.resolveUltimateSlash(hitCount);
    }
  }

  private updateShuriken(dt: number) {
    this.shurikenAngle += dt * (3.1 + this.player.shurikenCount * 0.12);
    for (const e of this.enemies) e.orbit = Math.max(0, e.orbit - dt);
    for (let i = 0; i < this.player.shurikenCount; i += 1) {
      const a =
        this.shurikenAngle + (Math.PI * 2 * i) / this.player.shurikenCount;
      const p = {
        x: this.player.x + Math.cos(a) * this.player.shurikenRadius,
        y: this.player.y + Math.sin(a) * this.player.shurikenRadius,
      };
      for (const e of this.enemies) {
        if (e.orbit > 0 || dist(p, e) > e.radius + 10) continue;
        e.hp -= this.player.shurikenDamage;
        e.hit = 0.1;
        e.orbit = 0.14;
        e.vx += Math.cos(a) * 36;
        e.vy += Math.sin(a) * 36;
        this.impact(e.x, e.y, "#f7f3e8", 3, 88);
        this.audio.playOrbitHit();
      }
    }
  }

  private updateSkills(dt: number) {
    for (const s of this.skills) {
      if (s.key === "fire") continue;
      s.timer -= dt;
      if (s.timer > 0) continue;
      if (s.key === "lightning") this.castLightning(s.level);
      if (s.key === "shadow") this.castShadow(s.level);
      if (s.key === "wind") this.castWind(s.level);
      if (s.key === "kunai") this.castKunai(s.level);
      s.timer = this.skillCooldown(s.key, s.level);
    }
  }

  private castLightning(level: number) {
    const shadowLv = this.skillLevel("shadow");
    const targets = this.enemies
      .map((e) => ({ e, d: dist(e, this.player) }))
      .filter((x) => x.d <= 220 + level * 32)
      .sort((a, b) => a.d - b.d)
      .slice(0, 1 + level);
    if (!targets.length) return;
    this.audio.playSkill("lightning");
    this.screenFlash = Math.max(this.screenFlash, 0.16);
    for (const { e } of targets) {
      e.hp -= 20 + level * 14;
      e.hit = 0.14;
      const points: V[] = [this.player];
      for (let i = 1; i < 4; i += 1) {
        const t = i / 4;
        const wave = (Math.random() - 0.5) * 26;
        points.push({
          x: lerp(this.player.x, e.x, t) + wave,
          y: lerp(this.player.y, e.y, t) - wave * 0.35,
        });
      }
      points.push({ x: e.x, y: e.y });
      this.bolts.push({ id: this.next(), points, life: 0.18, maxLife: 0.18 });
      this.shockwaves.push({
        id: this.next(),
        x: e.x,
        y: e.y,
        radius: 12,
        growth: 130,
        color: "rgba(245,213,126,0.85)",
        life: 0.16,
        maxLife: 0.16,
      });
      this.impact(e.x, e.y, "#f5d57e", 4, 120);
      if (shadowLv > 0) {
        this.slashes.push({
          id: this.next(),
          x: e.x,
          y: e.y,
          angle: Math.random() * Math.PI * 2,
          radius: 46 + shadowLv * 8,
          span: 0.74,
          color: "rgba(163,155,189,0.8)",
          life: 0.18,
          maxLife: 0.18,
        });
        e.hp -= 8 + shadowLv * 6;
      }
    }
  }

  private castShadow(level: number) {
    if (!this.enemies.length) return;
    this.audio.playSkill("shadow");
    const slashes = 1 + Math.floor((level + 1) / 2);
    for (let i = 0; i < slashes; i += 1) {
      const t = this.enemies[Math.floor(Math.random() * this.enemies.length)];
      const a = Math.random() * Math.PI * 2;
      const reach = 86 + level * 18;
      const start = {
        x: t.x - Math.cos(a) * reach,
        y: t.y - Math.sin(a) * reach,
      };
      const end = {
        x: t.x + Math.cos(a) * reach,
        y: t.y + Math.sin(a) * reach,
      };
      // Shadow clone afterimage
      this.afterimages.push({ id: this.next(), x: start.x, y: start.y, angle: a, life: 0.4, maxLife: 0.4 });
      // Primary + secondary slash arcs
      this.slashes.push({ id: this.next(), x: t.x, y: t.y, angle: a, radius: reach * 0.7, span: 1.1, color: "rgba(180,160,220,0.9)", life: 0.32, maxLife: 0.32 });
      this.slashes.push({ id: this.next(), x: t.x, y: t.y, angle: a + Math.PI, radius: reach * 0.5, span: 0.7, color: "rgba(140,120,190,0.65)", life: 0.25, maxLife: 0.25 });
      // Shockwave at impact
      this.shockwaves.push({ id: this.next(), x: t.x, y: t.y, radius: 12, growth: 120, color: "rgba(163,155,189,0.7)", life: 0.2, maxLife: 0.2 });
      for (const e of this.enemies)
        if (segDist(e, start, end) <= e.radius + 14) {
          e.hp -= 28 + level * 18;
          e.hit = 0.18;
        }
      this.impact(t.x, t.y, "#b0a3ce", 8, 170);
      // Trail particles
      for (let p = 0; p < 5; p++) {
        const pt = p / 4;
        const px = lerp(start.x, end.x, pt);
        const py = lerp(start.y, end.y, pt);
        const life = rand(0.15, 0.3);
        this.particles.push({ id: this.next(), x: px, y: py, vx: rand(-30, 30), vy: rand(-30, 30), size: rand(2, 4), color: "#c4b8e0", glow: 8, life, maxLife: life });
      }
    }
  }

  private castWind(level: number) {
    if (!this.enemies.length) return;
    this.audio.playSkill("wind");
    const fireLv = this.skillLevel("fire");
    const targets = this.enemies
      .map((e) => ({ e, d: dist(e, this.player) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 1 + Math.ceil(level / 2));
    targets.forEach(({ e }, i) => {
      const dir = norm({ x: e.x - this.player.x, y: e.y - this.player.y });
      const fan = (i - (targets.length - 1) / 2) * 0.18;
      const rotated = {
        x: dir.x * Math.cos(fan) - dir.y * Math.sin(fan),
        y: dir.x * Math.sin(fan) + dir.y * Math.cos(fan),
      };
      this.projectiles.push({
        id: this.next(),
        kind: "wind",
        x: this.player.x + rotated.x * 18,
        y: this.player.y + rotated.y * 18,
        vx: rotated.x * 260,
        vy: rotated.y * 260,
        radius: 7,
        damage: 14 + level * 7,
        life: 1.5,
        maxLife: 1.5,
        pierce: 1 + Math.floor(level / 3),
        homing: 250 + level * 80,
        color: "#87ddd9",
        hits: new Set<number>(),
        ignite: fireLv > 0,
      });
    });
  }

  private castKunai(level: number) {
    const target = this.closest(this.player);
    if (!target) return;
    this.audio.playSkill("kunai");
    const shots = 2 + level;
    const spread = Math.min(0.7, 0.18 + shots * 0.05);
    const base = Math.atan2(target.y - this.player.y, target.x - this.player.x);
    for (let i = 0; i < shots; i += 1) {
      const t = shots === 1 ? 0.5 : i / (shots - 1);
      const a = base + lerp(-spread, spread, t);
      this.projectiles.push({
        id: this.next(),
        kind: "kunai",
        x: this.player.x + Math.cos(a) * 14,
        y: this.player.y + Math.sin(a) * 14,
        vx: Math.cos(a) * 340,
        vy: Math.sin(a) * 340,
        radius: 6,
        damage: 18 + level * 7,
        life: 1.05,
        maxLife: 1.05,
        pierce: level >= 4 ? 2 : 1,
        homing: 0,
        color: "#f5efe3",
        hits: new Set<number>(),
        ignite: false,
      });
    }
  }

  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i -= 1) {
      const p = this.projectiles[i];
      if (p.kind === "wind") {
        const t = this.closest(p);
        if (t) {
          const dir = norm({ x: t.x - p.x, y: t.y - p.y });
          p.vx += dir.x * p.homing * dt;
          p.vy += dir.y * p.homing * dt;
          const speed = Math.hypot(p.vx, p.vy) || 1;
          const keep = 250 + p.homing * 0.08;
          p.vx = (p.vx / speed) * keep;
          p.vy = (p.vy / speed) * keep;
        }
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.projectiles.splice(i, 1);
        continue;
      }
      for (const e of this.enemies) {
        if (p.hits.has(e.id) || dist(p, e) > p.radius + e.radius) continue;
        p.hits.add(e.id);
        e.hp -= p.damage;
        e.hit = 0.14;
        this.impact(e.x, e.y, p.color, 4, 110);
        if (p.kind === "wind" && p.ignite) {
          this.flames.push({
            id: this.next(),
            x: e.x,
            y: e.y,
            radius: 18 + this.skillLevel("fire") * 3,
            damage: 5 + this.skillLevel("fire") * 3,
            life: 0.7,
            maxLife: 0.7,
            tick: 0.05,
          });
        }
        if (p.kind === "kunai" && this.skillLevel("lightning") > 0) {
          this.chainSpark(
            e.id,
            { x: e.x, y: e.y },
            8 + this.skillLevel("lightning") * 4,
          );
        }
        p.pierce -= 1;
        if (p.pierce <= 0) {
          this.projectiles.splice(i, 1);
          break;
        }
      }
    }
  }

  private updateFlames(dt: number) {
    for (let i = this.flames.length - 1; i >= 0; i -= 1) {
      const f = this.flames[i];
      f.life -= dt;
      f.tick -= dt;
      if (f.tick <= 0) {
        f.tick = 0.09;
        for (const e of this.enemies)
          if (dist(f, e) <= f.radius + e.radius) {
            e.hp -= f.damage;
            e.hit = 0.06;
          }
      }
      if (f.life <= 0) this.flames.splice(i, 1);
    }
  }

  private updateEnemies(dt: number) {
    for (let i = this.enemies.length - 1; i >= 0; i -= 1) {
      const e = this.enemies[i];
      e.hit = Math.max(0, e.hit - dt);
      if (e.kind === "boss") this.updateBossEnemy(e, dt);
      const toPlayer = { x: this.player.x - e.x, y: this.player.y - e.y };
      const d = Math.max(1, Math.hypot(toPlayer.x, toPlayer.y));
      const dir = { x: toPlayer.x / d, y: toPlayer.y / d };
      const side = { x: -dir.y, y: dir.x };
      let move = { x: dir.x, y: dir.y };
      if (e.kind === "kappa") {
        const sway = Math.sin(this.time * 6 + e.seed) * 0.55;
        move.x += side.x * sway;
        move.y += side.y * sway;
      } else if (e.kind === "tengu") {
        const bias = d < 160 ? -0.8 : 0.6;
        const sway = Math.sin(this.time * 3 + e.seed) * 0.4;
        move.x += dir.x * bias + side.x * sway;
        move.y += dir.y * bias + side.y * sway;
      } else if (e.kind === "yurei") {
        const drift = Math.sin(this.time * 2.8 + e.seed) * 0.3;
        move.x += side.x * drift;
        move.y += side.y * drift;
      }
      move = norm(move);
      const speedScale = 1 + e.buffed;
      e.vx = lerp(e.vx, move.x * e.speed * speedScale, dt * 4);
      e.vy = lerp(e.vy, move.y * e.speed * speedScale, dt * 4);
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      if (
        !this.dash &&
        this.player.invulnerable <= 0 &&
        d <= e.radius + PLAYER_RADIUS
      ) {
        const pressure = e.elite ? 1.15 : 1;
        this.player.hp -= e.damage * dt * pressure * (1 + e.buffed * 1.25);
        this.trauma = Math.min(1, this.trauma + 0.03);
        if (Math.random() < 0.12)
          this.impact(this.player.x, this.player.y, "#ff8a7c", 2, 65);
      }
      if (e.hp <= 0) this.killEnemy(i);
    }
    if (this.enemies.length > MAX_ENEMIES) {
      this.enemies.sort((a, b) => dist(a, this.player) - dist(b, this.player));
      this.enemies.length = MAX_ENEMIES;
    }
  }

  private killEnemy(i: number) {
    const e = this.enemies[i];
    this.enemies.splice(i, 1);
    this.player.killCount += 1;
    this.trauma = Math.min(
      1,
      this.trauma + (e.kind === "boss" ? 0.24 : e.elite ? 0.14 : 0.08),
    );
    this.screenFlash = Math.max(
      this.screenFlash,
      e.kind === "boss" ? 0.22 : e.elite ? 0.1 : 0.06,
    );
    this.shockwaves.push({
      id: this.next(),
      x: e.x,
      y: e.y,
      radius: e.kind === "boss" ? 28 : e.elite ? 20 : 14,
      growth: e.kind === "boss" ? 220 : e.elite ? 180 : 140,
      color:
        e.kind === "boss"
          ? "rgba(226,71,62,0.9)"
          : e.elite
            ? "rgba(245,213,126,0.9)"
            : "rgba(216,180,94,0.7)",
      life: e.kind === "boss" ? 0.32 : e.elite ? 0.26 : 0.2,
      maxLife: e.kind === "boss" ? 0.32 : e.elite ? 0.26 : 0.2,
    });
    this.impact(
      e.x,
      e.y,
      e.primary,
      e.kind === "boss" ? 18 : e.elite ? 14 : 10,
      e.kind === "boss" ? 230 : e.elite ? 190 : 160,
    );
    this.gainUltimate(e.kind === "boss" ? 24 : e.elite ? 10 : 1.8);
    let xp = e.xp;
    while (xp > 0) {
      const value = xp >= 6 ? 3 : xp >= 3 ? 2 : 1;
      xp -= value;
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * 16;
      this.orbs.push({
        id: this.next(),
        x: e.x + Math.cos(a) * r,
        y: e.y + Math.sin(a) * r,
        value,
        magnet: false,
      });
    }
    if (e.scrollDrop)
      this.dropScroll(
        e.x,
        e.y,
        e.kind === "boss" ? undefined : this.rollScrollKind(),
      );
    this.audio.playKill();
  }

  private updateOrbs(dt: number) {
    for (let i = this.orbs.length - 1; i >= 0; i -= 1) {
      const o = this.orbs[i];
      const d = dist(o, this.player);
      if (d <= this.player.magnetRadius || o.magnet) {
        o.magnet = true;
        const dir = norm({ x: this.player.x - o.x, y: this.player.y - o.y });
        const speed = 180 + clamp(this.player.magnetRadius, 0, 180) * 1.5;
        o.x += dir.x * speed * dt;
        o.y += dir.y * speed * dt;
      }
      if (d <= 16) {
        this.player.xp += o.value;
        this.orbs.splice(i, 1);
        this.audio.playPickup();
        while (this.player.xp >= this.player.xpToNext) {
          this.player.xp -= this.player.xpToNext;
          this.player.level += 1;
          this.player.xpToNext = Math.floor(
            BASE_XP + Math.pow(this.player.level, 1.28) * 11,
          );
          this.queuedLevelUps += 1;
          if (this.player.level % 5 === 0) this.player.rerolls += 1;
          this.audio.playLevelUp();
          this.screenFlash = Math.max(this.screenFlash, 0.18);
          this.shockwaves.push({
            id: this.next(),
            x: this.player.x,
            y: this.player.y,
            radius: 34,
            growth: 170,
            color: "rgba(216,180,94,0.9)",
            life: 0.34,
            maxLife: 0.34,
          });
        }
        if (this.queuedLevelUps > 0 && !this.upgrades) {
          this.paused = true;
          this.upgrades = this.rollUpgrades();
          this.upgradeGuard = UPGRADE_GUARD;
        }
      }
    }
  }

  private updateScrolls(dt: number) {
    for (let i = this.scrolls.length - 1; i >= 0; i -= 1) {
      const scroll = this.scrolls[i];
      scroll.life -= dt;
      const d = dist(scroll, this.player);
      if (d <= this.player.magnetRadius * 0.7 || scroll.magnet) {
        scroll.magnet = true;
        const dir = norm({
          x: this.player.x - scroll.x,
          y: this.player.y - scroll.y,
        });
        const speed = 150 + this.player.magnetRadius * 1.2;
        scroll.x += dir.x * speed * dt;
        scroll.y += dir.y * speed * dt;
      }
      if (d <= scroll.radius + PLAYER_RADIUS + 4) {
        this.collectScroll(scroll);
        this.scrolls.splice(i, 1);
        continue;
      }
      if (scroll.life <= 0) this.scrolls.splice(i, 1);
    }
  }

  private updateHazards(dt: number) {
    for (let i = this.hazards.length - 1; i >= 0; i -= 1) {
      const hazard = this.hazards[i];
      hazard.life -= dt;
      const activeWindow = hazard.life <= hazard.active;
      if (
        activeWindow &&
        !hazard.hit &&
        !this.dash &&
        this.player.invulnerable <= 0 &&
        dist(hazard, this.player) <= hazard.radius + PLAYER_RADIUS
      ) {
        hazard.hit = true;
        this.player.hp -= hazard.damage;
        this.freeze = Math.max(this.freeze, 0.03);
        this.trauma = Math.min(1, this.trauma + 0.14);
        this.screenFlash = Math.max(this.screenFlash, 0.12);
        this.impact(this.player.x, this.player.y, "#ffb09c", 7, 180);
      }
      if (hazard.life <= 0) this.hazards.splice(i, 1);
    }
  }

  private updateEnemyAuras() {
    for (const enemy of this.enemies) enemy.buffed = 0;
    for (const source of this.enemies) {
      if (!source.elite && source.kind !== "boss") continue;
      const auraRadius = source.kind === "boss" ? 156 : 124;
      const auraStrength = source.kind === "boss" ? 0.34 : 0.22;
      for (const enemy of this.enemies) {
        if (enemy.id === source.id || enemy.kind === "boss") continue;
        if (dist(enemy, source) <= auraRadius) {
          enemy.buffed = Math.max(enemy.buffed, auraStrength);
        }
      }
    }
  }

  private updateBossEnemy(enemy: Enemy, dt: number) {
    enemy.attackTimer -= dt;
    if (enemy.attackTimer > 0) return;
    const rank = Math.max(1, enemy.rank);
    const attackRoll = Math.random();
    if (attackRoll < 0.46) {
      this.spawnHazard(
        enemy.x,
        enemy.y,
        90 + rank * 8,
        0.78,
        0.18,
        16 + rank * 3.8,
        "rgba(226,71,62,0.92)",
      );
    } else if (attackRoll < 0.82) {
      const markers = 1 + Math.floor(rank / 4);
      for (let i = 0; i < markers; i += 1) {
        const fan = markers === 1 ? 0 : (i - (markers - 1) / 2) * 34;
        const dir = norm({
          x: enemy.x - this.player.x,
          y: enemy.y - this.player.y,
        });
        const lateral = { x: -dir.y, y: dir.x };
        this.spawnHazard(
          this.player.x + lateral.x * fan,
          this.player.y + lateral.y * fan,
          38 + rank * 4,
          0.62,
          0.16,
          14 + rank * 3.2,
          "rgba(245,213,126,0.95)",
        );
      }
    } else {
      const summons = 2 + Math.floor(rank / 3);
      for (let i = 0; i < summons; i += 1) {
        const summonKind: EnemyKind =
          rank >= 5 && Math.random() < 0.35
            ? "tengu"
            : Math.random() < 0.45
              ? "oni"
              : "yurei";
        if (this.enemies.length < MAX_ENEMIES) this.spawnEnemy(summonKind);
      }
      this.screenFlash = Math.max(this.screenFlash, 0.08);
    }
    enemy.attackTimer = Math.max(1.9, 4.2 - rank * 0.14 + Math.random() * 0.6);
  }

  private spawnHazard(
    x: number,
    y: number,
    radius: number,
    telegraph: number,
    active: number,
    damage: number,
    color: string,
  ) {
    this.hazards.push({
      id: this.next(),
      x,
      y,
      radius,
      damage,
      telegraph,
      active,
      life: telegraph + active,
      maxLife: telegraph + active,
      color,
      hit: false,
    });
  }

  private dropScroll(x: number, y: number, kind = this.rollScrollKind()) {
    this.scrolls.push({
      id: this.next(),
      kind,
      x,
      y,
      radius: 12,
      magnet: false,
      life: 18,
      maxLife: 18,
    });
  }

  private rollScrollKind(): ScrollKind {
    const roll = Math.random();
    if (roll < 0.36) return "storm";
    if (roll < 0.69) return "blood";
    return "shadow";
  }

  private collectScroll(scroll: Scroll) {
    this.audio.playScroll(scroll.kind);
    this.screenFlash = Math.max(this.screenFlash, 0.16);
    this.shockwaves.push({
      id: this.next(),
      x: scroll.x,
      y: scroll.y,
      radius: 18,
      growth: 160,
      color:
        scroll.kind === "storm"
          ? "rgba(245,213,126,0.92)"
          : scroll.kind === "blood"
            ? "rgba(207,46,47,0.92)"
            : "rgba(163,155,189,0.95)",
      life: 0.22,
      maxLife: 0.22,
    });

    if (scroll.kind === "storm") {
      this.rewardBanner = {
        title: "雷の巻物",
        subtitle: "連鎖雷撃で奥義ゲージが満たされる",
        color: "rgba(245,213,126,1)",
        life: 1.1,
        maxLife: 1.1,
      };
      this.gainUltimate(40);
      this.castStormBurst(3 + Math.floor(this.wave / 3), 26 + this.wave * 2.4);
    } else if (scroll.kind === "blood") {
      this.rewardBanner = {
        title: "血の巻物",
        subtitle: "体力を回復し、防御を固める",
        color: "rgba(207,46,47,1)",
        life: 1.1,
        maxLife: 1.1,
      };
      this.player.maxHp += 6;
      this.player.hp = Math.min(
        this.player.maxHp,
        this.player.hp + this.player.maxHp * 0.24,
      );
      this.player.invulnerable = Math.max(this.player.invulnerable, 0.28);
    } else {
      this.rewardBanner = {
        title: "影の巻物",
        subtitle: "次のダッシュが必殺の一撃となる",
        color: "rgba(163,155,189,1)",
        life: 1.1,
        maxLife: 1.1,
      };
      this.gainUltimate(ULTIMATE_MAX);
    }
  }

  private castStormBurst(count: number, damage: number) {
    const targets = this.enemies
      .map((enemy) => ({ enemy, d: dist(enemy, this.player) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, count);
    for (const { enemy } of targets) {
      enemy.hp -= damage;
      enemy.hit = 0.16;
      const points: V[] = [this.player];
      for (let i = 1; i < 4; i += 1) {
        const t = i / 4;
        const wave = (Math.random() - 0.5) * 32;
        points.push({
          x: lerp(this.player.x, enemy.x, t) + wave,
          y: lerp(this.player.y, enemy.y, t) - wave * 0.3,
        });
      }
      points.push({ x: enemy.x, y: enemy.y });
      this.bolts.push({ id: this.next(), points, life: 0.22, maxLife: 0.22 });
      this.impact(enemy.x, enemy.y, "#f5d57e", 6, 150);
    }
  }

  private chainSpark(skipEnemyId: number, origin: V, damage: number) {
    const target = this.enemies
      .filter((enemy) => enemy.id !== skipEnemyId && dist(enemy, origin) <= 120)
      .sort((a, b) => dist(a, origin) - dist(b, origin))[0];
    if (!target) return;
    target.hp -= damage;
    target.hit = 0.14;
    const points: V[] = [origin];
    for (let i = 1; i < 4; i += 1) {
      const t = i / 4;
      const wave = (Math.random() - 0.5) * 18;
      points.push({
        x: lerp(origin.x, target.x, t) + wave,
        y: lerp(origin.y, target.y, t) - wave * 0.25,
      });
    }
    points.push({ x: target.x, y: target.y });
    this.bolts.push({ id: this.next(), points, life: 0.14, maxLife: 0.14 });
    this.impact(target.x, target.y, "#f5d57e", 3, 110);
  }

  private gainUltimate(amount: number) {
    const before = this.player.ultimate;
    this.player.ultimate = clamp(
      this.player.ultimate + amount,
      0,
      ULTIMATE_MAX,
    );
    if (before < ULTIMATE_MAX && this.player.ultimate >= ULTIMATE_MAX) {
      this.rewardBanner = {
        title: "奥義解放",
        subtitle: "ダブルタップで全方位斬を発動、または次のダッシュが必殺化",
        color: "rgba(245,213,126,1)",
        life: 0.9,
        maxLife: 0.9,
      };
      this.audio.playUltimateReady();
      this.screenFlash = Math.max(this.screenFlash, 0.14);
    }
  }

  private resolveUltimateSlash(hitCount: number) {
    this.audio.playUltimateCast();
    this.freeze = Math.max(this.freeze, 0.06);
    this.screenFlash = Math.max(this.screenFlash, 0.22);
    this.shockwaves.push({
      id: this.next(),
      x: this.player.x,
      y: this.player.y,
      radius: 38,
      growth: 240,
      color: "rgba(245,213,126,0.95)",
      life: 0.34,
      maxLife: 0.34,
    });
    this.castStormBurst(
      4 + Math.min(4, Math.floor(hitCount / 2)),
      34 + this.wave * 3.2,
    );
  }

  private spawn(dt: number) {
    if (this.hasBoss() && this.enemies.length >= MAX_ENEMIES / 2) return;
    this.spawnTimer -= dt;
    if (this.spawnTimer > 0) return;
    const danger = 1 + this.time * 0.021;
    this.spawnTimer = Math.max(0.18, 0.92 - danger * 0.054);
    let budget = 1.2 + danger * 0.46 + Math.random() * 0.65;
    if (this.time < 18) budget *= 0.82;
    if (this.hasBoss()) budget *= 0.85;
    while (budget > 0 && this.enemies.length < MAX_ENEMIES) {
      const kind = this.pickEnemy(budget);
      budget -= ENEMY_DEF[kind].cost;
      this.spawnEnemy(kind);
    }
  }

  private maybeBoss() {
    if (this.time < this.nextBossAt || this.hasBoss()) return;
    this.spawnEnemy("boss");
    this.nextBossAt += 60;
    this.bossWarning = 1.5;
    this.audio.playBossWarning();
  }

  private spawnEnemy(kind: EnemyKind) {
    const d = ENEMY_DEF[kind];
    const a = Math.random() * Math.PI * 2;
    const range = Math.max(CANVAS_WIDTH, CANVAS_HEIGHT) * 0.8 + rand(80, 170);
    const rank = kind === "boss" ? Math.max(1, this.wave) : this.wave;
    const eliteChance =
      kind === "boss"
        ? 0
        : clamp((this.wave - 2) * 0.035 + (this.time > 75 ? 0.04 : 0), 0, 0.16);
    const elite =
      kind !== "boss" &&
      this.time > 30 &&
      Math.random() < eliteChance &&
      (kind === "oni" || kind === "tengu" || kind === "kappa");
    const hpScale =
      kind === "boss"
        ? 1 + this.wave * 0.22
        : 1 + this.time * 0.014 + (elite ? 0.6 : 0);
    const spScale = 1 + this.time * 0.0019 + (elite ? 0.08 : 0);
    this.enemies.push({
      id: this.next(),
      kind,
      x: this.player.x + Math.cos(a) * range,
      y: this.player.y + Math.sin(a) * range,
      vx: 0,
      vy: 0,
      hp: d.hp * hpScale,
      maxHp: d.hp * hpScale,
      radius:
        d.radius * (kind === "boss" ? 1 + this.wave * 0.032 : elite ? 1.08 : 1),
      speed: d.speed * spScale,
      damage:
        d.damage + this.wave * (kind === "boss" ? 2.6 : 1.05) + (elite ? 4 : 0),
      xp:
        d.xp +
        (kind === "boss" ? this.wave * 2 : Math.floor(this.wave / 3)) +
        (elite ? 3 : 0),
      hit: 0,
      orbit: 0,
      seed: Math.random() * Math.PI * 2,
      primary: elite ? "#f5d57e" : d.primary,
      secondary: elite ? "#7b4d16" : d.secondary,
      elite,
      rank,
      attackTimer:
        kind === "boss" ? Math.max(1.4, 3.8 - rank * 0.16) : rand(2.6, 4.8),
      scrollDrop: kind === "boss" || (elite && Math.random() < 0.7),
      buffed: 0,
    });
  }

  private pickEnemy(budget: number) {
    const c: Array<{ kind: EnemyKind; weight: number }> = [];
    const add = (kind: EnemyKind, weight: number) => {
      if (ENEMY_DEF[kind].cost <= budget + 0.2) c.push({ kind, weight });
    };
    add("oni", 5);
    if (this.time > 12) add("yurei", 3.5);
    if (this.time > 24) add("kappa", 3.2);
    if (this.time > 42) add("tengu", 2.8);
    let roll = Math.random() * c.reduce((s, x) => s + x.weight, 0);
    for (const item of c) {
      roll -= item.weight;
      if (roll <= 0) return item.kind;
    }
    return "oni";
  }

  private rollUpgrades() {
    const pool: Upgrade[] = [];
    const active = new Set(this.skills.map((s) => s.key));
    (Object.keys(SKILL_DEF) as SkillKey[]).forEach((key) => {
      if (!active.has(key))
        pool.push({
          id: `new-${key}`,
          title: `${SKILL_DEF[key].name}を習得`,
          desc: this.skillDesc(key, 1),
          icon: SKILL_DEF[key].icon,
          weight: this.skills.length < 2 ? 5 : 3,
          kind: "新術",
          rarity: "RARE",
          current: "未習得",
          next: "Lv.1",
          kicker: "型を増やす",
          apply: (g) => g.ensureSkill(key),
        });
    });
    this.skills.forEach((s) => {
      if (s.level < 5)
        pool.push({
          id: `up-${s.key}`,
          title: `${SKILL_DEF[s.key].name}強化`,
          desc: this.skillDesc(s.key, s.level + 1),
          icon: SKILL_DEF[s.key].icon,
          weight: 3.4,
          kind: "強化",
          rarity: s.level >= 3 ? "EPIC" : "RARE",
          current: `Lv.${s.level}`,
          next: `Lv.${s.level + 1}`,
          kicker: s.level >= 3 ? "主力を伸ばす" : "手数を増やす",
          apply: (g) => {
            const hit = g.skills.find((x) => x.key === s.key);
            if (hit) hit.level += 1;
          },
        });
    });
    pool.push(
      {
        id: "dash-dmg",
        title: "斬撃の重み",
        desc: "ダッシュ威力 +18",
        icon: "斬",
        weight: 2.6,
        kind: "機動",
        rarity: "RARE",
        current: `${Math.round(this.player.dashDamage)}`,
        next: `${Math.round(this.player.dashDamage + 18)}`,
        kicker: "貫通が重くなる",
        apply: (g) => {
          g.player.dashDamage += 18;
        },
      },
      {
        id: "dash-dist",
        title: "踏み込み",
        desc: "ダッシュ距離 +24",
        icon: "迅",
        weight: 2.2,
        kind: "機動",
        rarity: "COMMON",
        current: `${Math.round(this.player.dashDistance)}`,
        next: `${Math.round(this.player.dashDistance + 24)}`,
        kicker: "安全圏へ抜ける",
        apply: (g) => {
          g.player.dashDistance += 24;
        },
      },
      {
        id: "max-hp",
        title: "肉体鍛錬",
        desc: "最大HP +22 / 即時回復",
        icon: "命",
        weight: this.player.hp / this.player.maxHp < 0.55 ? 3.4 : 1.4,
        kind: "生存",
        rarity: "RARE",
        current: `${Math.round(this.player.maxHp)}`,
        next: `${Math.round(this.player.maxHp + 22)}`,
        kicker: "立て直し向き",
        apply: (g) => {
          g.player.maxHp += 22;
          g.player.hp = Math.min(g.player.maxHp, g.player.hp + 32);
        },
      },
      {
        id: "heal",
        title: "止血の術",
        desc: "現在HPを 35% 回復",
        icon: "癒",
        weight: this.player.hp / this.player.maxHp < 0.75 ? 2.8 : 0.4,
        kind: "生存",
        rarity: "COMMON",
        current: `${Math.round(this.player.hp)}`,
        next: `${Math.round(Math.min(this.player.maxHp, this.player.hp + this.player.maxHp * 0.35))}`,
        kicker: "今すぐ安全",
        apply: (g) => {
          g.player.hp = Math.min(
            g.player.maxHp,
            g.player.hp + g.player.maxHp * 0.35,
          );
        },
      },
      {
        id: "magnet",
        title: "気脈感知",
        desc: "XP 吸引範囲 +36",
        icon: "気",
        weight: 1.8,
        kind: "補助",
        rarity: "COMMON",
        current: `${Math.round(this.player.magnetRadius)}`,
        next: `${Math.round(this.player.magnetRadius + 36)}`,
        kicker: "育成が速くなる",
        apply: (g) => {
          g.player.magnetRadius += 36;
        },
      },
      {
        id: "shuriken-count",
        title: "手裏剣追加",
        desc: "周囲の手裏剣 +1",
        icon: "鋼",
        weight: this.player.shurikenCount < 5 ? 2.8 : 1.1,
        kind: "強化",
        rarity: "RARE",
        current: `${this.player.shurikenCount}枚`,
        next: `${this.player.shurikenCount + 1}枚`,
        kicker: "接近拒否が厚い",
        apply: (g) => {
          g.player.shurikenCount += 1;
        },
      },
      {
        id: "shuriken-force",
        title: "手裏剣研磨",
        desc: "手裏剣威力 +6 / 半径 +4",
        icon: "輪",
        weight: 2.4,
        kind: "強化",
        rarity: "COMMON",
        current: `${this.player.shurikenDamage}/${Math.round(this.player.shurikenRadius)}`,
        next: `${this.player.shurikenDamage + 6}/${Math.round(this.player.shurikenRadius + 4)}`,
        kicker: "近接火力UP",
        apply: (g) => {
          g.player.shurikenDamage += 6;
          g.player.shurikenRadius += 4;
        },
      },
    );
    const picked: Upgrade[] = [];
    const used = new Set<string>();
    while (picked.length < 3) {
      const items = pool.filter((x) => !used.has(x.id));
      let roll =
        Math.random() * items.reduce((s, x) => s + Math.max(0, x.weight), 0);
      const found =
        items.find((x) => (roll -= Math.max(0, x.weight)) <= 0) ??
        items[items.length - 1];
      if (!found) break;
      used.add(found.id);
      picked.push(found);
    }
    return picked;
  }

  private pickUpgrade(index: number) {
    if (!this.upgrades || this.upgradeGuard > 0) return;
    const choice = this.upgrades[index];
    if (!choice) return;
    choice.apply(this);
    this.audio.playSelect();
    this.screenFlash = Math.max(this.screenFlash, 0.22);
    this.rewardBanner = {
      title: choice.title,
      subtitle: choice.kicker ?? choice.desc,
      color: this.rarityColor(choice.rarity),
      life: 1.2,
      maxLife: 1.2,
    };
    this.shockwaves.push({
      id: this.next(),
      x: this.player.x,
      y: this.player.y,
      radius: 26,
      growth: 190,
      color: this.rarityColor(choice.rarity).replace("1)", "0.9)"),
      life: 0.28,
      maxLife: 0.28,
    });
    this.upgrades = null;
    this.queuedLevelUps -= 1;
    if (this.queuedLevelUps > 0) {
      this.upgrades = this.rollUpgrades();
      this.upgradeGuard = UPGRADE_GUARD;
    } else {
      this.paused = false;
    }
  }

  private rerollUpgrades() {
    if (!this.upgrades || this.upgradeGuard > 0 || this.player.rerolls <= 0)
      return;
    this.player.rerolls -= 1;
    this.upgrades = this.rollUpgrades();
    this.upgradeGuard = 0.18;
    this.audio.playSelect();
    this.screenFlash = Math.max(this.screenFlash, 0.1);
  }

  private ensureSkill(key: SkillKey) {
    const current = this.skills.find((s) => s.key === key);
    if (current) current.level = Math.min(current.level + 1, 5);
    else this.skills.push({ key, level: 1, timer: key === "fire" ? 0 : 0.35 });
    this.maybeUnlockSynergies();
  }

  private skillLevel(key: SkillKey) {
    return this.skills.find((s) => s.key === key)?.level ?? 0;
  }

  private maybeUnlockSynergies() {
    const unlocks = [
      {
        id: "storm-shadow",
        active: this.skillLevel("lightning") > 0 && this.skillLevel("shadow") > 0,
        title: "雷影連殺",
        subtitle: "雷遁が影の斬撃を伴う",
        color: "rgba(245,213,126,1)",
      },
      {
        id: "inferno-wind",
        active: this.skillLevel("fire") > 0 && this.skillLevel("wind") > 0,
        title: "炎風旋",
        subtitle: "風遁が火種を広げる",
        color: "rgba(239,125,50,1)",
      },
      {
        id: "arc-kunai",
        active: this.skillLevel("lightning") > 0 && this.skillLevel("kunai") > 0,
        title: "雷走苦無",
        subtitle: "クナイが近くの敵へ放電する",
        color: "rgba(163,155,189,1)",
      },
    ];
    for (const unlock of unlocks) {
      if (!unlock.active || this.unlockedSynergies.has(unlock.id)) continue;
      this.unlockedSynergies.add(unlock.id);
      this.rewardBanner = {
        title: unlock.title,
        subtitle: unlock.subtitle,
        color: unlock.color,
        life: 1.15,
        maxLife: 1.15,
      };
      this.audio.playSelect();
      this.screenFlash = Math.max(this.screenFlash, 0.16);
    }
  }

  private skillCooldown(key: SkillKey, level: number) {
    const base = SKILL_DEF[key].cooldown;
    if (key === "fire") return 0;
    if (key === "shadow") return Math.max(1.6, base - level * 0.35);
    if (key === "lightning") return Math.max(0.65, base - level * 0.12);
    if (key === "wind") return Math.max(0.38, base - level * 0.08);
    return Math.max(0.55, base - level * 0.1);
  }

  private skillDesc(key: SkillKey, next: number) {
    if (key === "lightning") return `近い敵を ${next + 1} 体まで感電`;
    if (key === "fire") return `ダッシュの残火を強化 Lv.${next}`;
    if (key === "shadow")
      return `影の斬撃が ${1 + Math.floor((next + 1) / 2)} 回発生`;
    if (key === "wind") return `追尾する風刃を強化 Lv.${next}`;
    return `クナイ投射数 ${2 + next}`;
  }

  private rarityColor(rarity: Upgrade["rarity"]) {
    if (rarity === "EPIC") return "rgba(183, 130, 255, 1)";
    if (rarity === "RARE") return "rgba(135, 221, 217, 1)";
    return "rgba(216, 180, 94, 1)";
  }

  private closest(origin: V) {
    let best: Enemy | null = null;
    let bestDist = Infinity;
    for (const e of this.enemies) {
      const d = dist(origin, e);
      if (d < bestDist) {
        bestDist = d;
        best = e;
      }
    }
    return best;
  }

  private hasBoss() {
    return this.enemies.some((e) => e.kind === "boss");
  }

  private updateFx(dt: number) {
    this.trauma = Math.max(0, this.trauma - dt * 1.8);
    this.screenFlash = Math.max(0, this.screenFlash - dt * 1.35);
    if (this.rewardBanner) {
      this.rewardBanner.life -= dt;
      if (this.rewardBanner.life <= 0) this.rewardBanner = null;
    }
    for (let i = this.slashes.length - 1; i >= 0; i -= 1) {
      this.slashes[i].life -= dt;
      if (this.slashes[i].life <= 0) this.slashes.splice(i, 1);
    }
    for (let i = this.bolts.length - 1; i >= 0; i -= 1) {
      this.bolts[i].life -= dt;
      if (this.bolts[i].life <= 0) this.bolts.splice(i, 1);
    }
    for (let i = this.afterimages.length - 1; i >= 0; i -= 1) {
      this.afterimages[i].life -= dt;
      if (this.afterimages[i].life <= 0) this.afterimages.splice(i, 1);
    }
    for (let i = this.shockwaves.length - 1; i >= 0; i -= 1) {
      const wave = this.shockwaves[i];
      wave.life -= dt;
      wave.radius += wave.growth * dt;
      if (wave.life <= 0) this.shockwaves.splice(i, 1);
    }
    for (let i = this.particles.length - 1; i >= 0; i -= 1) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.92;
      p.vy *= 0.92;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  private impact(
    x: number,
    y: number,
    color: string,
    count: number,
    speed: number,
  ) {
    for (let i = 0; i < count; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const life = rand(0.12, 0.32);
      this.particles.push({
        id: this.next(),
        x,
        y,
        vx: Math.cos(a) * rand(speed * 0.4, speed),
        vy: Math.sin(a) * rand(speed * 0.4, speed),
        size: rand(2, 4.5),
        color,
        glow: 10,
        life,
        maxLife: life,
      });
    }
  }

  private openingParticles() {
    for (let i = 0; i < 18; i += 1) {
      const life = rand(0.6, 1.1);
      this.particles.push({
        id: this.next(),
        x: rand(-80, 80),
        y: rand(-80, 80),
        vx: rand(-20, 20),
        vy: rand(-20, 20),
        size: rand(1.5, 3),
        color: i % 3 === 0 ? "#d8b45e" : "#f5efe3",
        glow: 6,
        life,
        maxLife: life,
      });
    }
  }

  private restart() {
    this.player = this.makePlayer();
    this.dash = null;
    this.aimStart = null;
    this.aimCurrent = null;
    this.enemies = [];
    this.projectiles = [];
    this.flames = [];
    this.orbs = [];
    this.scrolls = [];
    this.hazards = [];
    this.slashes = [];
    this.bolts = [];
    this.particles = [];
    this.afterimages = [];
    this.shockwaves = [];
    this.skills = [];
    this.unlockedSynergies.clear();
    this.shurikenAngle = 0;
    this.time = 0;
    this.wave = 1;
    this.spawnTimer = 0.4;
    this.nextBossAt = 58;
    this.bossWarning = 0;
    this.trauma = 0;
    this.freeze = 0;
    this.hintTimer = 12;
    this.fireTrailTimer = 0;
    this.screenFlash = 0;
    this.rewardBanner = null;
    this.upgrades = null;
    this.upgradeGuard = 0;
    this.queuedLevelUps = 0;
    this.paused = false;
    this.manualPause = false;
    this.gameOver = false;
    this.lastTapTime = 0;
    this.openingParticles();
  }

  private startDash(dir: V) {
    if (this.dash || this.player.dashCooldown > 0) return;
    const ultimate = this.player.ultimate >= ULTIMATE_MAX;
    if (ultimate) this.player.ultimate = 0;
    this.dash = {
      from: { x: this.player.x, y: this.player.y },
      to: {
        x:
          this.player.x +
          dir.x * this.player.dashDistance * (ultimate ? 1.22 : 1),
        y:
          this.player.y +
          dir.y * this.player.dashDistance * (ultimate ? 1.22 : 1),
      },
      dir,
      progress: 0,
      hits: new Set<number>(),
      hitCount: 0,
      ultimate,
    };
    this.player.invulnerable = DASH_DURATION + 0.08;
    this.fireTrailTimer = 0;
    this.audio.playDash(ultimate);
    this.screenFlash = Math.max(this.screenFlash, ultimate ? 0.18 : 0.12);
    this.shockwaves.push({
      id: this.next(),
      x: this.player.x,
      y: this.player.y,
      radius: ultimate ? 30 : 22,
      growth: ultimate ? 220 : 180,
      color: ultimate ? "rgba(245,213,126,0.95)" : "rgba(207,46,47,0.85)",
      life: ultimate ? 0.26 : 0.2,
      maxLife: ultimate ? 0.26 : 0.2,
    });
    this.slashes.push({
      id: this.next(),
      x: this.player.x + dir.x * 26,
      y: this.player.y + dir.y * 26,
      angle: Math.atan2(dir.y, dir.x),
      radius: this.player.dashDistance * (ultimate ? 0.58 : 0.42),
      span: ultimate ? 0.92 : 0.72,
      color: ultimate ? "rgba(245,213,126,0.95)" : "rgba(207,46,47,0.8)",
      life: ultimate ? 0.28 : 0.22,
      maxLife: ultimate ? 0.28 : 0.22,
    });
    if (ultimate) {
      this.rewardBanner = {
        title: "必殺・裂空斬",
        subtitle: "渾身の一撃が敵を切り裂く",
        color: "rgba(245,213,126,1)",
        life: 0.9,
        maxLife: 0.9,
      };
    }
  }

  private togglePause() {
    if (this.gameOver || this.upgrades) return;
    this.manualPause = !this.manualPause;
    if (this.manualPause) {
      this.cancelTouch();
    }
  }

  private castUltimate() {
    if (this.player.ultimate < ULTIMATE_MAX) return;
    this.player.ultimate = 0;
    this.audio.playDash(true);
    this.screenFlash = 0.3;
    this.trauma = Math.min(1, this.trauma + 0.4);
    this.freeze = 0.08;
    // Omnidirectional slash — 8 directions
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      this.slashes.push({
        id: this.next(),
        x: this.player.x + Math.cos(angle) * 30,
        y: this.player.y + Math.sin(angle) * 30,
        angle,
        radius: 80,
        span: 0.5,
        color: "rgba(245,213,126,0.9)",
        life: 0.3,
        maxLife: 0.3,
      });
    }
    // Shockwave
    this.shockwaves.push({
      id: this.next(),
      x: this.player.x,
      y: this.player.y,
      radius: 40,
      growth: 300,
      color: "rgba(245,213,126,0.95)",
      life: 0.35,
      maxLife: 0.35,
    });
    // Damage all enemies in range
    const ultimateRange = 160;
    const ultimateDmg = this.player.dashDamage * 3 + this.player.level * 5;
    for (const e of this.enemies) {
      const d = dist(e, this.player);
      if (d <= ultimateRange + e.radius) {
        e.hp -= ultimateDmg;
        e.hit = 0.2;
        const push = norm({ x: e.x - this.player.x, y: e.y - this.player.y });
        e.vx += push.x * 200;
        e.vy += push.y * 200;
        this.impact(e.x, e.y, "#f5d57e", 6, 180);
      }
    }
    this.player.invulnerable = Math.max(this.player.invulnerable, 0.5);
    // Particles burst
    for (let i = 0; i < 24; i++) {
      const a = (Math.PI * 2 * i) / 24;
      const life = rand(0.2, 0.4);
      this.particles.push({
        id: this.next(),
        x: this.player.x,
        y: this.player.y,
        vx: Math.cos(a) * rand(150, 280),
        vy: Math.sin(a) * rand(150, 280),
        size: rand(2.5, 5),
        color: i % 3 === 0 ? "#f5d57e" : "#ffffff",
        glow: 14,
        life,
        maxLife: life,
      });
    }
    this.rewardBanner = {
      title: "必殺・全方位斬",
      subtitle: "周囲の敵を一掃する渾身の一撃",
      color: "rgba(245,213,126,1)",
      life: 1.0,
      maxLife: 1.0,
    };
  }

  private next() {
    this.id += 1;
    return this.id;
  }

  private render() {
    const shake = this.trauma * this.trauma * 18;
    const camX = this.player.x - CANVAS_WIDTH / 2 + rand(-shake, shake);
    const camY = this.player.y - CANVAS_HEIGHT / 2 + rand(-shake, shake);
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawBackground(
      this.ctx,
      camX,
      camY,
      this.time,
      1 + this.wave * 0.08 + this.enemies.length * 0.01,
    );
    drawEmbers(this.ctx, camX, camY, this.time);
    this.ctx.save();
    this.ctx.translate(-camX, -camY);
    for (const flame of this.flames) drawFlamePatch(this.ctx, flame, this.time);
    for (const orb of this.orbs) drawOrb(this.ctx, orb, this.time);
    for (const scroll of this.scrolls) drawScroll(this.ctx, scroll, this.time);
    for (const hazard of this.hazards) drawHazard(this.ctx, hazard, this.time);
    for (const wave of this.shockwaves) drawShockwave(this.ctx, wave);
    for (const slash of this.slashes) drawSlashEffect(this.ctx, slash);
    for (const bolt of this.bolts) drawLightning(this.ctx, bolt);
    for (const p of this.projectiles) drawProjectile(this.ctx, p);
    for (const e of this.enemies)
      drawEnemy(this.ctx, { ...e, hitFlash: e.hit }, this.time);
    for (let i = 0; i < this.player.shurikenCount; i += 1) {
      const a =
        this.shurikenAngle + (Math.PI * 2 * i) / this.player.shurikenCount;
      drawShuriken(
        this.ctx,
        this.player.x + Math.cos(a) * this.player.shurikenRadius,
        this.player.y + Math.sin(a) * this.player.shurikenRadius,
        10,
        a * 5,
      );
    }
    if (this.aimStart && this.aimCurrent && !this.dash && !this.paused)
      drawAimGuide(this.ctx, this.aimStart, this.aimCurrent, this.player);
    for (const ghost of this.afterimages) drawAfterimage(this.ctx, ghost);
    drawPlayer(
      this.ctx,
      { ...this.player, radius: PLAYER_RADIUS },
      this.dash?.dir ?? null,
      this.time,
    );
    for (const p of this.particles) drawParticle(this.ctx, p);
    this.ctx.restore();
    drawScreenFlash(
      this.ctx,
      this.screenFlash,
      this.bossWarning > 0 ? "226,71,62" : "255,255,255",
    );
    drawVignette(this.ctx, 0.4 + this.trauma * 0.2);
    drawHud(this.ctx, {
      hp: this.player.hp,
      maxHp: this.player.maxHp,
      xp: this.player.xp,
      xpToNext: this.player.xpToNext,
      level: this.player.level,
      wave: this.wave,
      time: this.time,
      killCount: this.player.killCount,
      dashCooldownRatio:
        1 - clamp(this.player.dashCooldown / DASH_COOLDOWN, 0, 1),
      ultimateRatio: this.player.ultimate / ULTIMATE_MAX,
      ultimateReady: this.player.ultimate >= ULTIMATE_MAX,
      skills: this.skills.map((s) => ({
        key: s.key,
        name: SKILL_DEF[s.key].name,
        icon: SKILL_DEF[s.key].icon,
        level: s.level,
        color: SKILL_DEF[s.key].color,
        readyRatio:
          s.key === "fire"
            ? 1
            : 1 - clamp(s.timer / this.skillCooldown(s.key, s.level), 0, 1),
      })),
      hintAlpha: clamp(this.hintTimer / 2.5, 0, 1),
      boss:
        this.enemies
          .filter((e) => e.kind === "boss")
          .map((e) => ({ hp: e.hp, maxHp: e.maxHp, rank: e.rank }))[0] ?? null,
      bossWarning: this.bossWarning,
    });
    if (this.rewardBanner) drawRewardBanner(this.ctx, this.rewardBanner);
    if (this.upgrades)
      drawUpgradeOverlay(this.ctx, {
        choices: this.upgrades.map((u) => ({
          title: u.title,
          description: u.desc,
          icon: u.icon,
          kind: u.kind,
          rarity: u.rarity,
          rarityColor: this.rarityColor(u.rarity),
          current: u.current,
          next: u.next,
          kicker: u.kicker,
        })),
        guardTimer: this.upgradeGuard,
        rerolls: this.player.rerolls,
      });
    if (this.gameOver)
      drawGameOver(this.ctx, {
        time: this.time,
        level: this.player.level,
        killCount: this.player.killCount,
        wave: this.wave,
      });
    // Pause button (always visible during gameplay)
    if (!this.gameOver && !this.upgrades) {
      this.ctx.save();
      this.ctx.fillStyle = "rgba(8,10,18,0.6)";
      this.ctx.beginPath();
      this.ctx.roundRect(CANVAS_WIDTH - 46, 8, 38, 38, 10);
      this.ctx.fill();
      this.ctx.strokeStyle = "rgba(255,255,255,0.2)";
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.roundRect(CANVAS_WIDTH - 46, 8, 38, 38, 10);
      this.ctx.stroke();
      // Pause/play icon
      this.ctx.fillStyle = "#f5efe3";
      if (this.manualPause) {
        // Play triangle
        this.ctx.beginPath();
        this.ctx.moveTo(CANVAS_WIDTH - 34, 18);
        this.ctx.lineTo(CANVAS_WIDTH - 34, 36);
        this.ctx.lineTo(CANVAS_WIDTH - 18, 27);
        this.ctx.closePath();
        this.ctx.fill();
      } else {
        // Pause bars
        this.ctx.fillRect(CANVAS_WIDTH - 35, 18, 5, 18);
        this.ctx.fillRect(CANVAS_WIDTH - 24, 18, 5, 18);
      }
      this.ctx.restore();
    }
    // Pause overlay
    if (this.manualPause) {
      this.ctx.save();
      this.ctx.fillStyle = "rgba(3,4,8,0.75)";
      this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      this.ctx.fillStyle = "#f1ddbb";
      this.ctx.textAlign = "center";
      this.ctx.font = '800 32px "Shippori Mincho", "Yu Mincho", serif';
      this.ctx.fillText("一時停止", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
      this.ctx.font = '500 14px "Noto Sans JP", "Hiragino Sans", sans-serif';
      this.ctx.fillStyle = "rgba(255,255,255,0.6)";
      this.ctx.fillText(
        "画面右上をタップで再開",
        CANVAS_WIDTH / 2,
        CANVAS_HEIGHT / 2 + 24,
      );
      this.ctx.restore();
    }
  }
}
