import * as Tone from 'tone';
import { chordFor, melodyNote, siteSeedFromCode } from './musicProfiles';

const clamp = (value) => Math.max(0, Math.min(1, Number(value) || 0));
const melodyPatterns = [
  [1, 3, 5, 7], [1, 4, 5, 7], [1, 3, 6, 7],
  [1, 2, 5, 7], [1, 3, 5, 6],
];

export default class AudioEngine {
  constructor() {
    this.isPlaying = false;
    this.isInitialized = false;
    this._cityConfig = null;
    this._siteSeed = 0;
    this._liveStress = 0.5;
    this._liveRichness = 0.4;
    this._step = 0;
    this.loop = null;
  }

  async init() {
    if (this.isInitialized) return;
    await Tone.start();

    this.master = new Tone.Gain(0.82).toDestination();
    this.reverb = new Tone.Reverb({ decay: 4.5, preDelay: 0.025, wet: 0.3 }).connect(this.master);
    this.delay = new Tone.FeedbackDelay({ delayTime: '8n.', feedback: 0.16, wet: 0.17 }).connect(this.reverb);
    this.padFilter = new Tone.Filter({ type: 'lowpass', frequency: 2500, rolloff: -12, Q: 0.65 }).connect(this.reverb);
    this.padChorus = new Tone.Chorus({ frequency: 0.24, delayTime: 3.5, depth: 0.28, wet: 0.18 }).connect(this.padFilter);
    this.padChorus.start();

    this.pad = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.85, decay: 0.25, sustain: 0.7, release: 2.7 },
      volume: -19,
    }).connect(this.padChorus);
    this.lead = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.025, decay: 0.26, sustain: 0.16, release: 1.1 },
      volume: -20,
    }).connect(this.delay);
    this.bass = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.09, decay: 0.35, sustain: 0.3, release: 1.2 },
      volume: -22,
    }).connect(this.master);
    this.bell = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.004, decay: 0.45, sustain: 0, release: 0.55 },
      volume: -28,
    }).connect(this.reverb);
    this.textureFilter = new Tone.Filter({ type: 'lowpass', frequency: 950, rolloff: -12 }).connect(this.reverb);
    this.texture = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.4, decay: 0.8, sustain: 0.08, release: 1.3 },
      volume: -46,
    }).connect(this.textureFilter);

    this.analyser = new Tone.Analyser('waveform', 64);
    this.fftAnalyser = new Tone.Analyser('fft', 128);
    this.master.connect(this.analyser);
    this.master.connect(this.fftAnalyser);
    this.isInitialized = true;
    this.updateParams(this._liveStress, this._liveRichness);
  }

  setCity(cityConfig) {
    this._cityConfig = cityConfig;
    if (this.isInitialized) this.updateParams(this._liveStress, this._liveRichness);
  }

  setSite(code) {
    const nextSeed = siteSeedFromCode(code);
    if (nextSeed !== this._siteSeed) {
      this._siteSeed = nextSeed;
      this._step = 0;
    }
  }

  updateParams(stress, richness = 0.4) {
    if (!this.isInitialized) return;
    const tension = clamp(stress);
    const life = clamp(richness);
    this.padFilter.frequency.rampTo(3600 - tension * 1900, 0.8);
    this.textureFilter.frequency.rampTo(650 + tension * 500, 0.8);
    this.reverb.wet.rampTo(0.33 - tension * 0.07, 0.8);
    this.delay.wet.rampTo(0.13 + tension * 0.05, 0.8);
    this.lead.volume.rampTo(-19 - tension * 3, 0.8);
    this.bell.volume.rampTo(-30 + life * 5, 0.8);
    this.texture.volume.rampTo(-49 + tension * 7, 0.8);
    Tone.getTransport().bpm.rampTo((this._cityConfig?.bpm || 60) + 18 + tension * 8, 1);
  }

  _tick(time) {
    const step = this._step % 8;
    const bar = Math.floor(this._step / 8);
    const cityId = this._cityConfig?.id || 'ghent';
    const chord = chordFor(cityId, this._liveStress, bar, this._siteSeed);

    if (step === 0) {
      this.pad.triggerAttackRelease(chord.pad, '2n.', time, 0.55);
      this.bass.triggerAttackRelease(chord.bass, '2n', time, 0.62);
      if (bar % 4 === 0) this.texture.triggerAttackRelease('2n', time, 0.2);
    }
    if (step === 4 && this._liveStress > 0.68) {
      this.bass.triggerAttackRelease(chord.bass, '8n', time, 0.28);
    }

    const phraseStep = melodyPatterns[this._siteSeed % melodyPatterns.length].indexOf(step);
    if (phraseStep !== -1 && !(bar % 8 === 7 && phraseStep === 2)) {
      const note = melodyNote(chord, cityId, bar, phraseStep, this._siteSeed);
      this.lead.triggerAttackRelease(note, phraseStep === 3 ? '4n' : '8n', time, 0.48);
    }

    const life = clamp(this._liveRichness);
    const addDrop = life > 0.68 ? step === 2 || step === 6
      : life > 0.35 ? step === 6
        : step === 6 && bar % 2 === 0;
    if (addDrop) {
      const note = melodyNote(chord, cityId, bar, step === 2 ? 1 : 3, this._siteSeed);
      this.bell.triggerAttackRelease(note, '16n', time, 0.37);
    }
    this._step += 1;
  }

  start(stress = 0.5, richness = 0.4) {
    if (!this.isInitialized || this.isPlaying) return;
    this._liveStress = clamp(stress);
    this._liveRichness = clamp(richness);
    this._step = 0;
    this.updateParams(stress, richness);
    this.loop = new Tone.Loop((time) => this._tick(time), '8n').start(0);
    Tone.getTransport().start();
    this.isPlaying = true;
  }

  stop() {
    if (!this.isInitialized) return;
    this.isPlaying = false;
    Tone.getTransport().stop();
    if (this.loop) {
      this.loop.stop();
      this.loop.dispose();
      this.loop = null;
    }
    this.pad.releaseAll();
    this.lead.triggerRelease();
    this.bass.triggerRelease();
    this.bell.triggerRelease();
    this._step = 0;
  }

  setLiveParams(stress, richness = 0.4) {
    this._liveStress = clamp(stress);
    this._liveRichness = clamp(richness);
    this.updateParams(stress, richness);
  }

  getWaveformData() {
    return this.analyser?.getValue() || new Float32Array(64).fill(0);
  }

  getFFTData() {
    return this.fftAnalyser?.getValue() || new Float32Array(128).fill(-100);
  }

  dispose() {
    this.stop();
    for (const node of [this.pad, this.lead, this.bass, this.bell, this.texture,
      this.padChorus, this.padFilter, this.textureFilter, this.delay, this.reverb,
      this.analyser, this.fftAnalyser, this.master]) node?.dispose();
    this.isInitialized = false;
  }
}
