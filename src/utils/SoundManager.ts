export class SoundManager {
    ctx: AudioContext | null = null;
    bgmOsc: OscillatorNode | null = null;
    bgmGain: GainNode | null = null;

    constructor() {
        try {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
            console.error("Web Audio API not supported", e);
        }
    }

    private playTone(freq: number, type: OscillatorType, duration: number, vol = 0.1) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    // New: Spatial audio helper
    createSpatialSource(position: [number, number, number]) {
        if (!this.ctx) return null;

        const oscillator = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const panner = this.ctx.createPanner();

        panner.panningModel = 'HRTF';
        panner.distanceModel = 'inverse';
        panner.positionX.setValueAtTime(position[0], this.ctx.currentTime);
        panner.positionY.setValueAtTime(position[1], this.ctx.currentTime);
        panner.positionZ.setValueAtTime(position[2], this.ctx.currentTime);

        oscillator.connect(gain);
        gain.connect(panner);
        panner.connect(this.ctx.destination);

        return { oscillator, gain, panner };
    }

    playShoot(isRapid = false) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const baseFreq = isRapid ? 1200 : 800;
        const duration = isRapid ? 0.1 : 0.2;

        osc.type = isRapid ? 'square' : 'sine';
        osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + duration);

        gain.gain.setValueAtTime(isRapid ? 0.1 : 0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playHit() {
        this.playTone(60, 'square', 0.2, 0.3);
    }

    startBGM() {
        if (!this.ctx || this.bgmOsc) return;

        this.bgmOsc = this.ctx.createOscillator();
        this.bgmGain = this.ctx.createGain();

        this.bgmOsc.type = 'sawtooth';
        this.bgmOsc.frequency.setValueAtTime(50, this.ctx.currentTime); // Low space drone

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, this.ctx.currentTime);

        this.bgmGain.gain.setValueAtTime(0, this.ctx.currentTime);
        this.bgmGain.gain.linearRampToValueAtTime(0.05, this.ctx.currentTime + 2); // Fade in

        this.bgmOsc.connect(filter);
        filter.connect(this.bgmGain);
        this.bgmGain.connect(this.ctx.destination);

        this.bgmOsc.start();
    }

    stopBGM() {
        if (this.bgmGain && this.bgmOsc && this.ctx) {
            this.bgmGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1);
            setTimeout(() => {
                this.bgmOsc?.stop();
                this.bgmOsc = null;
            }, 1000);
        }
    }

    playStart() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(600, this.ctx.currentTime + 0.5);

        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.5);
    }
}

export const soundManager = new SoundManager();
