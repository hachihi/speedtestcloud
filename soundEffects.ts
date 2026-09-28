/**
 * Web Audio API synthesizer for network speed test telemetry
 */
class SoundEngine {
  private ctx: AudioContext | null = null;
  private isEnabled: boolean = true;
  private humOsc: OscillatorNode | null = null;
  private humGain: GainNode | null = null;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.stopContinuousHum();
    }
  }

  public getEnabled(): boolean {
    return this.isEnabled;
  }

  // Soft ping tick
  public playPingTick(latencyMs: number) {
    if (!this.isEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Higher frequency for lower latency
      const freq = Math.max(300, 1200 - Math.min(latencyMs * 5, 800));
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch {
      // Audio error suppressed
    }
  }

  // Continuous hum that pitches up with Mbps throughput
  public startContinuousHum() {
    if (!this.isEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      this.stopContinuousHum();

      this.humOsc = this.ctx.createOscillator();
      this.humGain = this.ctx.createGain();

      this.humOsc.type = 'triangle';
      this.humOsc.frequency.setValueAtTime(120, this.ctx.currentTime);
      this.humGain.gain.setValueAtTime(0.02, this.ctx.currentTime);

      this.humOsc.connect(this.humGain);
      this.humGain.connect(this.ctx.destination);
      this.humOsc.start();
    } catch {
      // Audio error suppressed
    }
  }

  public updateHumSpeed(speedMbps: number, maxSpeed: number = 500) {
    if (!this.isEnabled || !this.humOsc || !this.ctx) return;
    try {
      const normalized = Math.min(Math.max(speedMbps / maxSpeed, 0), 1);
      const targetFreq = 140 + normalized * 420;
      this.humOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.08);
    } catch {
      // Audio error suppressed
    }
  }

  public stopContinuousHum() {
    try {
      if (this.humOsc) {
        this.humOsc.stop();
        this.humOsc.disconnect();
        this.humOsc = null;
      }
      if (this.humGain) {
        this.humGain.disconnect();
        this.humGain = null;
      }
    } catch {
      // Audio error suppressed
    }
  }

  // Completion futuristic chord
  public playCompletionChord() {
    if (!this.isEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      const now = this.ctx.currentTime;

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0.08, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.6);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.6);
      });
    } catch {
      // Audio error suppressed
    }
  }
}

export const soundEffects = new SoundEngine();
