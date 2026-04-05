// All SFX from Freesound.org (CC0) — downloaded to public/sounds/
const SFX = {
  ambience: "/audio/dark-ambience.mp3",
  slash: "/sounds/slash.mp3",
  hit: "/sounds/hit.mp3",
  kill: "/sounds/enemy_die.mp3",
  pickup: "/sounds/xp_pickup.mp3",
  shurikenHit: "/sounds/shuriken.mp3",
  levelup: "/sounds/levelup.mp3",
  select: "/sounds/skill_select.mp3",
  gameover: "/sounds/game_over.mp3",
  lightning: "/sounds/skill_use.mp3",
  fire: "/sounds/skill_use.mp3",
  shadow: "/sounds/shadow_clone.mp3",
  wind: "/sounds/skill_use.mp3",
  kunai: "/sounds/shuriken.mp3",
  bossWarning: "/sounds/boss_appear.mp3",
  ultimateReady: "/sounds/wave_clear.mp3",
  ultimateCast: "/sounds/wave_clear.mp3",
  scroll: "/sounds/skill_select.mp3",
  dash: "/sounds/dash.mp3",
  waveStart: "/sounds/wave_start.mp3",
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
  private running = false;

  // Rate limiters (prevent sound spam)
  private lastPlay: Record<string, number> = {};

  /**
   * Called on every user gesture (pointerdown).
   * Must be synchronous up to ctx.resume() to satisfy autoplay policy.
   */
  async unlock() {
    if (this.destroyed) return;

    // Create AudioContext synchronously on first call
    if (!this.ctx) this.setup();
    if (!this.ctx) return;

    // Resume on EVERY call until running (browsers may need repeated gestures)
    if (this.ctx.state !== "running") {
      try {
        await this.ctx.resume();
      } catch {
        // Some browsers reject resume — try again on next gesture
        return;
      }
    }

    this.running = this.ctx.state === "running";
    this.unlocked = true;

    // Start loading buffers (idempotent)
    if (!this.loadingPromise) this.loadingPromise = this.loadAll();
    await this.loadingPromise;

    this.startAmbience();
  }

  setIntensity(value: number) {
    if (!this.ctx || !this.ambienceGain || !this.ambienceFilter) return;
    const i = clamp(value, 0, 1);
    const now = this.ctx.currentTime;
    this.ambienceGain.gain.cancelScheduledValues(now);
    this.ambienceGain.gain.setTargetAtTime(0.15 + i * 0.15, now, 0.4);
    this.ambienceFilter.frequency.cancelScheduledValues(now);
    this.ambienceFilter.frequency.setTargetAtTime(700 + i * 1800, now, 0.35);
  }

  // === Game Sound Methods ===

  playDash(ultimate = false) {
    this.play("dash", {
      gain: ultimate ? 0.6 : 0.45,
      rate: ultimate ? 0.8 : 0.92 + Math.random() * 0.16,
    });
    this.play("slash", {
      gain: ultimate ? 0.5 : 0.35,
      rate: ultimate ? 0.8 : 0.92 + Math.random() * 0.16,
    });
    this.play("hit", {
      gain: ultimate ? 0.2 : 0.12,
      rate: ultimate ? 0.58 : 0.72,
      delay: 0.015,
    });
    if (ultimate) {
      this.play("ultimateCast", { gain: 0.45, rate: 0.9, delay: 0.02 });
    }
  }

  playKill() {
    if (!this.rateLimit("kill", 0.04)) return;
    this.play("kill", { gain: 0.35, rate: 0.85 + Math.random() * 0.3 });
  }

  playPickup() {
    if (!this.rateLimit("pickup", 0.03)) return;
    this.play("pickup", { gain: 0.3, rate: 0.9 + Math.random() * 0.4 });
  }

  playGoldPickup() {
    if (!this.rateLimit("gold", 0.03)) return;
    this.play("pickup", { gain: 0.25, rate: 1.2 + Math.random() * 0.3 });
  }

  playHurt() {
    if (!this.rateLimit("hurt", 0.08)) return;
    this.play("hit", { gain: 0.5, rate: 0.78 + Math.random() * 0.12 });
    this.play("hit", { gain: 0.2, rate: 0.52, delay: 0.02 });
  }

  playOrbitHit() {
    if (!this.rateLimit("orbit", 0.04)) return;
    this.play("shurikenHit", { gain: 0.25, rate: 0.9 + Math.random() * 0.2 });
  }

  playLevelUp() {
    this.play("levelup", { gain: 0.5, rate: 1.0 });
  }

  playSelect() {
    this.play("select", { gain: 0.4, rate: 1.0 });
  }

  playUpgradeOpen() {
    if (!this.rateLimit("upgrade-open", 0.18)) return;
    this.play("select", { gain: 0.22, rate: 1.3 });
  }

  playGameOver() {
    this.play("gameover", { gain: 0.55, rate: 0.7 });
    this.play("kill", { gain: 0.35, rate: 0.5, delay: 0.15 });
  }

  playVictory() {
    this.play("levelup", { gain: 0.6, rate: 1.2 });
    this.play("waveStart", { gain: 0.4, rate: 1.1, delay: 0.2 });
  }

  playSkill(kind: "lightning" | "fire" | "shadow" | "wind" | "kunai") {
    const map: Record<string, SfxName> = {
      lightning: "lightning",
      fire: "fire",
      shadow: "shadow",
      wind: "wind",
      kunai: "kunai",
    };
    this.play(map[kind], { gain: 0.4, rate: 0.9 + Math.random() * 0.2 });
    if (kind === "lightning") {
      this.play("hit", { gain: 0.16, rate: 0.62, delay: 0.02 });
    } else if (kind === "fire") {
      this.play("slash", { gain: 0.12, rate: 0.72, delay: 0.01 });
    } else if (kind === "shadow") {
      this.play("slash", { gain: 0.18, rate: 0.84, delay: 0.02 });
    } else if (kind === "wind") {
      this.play("pickup", { gain: 0.1, rate: 0.6, delay: 0.01 });
    } else if (kind === "kunai") {
      this.play("shurikenHit", { gain: 0.12, rate: 1.08, delay: 0.01 });
    }
  }

  playScroll(kind: "storm" | "blood" | "shadow") {
    this.play("scroll", {
      gain: 0.45,
      rate: kind === "storm" ? 1.2 : kind === "blood" ? 0.9 : 1.0,
    });
  }

  playBossWarning() {
    this.play("bossWarning", { gain: 0.6, rate: 0.8 });
    this.play("bossWarning", { gain: 0.35, rate: 0.6, delay: 0.3 });
  }

  playWaveStart() {
    this.play("waveStart", { gain: 0.4, rate: 1.0 });
  }

  // Charge sound — continuous rising tone while aiming
  private chargeOsc: OscillatorNode | null = null;
  private chargeGainNode: GainNode | null = null;

  startCharge() {
    if (!this.ctx || !this.sfxBus || this.chargeOsc) return;
    if (!this.running) return; // Don't create oscillators on suspended context
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 200;
    const g = this.ctx.createGain();
    g.gain.value = 0;
    osc.connect(g);
    g.connect(this.sfxBus);
    osc.start();
    this.chargeOsc = osc;
    this.chargeGainNode = g;
  }

  updateCharge(level: number) {
    if (!this.ctx || !this.chargeOsc || !this.chargeGainNode) return;
    const now = this.ctx.currentTime;
    this.chargeOsc.frequency.setTargetAtTime(200 + level * 400, now, 0.05);
    this.chargeGainNode.gain.setTargetAtTime(
      Math.min(level * 0.18, 0.15),
      now,
      0.05,
    );
  }

  stopCharge() {
    if (this.chargeOsc) {
      try {
        this.chargeOsc.stop();
      } catch {
        /* */
      }
      this.chargeOsc.disconnect();
      this.chargeOsc = null;
    }
    if (this.chargeGainNode) {
      this.chargeGainNode.disconnect();
      this.chargeGainNode = null;
    }
  }

  playUltimateReady() {
    this.play("ultimateReady", { gain: 0.5, rate: 1.0 });
  }

  playUltimateCast() {
    this.play("ultimateCast", { gain: 0.55, rate: 0.85 });
    this.play("slash", { gain: 0.4, rate: 0.7, delay: 0.03 });
  }

  // BGM — procedural Japanese pentatonic loop
  private bgmNodes: OscillatorNode[] = [];
  private bgmGain: GainNode | null = null;
  private bgmInterval: ReturnType<typeof setInterval> | null = null;

  pauseBgm() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.3);
    }
  }

  resumeBgm() {
    if (!this.ctx || !this.bgmGain || !this.musicBus) return;
    if (this.bgmNodes.length === 0) return;
    this.bgmGain.gain.setTargetAtTime(1.0, this.ctx.currentTime, 0.5);
    if (!this.bgmInterval) {
      const scale = [220, 261.6, 293.7, 330, 392, 440, 523.3, 587.3, 660];
      let noteIdx = Math.floor(Math.random() * 5);
      this.bgmInterval = setInterval(() => {
        if (!this.ctx || !this.bgmGain || this.destroyed) {
          this.stopBgm();
          return;
        }
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = "triangle";
        osc.frequency.value = scale[noteIdx % scale.length];
        const noteGain = this.ctx.createGain();
        noteGain.gain.setValueAtTime(0.12, now);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.connect(noteGain);
        noteGain.connect(this.bgmGain);
        osc.start(now);
        osc.stop(now + 0.7);
        noteIdx += Math.random() < 0.3 ? 2 : 1;
        if (Math.random() < 0.15) noteIdx = Math.floor(Math.random() * 5);
      }, 400);
    }
  }

  startBgm() {
    if (!this.ctx || !this.musicBus || this.bgmGain) return;
    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.value = 0;
    this.bgmGain.connect(this.musicBus);

    // Fade in over ~2 seconds
    this.bgmGain.gain.setTargetAtTime(1.0, this.ctx.currentTime, 0.8);

    // Drone pad (low A2)
    const drone = this.ctx.createOscillator();
    drone.type = "sine";
    drone.frequency.value = 110;
    const droneG = this.ctx.createGain();
    droneG.gain.value = 0.25;
    drone.connect(droneG);
    droneG.connect(this.bgmGain);
    drone.start();
    this.bgmNodes.push(drone);

    // Drone 5th (E3)
    const drone5 = this.ctx.createOscillator();
    drone5.type = "sine";
    drone5.frequency.value = 165;
    const drone5G = this.ctx.createGain();
    drone5G.gain.value = 0.12;
    drone5.connect(drone5G);
    drone5G.connect(this.bgmGain);
    drone5.start();
    this.bgmNodes.push(drone5);

    // Melodic arpeggio — Japanese In scale (A C D E G)
    const scale = [220, 261.6, 293.7, 330, 392, 440, 523.3, 587.3, 660];
    let noteIdx = 0;

    this.bgmInterval = setInterval(() => {
      if (!this.ctx || !this.bgmGain || this.destroyed) {
        this.stopBgm();
        return;
      }
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      osc.type = "triangle";
      const freq = scale[noteIdx % scale.length];
      osc.frequency.value = freq;

      const noteGain = this.ctx.createGain();
      noteGain.gain.setValueAtTime(0.12, now);
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(noteGain);
      noteGain.connect(this.bgmGain);
      osc.start(now);
      osc.stop(now + 0.7);

      noteIdx += Math.random() < 0.3 ? 2 : 1;
      if (Math.random() < 0.15) noteIdx = Math.floor(Math.random() * 5);
    }, 400);
  }

  stopBgm() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    for (const osc of this.bgmNodes) {
      try {
        osc.stop();
      } catch {
        /* */
      }
      osc.disconnect();
    }
    this.bgmNodes = [];
    if (this.bgmGain) {
      this.bgmGain.disconnect();
      this.bgmGain = null;
    }
  }

  destroy() {
    this.destroyed = true;
    this.stopAmbience();
    this.stopBgm();
    this.stopCharge();
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
    this.master.gain.value = 1.0;

    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -12;
    this.compressor.knee.value = 10;
    this.compressor.ratio.value = 4;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.15;

    this.musicBus = this.ctx.createGain();
    this.musicBus.gain.value = 0.7;

    this.sfxBus = this.ctx.createGain();
    this.sfxBus.gain.value = 1.0;

    this.reverbBus = this.ctx.createGain();
    this.reverbBus.gain.value = 0.15;

    // Reverb (convolver with impulse response)
    this.reverbConvolver = this.ctx.createConvolver();
    this.reverbConvolver.buffer = this.createImpulse(0.8, 3.0);

    // Ambience chain
    this.ambienceFilter = this.ctx.createBiquadFilter();
    this.ambienceFilter.type = "lowpass";
    this.ambienceFilter.frequency.value = 1200;
    this.ambienceFilter.Q.value = 0.5;
    this.ambienceGain = this.ctx.createGain();
    this.ambienceGain.gain.value = 0.15;

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
    const results = await Promise.allSettled(
      entries.map(async ([name, path]) => {
        const res = await fetch(path);
        if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`);
        const ab = await res.arrayBuffer();
        this.buffers[name] = await this.ctx!.decodeAudioData(ab);
        return name;
      }),
    );
    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length > 0) {
      console.warn(
        `[Audio] ${failed.length}/${entries.length} sounds failed to load`,
      );
    }
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
    // If context not running yet, try to resume (will work on next gesture)
    if (this.ctx.state !== "running") return;
    if (!this.unlocked) return;
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
