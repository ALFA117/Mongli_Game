"use client";

// ═══════════════════════════════════════════════
// Pure Web Audio API — no Howler, no SSR issues
// ═══════════════════════════════════════════════

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let droneOsc: OscillatorNode | null = null;
let droneGain: GainNode | null = null;
let initialized = false;
let audioStarted = false;
let currentAct: 1 | 2 | 3 | "revelation" = 1;
let globalVolume = 0.6;

export type AchievementCategory = "exploration" | "decision" | "obsession" | "verification" | "balance" | "general";

// ─── Ensure AudioContext exists (but don't play yet) ───
function ensureCtx(): AudioContext {
  if (!ctx && typeof window !== "undefined") {
    ctx = new AudioContext();
    masterGain = ctx.createGain();
    masterGain.gain.value = globalVolume;
    masterGain.connect(ctx.destination);
  }
  return ctx!;
}

// ─── Resume context (must be called from user gesture) ───
async function resumeCtx() {
  const c = ensureCtx();
  if (c.state === "suspended") {
    await c.resume();
  }
}

// ─── Init: prepare context but DON'T play anything ───
export function initAudio() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  ensureCtx();
}

// ─── Start audio on first user interaction ───
export async function startAudioOnFirstInteraction() {
  if (audioStarted) return;
  audioStarted = true;
  initAudio();
  await resumeCtx();
  fadeInAudio(2000);
}

export function isAudioStarted(): boolean {
  return audioStarted;
}

// ─── Drone frequencies per act ───
const DRONE_CONFIG = {
  1: { freq: 55, lfo: 0.15 },
  2: { freq: 73, lfo: 0.4 },
  3: { freq: 41, lfo: 0.08 },
  revelation: { freq: 110, lfo: 0.8 },
};

function startDrone(freq: number, lfoRate: number) {
  if (!ctx || !masterGain) return;
  stopDroneImmediate();

  droneGain = ctx.createGain();
  droneGain.gain.value = 0;
  droneGain.connect(masterGain);

  droneOsc = ctx.createOscillator();
  droneOsc.type = "sine";
  droneOsc.frequency.value = freq;
  droneOsc.connect(droneGain);

  // LFO modulation
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = lfoRate;
  lfoGain.gain.value = freq * 0.05;
  lfo.connect(lfoGain);
  lfoGain.connect(droneOsc.frequency);
  lfo.start();

  // Sub harmonic
  const sub = ctx.createOscillator();
  sub.type = "sine";
  sub.frequency.value = freq * 0.5;
  const subGain = ctx.createGain();
  subGain.gain.value = 0.3;
  sub.connect(subGain);
  subGain.connect(droneGain);
  sub.start();

  droneOsc.start();
}

function stopDroneImmediate() {
  try { droneOsc?.stop(); } catch { /* already stopped */ }
  droneOsc = null;
  droneGain = null;
}

// ─── Play a one-shot tone ───
function playTone(freq: number, duration: number, type: OscillatorType = "sine", vol = 0.1) {
  if (!ctx || !masterGain || !audioStarted) return;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  g.connect(masterGain);

  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.value = freq;
  o.connect(g);
  o.start();
  o.stop(ctx.currentTime + duration + 0.05);
}

function playNoiseBurst(duration: number, vol = 0.08) {
  if (!ctx || !masterGain || !audioStarted) return;
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-(i / bufferSize) * 5);
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const g = ctx.createGain();
  g.gain.value = vol;
  source.connect(g);
  g.connect(masterGain);
  source.start();
}

// ─── Public API ───

