// All sound is synthesised with WebAudio: no audio files, no network.
// The kitchen sizzles while a patty grills, chops thock, a serve dings.
let context = null;
let muted = false;
let sizzleNode = null;

export function setMuted(value) {
  muted = value;
  if (sizzleNode) sizzleNode.gain.value = 0;
}

export function isMuted() {
  return muted;
}

/** Lazily created on the first player gesture, so autoplay rules never bite. */
export function ensureAudio() {
  if (context) {
    if (context.state === 'suspended') context.resume().catch(() => {});
    return context;
  }
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    context = new AudioContextClass();
  } catch {
    context = null;
  }
  return context;
}

function tone(frequency, duration, type, volume, when = 0) {
  const ctx = ensureAudio();
  if (!ctx || muted) return;
  const start = ctx.currentTime + when;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function noiseBurst(duration, volume, filterFrequency) {
  const ctx = ensureAudio();
  if (!ctx || muted) return;
  const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFrequency;
  const gain = ctx.createGain();
  gain.gain.value = volume;
  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start();
}

export function playGrab() {
  tone(520, 0.07, 'sine', 0.12);
}

export function playPlace() {
  tone(330, 0.08, 'triangle', 0.14);
  noiseBurst(0.05, 0.08, 900);
}

export function playChop() {
  noiseBurst(0.09, 0.25, 500);
  tone(140, 0.06, 'square', 0.08);
}

export function playFlip() {
  tone(660, 0.06, 'sine', 0.1);
  tone(880, 0.08, 'sine', 0.1, 0.06);
}

export function playServe() {
  tone(880, 0.12, 'sine', 0.16);
  tone(1174, 0.18, 'sine', 0.16, 0.09);
  tone(1568, 0.22, 'sine', 0.12, 0.18);
}

export function playBad() {
  tone(220, 0.16, 'sawtooth', 0.1);
  tone(174, 0.22, 'sawtooth', 0.1, 0.12);
}

export function playTick() {
  tone(980, 0.05, 'square', 0.06);
}

export function playBurn() {
  noiseBurst(0.3, 0.2, 300);
  tone(110, 0.3, 'sawtooth', 0.08);
}

/** A looping filtered-noise sizzle while any patty is on the grill. */
export function setSizzle(on) {
  const ctx = ensureAudio();
  if (!ctx) return;
  if (on && !sizzleNode) {
    const length = ctx.sampleRate;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2400;
    const gain = ctx.createGain();
    gain.gain.value = muted ? 0 : 0.035;
    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start();
    sizzleNode = { source, gain };
  } else if (!on && sizzleNode) {
    try {
      sizzleNode.source.stop();
    } catch {
      // Already stopped; nothing to do.
    }
    sizzleNode = null;
  }
}
