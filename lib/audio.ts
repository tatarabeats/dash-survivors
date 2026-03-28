// All SFX from Kenney.nl (CC0) — real audio files, no synthesis
const SFX = {
  ambience: "/audio/dark-ambience.mp3",
  slash: "/audio/sfx/slash.ogg",
  hit: "/audio/sfx/hit.ogg",
  kill: "/audio/sfx/kill.ogg",
  pickup: "/audio/sfx/pickup.ogg",
  shurikenHit: "/audio/sfx/shuriken-hit.ogg",
  levelup: "/audio/sfx/levelup.ogg",
  select: "/audio/sfx/select.ogg",
  gameover: "/audio/sfx/gameover.ogg",
  lightning: "/audio/sfx/lightning.ogg",
  fire: "/audio/sfx/fire.ogg",
  shadow: "/audio/sfx/shadow.ogg",
  wind: "/audio/sfx/wind.ogg",
  kunai: "/audio/sfx/kunai.ogg",
  bossWarning: "/audio/sfx/boss-warning.ogg",
  ultimateReady: "/audio/sfx/ultimate-ready.ogg",
  ultimateCast: "/audio/sfx/ultimate-cast.ogg",
  scroll: "/audio/sfx/scroll.ogg",
} as const;

type SfxName = keyof typeof SFX;

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

