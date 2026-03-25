// ============================================================
// DASH SURVIVORS - 突っ込むサバイバー
// Right-thumb swipe to dash-attack through enemies
// ============================================================

// --- Types ---
interface Vec2 {
  x: number;
  y: number;
}

interface Player {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  dashDir: Vec2 | null;
  dashProgress: number; // 0-1
  dashStart: Vec2;
  dashTarget: Vec2;
  dashCooldown: number;
  dashSpeed: number;
  dashDamage: number;
  dashDistance: number;
  invincibleTimer: number;
  xp: number;
  xpToNext: number;
  level: number;
  killCount: number;
  magnetRange: number;
}

interface Enemy {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  size: number;
  type: EnemyType;
  hitTimer: number;
  xpValue: number;
}

type EnemyType = "basic" | "fast" | "tank" | "swarm" | "boss";

interface XpOrb {
  x: number;
  y: number;
  value: number;
  magnet: boolean; // being pulled toward player
}

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  lifetime: number;
  size: number;
  color: string;
  pierce: number;
  hitEnemies: Set<number>;
  weaponType: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface DashTrail {
  x: number;
  y: number;
  life: number;
  size: number;
}

interface Weapon {
  id: string;
  name: string;
  level: number;
  maxLevel: number;
  cooldown: number;
  timer: number;
  color: string;
  icon: string;
}

interface Upgrade {
  id: string;
  name: string;
  description: string;
  icon: string;
  apply: (game: DashSurvivors) => void;
}

// --- Constants ---
const W = 390;
const H = 750;
const PLAYER_SIZE = 16;
const DASH_DURATION = 0.15; // seconds
const DASH_COOLDOWN = 0.08;
const BASE_DASH_DISTANCE = 120;
const BASE_DASH_DAMAGE = 25;
const XP_BASE = 10;
const WAVE_INTERVAL = 15; // seconds between difficulty increases

// --- Enemy Templates ---
const ENEMY_TEMPLATES: Record<
  EnemyType,
  {
    hp: number;
    speed: number;
    damage: number;
    size: number;
    xp: number;
    color: string;
  }
> = {
  basic: { hp: 30, speed: 40, damage: 8, size: 12, xp: 1, color: "#e74c3c" },
  fast: { hp: 15, speed: 80, damage: 5, size: 9, xp: 1, color: "#e67e22" },
  tank: { hp: 120, speed: 20, damage: 15, size: 20, xp: 3, color: "#8e44ad" },
  swarm: { hp: 10, speed: 55, damage: 3, size: 7, xp: 1, color: "#f39c12" },
  boss: { hp: 500, speed: 15, damage: 25, size: 35, xp: 20, color: "#c0392b" },
};

// --- Weapon Definitions ---
function getWeaponDefs(): Record<
  string,
  { name: string; icon: string; color: string; baseCooldown: number }
> {
  return {
    orbit: { name: "回転刃", icon: "🔪", color: "#3498db", baseCooldown: 0 },
    burst: { name: "弾幕", icon: "💫", color: "#e74c3c", baseCooldown: 2.0 },
    lightning: {
      name: "雷撃",
      icon: "⚡",
      color: "#f1c40f",
      baseCooldown: 1.5,
    },
    flame: { name: "炎の軌跡", icon: "🔥", color: "#e67e22", baseCooldown: 0 },
    nova: { name: "衝撃波", icon: "💥", color: "#9b59b6", baseCooldown: 4.0 },
    homing: { name: "追尾弾", icon: "🎯", color: "#1abc9c", baseCooldown: 1.2 },
  };
}

// --- Main Game Class ---
export class DashSurvivors {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  player: Player;
  enemies: Enemy[] = [];
  xpOrbs: XpOrb[] = [];
  projectiles: Projectile[] = [];
  particles: Particle[] = [];
  dashTrails: DashTrail[] = [];
  weapons: Weapon[] = [];
  camera: Vec2 = { x: 0, y: 0 };

  gameTime: number = 0;
  wave: number = 1;
  spawnTimer: number = 0;
  gameOver: boolean = false;
  paused: boolean = false;
  upgradeChoices: Upgrade[] | null = null;
  pendingLevelUps: number = 0;

  private animFrame: number = 0;
  private lastTime: number = 0;
  private destroyed: boolean = false;
  private enemyIdCounter: number = 0;
  private onStateChange: (() => void) | null = null;
  private orbitAngle: number = 0;

  // Touch state
  private touchStart: Vec2 | null = null;
  private swipeThreshold: number = 20;

  constructor(canvas: HTMLCanvasElement, onStateChange?: () => void) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    canvas.width = W;
    canvas.height = H;
    this.onStateChange = onStateChange || null;

