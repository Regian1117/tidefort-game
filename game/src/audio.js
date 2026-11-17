// All sound is synthesised with WebAudio: short effects (noise splashes, thuds, chimes) and a light
// looping tune that gets busier during a tide. Nothing is loaded; the context starts on the
// first click or key (browsers require a gesture) and M mutes everything.

const SCALE = [0, 2, 4, 7, 9]; // major pentatonic
const ROOT = 196; // G3

function noteFreq(degree, octave = 0) {
  const oct = Math.floor(degree / 5);
  return ROOT * Math.pow(2, (SCALE[((degree % 5) + 5) % 5] + 12 * (oct + octave)) / 12);
}

export function createAudio() {
  let ctx = null;
  let master = null;
  let noiseBuffer = null;
  let muted = false;
  let mood = 'off';
  let nextBeat = 0;
  let beat = 0;
  let timer = null;

  function ensure() {
    if (ctx) return true;
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return false;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.5;
    master.connect(ctx.destination);
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    return true;
  }

  function tone(freq, dur, type = 'sine', vol = 0.2, when = 0, slideTo = null) {
    if (!ensure()) return;
    const t = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  function noise(dur, vol = 0.2, freq = 1200, type = 'lowpass', when = 0, sweepTo = null) {
    if (!ensure()) return;
    const t = ctx.currentTime + when;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(freq, t);
    if (sweepTo) filter.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    src.start(t);
    src.stop(t + dur + 0.05);
  }

  const effects = {
    build: () => { tone(220, 0.1, 'triangle', 0.25, 0, 330); noise(0.08, 0.12, 900); },
    upgrade: () => { [0, 2, 4].forEach((d, i) => tone(noteFreq(d, 1), 0.16, 'triangle', 0.2, i * 0.07)); },
    perfect: () => { [0, 2, 4, 5].forEach((d, i) => tone(noteFreq(d, 2), 0.18, 'sine', 0.22, i * 0.055)); },
    patch: () => { noise(0.1, 0.14, 700); tone(330, 0.08, 'triangle', 0.15); },
    hit: () => { noise(0.2, 0.3, 500, 'lowpass', 0, 120); tone(110, 0.14, 'sine', 0.3, 0, 60); },
    crumble: () => { noise(0.5, 0.4, 900, 'lowpass', 0, 90); tone(90, 0.35, 'sawtooth', 0.14, 0, 40); },
    shoot: () => { tone(620, 0.09, 'square', 0.07, 0, 300); },
    squash: () => { tone(300, 0.12, 'square', 0.16, 0, 90); tone(660, 0.1, 'triangle', 0.14, 0.06); },
    thud: () => { tone(180, 0.08, 'square', 0.12, 0, 120); },
    pinch: () => { noise(0.05, 0.12, 2600, 'highpass'); },
    ram: () => { noise(0.35, 0.4, 700, 'lowpass', 0, 100); tone(70, 0.3, 'sine', 0.4, 0, 40); },
    flag: () => { tone(440, 0.4, 'sawtooth', 0.2, 0, 110); noise(0.3, 0.2, 1500, 'lowpass', 0, 200); },
    castle: () => { tone(120, 0.3, 'sawtooth', 0.22, 0, 50); noise(0.3, 0.3, 600, 'lowpass', 0, 120); },
    scoop: () => { noise(0.12, 0.2, 2200, 'bandpass', 0, 900); tone(520, 0.06, 'triangle', 0.1); },
    splash: () => { noise(0.45, 0.4, 1800, 'lowpass', 0, 300); tone(240, 0.25, 'sine', 0.2, 0, 90); },
    drain: () => { noise(0.5, 0.18, 700, 'bandpass', 0, 2200); },
    nope: () => { tone(160, 0.12, 'square', 0.1, 0, 120); },
    warn: () => { [0, 0.3, 0.6].forEach((w) => tone(520, 0.2, 'square', 0.14, w, 400)); },
    rogue: () => { noise(1.4, 0.5, 400, 'lowpass', 0, 2400); tone(60, 1.2, 'sine', 0.45, 0, 120); },
    'tide-start': () => { noise(0.9, 0.25, 500, 'lowpass', 0, 2800); },
    'build-phase': () => { tone(392, 0.12, 'triangle', 0.16); tone(523, 0.16, 'triangle', 0.16, 0.1); },
    'tide-end': () => { [0, 2, 4, 6].forEach((d, i) => tone(noteFreq(d, 1), 0.22, 'triangle', 0.2, i * 0.1)); },
    win: () => { [0, 2, 4, 7, 9, 7, 9, 12].forEach((d, i) => tone(noteFreq(d, 1), 0.28, 'triangle', 0.22, i * 0.13)); },
    lose: () => { [7, 5, 3, 0].forEach((d, i) => tone(noteFreq(d - 5, 0), 0.4, 'sawtooth', 0.14, i * 0.22)); noise(1.2, 0.3, 900, 'lowpass', 0, 80); },
  };

  // The tune: a slow bass on beats 0 and 4, a pentatonic melody, and a light tick once a tide runs.
  const MELODY = [4, 6, 7, 6, 4, 2, 4, 5, 7, 9, 7, 6, 4, 2, 0, 2];
  function scheduleBeat(b, t) {
    const busy = mood === 'tide';
    const step = b % 16;
    const dur = busy ? 0.17 : 0.3;
    if (step % 4 === 0) {
      const bass = [0, 0, 3, 2][(b >> 2) % 4];
      toneAt(noteFreq(bass, -1), dur * 3, 'triangle', 0.16, t);
    }
    if (step % 2 === 0 || busy) toneAt(noteFreq(MELODY[step], 0), dur * 1.4, 'sine', busy ? 0.1 : 0.08, t);
    if (busy && step % 2 === 1) noiseAt(0.03, 0.05, 6000, t);
  }

  function toneAt(freq, dur, type, vol, t) {
    tone(freq, dur, type, vol, Math.max(0, t - ctx.currentTime));
  }

  function noiseAt(dur, vol, freq, t) {
    noise(dur, vol, freq, 'highpass', Math.max(0, t - ctx.currentTime));
  }

  function pump() {
    if (!ctx || mood === 'off' || muted || ctx.state !== 'running') return;
    const spb = mood === 'tide' ? 0.19 : 0.3;
    if (nextBeat < ctx.currentTime) nextBeat = ctx.currentTime + 0.05;
    while (nextBeat < ctx.currentTime + 0.25) {
      scheduleBeat(beat, nextBeat);
      beat += 1;
      nextBeat += spb;
    }
  }

  return {
    /** Call from a click or key handler so the browser lets the sound start. */
    unlock() {
      if (!ensure()) return;
      if (ctx.state === 'suspended') ctx.resume();
      if (!timer) timer = setInterval(pump, 60);
    },
    play(name) {
      if (muted || !ctx || ctx.state !== 'running') return;
      const fx = effects[name];
      if (fx) fx();
    },
    setMood(next) {
      mood = next;
    },
    toggleMute() {
      muted = !muted;
      if (master) master.gain.value = muted ? 0 : 0.5;
      return muted;
    },
    isMuted() {
      return muted;
    },
  };
}
