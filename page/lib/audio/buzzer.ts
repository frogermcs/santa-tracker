// Web Audio API Synthesizer replicating the M5StickC Plus SE passive buzzer
// StickCP2.Speaker.tone(frequency, durationMs)

class BuzzerSound {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (!this.isMuted) {
      this.beep(1200, 40);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public playTone(freq: number, durationMs: number, type: OscillatorType = "square", volume: number = 0.08) {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + durationMs / 1000);
    } catch {
      // AudioContext policy catch
    }
  }

  // Pre-configured M5Stick chirps
  public beep(freq = 1200, durationMs = 40) {
    this.playTone(freq, durationMs, "square", 0.06);
  }

  // Tactical Holiday Bell Chime
  public playSleighChime() {
    if (this.isMuted) return;
    const notes = [1046.5, 1318.5, 1567.98, 2093.0]; // C6, E6, G6, C7
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 70, "sine", 0.04), i * 75);
    });
  }

  public screenSwitch() {
    this.playTone(1100, 35, "square", 0.07);
  }

  public actionTrigger() {
    this.playTone(1600, 45, "square", 0.07);
  }

  public giftBoost() {
    this.playTone(1760, 30, "square", 0.06);
    setTimeout(() => this.playTone(2200, 40, "square", 0.06), 40);
  }

  public warpSpeed() {
    this.playTone(800, 30, "sawtooth", 0.05);
    setTimeout(() => this.playTone(1400, 30, "sawtooth", 0.05), 35);
    setTimeout(() => this.playTone(2400, 60, "sawtooth", 0.06), 70);
  }

  public cookieMunch() {
    this.playTone(700, 30, "square", 0.06);
    setTimeout(() => this.playTone(950, 40, "triangle", 0.07), 40);
  }
}

export const buzzer = new BuzzerSound();
