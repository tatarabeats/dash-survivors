// Meta-progression: gold, permanent upgrades, character unlocks, achievements
// Persisted in localStorage as "ninja-survivors-meta"

export type PermanentUpgradeId =
  | "maxHp"
  | "damage"
  | "armor"
  | "xpGain"
  | "goldGain"
  | "magnet"
  | "cooldown"
  | "speed"
  | "revival"
  | "luck";

export interface PermanentUpgradeDef {
  id: PermanentUpgradeId;
  name: string;
  icon: string;
  desc: string;
  maxLevel: number;
  costs: number[];
  effects: number[];
}

export const PERMANENT_UPGRADES: PermanentUpgradeDef[] = [
  {
    id: "maxHp",
    name: "体力強化",
    icon: "❤️",
    desc: "最大HP+15",
    maxLevel: 5,
    costs: [10, 25, 50, 100, 200],
    effects: [15, 30, 45, 60, 75],
  },
  {
    id: "damage",
    name: "攻撃強化",
    icon: "⚔️",
    desc: "ダッシュ威力+5",
    maxLevel: 5,
    costs: [10, 25, 50, 100, 200],
    effects: [5, 10, 15, 20, 25],
  },
  {
    id: "armor",
    name: "防御強化",
    icon: "🛡️",
    desc: "被ダメ-2",
    maxLevel: 5,
    costs: [15, 30, 60, 120, 250],
    effects: [2, 4, 6, 8, 10],
  },
  {
    id: "xpGain",
    name: "経験値強化",
    icon: "📖",
    desc: "XP獲得+10%",
    maxLevel: 5,
    costs: [10, 25, 50, 100, 200],
    effects: [0.1, 0.2, 0.3, 0.4, 0.5],
  },
  {
    id: "goldGain",
    name: "金運",
    icon: "🪙",
    desc: "Gold獲得+10%",
    maxLevel: 5,
    costs: [15, 30, 60, 120, 250],
    effects: [0.1, 0.2, 0.3, 0.4, 0.5],
  },
  {
    id: "magnet",
    name: "吸引力",
    icon: "🧲",
    desc: "吸引範囲+20",
    maxLevel: 5,
    costs: [10, 20, 40, 80, 160],
    effects: [20, 40, 60, 80, 100],
  },
  {
    id: "cooldown",
    name: "素早さ",
    icon: "💨",
    desc: "CD-5%",
    maxLevel: 5,
    costs: [15, 30, 60, 120, 250],
    effects: [0.05, 0.1, 0.15, 0.2, 0.25],
  },
  {
    id: "speed",
    name: "俊足",
    icon: "👟",
    desc: "移動+8%",
    maxLevel: 5,
    costs: [10, 25, 50, 100, 200],
    effects: [0.08, 0.16, 0.24, 0.32, 0.4],
  },
  {
    id: "revival",
    name: "復活",
    icon: "✨",
    desc: "1回復活(HP30%)",
    maxLevel: 1,
    costs: [300],
    effects: [1],
  },
  {
    id: "luck",
    name: "幸運",
    icon: "🍀",
    desc: "レア度UP+5%",
    maxLevel: 5,
    costs: [15, 30, 60, 120, 250],
    effects: [0.05, 0.1, 0.15, 0.2, 0.25],
  },
];

// Character definitions
export type CharacterId =
  | "ninja"
  | "samurai"
  | "kunoichi"
  | "ronin"
  | "spearmaster"
  | "shadowwalker"
  | "berserker"
  | "collector";

export interface CharacterDef {
  id: CharacterId;
  name: string;
  title: string;
  sprite: string;
  weapon: "katana" | "yari" | "kusarigama" | "shuriken";
  passiveName: string;
  passiveDesc: string;
  unlockAchievement: string | null; // null = initially unlocked
}

