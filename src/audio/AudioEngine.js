import * as Tone from 'tone';
import { chordFor, melodyNote, scoreFor, siteSeedFromCode } from './musicProfiles';

const clamp = (value) => Math.max(0, Math.min(1, Number(value) || 0));
export default class AudioEngine {
  constructor() {
    this.isPlaying = false;
    this.isInitialized = false;
    this._cityConfig = null;
    this._siteSeed = 0;
    this._liveStress = 0.5;
    this._liveRichness = 0.4;
    this._liveNitrateRank = null;
    this._step = 0;
    this.loop = null;
  }

  async init() {
    if (this.isInitialized) return;
    await Tone.start();

    this.master = new Tone.Gain(0.78).toDestination();
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
    this.reedFilter = new Tone.Filter({ type: 'lowpass', frequency: 1450, rolloff: -12 }).connect(this.delay);
    this.leads = {
      glass: new Tone.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.012, decay: 0.75, sustain: 0.06, release: 1.1 }, volume: -17 }).connect(this.delay),
      pluck: new Tone.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.006, decay: 0.22, sustain: 0.06, release: 0.35 }, volume: -18 }).connect(this.reverb),
      reed: new Tone.Synth({ oscillator: { type: 'sawtooth' }, envelope: { attack: 0.075, decay: 0.2, sustain: 0.25, release: 0.42 }, volume: -25 }).connect(this.reedFilter),
      warm: new Tone.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.045, decay: 0.38, sustain: 0.3, release: 0.6 }, volume: -17 }).connect(this.delay),
    };
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
    this.updateParams(this._liveStress, this._liveRichness, this._liveNitrateRank);
  }

  setCity(cityConfig) {
    if (this._cityConfig?.id !== cityConfig?.id) {
      this._step = 0;
      if (this.isInitialized) {
        this.pad.releaseAll();
        Object.values(this.leads).forEach((lead) => lead.triggerRelease());
      }
    }
    this._cityConfig = cityConfig;
    if (this.isInitialized) this.updateParams(this._liveStress, this._liveRichness, this._liveNitrateRank);
  }

  setSite(code) {
    const nextSeed = siteSeedFromCode(code);
    if (nextSeed !== this._siteSeed) {
      this._siteSeed = nextSeed;
      this._step = 0;
    }
  }

  updateParams(stress, richness = 0.4, nitrateRank = null) {
    if (!this.isInitialized) return;
    const tension = clamp(stress);
    const life = clamp(richness);
    const nitrateColour = Number.isFinite(nitrateRank) ? clamp(nitrateRank) : 0;
    this.padFilter.frequency.rampTo(4200 - tension * 2850, 0.8);
    this.reedFilter.frequency.rampTo(1900 - tension * 650, 0.8);
    this.textureFilter.frequency.rampTo(650 + tension * 500 + nitrateColour * 260, 0.8);
    this.reverb.wet.rampTo(0.35 - tension * 0.12, 0.8);
    this.delay.wet.rampTo(0.13 - tension * 0.03 + nitrateColour * 0.1, 0.8);
    this.pad.volume.rampTo(-18 - tension * 5, 0.8);
    this.bass.volume.rampTo(-25 + tension * 5, 0.8);
    this.bell.volume.rampTo(-27 + life * 4 - tension * 10, 0.8);
    this.texture.volume.rampTo(-56 + tension * 15, 0.8);
    Tone.getTransport().bpm.rampTo((this._cityConfig?.bpm || 60) + tension * 11, 1);
  }

  _tick(time) {
    const step = this._step % 8;
    const bar = Math.floor(this._step / 8);
    const cityId = this._cityConfig?.id || 'ghent';
    const profile = scoreFor(cityId);
    const tension = clamp(this._liveStress);
    const chord = chordFor(cityId, tension, bar);

    if (step === 0) {
      this.pad.triggerAttackRelease(chord.pad, '2n.', time, 0.52);
      if (bar % 4 === 0 || tension > 0.6) this.texture.triggerAttackRelease('4n', time, 0.2 + tension * 0.16);
    }
    if (profile.bassSteps.includes(step) || (tension > 0.72 && step === 6)) {
      this.bass.triggerAttackRelease(chord.bass, step === 0 ? '4n' : '8n', time, step === 0 ? 0.59 : 0.27 + tension * 0.1);
    }

    const phraseStep = profile.leadSteps.indexOf(step);
    if (phraseStep !== -1 && !(bar % 8 === 7 && phraseStep === 1)) {
      const note = melodyNote(cityId, tension, bar, phraseStep, this._siteSeed);
      this.leads[profile.instrument].triggerAttackRelease(note, profile.noteLength, time, 0.4 + (1 - tension) * 0.12);
    }

    const life = clamp(this._liveRichness);
    const addDrop = profile.accentSteps.includes(step) && tension < 0.78 &&
      (life > 0.63 || (life > 0.31 && (bar + this._siteSeed) % 2 === 0) || bar % 4 === 0);
    if (addDrop) {
      const note = melodyNote(cityId, tension, bar, step, this._siteSeed);
      this.bell.triggerAttackRelease(note, '16n', time, 0.32 + life * 0.12);
    }
    this._step += 1;
  }

  start(stress = 0.5, richness = 0.4, nitrateRank = null) {
    if (!this.isInitialized || this.isPlaying) return;
    this._liveStress = clamp(stress);
    this._liveRichness = clamp(richness);
    this._liveNitrateRank = nitrateRank;
    this._step = 0;
    this.updateParams(stress, richness, nitrateRank);
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
    Object.values(this.leads).forEach((lead) => lead.triggerRelease());
    this.bass.triggerRelease();
    this.bell.triggerRelease();
    this._step = 0;
  }

  setLiveParams(stress, richness = 0.4, nitrateRank = null) {
    this._liveStress = clamp(stress);
    this._liveRichness = clamp(richness);
    this._liveNitrateRank = nitrateRank;
    this.updateParams(stress, richness, nitrateRank);
  }

  getWaveformData() {
    return this.analyser?.getValue() || new Float32Array(64).fill(0);
  }

  getFFTData() {
    return this.fftAnalyser?.getValue() || new Float32Array(128).fill(-100);
  }

  dispose() {
    this.stop();
    for (const node of [this.pad, ...Object.values(this.leads || {}), this.bass, this.bell, this.texture,
      this.padChorus, this.padFilter, this.reedFilter, this.textureFilter, this.delay, this.reverb,
      this.analyser, this.fftAnalyser, this.master]) node?.dispose();
    this.isInitialized = false;
  }
}