    this.player = {
      x: 0,
      y: 0,
      hp: 100,
      maxHp: 100,
      dashDir: null,
      dashProgress: 0,
      dashStart: { x: 0, y: 0 },
      dashTarget: { x: 0, y: 0 },
      dashCooldown: 0,
      dashSpeed: 1,
      dashDamage: BASE_DASH_DAMAGE,
      dashDistance: BASE_DASH_DISTANCE,
      invincibleTimer: 0,
      xp: 0,
      xpToNext: XP_BASE,
      level: 1,
      killCount: 0,
      magnetRange: 60,
    };

    // Start with orbit weapon
    this.addWeapon("orbit");
  }

  // --- Weapon Management ---
  addWeapon(id: string) {
    const def = getWeaponDefs()[id];
    if (!def) return;
    const existing = this.weapons.find((w) => w.id === id);
    if (existing) {
      existing.level = Math.min(existing.level + 1, existing.maxLevel);
      return;
    }
    this.weapons.push({
      id,
      name: def.name,
      level: 1,
      maxLevel: 5,
      cooldown: def.baseCooldown,
      timer: 0,
      color: def.color,
      icon: def.icon,
    });
  }

  // --- Upgrade System ---
  private generateUpgrades(): Upgrade[] {
    const allUpgrades: Upgrade[] = [];
    const defs = getWeaponDefs();

    // New weapons
    for (const [id, def] of Object.entries(defs)) {
      if (!this.weapons.find((w) => w.id === id)) {
        allUpgrades.push({
          id: `new_${id}`,
          name: def.name,
          icon: def.icon,
          description: `${def.name}を獲得`,
          apply: (g) => g.addWeapon(id),
        });
      }
    }

    // Upgrade existing weapons
    for (const w of this.weapons) {
      if (w.level < w.maxLevel) {
        allUpgrades.push({
          id: `up_${w.id}`,
          name: w.name,
          icon: w.icon,
          description: `${w.name} Lv${w.level + 1}`,
          apply: (g) => {
            const wep = g.weapons.find((x) => x.id === w.id);
            if (wep) wep.level = Math.min(wep.level + 1, wep.maxLevel);
          },
        });
      }
    }

    // Stat upgrades
    allUpgrades.push({
      id: "dash_dmg",
      name: "ダッシュ攻撃力",
      icon: "⚔️",
      description: `ダッシュ攻撃+15`,
      apply: (g) => {
        g.player.dashDamage += 15;
      },
    });
    allUpgrades.push({
      id: "dash_dist",
      name: "ダッシュ距離",
      icon: "💨",
      description: `ダッシュ距離+30`,
      apply: (g) => {
        g.player.dashDistance += 30;
      },
    });
    allUpgrades.push({
      id: "max_hp",
      name: "最大HP",
      icon: "❤️",
      description: `最大HP+25 & 全回復`,
      apply: (g) => {
        g.player.maxHp += 25;
        g.player.hp = g.player.maxHp;
      },
    });
    allUpgrades.push({
      id: "magnet",
      name: "磁力範囲",
      icon: "🧲",
      description: `XP吸収範囲+30`,
      apply: (g) => {
        g.player.magnetRange += 30;
      },
    });
    allUpgrades.push({
      id: "heal",
      name: "回復",
      icon: "💚",
      description: `HP 30% 回復`,
      apply: (g) => {
        g.player.hp = Math.min(
          g.player.hp + g.player.maxHp * 0.3,
          g.player.maxHp,
        );
      },
    });

    // Shuffle and pick 3
    for (let i = allUpgrades.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allUpgrades[i], allUpgrades[j]] = [allUpgrades[j], allUpgrades[i]];
    }
    return allUpgrades.slice(0, 3);
  }

  selectUpgrade(index: number) {
    if (!this.upgradeChoices) return;
    const choice = this.upgradeChoices[index];
    if (choice) {
      choice.apply(this);
    }
    this.upgradeChoices = null;
    this.pendingLevelUps--;

    if (this.pendingLevelUps > 0) {
      this.upgradeChoices = this.generateUpgrades();
    } else {
      this.paused = false;
    }
    this.emitState();
  }

  // --- Touch Handling ---
  onTouchStart(x: number, y: number) {
    if (this.gameOver) return;
    if (this.upgradeChoices) return; // handled by UI
    this.touchStart = { x, y };
  }

  onTouchMove(x: number, y: number) {
    // Could show swipe preview
  }

  onTouchEnd(x: number, y: number) {
    if (this.gameOver || this.upgradeChoices || !this.touchStart) return;

    const dx = x - this.touchStart.x;
    const dy = y - this.touchStart.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > this.swipeThreshold) {
      // Swipe detected → dash in that direction
      const nx = dx / dist;
      const ny = dy / dist;
      this.startDash(nx, ny);
    }
    this.touchStart = null;
  }

  private startDash(nx: number, ny: number) {
    const p = this.player;
    if (p.dashDir || p.dashCooldown > 0) return;

    p.dashDir = { x: nx, y: ny };
    p.dashStart = { x: p.x, y: p.y };
    p.dashTarget = {
      x: p.x + nx * p.dashDistance,
      y: p.y + ny * p.dashDistance,
    };
    p.dashProgress = 0;
    p.invincibleTimer = DASH_DURATION + 0.05;
  }

  // --- Spawning ---
  private spawnEnemies(dt: number) {
    this.spawnTimer -= dt;
    if (this.spawnTimer > 0) return;

    const wave = this.wave;
    const baseRate = Math.max(0.3, 1.5 - wave * 0.08);
    this.spawnTimer = baseRate;

    // How many to spawn
    const count = Math.min(1 + Math.floor(wave / 3), 8);

    for (let i = 0; i < count; i++) {
      let type: EnemyType = "basic";
      const r = Math.random();
      if (wave >= 10 && r < 0.03) type = "boss";
      else if (wave >= 5 && r < 0.15) type = "tank";
      else if (wave >= 3 && r < 0.3) type = "fast";
      else if (wave >= 2 && r < 0.5) type = "swarm";

      const template = ENEMY_TEMPLATES[type];
      const hpMult = 1 + (wave - 1) * 0.15;

      // Spawn from edge of visible area
      const angle = Math.random() * Math.PI * 2;
      const spawnDist = Math.max(W, H) * 0.6;
      const ex = this.player.x + Math.cos(angle) * spawnDist;
      const ey = this.player.y + Math.sin(angle) * spawnDist;

      this.enemies.push({
        x: ex,
        y: ey,
        hp: template.hp * hpMult,
        maxHp: template.hp * hpMult,
        speed: template.speed * (0.9 + Math.random() * 0.2),
        damage: template.damage + wave,
        size: template.size,
        type,
        hitTimer: 0,
        xpValue: template.xp,
      });
    }
  }

  // --- Weapon Updates ---
  private updateWeapons(dt: number) {
    for (const w of this.weapons) {
      w.timer -= dt;

      switch (w.id) {
        case "orbit":
          this.updateOrbitWeapon(w, dt);
          break;
        case "burst":
          if (w.timer <= 0) {
            this.fireBurst(w);
            w.timer = Math.max(0.5, w.cooldown - w.level * 0.2);
          }
          break;
        case "lightning":
          if (w.timer <= 0) {
            this.fireLightning(w);
            w.timer = Math.max(0.3, w.cooldown - w.level * 0.15);
          }
          break;
        case "flame":
          this.updateFlame(w, dt);
          break;
        case "nova":
          if (w.timer <= 0) {
            this.fireNova(w);
            w.timer = Math.max(1.5, w.cooldown - w.level * 0.4);
          }
          break;
        case "homing":
          if (w.timer <= 0) {
            this.fireHoming(w);
            w.timer = Math.max(0.3, w.cooldown - w.level * 0.12);
          }
          break;
      }
    }
  }

  private updateOrbitWeapon(w: Weapon, dt: number) {
    const p = this.player;
    const count = w.level + 1;
    const radius = 45 + w.level * 5;
    const damage = 10 + w.level * 8;
    const bladeSize = 8 + w.level * 2;

    this.orbitAngle += dt * (3 + w.level * 0.5);

    for (let i = 0; i < count; i++) {
      const angle = this.orbitAngle + (Math.PI * 2 * i) / count;
      const bx = p.x + Math.cos(angle) * radius;
      const by = p.y + Math.sin(angle) * radius;

      // Check collision with enemies
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const e = this.enemies[j];
        const dx = bx - e.x;
        const dy = by - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < bladeSize + e.size) {
          if (e.hitTimer <= 0) {
            e.hp -= damage;
            e.hitTimer = 0.2;
            this.spawnHitParticles(e.x, e.y, w.color, 3);
          }
        }
      }
    }
  }

  private fireBurst(w: Weapon) {
    const count = 4 + w.level * 2;
    const damage = 8 + w.level * 5;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      this.projectiles.push({
        x: this.player.x,
        y: this.player.y,
        vx: Math.cos(angle) * 200,
        vy: Math.sin(angle) * 200,
        damage,
        lifetime: 1.5,
        size: 4 + w.level,
        color: w.color,
        pierce: w.level >= 3 ? 2 : 1,
        hitEnemies: new Set(),
        weaponType: "burst",
      });
    }
  }

  private fireLightning(w: Weapon) {
    const targets = w.level + 1;
    const damage = 15 + w.level * 10;
    const range = 150 + w.level * 30;

    // Find nearest enemies
    const sorted = [...this.enemies]
      .map((e) => ({
        e,
        d: Math.hypot(e.x - this.player.x, e.y - this.player.y),
      }))
      .filter((x) => x.d < range)
      .sort((a, b) => a.d - b.d)
      .slice(0, targets);

    for (const { e } of sorted) {
      e.hp -= damage;
      e.hitTimer = 0.15;
      // Lightning visual as particle line
      const steps = 5;
      for (let i = 0; i < steps; i++) {
        const t = i / steps;
        this.particles.push({
          x:
            this.player.x +
            (e.x - this.player.x) * t +
            (Math.random() - 0.5) * 15,
          y:
            this.player.y +
            (e.y - this.player.y) * t +
            (Math.random() - 0.5) * 15,
          vx: 0,
          vy: 0,
          life: 1,
          maxLife: 0.3,
          color: "#f1c40f",
          size: 3 + Math.random() * 3,
        });
      }
    }
  }

  private updateFlame(w: Weapon, dt: number) {
    // Leave fire trail when dashing
    if (this.player.dashDir) {
      const damage = 5 + w.level * 4;
      // Fire trail damages enemies near dash path
      for (const e of this.enemies) {
        const dx = e.x - this.player.x;
        const dy = e.y - this.player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 30 + w.level * 5) {
          if (e.hitTimer <= 0) {
            e.hp -= damage;
            e.hitTimer = 0.1;
          }
        }
      }
    }
  }

  private fireNova(w: Weapon) {
    const damage = 20 + w.level * 15;
    const range = 100 + w.level * 25;

    for (const e of this.enemies) {
      const dist = Math.hypot(e.x - this.player.x, e.y - this.player.y);
      if (dist < range) {
        e.hp -= damage;
        e.hitTimer = 0.2;
        // Knockback
        const nx = (e.x - this.player.x) / Math.max(dist, 1);
        const ny = (e.y - this.player.y) / Math.max(dist, 1);
        e.x += nx * 30;
        e.y += ny * 30;
      }
    }

    // Visual
    for (let i = 0; i < 24; i++) {
      const angle = (Math.PI * 2 * i) / 24;
      this.particles.push({
        x: this.player.x,
        y: this.player.y,
        vx: Math.cos(angle) * range * 3,
        vy: Math.sin(angle) * range * 3,
        life: 1,
        maxLife: 0.4,
        color: "#9b59b6",
        size: 6,
      });
    }
  }

  private fireHoming(w: Weapon) {
    const count = Math.min(w.level, 3);
    const damage = 10 + w.level * 6;

    for (let i = 0; i < count; i++) {
      // Find a random nearby enemy
      const nearby = this.enemies.filter(
        (e) => Math.hypot(e.x - this.player.x, e.y - this.player.y) < 250,
      );
      if (nearby.length === 0) return;
      const target = nearby[Math.floor(Math.random() * nearby.length)];
      const dx = target.x - this.player.x;
      const dy = target.y - this.player.y;
      const dist = Math.max(Math.hypot(dx, dy), 1);

      this.projectiles.push({
        x: this.player.x,
        y: this.player.y,
        vx: (dx / dist) * 250,
        vy: (dy / dist) * 250,
        damage,
        lifetime: 2,
        size: 5,
        color: "#1abc9c",
        pierce: 1,
        hitEnemies: new Set(),
        weaponType: "homing",
      });
    }
  }

  // --- Particle Helpers ---
  private spawnHitParticles(
    x: number,
    y: number,
    color: string,
    count: number,
  ) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 100;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 0.3 + Math.random() * 0.2,
        color,
        size: 2 + Math.random() * 3,
      });
    }
  }

  private spawnDeathParticles(x: number, y: number, color: string) {
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 120;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 0.4,
        color,
        size: 3 + Math.random() * 4,
      });
    }
  }

  // --- Main Update ---
  private update(dt: number) {
    if (this.paused || this.gameOver) return;

    this.gameTime += dt;

    // Wave progression
    const newWave = 1 + Math.floor(this.gameTime / WAVE_INTERVAL);
    if (newWave > this.wave) {
      this.wave = newWave;
    }

    // Update player dash
    this.updateDash(dt);

    // Spawn enemies
    this.spawnEnemies(dt);

    // Update enemies
    this.updateEnemies(dt);

    // Update weapons
    this.updateWeapons(dt);

    // Update projectiles
    this.updateProjectiles(dt);

    // Update XP orbs
    this.updateXpOrbs(dt);

    // Update particles
    this.updateParticles(dt);

    // Update dash trails
    this.updateDashTrails(dt);

    // Player invincibility timer
    if (this.player.invincibleTimer > 0) {
      this.player.invincibleTimer -= dt;
    }

    // Check death
    if (this.player.hp <= 0) {
      this.gameOver = true;
      this.emitState();
    }
  }

  private updateDash(dt: number) {
    const p = this.player;

    if (p.dashCooldown > 0) {
      p.dashCooldown -= dt;
    }

    if (p.dashDir) {
      p.dashProgress += dt / DASH_DURATION;

      if (p.dashProgress >= 1) {
        // Dash complete
        p.x = p.dashTarget.x;
        p.y = p.dashTarget.y;
        p.dashDir = null;
        p.dashCooldown = DASH_COOLDOWN;
      } else {
        // Interpolate position
        const t = this.easeOutQuad(p.dashProgress);
        p.x = p.dashStart.x + (p.dashTarget.x - p.dashStart.x) * t;
        p.y = p.dashStart.y + (p.dashTarget.y - p.dashStart.y) * t;

        // Dash trail
        this.dashTrails.push({
          x: p.x,
          y: p.y,
          life: 1,
          size: PLAYER_SIZE * 0.8,
        });

        // Dash damage to enemies
        for (const e of this.enemies) {
          const dist = Math.hypot(e.x - p.x, e.y - p.y);
          if (dist < PLAYER_SIZE + e.size + 5) {
            if (e.hitTimer <= 0) {
              e.hp -= p.dashDamage;
              e.hitTimer = 0.15;
              // Knockback
              const nx = (e.x - p.x) / Math.max(dist, 1);
              const ny = (e.y - p.y) / Math.max(dist, 1);
              e.x += nx * 20;
              e.y += ny * 20;
              this.spawnHitParticles(e.x, e.y, "#ffffff", 5);
            }
          }
        }
      }
    }
  }

  private easeOutQuad(t: number): number {
    return 1 - (1 - t) * (1 - t);
  }

  private updateEnemies(dt: number) {
    const p = this.player;

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];

      // Move toward player
      const dx = p.x - e.x;
      const dy = p.y - e.y;
      const dist = Math.max(Math.hypot(dx, dy), 1);
      e.x += (dx / dist) * e.speed * dt;
      e.y += (dy / dist) * e.speed * dt;

      // Hit timer
      if (e.hitTimer > 0) e.hitTimer -= dt;

      // Contact damage to player
      if (dist < PLAYER_SIZE + e.size && p.invincibleTimer <= 0 && !p.dashDir) {
        p.hp -= e.damage * dt;
        if (e.hitTimer <= 0) {
          this.spawnHitParticles(p.x, p.y, "#ff0000", 3);
          e.hitTimer = 0.5;
        }
      }

      // Dead check
      if (e.hp <= 0) {
        const color = ENEMY_TEMPLATES[e.type].color;
        this.spawnDeathParticles(e.x, e.y, color);
        // Drop XP
        this.xpOrbs.push({ x: e.x, y: e.y, value: e.xpValue, magnet: false });
        p.killCount++;
        this.enemies.splice(i, 1);
      }
    }

    // Limit enemy count
    if (this.enemies.length > 200) {
      // Remove furthest enemies
      this.enemies.sort(
        (a, b) =>
          Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y),
      );
      this.enemies.length = 150;
    }
  }

  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];

      // Homing projectiles adjust direction
      if (proj.weaponType === "homing" && this.enemies.length > 0) {
        let nearest: Enemy | null = null;
        let nearestDist = Infinity;
        for (const e of this.enemies) {
          const d = Math.hypot(e.x - proj.x, e.y - proj.y);
          if (d < nearestDist) {
            nearestDist = d;
            nearest = e;
          }
        }
        if (nearest && nearestDist < 200) {
          const dx = nearest.x - proj.x;
          const dy = nearest.y - proj.y;
          const d = Math.max(Math.hypot(dx, dy), 1);
          const speed = Math.hypot(proj.vx, proj.vy);
          proj.vx += (dx / d) * 500 * dt;
          proj.vy += (dy / d) * 500 * dt;
          // Normalize to speed
          const currentSpeed = Math.hypot(proj.vx, proj.vy);
          proj.vx = (proj.vx / currentSpeed) * speed;
          proj.vy = (proj.vy / currentSpeed) * speed;
        }
      }

      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;
      proj.lifetime -= dt;

      if (proj.lifetime <= 0) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // Check enemy collisions
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const e = this.enemies[j];
        if (proj.hitEnemies.has(j)) continue;
        const dist = Math.hypot(e.x - proj.x, e.y - proj.y);
        if (dist < proj.size + e.size) {
          e.hp -= proj.damage;
          e.hitTimer = 0.1;
          proj.hitEnemies.add(j);
          this.spawnHitParticles(e.x, e.y, proj.color, 3);
          proj.pierce--;
          if (proj.pierce <= 0) {
            this.projectiles.splice(i, 1);
            break;
          }
        }
      }
    }
  }

  private updateXpOrbs(dt: number) {
    const p = this.player;

    for (let i = this.xpOrbs.length - 1; i >= 0; i--) {
      const orb = this.xpOrbs[i];

      // Magnet
      const dist = Math.hypot(orb.x - p.x, orb.y - p.y);
      if (dist < p.magnetRange || orb.magnet) {
        orb.magnet = true;
        const speed = 300;
        const dx = p.x - orb.x;
        const dy = p.y - orb.y;
        const d = Math.max(dist, 1);
        orb.x += (dx / d) * speed * dt;
        orb.y += (dy / d) * speed * dt;
      }

      // Collect
      if (dist < 15) {
        p.xp += orb.value;
        this.xpOrbs.splice(i, 1);

        // Level up check
        while (p.xp >= p.xpToNext) {
          p.xp -= p.xpToNext;
          p.level++;
          p.xpToNext = Math.floor(XP_BASE * Math.pow(1.2, p.level - 1));
          this.pendingLevelUps++;
        }

        if (this.pendingLevelUps > 0 && !this.upgradeChoices) {
          this.paused = true;
          this.upgradeChoices = this.generateUpgrades();
          this.emitState();
        }
      }
    }

    // Limit orbs
    if (this.xpOrbs.length > 300) {
      this.xpOrbs.splice(0, this.xpOrbs.length - 200);
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.95;
      p.vy *= 0.95;
      p.life -= dt / p.maxLife;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  private updateDashTrails(dt: number) {
    for (let i = this.dashTrails.length - 1; i >= 0; i--) {
      this.dashTrails[i].life -= dt * 4;
      if (this.dashTrails[i].life <= 0) this.dashTrails.splice(i, 1);
    }
  }

  // --- Rendering ---
  private render() {
    const ctx = this.ctx;
    const p = this.player;

    // Camera follows player
    this.camera.x = p.x - W / 2;
    this.camera.y = p.y - H / 2;

    ctx.save();
    ctx.translate(-this.camera.x, -this.camera.y);

    // Background
    this.renderBackground(ctx);

    // XP orbs
    for (const orb of this.xpOrbs) {
      ctx.fillStyle = "#2ecc71";
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, 4 + orb.value, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Dash trails
    for (const trail of this.dashTrails) {
      ctx.globalAlpha = trail.life * 0.5;
      ctx.fillStyle = "#3498db";
      ctx.beginPath();
      ctx.arc(trail.x, trail.y, trail.size * trail.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Enemies
    for (const e of this.enemies) {
      const color = ENEMY_TEMPLATES[e.type].color;
      ctx.fillStyle = e.hitTimer > 0 ? "#ffffff" : color;

      ctx.beginPath();
      ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
      ctx.fill();

      // Boss HP bar
      if (e.type === "boss") {
        const barW = e.size * 2;
        const barH = 4;
        ctx.fillStyle = "#333";
        ctx.fillRect(e.x - barW / 2, e.y - e.size - 10, barW, barH);
        ctx.fillStyle = "#e74c3c";
        ctx.fillRect(
          e.x - barW / 2,
          e.y - e.size - 10,
          barW * (e.hp / e.maxHp),
          barH,
        );
      }
    }

    // Projectiles
    for (const proj of this.projectiles) {
      ctx.fillStyle = proj.color;
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, proj.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Orbit weapon visuals
    const orbitW = this.weapons.find((w) => w.id === "orbit");
    if (orbitW) {
      const count = orbitW.level + 1;
      const radius = 45 + orbitW.level * 5;
      const bladeSize = 8 + orbitW.level * 2;
      for (let i = 0; i < count; i++) {
        const angle = this.orbitAngle + (Math.PI * 2 * i) / count;
        const bx = p.x + Math.cos(angle) * radius;
        const by = p.y + Math.sin(angle) * radius;
        ctx.fillStyle = "#3498db";
        ctx.beginPath();
        ctx.arc(bx, by, bladeSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(52,152,219,0.3)";
        ctx.beginPath();
        ctx.arc(bx, by, bladeSize + 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Player
    const isDashing = !!p.dashDir;
    ctx.fillStyle = isDashing ? "#ffffff" : "#3498db";
    if (p.invincibleTimer > 0 && !isDashing) {
      ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.02) * 0.3;
    }
    ctx.beginPath();
    ctx.arc(p.x, p.y, PLAYER_SIZE, 0, Math.PI * 2);
    ctx.fill();

    // Player inner
    ctx.fillStyle = isDashing ? "#3498db" : "#2980b9";
    ctx.beginPath();
    ctx.arc(p.x, p.y, PLAYER_SIZE * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Direction indicator when dashing
    if (isDashing && p.dashDir) {
      ctx.strokeStyle = "rgba(255,255,255,0.8)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + p.dashDir.x * 25, p.y + p.dashDir.y * 25);
      ctx.stroke();
    }

    // Particles
    for (const part of this.particles) {
      ctx.globalAlpha = Math.max(0, part.life);
      ctx.fillStyle = part.color;
      ctx.beginPath();
      ctx.arc(
        part.x,
        part.y,
        part.size * Math.max(0, part.life),
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.restore();

    // --- HUD (screen space) ---
    this.renderHUD(ctx);
  }

  private renderBackground(ctx: CanvasRenderingContext2D) {
    // Dark background with grid
    const cx = this.camera.x;
    const cy = this.camera.y;

    ctx.fillStyle = "#0a0a1a";
    ctx.fillRect(cx, cy, W, H);

    // Grid
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    const gridSize = 50;
    const startX = Math.floor(cx / gridSize) * gridSize;
    const startY = Math.floor(cy / gridSize) * gridSize;

    for (let x = startX; x < cx + W + gridSize; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, cy);
      ctx.lineTo(x, cy + H);
      ctx.stroke();
    }
    for (let y = startY; y < cy + H + gridSize; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(cx, y);
      ctx.lineTo(cx + W, y);
      ctx.stroke();
    }
  }

  private renderHUD(ctx: CanvasRenderingContext2D) {
    const p = this.player;

    // HP bar
    const hpBarW = W - 40;
    const hpBarH = 10;
    const hpBarX = 20;
    const hpBarY = 15;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(hpBarX - 2, hpBarY - 2, hpBarW + 4, hpBarH + 4);
    ctx.fillStyle = "#333";
    ctx.fillRect(hpBarX, hpBarY, hpBarW, hpBarH);
    const hpRatio = Math.max(0, p.hp / p.maxHp);
    ctx.fillStyle =
      hpRatio > 0.5 ? "#2ecc71" : hpRatio > 0.25 ? "#f39c12" : "#e74c3c";
    ctx.fillRect(hpBarX, hpBarY, hpBarW * hpRatio, hpBarH);

    // XP bar
    const xpBarY = hpBarY + hpBarH + 4;
    const xpBarH = 6;
    ctx.fillStyle = "#222";
    ctx.fillRect(hpBarX, xpBarY, hpBarW, xpBarH);
    ctx.fillStyle = "#9b59b6";
    ctx.fillRect(hpBarX, xpBarY, hpBarW * (p.xp / p.xpToNext), xpBarH);

    // Level & Time
    ctx.fillStyle = "#fff";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`Lv.${p.level}`, 20, xpBarY + xpBarH + 16);

    ctx.textAlign = "right";
    const mins = Math.floor(this.gameTime / 60);
    const secs = Math.floor(this.gameTime % 60);
    ctx.fillText(
      `${mins}:${secs.toString().padStart(2, "0")}`,
      W - 20,
      xpBarY + xpBarH + 16,
    );

    ctx.textAlign = "center";
    ctx.fillText(`Wave ${this.wave}`, W / 2, xpBarY + xpBarH + 16);

    // Kill count
    ctx.textAlign = "left";
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText(`Kill: ${p.killCount}`, 20, xpBarY + xpBarH + 32);

    // Weapon icons
    ctx.textAlign = "right";
    let iconX = W - 20;
    for (const w of this.weapons) {
      ctx.font = "16px sans-serif";
      ctx.fillText(w.icon, iconX, xpBarY + xpBarH + 34);
      ctx.font = "9px sans-serif";
      ctx.fillStyle = "#fff";
      ctx.fillText(`${w.level}`, iconX + 2, xpBarY + xpBarH + 44);
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      iconX -= 28;
    }

    // Upgrade selection UI
    if (this.upgradeChoices) {
      this.renderUpgradeUI(ctx);
    }

    // Game over
    if (this.gameOver) {
      this.renderGameOver(ctx);
    }
  }

  private renderUpgradeUI(ctx: CanvasRenderingContext2D) {
    if (!this.upgradeChoices) return;

    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 22px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("LEVEL UP!", W / 2, 180);
    ctx.font = "14px sans-serif";
    ctx.fillText("選べ", W / 2, 205);

    const cardW = W - 60;
    const cardH = 80;
    const startY = 230;
    const gap = 15;

    for (let i = 0; i < this.upgradeChoices.length; i++) {
      const up = this.upgradeChoices[i];
      const y = startY + i * (cardH + gap);

      // Card bg
      ctx.fillStyle = "rgba(52,73,94,0.9)";
      ctx.beginPath();
      ctx.roundRect(30, y, cardW, cardH, 12);
      ctx.fill();

      // Border
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(30, y, cardW, cardH, 12);
      ctx.stroke();

      // Icon
      ctx.font = "30px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(up.icon, 50, y + 50);

      // Name
      ctx.font = "bold 16px sans-serif";
      ctx.fillStyle = "#fff";
      ctx.fillText(up.name, 95, y + 35);

      // Description
      ctx.font = "13px sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fillText(up.description, 95, y + 58);
    }
  }

  private renderGameOver(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "#e74c3c";
    ctx.font = "bold 36px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", W / 2, H / 2 - 80);

    ctx.fillStyle = "#fff";
    ctx.font = "20px sans-serif";
    const mins = Math.floor(this.gameTime / 60);
    const secs = Math.floor(this.gameTime % 60);
    ctx.fillText(
      `生存時間: ${mins}:${secs.toString().padStart(2, "0")}`,
      W / 2,
      H / 2 - 30,
    );
    ctx.fillText(
      `Lv.${this.player.level}  Kill: ${this.player.killCount}`,
      W / 2,
      H / 2 + 5,
    );
    ctx.fillText(`Wave ${this.wave}`, W / 2, H / 2 + 35);

    // Restart button
    ctx.fillStyle = "#3498db";
    ctx.beginPath();
    ctx.roundRect(W / 2 - 80, H / 2 + 60, 160, 50, 12);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText("もう1回", W / 2, H / 2 + 90);
  }

  // --- Handle clicks on upgrade cards / game over ---
  handleTap(canvasX: number, canvasY: number) {
    if (this.gameOver) {
      // Restart button
      if (
        canvasX > W / 2 - 80 &&
        canvasX < W / 2 + 80 &&
        canvasY > H / 2 + 60 &&
        canvasY < H / 2 + 110
      ) {
        this.restart();
        return true;
      }
      return false;
    }

    if (this.upgradeChoices) {
      const cardW = W - 60;
      const cardH = 80;
      const startY = 230;
      const gap = 15;

      for (let i = 0; i < this.upgradeChoices.length; i++) {
        const y = startY + i * (cardH + gap);
        if (
          canvasX >= 30 &&
          canvasX <= 30 + cardW &&
          canvasY >= y &&
          canvasY <= y + cardH
        ) {
          this.selectUpgrade(i);
          return true;
        }
      }
      return false;
    }

    return false;
  }

  restart() {
    this.player = {
      x: 0,
      y: 0,
      hp: 100,
      maxHp: 100,
      dashDir: null,
      dashProgress: 0,
      dashStart: { x: 0, y: 0 },
      dashTarget: { x: 0, y: 0 },
      dashCooldown: 0,
      dashSpeed: 1,
      dashDamage: BASE_DASH_DAMAGE,
      dashDistance: BASE_DASH_DISTANCE,
      invincibleTimer: 0,
      xp: 0,
      xpToNext: XP_BASE,
      level: 1,
      killCount: 0,
      magnetRange: 60,
    };
    this.enemies = [];
    this.xpOrbs = [];
    this.projectiles = [];
    this.particles = [];
    this.dashTrails = [];
    this.weapons = [];
    this.gameTime = 0;
    this.wave = 1;
    this.spawnTimer = 0;
    this.gameOver = false;
    this.paused = false;
    this.upgradeChoices = null;
    this.pendingLevelUps = 0;
    this.orbitAngle = 0;

    this.addWeapon("orbit");
    this.emitState();
  }

  // --- Game Loop ---
  private gameLoop(time: number) {
    if (this.destroyed) return;

    const dt = this.lastTime
      ? Math.min((time - this.lastTime) / 1000, 0.05)
      : 1 / 60;
    this.lastTime = time;

    this.update(dt);
    this.render();

    this.animFrame = requestAnimationFrame((t) => this.gameLoop(t));
  }

  start() {
    this.animFrame = requestAnimationFrame((t) => this.gameLoop(t));
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.animFrame);
  }

  private emitState() {
    if (this.onStateChange) this.onStateChange();
  }

  getWidth() {
    return W;
  }
  getHeight() {
    return H;
  }
}