export const CHARACTERS: CharacterDef[] = [
  {
    id: "ninja",
    name: "忍",
    title: "影走りの忍",
    sprite: "ninjaIdle",
    weapon: "katana",
    passiveName: "忍道",
    passiveDesc: "バランス型",
    unlockAchievement: null,
  },
  {
    id: "samurai",
    name: "侍",
    title: "一刀両断の侍",
    sprite: "ninjaRed",
    weapon: "katana",
    passiveName: "剛力",
    passiveDesc: "ダッシュ威力+25%",
    unlockAchievement: null,
  },
  {
    id: "kunoichi",
    name: "くノ一",
    title: "疾風のくノ一",
    sprite: "ninjaPurple",
    weapon: "shuriken",
    passiveName: "疾駆",
    passiveDesc: "手裏剣+2本",
    unlockAchievement: "survive_5min",
  },
  {
    id: "ronin",
    name: "浪人",
    title: "鎖使いの浪人",
    sprite: "ninjaGreen",
    weapon: "kusarigama",
    passiveName: "広斬",
    passiveDesc: "斬撃範囲+30%",
    unlockAchievement: "kill_500",
  },
  {
    id: "spearmaster",
    name: "槍師",
    title: "朱槍の槍師",
    sprite: "ninjaBlue",
    weapon: "yari",
    passiveName: "穿貫",
    passiveDesc: "貫通力UP",
    unlockAchievement: "reach_wave10",
  },
  {
    id: "shadowwalker",
    name: "影歩き",
    title: "闇に潜む者",
    sprite: "ninjaPurple",
    weapon: "katana",
    passiveName: "影遁",
    passiveDesc: "影分身Lv1で開始",
    unlockAchievement: "evolve_weapon",
  },
  {
    id: "berserker",
    name: "修羅",
    title: "赤眼の修羅",
    sprite: "ninjaRed",
    weapon: "kusarigama",
    passiveName: "修羅道",
    passiveDesc: "HP半減・威力2倍",
    unlockAchievement: "beat_game",
  },
  {
    id: "collector",
    name: "拾い屋",
    title: "金色の拾い屋",
    sprite: "ninjaGreen",
    weapon: "shuriken",
    passiveName: "蓄財",
    passiveDesc: "ゴールド+50%",
    unlockAchievement: "total_kills_2000",
  },
];

// Achievement definitions
export interface AchievementDef {
  id: string;
  name: string;
  desc: string;
  icon: string;
  check: (stats: RunEndStats) => boolean;
}

export interface RunEndStats {
  time: number;
  kills: number;
  wave: number;
  level: number;
  gold: number;
  victory: boolean;
  evolved: boolean;
  totalKills: number;
  totalRuns: number;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "survive_5min",
    name: "五分の命",
    desc: "5分生存する",
    icon: "⏱️",
    check: (s) => s.time >= 300,
  },
  {
    id: "kill_500",
    name: "五百斬り",
    desc: "累計500体討伐",
    icon: "💀",
    check: (s) => s.totalKills >= 500,
  },
  {
    id: "reach_wave10",
    name: "十波突破",
    desc: "第10波に到達",
    icon: "🌊",
    check: (s) => s.wave >= 10,
  },
  {
    id: "evolve_weapon",
    name: "武器進化",
    desc: "武器を進化させる",
    icon: "✨",
    check: (s) => s.evolved,
  },
  {
    id: "beat_game",
    name: "生還",
    desc: "15分生還する",
    icon: "🏆",
    check: (s) => s.victory,
  },
  {
    id: "total_kills_2000",
    name: "二千斬り",
    desc: "累計2000体討伐",
    icon: "⚰️",
    check: (s) => s.totalKills >= 2000,
  },
  {
    id: "kill_100_run",
    name: "百殺し",
    desc: "1ランで100体討伐",
    icon: "🗡️",
    check: (s) => s.kills >= 100,
  },
  {
    id: "kill_500_run",
    name: "鬼殺し",
    desc: "1ランで500体討伐",
    icon: "👹",
    check: (s) => s.kills >= 500,
  },
  {
    id: "reach_lv10",
    name: "十段",
    desc: "Lv10に到達",
    icon: "📈",
    check: (s) => s.level >= 10,
  },
  {
    id: "reach_lv20",
    name: "二十段",
    desc: "Lv20に到達",
    icon: "📈",
    check: (s) => s.level >= 20,
  },
  {
    id: "survive_3min",
    name: "三分の命",
    desc: "3分生存する",
    icon: "⏱️",
    check: (s) => s.time >= 180,
  },
  {
    id: "survive_10min",
    name: "十分の命",
    desc: "10分生存する",
    icon: "⏱️",
    check: (s) => s.time >= 600,
  },
  {
    id: "earn_100gold",
    name: "小金持ち",
    desc: "1ランで100G獲得",
    icon: "🪙",
    check: (s) => s.gold >= 100,
  },
  {
    id: "total_runs_10",
    name: "十戦錬磨",
    desc: "10回プレイ",
    icon: "🔄",
    check: (s) => s.totalRuns >= 10,
  },
  {
    id: "total_runs_50",
    name: "百戦錬磨",
    desc: "50回プレイ",
    icon: "🔄",
    check: (s) => s.totalRuns >= 50,
  },
];