export function setAct(act: 1 | 2 | 3 | "revelation") {
  if (act === currentAct || !audioStarted) { currentAct = act; return; }
  currentAct = act;
  const cfg = DRONE_CONFIG[act];

  // Fade out old drone, start new one
  if (droneGain && ctx) {
    droneGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2);
    setTimeout(() => {
      stopDroneImmediate();
      startDrone(cfg.freq, cfg.lfo);
      if (droneGain && ctx) {
        droneGain.gain.linearRampToValueAtTime(0.12 * globalVolume, ctx.currentTime + 2);
      }
    }, 2100);
  } else {
    startDrone(cfg.freq, cfg.lfo);
    if (droneGain && ctx) {
      droneGain.gain.linearRampToValueAtTime(0.12 * globalVolume, ctx.currentTime + 2);
    }
  }
}

export function playAmbient() {
  if (!audioStarted) return;
  const cfg = DRONE_CONFIG[currentAct];
  startDrone(cfg.freq, cfg.lfo);
  if (droneGain && ctx) {
    droneGain.gain.linearRampToValueAtTime(0.12 * globalVolume, ctx.currentTime + 1);
  }
}

export function stopAmbient() {
  if (droneGain && ctx) {
    droneGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
    setTimeout(stopDroneImmediate, 600);
  }
}

export function fadeInAudio(durationMs = 1500) {
  if (!audioStarted) return;
  const cfg = DRONE_CONFIG[currentAct];
  startDrone(cfg.freq, cfg.lfo);
  if (droneGain && ctx) {
    droneGain.gain.setValueAtTime(0, ctx.currentTime);
    droneGain.gain.linearRampToValueAtTime(0.12 * globalVolume, ctx.currentTime + durationMs / 1000);
  }
}

export function fadeOutAudio(durationMs = 1500) {
  if (droneGain && ctx) {
    droneGain.gain.linearRampToValueAtTime(0, ctx.currentTime + durationMs / 1000);
    setTimeout(stopDroneImmediate, durationMs + 100);
  }
}

export function setGlobalVolume(vol: number) {
  globalVolume = Math.max(0, Math.min(1, vol));
  if (masterGain) masterGain.gain.value = globalVolume;
}

export function getGlobalVolume(): number {
  return globalVolume;
}

export function getCurrentAct(): 1 | 2 | 3 | "revelation" {
  return currentAct;
}

// ─── SFX ───

export function playTypewriter() {
  const pitches = [800, 900, 1100];
  playTone(pitches[Math.floor(Math.random() * 3)], 0.02, "square", 0.04);
}

export function playChainConfirm() {
  // 3-layer chain sound
  playNoiseBurst(0.15, 0.06);
  setTimeout(() => playTone(440, 0.2, "sine", 0.1), 200);
  setTimeout(() => playNoiseBurst(0.02, 0.08), 400);
}

export function playChoice() {
  playTone(220, 0.12, "sine", 0.08);
}

export function playDiscovery() {
  // Arpeggio
  [220, 277, 330, 440].forEach((f, i) => {
    setTimeout(() => playTone(f, 0.3, "sine", 0.08), i * 100);
  });
}

export function playTuneIn() {
  // Frequency sweep
  if (!ctx || !masterGain || !audioStarted) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(200, ctx.currentTime);
  o.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.3);
  g.gain.setValueAtTime(0.06, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
  o.connect(g);
  g.connect(masterGain);
  o.start();
  o.stop(ctx.currentTime + 0.5);
}

export function playAchievementSound(category: AchievementCategory) {
  switch (category) {
    case "exploration":
      [330, 392, 523].forEach((f, i) => setTimeout(() => playTone(f, 0.6, "sine", 0.07), i * 80));
      break;
    case "decision":
      playTone(55, 0.4, "square", 0.1);
      break;
    case "obsession":
      [0, 200, 400, 600].forEach((d, i) =>
        setTimeout(() => playTone(260, 0.3, "sine", 0.08 * Math.pow(0.5, i)), d)
      );
      break;
    case "verification":
      [0, 100, 200].forEach((d) => setTimeout(() => playTone(1200, 0.04, "square", 0.06), d));
      break;
    case "balance":
      playTone(370, 0.8, "sine", 0.06);
      playTone(415, 0.4, "sine", 0.06);
      setTimeout(() => playTone(392, 0.6, "sine", 0.06), 400);
      break;
    default:
      playTone(330, 0.4, "sine", 0.07);
  }
}

