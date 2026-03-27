const ASSET_PATHS = {
  ambience: "/audio/dark-ambience.mp3",
  dash: "/audio/dash-slash.wav",
  thunder: "/audio/thunderclap.ogg",
} as const;

type AssetName = keyof typeof ASSET_PATHS;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
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
  private assets: Partial<Record<AssetName, AudioBuffer>> = {};
  private loadingPromise: Promise<void> | null = null;
  private unlocked = false;
  private destroyed = false;
  private lastSparkAt = 0;
  private lastPickupAt = 0;
  private lastKillAt = 0;
  private pickupPitch = 0;

  async unlock() {
    if (this.destroyed) return;
    if (!this.ctx) this.setup();
    if (!this.ctx) return;

    if (this.ctx.state !== "running") {
      await this.ctx.resume();
    }

    this.unlocked = true;
    if (!this.loadingPromise) {
      this.loadingPromise = this.loadAssets();
    }
    await this.loadingPromise;
    this.ensureAmbience();
  }

  setIntensity(value: number) {
    if (!this.ctx || !this.ambienceGain || !this.ambienceFilter) return;
    const intensity = clamp(value, 0, 1);
    const now = this.ctx.currentTime;
    this.ambienceGain.gain.cancelScheduledValues(now);
    this.ambienceGain.gain.setTargetAtTime(0.14 + intensity * 0.12, now, 0.4);
    this.ambienceFilter.frequency.cancelScheduledValues(now);
    this.ambienceFilter.frequency.setTargetAtTime(
      700 + intensity * 1800,
      now,
      0.35,
    );
  }

  playDash(ultimate = false) {
    this.ensureReady();
    // Layer 1: actual slash sample if available
    this.playBuffer("dash", {
      gain: ultimate ? 0.4 : 0.3,
      playbackRate: ultimate ? 0.75 : 0.9 + Math.random() * 0.15,
      highpass: 140,
    });
    if (ultimate) {
      this.playBuffer("thunder", {
        gain: 0.18,
        playbackRate: 1.16,
        highpass: 80,
        lowpass: 2400,
        delay: 0.01,
      });
    }
    // Layer 2: metallic sweep
    this.playSweep(
      ultimate ? 1600 : 1200,
      200,
      ultimate ? 0.18 : 0.12,
      "sawtooth",
      ultimate ? 0.1 : 0.06,
    );
    // Layer 3: sharp noise burst (sword air)
    this.playNoiseBurst(
      ultimate ? 0.12 : 0.08,
      ultimate ? 1600 : 2000,
      ultimate ? 0.12 : 0.09,
    );
    // Layer 4: sub-bass thump for weight
    this.playTone(
      ultimate ? 60 : 80,
      30,
      ultimate ? 0.25 : 0.15,
      "sine",
      ultimate ? 0.18 : 0.12,
    );
    // Layer 5: high metallic ring
    this.playTone(
      ultimate ? 3200 : 2400,
      1800,
      ultimate ? 0.1 : 0.06,
      "sine",
      ultimate ? 0.05 : 0.03,
    );
    if (ultimate) {
      // Extra layers for ultimate
      this.playTone(440, 880, 0.2, "triangle", 0.06, 0.02);
      this.playNoiseBurst(0.15, 800, 0.08, 0.03);
    }
  }

  playKill() {
    if (!this.ctx) return;
    if (this.ctx.currentTime - this.lastKillAt < 0.04) return;
    this.lastKillAt = this.ctx.currentTime;
    // Satisfying thump + crunch
    this.playTone(140, 60, 0.12, "sine", 0.1);
    this.playNoiseBurst(0.06, 1200, 0.06);
    this.playTone(380, 200, 0.06, "triangle", 0.04);
  }

  playPickup() {
    if (!this.ctx) return;
    if (this.ctx.currentTime - this.lastPickupAt < 0.035) return;
    this.lastPickupAt = this.ctx.currentTime;
    // Rising pitch for consecutive pickups
    this.pickupPitch = Math.min(this.pickupPitch + 1, 12);
    const base = 660 + this.pickupPitch * 40;
    this.playTone(base, base * 1.3, 0.06, "sine", 0.05);
    this.playTone(base * 1.5, base * 1.8, 0.04, "triangle", 0.02, 0.01);
    // Reset pitch after a gap
    setTimeout(() => {
      this.pickupPitch = Math.max(0, this.pickupPitch - 2);
    }, 200);
  }

  playOrbitHit() {
    if (!this.ctx) return;
    if (this.ctx.currentTime - this.lastSparkAt < 0.045) return;
    this.lastSparkAt = this.ctx.currentTime;
    // Metallic shuriken impact
    this.playTone(1800, 900, 0.05, "square", 0.025);
    this.playTone(2600, 1400, 0.035, "sine", 0.02);
    this.playNoiseBurst(0.03, 3000, 0.025);
  }

  playLevelUp() {
    this.ensureReady();
    // Japanese pentatonic scale arpeggio: D E G A B
    const notes = [293.66, 329.63, 392.0, 440.0, 493.88, 587.33];
    notes.forEach((note, index) => {
      this.playTone(note, note * 1.02, 0.22, "sine", 0.07, index * 0.055);
      this.playTone(
        note * 2,
        note * 2.02,
        0.18,
        "triangle",
        0.025,
        index * 0.055,
      );
    });
    // Shimmer
    this.playNoiseBurst(0.3, 4000, 0.04, 0.1);
    // Sub confirmation
    this.playTone(146.83, 146.83, 0.4, "sine", 0.06);
  }

  playSelect() {
    this.ensureReady();
    this.playTone(440, 660, 0.1, "triangle", 0.08);
    this.playTone(880, 1320, 0.06, "sine", 0.03, 0.02);
    this.playNoiseBurst(0.04, 2400, 0.03);
  }

  playGameOver() {
    this.ensureReady();
    // Dramatic descending tones
    this.playSweep(340, 55, 1.2, "sawtooth", 0.14);
    this.playSweep(220, 40, 1.4, "square", 0.06, 0.15);
    this.playNoiseBurst(0.5, 300, 0.18);
    this.playTone(55, 30, 1.5, "sine", 0.15, 0.3);
    // Eerie high overtone
    this.playTone(880, 440, 0.8, "sine", 0.04, 0.2);
  }

  playSkill(kind: "lightning" | "fire" | "shadow" | "wind" | "kunai") {
    this.ensureReady();
    switch (kind) {
      case "lightning":
        this.playBuffer("thunder", {
          gain: 0.18,
          playbackRate: 1.2 + Math.random() * 0.18,
          highpass: 120,
          lowpass: 2800,
        });
        this.playNoiseBurst(0.09, 2400, 0.12);
        this.playNoiseBurst(0.06, 5200, 0.06, 0.015);
        this.playTone(720, 1800, 0.08, "square", 0.08);
        this.playTone(1600, 3600, 0.05, "sawtooth", 0.04, 0.01);
        this.playTone(90, 48, 0.18, "sine", 0.12);
        break;
      case "fire":
        // Whoosh + crackle
        this.playNoiseBurst(0.08, 600, 0.1);
        this.playSweep(300, 120, 0.15, "sawtooth", 0.06);
        this.playNoiseBurst(0.12, 2000, 0.04, 0.05);
        break;
      case "shadow":
        // Ethereal slash
        this.playSweep(300, 100, 0.18, "triangle", 0.07);
        this.playTone(600, 200, 0.12, "sine", 0.04);
        this.playNoiseBurst(0.06, 1800, 0.03);
        break;
      case "wind":
        // Whooshing wind
        this.playNoiseBurst(0.06, 1200, 0.06);
        this.playSweep(500, 900, 0.1, "sine", 0.05);
        this.playNoiseBurst(0.1, 3000, 0.03, 0.03);
        break;
      case "kunai":
        // Sharp throw
        this.playTone(600, 1200, 0.06, "triangle", 0.06);
        this.playNoiseBurst(0.04, 4000, 0.04);
        this.playTone(1200, 800, 0.05, "sine", 0.02, 0.02);
        break;
    }
  }

  playScroll(kind: "storm" | "blood" | "shadow") {
    this.ensureReady();
    if (kind === "storm") {
      this.playBuffer("thunder", {
        gain: 0.2,
        playbackRate: 1.08,
        highpass: 90,
        lowpass: 2600,
      });
      this.playTone(520, 980, 0.14, "triangle", 0.08);
      this.playNoiseBurst(0.08, 2800, 0.07);
      return;
    }
    if (kind === "blood") {
      this.playTone(180, 110, 0.22, "sawtooth", 0.08);
      this.playTone(96, 72, 0.35, "sine", 0.12);
      this.playNoiseBurst(0.06, 700, 0.05);
      return;
    }
    this.playSweep(280, 140, 0.24, "triangle", 0.06);
    this.playTone(660, 330, 0.18, "sine", 0.04);
    this.playNoiseBurst(0.05, 1800, 0.03);
  }

  playUltimateReady() {
    this.ensureReady();
    this.playTone(440, 660, 0.12, "triangle", 0.08);
    this.playTone(660, 990, 0.16, "sine", 0.05, 0.04);
    this.playTone(110, 110, 0.28, "sine", 0.06);
  }

  playUltimateCast() {
    this.ensureReady();
    this.playBuffer("thunder", {
      gain: 0.24,
      playbackRate: 0.96,
      highpass: 70,
      lowpass: 2200,
    });
    this.playNoiseBurst(0.15, 1800, 0.16);
    this.playNoiseBurst(0.09, 4200, 0.08, 0.02);
    this.playSweep(1800, 180, 0.24, "sawtooth", 0.11);
    this.playTone(65, 36, 0.4, "sine", 0.2);
  }

  playBossWarning() {
    this.ensureReady();
    // Ominous drums
    this.playBuffer("thunder", {
      gain: 0.12,
      playbackRate: 0.92,
      highpass: 60,
      lowpass: 1800,
    });
    this.playTone(65, 40, 0.5, "sine", 0.18);
    this.playNoiseBurst(0.15, 200, 0.12);
    this.playTone(87.31, 65, 0.4, "sine", 0.14, 0.3);
    this.playNoiseBurst(0.12, 200, 0.1, 0.3);
    // High dissonance
    this.playTone(466.16, 440, 0.6, "sawtooth", 0.03, 0.1);
  }

  destroy() {
    this.destroyed = true;
    this.stopAmbience();
    if (this.ctx) {
      void this.ctx.close();
    }
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

  private setup() {
    if (typeof window === "undefined" || this.ctx) return;
    const legacyWindow = window as Window & {
      webkitAudioContext?: typeof AudioContext;
    };
    const AudioCtor = window.AudioContext || legacyWindow.webkitAudioContext;
    if (!AudioCtor) return;

    this.ctx = new AudioCtor();
    this.master = this.ctx.createGain();
    this.compressor = this.ctx.createDynamicsCompressor();
    this.musicBus = this.ctx.createGain();
    this.sfxBus = this.ctx.createGain();
    this.reverbBus = this.ctx.createGain();
    this.ambienceFilter = this.ctx.createBiquadFilter();
    this.ambienceGain = this.ctx.createGain();

    this.master.gain.value = 0.85;
    this.compressor.threshold.value = -18;
    this.compressor.knee.value = 18;
    this.compressor.ratio.value = 3;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.18;
    this.musicBus.gain.value = 0.6;
    this.sfxBus.gain.value = 0.88;
    this.reverbBus.gain.value = 0.25;
    this.ambienceGain.gain.value = 0.14;
    this.ambienceFilter.type = "lowpass";
    this.ambienceFilter.frequency.value = 1200;
    this.ambienceFilter.Q.value = 0.5;

    // Create reverb via IIR approach (simple delay network)
    this.reverbConvolver = this.ctx.createConvolver();
    this.reverbConvolver.buffer = this.createReverbImpulse(1.2, 3.5);

    this.musicBus.connect(this.master);
    this.sfxBus.connect(this.master);

    // Reverb chain: sfxBus -> reverbConvolver -> reverbBus -> master
    this.sfxBus.connect(this.reverbConvolver);
    this.reverbConvolver.connect(this.reverbBus);
    this.reverbBus.connect(this.master);

    this.master.connect(this.compressor);
    this.compressor.connect(this.ctx.destination);
    this.ambienceGain.connect(this.ambienceFilter);
    this.ambienceFilter.connect(this.musicBus);
  }

  private createReverbImpulse(duration: number, decay: number): AudioBuffer {
    if (!this.ctx) throw new Error("no audio context");
    const rate = this.ctx.sampleRate;
    const length = Math.floor(rate * duration);
    const buffer = this.ctx.createBuffer(2, length, rate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const t = i / length;
      const envelope = Math.exp(-t * decay);
      // Shaped noise for more natural reverb
      const noise = (Math.random() * 2 - 1) * envelope;
      // Slight stereo spread
      left[i] = noise * (0.8 + Math.random() * 0.2);
      right[i] = noise * (0.8 + Math.random() * 0.2);
      // Add some early reflections
      if (i < rate * 0.05) {
        const early = Math.sin(i * 0.01) * envelope * 0.6;
        left[i] += early;
        right[i] += early * 0.8;
      }
    }
    return buffer;
  }

  private async loadAssets() {
    if (!this.ctx) return;
    const entries = Object.entries(ASSET_PATHS) as Array<[AssetName, string]>;
    await Promise.all(
      entries.map(async ([name, path]) => {
        try {
          const response = await fetch(path);
          if (!response.ok) return;
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await this.ctx!.decodeAudioData(arrayBuffer);
          this.assets[name] = audioBuffer;
        } catch {
          return;
        }
      }),
    );
  }

  private ensureAmbience() {
    if (!this.ctx || !this.unlocked || this.ambienceSource) return;
    const ambience = this.assets.ambience;
    if (!ambience || !this.ambienceGain) return;

    const source = this.ctx.createBufferSource();
    source.buffer = ambience;
    source.loop = true;
    source.loopStart = 0;
    source.loopEnd = ambience.duration;
    source.connect(this.ambienceGain);
    source.start();
    this.ambienceSource = source;
  }

  private stopAmbience() {
    if (!this.ambienceSource) return;
    try {
      this.ambienceSource.stop();
    } catch {
      return;
    } finally {
      this.ambienceSource.disconnect();
      this.ambienceSource = null;
    }
  }

  private ensureReady() {
    if (!this.unlocked) {
      void this.unlock();
    }
  }

  private playBuffer(
    name: AssetName,
    options: {
      gain: number;
      playbackRate?: number;
      highpass?: number;
      lowpass?: number;
      delay?: number;
    },
  ) {
    if (!this.ctx || !this.sfxBus) return;
    const buffer = this.assets[name];
    if (!buffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = options.playbackRate ?? 1;

    const gain = this.ctx.createGain();
    gain.gain.value = options.gain;

    let tail: AudioNode = source;
    if (options.highpass) {
      const filter = this.ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = options.highpass;
      tail.connect(filter);
      tail = filter;
    }
    if (options.lowpass) {
      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = options.lowpass;
      filter.Q.value = 0.6;
      tail.connect(filter);
      tail = filter;
    }
    tail.connect(gain);

    gain.connect(this.sfxBus);
    source.start(this.ctx.currentTime + (options.delay ?? 0));
  }

  private playTone(
    from: number,
    to: number,
    duration: number,
    type: OscillatorType,
    gainValue: number,
    delay = 0,
  ) {
    if (!this.ctx || !this.sfxBus) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const start = this.ctx.currentTime + delay;
    const end = start + duration;

    osc.type = type;
    osc.frequency.setValueAtTime(from, start);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), end);

    // Smoother ADSR envelope
    const attack = Math.min(0.01, duration * 0.1);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(gainValue, start + attack);
    gain.gain.setValueAtTime(gainValue, end - duration * 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, end);

    osc.connect(gain);
    gain.connect(this.sfxBus);
    osc.start(start);
    osc.stop(end + 0.01);
  }

  private playSweep(
    from: number,
    to: number,
    duration: number,
    type: OscillatorType,
    gainValue: number,
    delay = 0,
  ) {
    this.playTone(from, to, duration, type, gainValue, delay);
  }

  private playNoiseBurst(
    duration: number,
    highpass: number,
    gainValue: number,
    delay = 0,
  ) {
    if (!this.ctx || !this.sfxBus) return;
    const source = this.ctx.createBufferSource();
    const length = Math.max(1, Math.floor(this.ctx.sampleRate * duration));
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let index = 0; index < data.length; index += 1) {
      const t = index / data.length;
      // Shaped falloff for more natural sound
      const falloff = Math.exp(-t * 4) * (1 - t * 0.5);
      data[index] = (Math.random() * 2 - 1) * falloff;
    }

    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = highpass;
    filter.Q.value = 0.7;

    // Add a lowpass too for less harshness
    const lpf = this.ctx.createBiquadFilter();
    lpf.type = "lowpass";
    lpf.frequency.value = Math.min(highpass * 4, 16000);
    lpf.Q.value = 0.5;

    const gain = this.ctx.createGain();
    const start = this.ctx.currentTime + delay;
    gain.gain.setValueAtTime(gainValue, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

    source.buffer = buffer;
    source.connect(filter);
    filter.connect(lpf);
    lpf.connect(gain);
    gain.connect(this.sfxBus);
    source.start(start);
    source.stop(start + duration + 0.01);
  }
}