// Persistent state
export interface MetaState {
  gold: number;
  upgrades: Record<PermanentUpgradeId, number>;
  unlockedCharacters: CharacterId[];
  achievements: Record<string, boolean>;
  bestTime: number;
  bestKills: number;
  bestWave: number;
  totalRuns: number;
  totalKills: number;
}

const STORAGE_KEY = "ninja-survivors-meta";
const OLD_STORAGE_KEY = "ninja-survivors-best";

function defaultState(): MetaState {
  return {
    gold: 0,
    upgrades: {
      maxHp: 0,
      damage: 0,
      armor: 0,
      xpGain: 0,
      goldGain: 0,
      magnet: 0,
      cooldown: 0,
      speed: 0,
      revival: 0,
      luck: 0,
    },
    unlockedCharacters: ["ninja", "samurai"],
    achievements: {},
    bestTime: 0,
    bestKills: 0,
    bestWave: 0,
    totalRuns: 0,
    totalKills: 0,
  };
}

export class MetaStore {
  private state: MetaState;

  constructor() {
    this.state = this.load();
  }

  private load(): MetaState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return { ...defaultState(), ...parsed };
      }
      // Migrate from old format
      const old = localStorage.getItem(OLD_STORAGE_KEY);
      if (old) {
        const parsed = JSON.parse(old);
        const state = defaultState();
        state.bestTime = parsed.time ?? 0;
        state.bestKills = parsed.kills ?? 0;
        state.bestWave = parsed.wave ?? 0;
        return state;
      }
    } catch {
      /* */
    }
    return defaultState();
  }

  save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      /* */
    }
  }

  // Gold
  getGold(): number {
    return this.state.gold;
  }
  addGold(amount: number): void {
    this.state.gold += Math.floor(amount);
    this.save();
  }
  spendGold(amount: number): boolean {
    if (this.state.gold < amount) return false;
    this.state.gold -= amount;
    this.save();
    return true;
  }

  // Permanent upgrades
  getUpgradeLevel(id: PermanentUpgradeId): number {
    return this.state.upgrades[id] ?? 0;
  }
  getUpgradeEffect(id: PermanentUpgradeId): number {
    const level = this.getUpgradeLevel(id);
    if (level === 0) return 0;
    const def = PERMANENT_UPGRADES.find((u) => u.id === id)!;
    return def.effects[level - 1];
  }
  getUpgradeCost(id: PermanentUpgradeId): number {
    const def = PERMANENT_UPGRADES.find((u) => u.id === id)!;
    const level = this.getUpgradeLevel(id);
    if (level >= def.maxLevel) return -1;
    return def.costs[level];
  }
  purchaseUpgrade(id: PermanentUpgradeId): boolean {
    const cost = this.getUpgradeCost(id);
    if (cost < 0) return false;
    if (!this.spendGold(cost)) return false;
    this.state.upgrades[id] = (this.state.upgrades[id] ?? 0) + 1;
    this.save();
    return true;
  }

  // Stat bonuses (applied at run start)
  getBonusMaxHp(): number {
    return this.getUpgradeEffect("maxHp");
  }
  getBonusDamage(): number {
    return this.getUpgradeEffect("damage");
  }
  getBonusArmor(): number {
    return this.getUpgradeEffect("armor");
  }
  getBonusXpGain(): number {
    return this.getUpgradeEffect("xpGain");
  }
  getBonusGoldGain(): number {
    return this.getUpgradeEffect("goldGain");
  }
  getBonusMagnet(): number {
    return this.getUpgradeEffect("magnet");
  }
  getBonusCooldownReduction(): number {
    return this.getUpgradeEffect("cooldown");
  }
  getBonusSpeed(): number {
    return this.getUpgradeEffect("speed");
  }
  hasRevival(): boolean {
    return this.getUpgradeLevel("revival") >= 1;
  }
  getBonusLuck(): number {
    return this.getUpgradeEffect("luck");
  }

  // Characters
  isCharacterUnlocked(id: CharacterId): boolean {
    return this.state.unlockedCharacters.includes(id);
  }
  unlockCharacter(id: CharacterId): void {
    if (!this.state.unlockedCharacters.includes(id)) {
      this.state.unlockedCharacters.push(id);
      this.save();
    }
  }

  // Achievements
  isAchievementComplete(id: string): boolean {
    return this.state.achievements[id] === true;
  }
  completeAchievement(id: string): void {
    this.state.achievements[id] = true;
    this.save();
  }

  // Check achievements and unlock rewards
  checkAchievements(stats: RunEndStats): string[] {
    const newlyUnlocked: string[] = [];
    for (const ach of ACHIEVEMENTS) {
      if (this.isAchievementComplete(ach.id)) continue;
      if (ach.check(stats)) {
        this.completeAchievement(ach.id);
        newlyUnlocked.push(ach.id);
        // Unlock character if this achievement is tied to one
        for (const ch of CHARACTERS) {
          if (ch.unlockAchievement === ach.id) {
            this.unlockCharacter(ch.id);
          }
        }
      }
    }
    return newlyUnlocked;
  }

  // Get nearest incomplete achievement with progress
  getNearestAchievement(
    stats: RunEndStats,
  ): { name: string; desc: string; progress: number } | null {
    for (const ach of ACHIEVEMENTS) {
      if (this.isAchievementComplete(ach.id)) continue;
      // Estimate progress based on achievement type
      let progress = 0;
      if (ach.id === "survive_5min") progress = Math.min(1, stats.time / 300);
      else if (ach.id === "survive_3min")
        progress = Math.min(1, stats.time / 180);
      else if (ach.id === "survive_10min")
        progress = Math.min(1, stats.time / 600);
      else if (ach.id === "kill_500")
        progress = Math.min(1, stats.totalKills / 500);
      else if (ach.id === "total_kills_2000")
        progress = Math.min(1, stats.totalKills / 2000);
      else if (ach.id === "reach_wave10")
        progress = Math.min(1, stats.wave / 10);
      else if (ach.id === "kill_100_run")
        progress = Math.min(1, stats.kills / 100);
      else if (ach.id === "kill_500_run")
        progress = Math.min(1, stats.kills / 500);
      else if (ach.id === "reach_lv10")
        progress = Math.min(1, stats.level / 10);
      else if (ach.id === "reach_lv20")
        progress = Math.min(1, stats.level / 20);
      else if (ach.id === "earn_100gold")
        progress = Math.min(1, stats.gold / 100);
      else if (ach.id === "total_runs_10")
        progress = Math.min(1, stats.totalRuns / 10);
      else if (ach.id === "total_runs_50")
        progress = Math.min(1, stats.totalRuns / 50);
      else if (ach.id === "evolve_weapon") progress = 0;
      else if (ach.id === "beat_game") progress = Math.min(1, stats.time / 900);
      if (progress > 0 && progress < 1) {
        // Find character unlock tied to this achievement
        const ch = CHARACTERS.find((c) => c.unlockAchievement === ach.id);
        const rewardStr = ch ? `${ch.name}解放` : ach.name;
        return { name: rewardStr, desc: ach.desc, progress };
      }
    }
    return null;
  }

  // Best scores
  getBestTime(): number {
    return this.state.bestTime;
  }
  getBestKills(): number {
    return this.state.bestKills;
  }
  getBestWave(): number {
    return this.state.bestWave;
  }
  getTotalRuns(): number {
    return this.state.totalRuns;
  }
  getTotalKills(): number {
    return this.state.totalKills;
  }

  updateRunEnd(time: number, kills: number, wave: number): void {
    this.state.bestTime = Math.max(this.state.bestTime, time);
    this.state.bestKills = Math.max(this.state.bestKills, kills);
    this.state.bestWave = Math.max(this.state.bestWave, wave);
    this.state.totalRuns += 1;
    this.state.totalKills += kills;
    this.save();
  }

  // For dojo screen
  getAllUpgrades(): {
    def: PermanentUpgradeDef;
    level: number;
    cost: number;
  }[] {
    return PERMANENT_UPGRADES.map((def) => ({
      def,
      level: this.getUpgradeLevel(def.id),
      cost: this.getUpgradeCost(def.id),
    }));
  }

  getState(): MetaState {
    return this.state;
  }
}