export class GameAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private musicBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private reverbBus: GainNode | null = null;
  private reverbConvolver: ConvolverNode | null = null;
  private ambienceFilter: BiquadFilterNode | null = null;
  private ambienceSource: AudioBufferSourceNode | null = null;
  private ambienceGain: GainNode | null = null;
  private buffers: Partial<Record<SfxName, AudioBuffer>> = {};
  private loadingPromise: Promise<void> | null = null;
  private unlocked = false;
  private destroyed = false;

  // Rate limiters (prevent sound spam)
  private lastPlay: Record<string, number> = {};

  async unlock() {
    if (this.destroyed) return;
    if (!this.ctx) this.setup();
    if (!this.ctx) return;
    if (this.ctx.state !== "running") await this.ctx.resume();
    this.unlocked = true;
    if (!this.loadingPromise) this.loadingPromise = this.loadAll();
    await this.loadingPromise;
    this.startAmbience();
  }

  setIntensity(value: number) {
    if (!this.ctx || !this.ambienceGain || !this.ambienceFilter) return;
    const i = clamp(value, 0, 1);
    const now = this.ctx.currentTime;
    this.ambienceGain.gain.cancelScheduledValues(now);
    this.ambienceGain.gain.setTargetAtTime(0.12 + i * 0.12, now, 0.4);
    this.ambienceFilter.frequency.cancelScheduledValues(now);
    this.ambienceFilter.frequency.setTargetAtTime(700 + i * 1800, now, 0.35);
  }

  // === Game Sound Methods (all use real audio buffers) ===

  playDash(ultimate = false) {
    this.play("slash", {
      gain: ultimate ? 0.5 : 0.35,
      rate: ultimate ? 0.8 : 0.92 + Math.random() * 0.16,
    });
    this.play("hit", {
      gain: ultimate ? 0.18 : 0.1,
      rate: ultimate ? 0.58 : 0.72,
      delay: 0.015,
    });
    if (ultimate) {
      this.play("ultimateCast", { gain: 0.4, rate: 0.9, delay: 0.02 });
    }
  }

  playKill() {
    if (!this.rateLimit("kill", 0.04)) return;
    this.play("kill", { gain: 0.3, rate: 0.85 + Math.random() * 0.3 });
  }

  playPickup() {
    if (!this.rateLimit("pickup", 0.03)) return;
    this.play("pickup", { gain: 0.25, rate: 0.9 + Math.random() * 0.4 });
  }

  playHurt() {
    if (!this.rateLimit("hurt", 0.08)) return;
    this.play("hit", { gain: 0.42, rate: 0.78 + Math.random() * 0.12 });
    this.play("hit", { gain: 0.16, rate: 0.52, delay: 0.02 });
  }

  playOrbitHit() {
    if (!this.rateLimit("orbit", 0.04)) return;
    this.play("shurikenHit", { gain: 0.2, rate: 0.9 + Math.random() * 0.2 });
  }

  playLevelUp() {
    this.play("levelup", { gain: 0.4, rate: 1.0 });
  }

  playSelect() {
    this.play("select", { gain: 0.35, rate: 1.0 });
  }

  playUpgradeOpen() {
    if (!this.rateLimit("upgrade-open", 0.18)) return;
    this.play("levelup", { gain: 0.28, rate: 1.06 });
    this.play("select", { gain: 0.26, rate: 0.86, delay: 0.04 });
  }

  playGameOver() {
    this.play("gameover", { gain: 0.45, rate: 0.7 });
    this.play("kill", { gain: 0.3, rate: 0.5, delay: 0.15 });
  }

  playSkill(kind: "lightning" | "fire" | "shadow" | "wind" | "kunai") {
    const map: Record<string, SfxName> = {
      lightning: "lightning",
      fire: "fire",
      shadow: "shadow",
      wind: "wind",
      kunai: "kunai",
    };
    this.play(map[kind], { gain: 0.35, rate: 0.9 + Math.random() * 0.2 });
    if (kind === "lightning") {
      this.play("hit", { gain: 0.14, rate: 0.62, delay: 0.02 });
    } else if (kind === "fire") {
      this.play("slash", { gain: 0.1, rate: 0.72, delay: 0.01 });
    } else if (kind === "shadow") {
      this.play("slash", { gain: 0.16, rate: 0.84, delay: 0.02 });
    } else if (kind === "wind") {
      this.play("pickup", { gain: 0.08, rate: 0.6, delay: 0.01 });
    } else if (kind === "kunai") {
      this.play("shurikenHit", { gain: 0.1, rate: 1.08, delay: 0.01 });
    }
  }

  playScroll(kind: "storm" | "blood" | "shadow") {
    this.play("scroll", {
      gain: 0.4,
      rate: kind === "storm" ? 1.2 : kind === "blood" ? 0.9 : 1.0,
    });
  }

  playBossWarning() {
    this.play("bossWarning", { gain: 0.5, rate: 0.8 });
    this.play("bossWarning", { gain: 0.3, rate: 0.6, delay: 0.3 });
  }

  playUltimateReady() {
    this.play("ultimateReady", { gain: 0.45, rate: 1.0 });
  }

  playUltimateCast() {
    this.play("ultimateCast", { gain: 0.5, rate: 0.85 });
    this.play("slash", { gain: 0.35, rate: 0.7, delay: 0.03 });
  }

  destroy() {
    this.destroyed = true;
    this.stopAmbience();
    if (this.ctx) void this.ctx.close();
    this.ctx = null;
    this.master = null;
    this.compressor = null;
    this.musicBus = null;
    this.sfxBus = null;
    this.reverbBus = null;
    this.reverbConvolver = null;
    this.ambienceFilter = null;
    this.ambienceGain = null;
  }

  // === Internal ===

  private setup() {
    if (typeof window === "undefined" || this.ctx) return;
    const W = window as Window & { webkitAudioContext?: typeof AudioContext };
    const Ctor = window.AudioContext || W.webkitAudioContext;
    if (!Ctor) return;

    this.ctx = new Ctor();

    // Master chain: sfxBus + musicBus → compressor → master → destination
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.85;

    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -18;
    this.compressor.knee.value = 12;
    this.compressor.ratio.value = 4;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.15;

    this.musicBus = this.ctx.createGain();
    this.musicBus.gain.value = 0.5;

    this.sfxBus = this.ctx.createGain();
    this.sfxBus.gain.value = 0.9;

    this.reverbBus = this.ctx.createGain();
    this.reverbBus.gain.value = 0.18;

    // Reverb (convolver with impulse response)
    this.reverbConvolver = this.ctx.createConvolver();
    this.reverbConvolver.buffer = this.createImpulse(0.8, 3.0);

    // Ambience chain
    this.ambienceFilter = this.ctx.createBiquadFilter();
    this.ambienceFilter.type = "lowpass";
    this.ambienceFilter.frequency.value = 1200;
    this.ambienceFilter.Q.value = 0.5;
    this.ambienceGain = this.ctx.createGain();
    this.ambienceGain.gain.value = 0.12;

    // Routing
    this.musicBus.connect(this.compressor);
    this.sfxBus.connect(this.compressor);
    this.sfxBus.connect(this.reverbConvolver);
    this.reverbConvolver.connect(this.reverbBus);
    this.reverbBus.connect(this.compressor);
    this.compressor.connect(this.master);
    this.master.connect(this.ctx.destination);
    this.ambienceGain.connect(this.ambienceFilter);
    this.ambienceFilter.connect(this.musicBus);
  }

  private createImpulse(duration: number, decay: number): AudioBuffer {
    const rate = this.ctx!.sampleRate;
    const len = Math.floor(rate * duration);
    const buf = this.ctx!.createBuffer(2, len, rate);
    const L = buf.getChannelData(0);
    const R = buf.getChannelData(1);
    for (let i = 0; i < len; i++) {
      const env = Math.exp(-(i / len) * decay);
      L[i] = (Math.random() * 2 - 1) * env;
      R[i] = (Math.random() * 2 - 1) * env;
    }
    return buf;
  }

  private async loadAll() {
    if (!this.ctx) return;
    const entries = Object.entries(SFX) as [SfxName, string][];
    await Promise.all(
      entries.map(async ([name, path]) => {
        try {
          const res = await fetch(path);
          if (!res.ok) return;
          const ab = await res.arrayBuffer();
          this.buffers[name] = await this.ctx!.decodeAudioData(ab);
        } catch {
          // Silent fail — game works without individual sounds
        }
      }),
    );
  }

  private startAmbience() {
    if (!this.ctx || !this.unlocked || this.ambienceSource) return;
    const buf = this.buffers.ambience;
    if (!buf || !this.ambienceGain) return;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    src.connect(this.ambienceGain);
    src.start();
    this.ambienceSource = src;
  }

  private stopAmbience() {
    if (!this.ambienceSource) return;
    try {
      this.ambienceSource.stop();
    } catch {
      /* */
    }
    this.ambienceSource.disconnect();
    this.ambienceSource = null;
  }

  private play(
    name: SfxName,
    opts: { gain?: number; rate?: number; delay?: number } = {},
  ) {
    if (!this.ctx || !this.sfxBus || this.destroyed) return;
    if (!this.unlocked) void this.unlock();
    const buf = this.buffers[name];
    if (!buf) return;

    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = opts.rate ?? 1;

    const gain = this.ctx.createGain();
    gain.gain.value = opts.gain ?? 0.3;

    src.connect(gain);
    gain.connect(this.sfxBus);

    const when = this.ctx.currentTime + (opts.delay ?? 0);
    src.start(when);
  }

  private rateLimit(key: string, minInterval: number): boolean {
    if (!this.ctx) return false;
    const now = this.ctx.currentTime;
    if (now - (this.lastPlay[key] ?? 0) < minInterval) return false;
    this.lastPlay[key] = now;
    return true;
  }
}