export function setAmbientVolume(vol: number) {
  setGlobalVolume(vol);
}

// ─── Generative Melodic Layer ───
let melodicTimer: ReturnType<typeof setTimeout> | null = null;
let melodicActive = false;
let currentToneAvg = 5;

const DARK_SCALE = [220, 246, 261, 293, 329];
const LIGHT_SCALE = [220, 261, 294, 330, 392];

function playMelodicNote() {
  if (!melodicActive || !audioStarted) return;
  const scale = currentToneAvg > 6 ? DARK_SCALE : LIGHT_SCALE;
  const freq = scale[Math.floor(Math.random() * scale.length)];
  const dur = 0.8 + Math.random() * 0.7;
  playTone(freq, dur, "sine", 0.05);
  const nextDelay = 3000 + Math.random() * 4000;
  melodicTimer = setTimeout(playMelodicNote, nextDelay);
}

export function startMelodicLayer() {
  if (melodicActive) return;
  melodicActive = true;
  melodicTimer = setTimeout(playMelodicNote, 2000);
}

export function stopMelodicLayer() {
  melodicActive = false;
  if (melodicTimer) { clearTimeout(melodicTimer); melodicTimer = null; }
}

// ─── Tension layer ───
let tensionOsc: OscillatorNode | null = null;
let tensionGain: GainNode | null = null;

export function setTensionLevel(act: number) {
  if (!ctx || !masterGain || !audioStarted) return;
  const levels: Record<number, number> = { 1: 0, 2: 0.02, 3: 0.04, 4: 0.07, 5: 0.01 };
  const gain = levels[act] ?? 0;

  if (gain === 0) {
    if (tensionGain) tensionGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
    return;
  }

  if (!tensionOsc) {
    tensionOsc = ctx.createOscillator();
    tensionGain = ctx.createGain();
    tensionOsc.type = "sawtooth";
    tensionOsc.frequency.value = 80;
    tensionGain.gain.value = 0;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 200;
    tensionOsc.connect(filter);
    filter.connect(tensionGain);
    tensionGain.connect(masterGain);
    tensionOsc.start();
  }
  if (tensionGain) {
    tensionGain.gain.linearRampToValueAtTime(gain * globalVolume, ctx.currentTime + 2);
  }
}

// ─── Response to game events ───
export function updateMusicWithTone(toneScore: number) {
  currentToneAvg = toneScore;
  if (!ctx || !droneOsc || !audioStarted) return;
  // Shift drone pitch based on tone
  if (toneScore > 7) {
    droneOsc.frequency.linearRampToValueAtTime(droneOsc.frequency.value - 5, ctx.currentTime + 1);
    setTimeout(() => {
      if (droneOsc && ctx) droneOsc.frequency.linearRampToValueAtTime(droneOsc.frequency.value + 5, ctx.currentTime + 2);
    }, 3000);
  } else if (toneScore < 4) {
    droneOsc.frequency.linearRampToValueAtTime(droneOsc.frequency.value + 5, ctx.currentTime + 1);
    setTimeout(() => {
      if (droneOsc && ctx) droneOsc.frequency.linearRampToValueAtTime(droneOsc.frequency.value - 5, ctx.currentTime + 2);
    }, 3000);
  }
}

// ─── Analyser for visualizer ───
let analyser: AnalyserNode | null = null;

export function getAnalyserData(): Uint8Array | null {
  if (!analyser || !ctx) {
    if (ctx && masterGain) {
      analyser = ctx.createAnalyser();
      analyser.fftSize = 32;
      masterGain.connect(analyser);
    }
    return null;
  }
  const data = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(data);
  return data;
}
