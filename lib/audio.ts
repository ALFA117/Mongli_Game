"use client";

import { Howl } from "howler";

// ─── State ───
let initialized = false;
let currentAct: 1 | 2 | 3 | "revelation" = 1;
let globalVolume = 0.6;

// Drone sounds per act
let droneAct1: Howl | null = null;
let droneAct2: Howl | null = null;
let droneAct3: Howl | null = null;
let droneRevelation: Howl | null = null;
let activeDrone: Howl | null = null;

// SFX
let typewriterSounds: Howl[] = [];
let chainSound: Howl | null = null;
let choiceSound: Howl | null = null;
let discoverySound: Howl | null = null;
let tuneSound: Howl | null = null;

// Achievement sounds
let achExploreSound: Howl | null = null;
let achDecisionSound: Howl | null = null;
let achObsessionSound: Howl | null = null;
let achVerifySound: Howl | null = null;
let achBalanceSound: Howl | null = null;

// ─── Buffer generators ───

function createOscillatorBuffer(
  ctx: AudioContext,
  duration: number,
  frequency: number,
  type: OscillatorType = "sine"
): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * duration;
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    let sample = 0;

    if (type === "sine") {
      sample = Math.sin(2 * Math.PI * frequency * t);
      sample += Math.sin(2 * Math.PI * (frequency * 1.5) * t) * 0.3;
      sample += Math.sin(2 * Math.PI * (frequency * 0.5) * t) * 0.5;
    } else if (type === "square") {
      sample = Math.sin(2 * Math.PI * frequency * t) > 0 ? 0.3 : -0.3;
    } else {
      sample = Math.random() * 2 - 1;
    }

    const attack = Math.min(t / 0.5, 1);
    const release = Math.min((duration - t) / 0.5, 1);
    data[i] = sample * attack * release * 0.15;
  }
  return buffer;
}

function createDroneBuffer(ctx: AudioContext, freq: number, lfoRate: number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const duration = 10;
  const length = sampleRate * duration;
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const lfo = 1 + Math.sin(2 * Math.PI * lfoRate * t) * 0.15;
    let sample = Math.sin(2 * Math.PI * freq * lfo * t);
    sample += Math.sin(2 * Math.PI * freq * 1.5 * t) * 0.2;
    sample += Math.sin(2 * Math.PI * freq * 0.5 * t) * 0.4;
    sample += (Math.random() - 0.5) * 0.02;
    const attack = Math.min(t / 1, 1);
    const release = Math.min((duration - t) / 1, 1);
    data[i] = sample * attack * release * 0.12;
  }
  return buffer;
}

function createChordBuffer(ctx: AudioContext, freqs: number[], duration: number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * duration;
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    let sample = 0;
    for (const f of freqs) {
      sample += Math.sin(2 * Math.PI * f * t) / freqs.length;
    }
    const env = Math.exp(-t * 3) * Math.min(t / 0.01, 1);
    data[i] = sample * env * 0.15;
  }
  return buffer;
}

function createEchoBuffer(ctx: AudioContext, freq: number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const duration = 1.2;
  const length = sampleRate * duration;
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  for (let d = 0; d < 4; d++) {
    const delayTime = d * 0.2;
    const amp = Math.pow(0.5, d);
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate - delayTime;
      if (t < 0 || t > 0.3) continue;
      const sample = Math.sin(2 * Math.PI * freq * t) * amp;
      const env = Math.exp(-t * 5) * Math.min(t / 0.005, 1);
      data[i] += sample * env * 0.12;
    }
  }
  return buffer;
}

function createBeepSequence(ctx: AudioContext, freq: number, count: number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const onDur = 0.05;
  const offDur = 0.05;
  const total = count * (onDur + offDur);
  const length = sampleRate * total;
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  for (let b = 0; b < count; b++) {
    const start = Math.floor(b * (onDur + offDur) * sampleRate);
    const end = Math.floor(start + onDur * sampleRate);
    for (let i = start; i < end && i < length; i++) {
      const t = (i - start) / sampleRate;
      data[i] = (Math.sin(2 * Math.PI * freq * t) > 0 ? 0.3 : -0.3) * 0.1;
    }
  }
  return buffer;
}

function createChainTransmission(ctx: AudioContext): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const duration = 0.7;
  const length = sampleRate * duration;
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;

    // Layer 1: filtered noise (0-0.3s)
    if (t < 0.3) {
      const noise = Math.random() * 2 - 1;
      const bandpass = Math.sin(2 * Math.PI * 600 * t) * noise;
      data[i] += bandpass * Math.exp(-t * 4) * 0.08;
    }

    // Layer 2: confirmation beep (0.3-0.5s)
    if (t >= 0.3 && t < 0.5) {
      const bt = t - 0.3;
      data[i] += Math.sin(2 * Math.PI * 440 * bt) * Math.exp(-bt * 6) * 0.12;
    }

    // Layer 3: mechanical click (0.5-0.52s)
    if (t >= 0.5 && t < 0.52) {
      data[i] += (Math.random() * 2 - 1) * Math.exp(-(t - 0.5) * 100) * 0.1;
    }
  }
  return buffer;
}

function createArpeggio(ctx: AudioContext, freqs: number[], noteDur: number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const total = freqs.length * noteDur + 0.3;
  const length = sampleRate * total;
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  freqs.forEach((freq, n) => {
    const start = Math.floor(n * noteDur * sampleRate);
    for (let i = start; i < length; i++) {
      const t = (i - start) / sampleRate;
      data[i] += Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 4) * 0.1;
    }
  });
  return buffer;
}

function createSweep(ctx: AudioContext, f1: number, f2: number, dur: number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * dur;
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const f = f1 + (f2 - f1) * (t / dur);
    data[i] = Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 2) * 0.08;
  }
  return buffer;
}

function bufferToWavBlob(buffer: AudioBuffer): Blob {
  const sampleRate = buffer.sampleRate;
  const data = buffer.getChannelData(0);
  const dataLength = data.length * 2;
  const totalLength = 44 + dataLength;
  const ab = new ArrayBuffer(totalLength);
  const v = new DataView(ab);

  const ws = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  ws(0, "RIFF"); v.setUint32(4, totalLength - 8, true);
  ws(8, "WAVE"); ws(12, "fmt ");
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sampleRate, true); v.setUint32(28, sampleRate * 2, true);
  v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  ws(36, "data"); v.setUint32(40, dataLength, true);

  let offset = 44;
  for (let i = 0; i < data.length; i++) {
    const s = Math.max(-1, Math.min(1, data[i]));
    v.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }
  return new Blob([ab], { type: "audio/wav" });
}

function makeHowl(blob: Blob, volume: number, loop = false): Howl {
  return new Howl({ src: [URL.createObjectURL(blob)], volume, loop, format: ["wav"] });
}

// ─── Init ───

export function initAudio() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  try {
    const ctx = new AudioContext();

    // Drones per act
    droneAct1 = makeHowl(bufferToWavBlob(createDroneBuffer(ctx, 55, 0.15)), 0.10, true);
    droneAct2 = makeHowl(bufferToWavBlob(createDroneBuffer(ctx, 73, 0.4)), 0.10, true);
    droneAct3 = makeHowl(bufferToWavBlob(createDroneBuffer(ctx, 41, 0.08)), 0.06, true);
    droneRevelation = makeHowl(bufferToWavBlob(createDroneBuffer(ctx, 110, 0.8)), 0.08, true);

    // Typewriter — 3 pitch variants
    const twPitches = [800, 900, 1100];
    typewriterSounds = twPitches.map((freq) =>
      makeHowl(bufferToWavBlob(createOscillatorBuffer(ctx, 0.015, freq, "square")), 0.06)
    );

    // Chain transmission (3-layer)
    chainSound = makeHowl(bufferToWavBlob(createChainTransmission(ctx)), 0.14);

    // Choice
    choiceSound = makeHowl(bufferToWavBlob(createOscillatorBuffer(ctx, 0.1, 220, "sine")), 0.1);

    // Discovery arpeggio
    discoverySound = makeHowl(
      bufferToWavBlob(createArpeggio(ctx, [220, 277, 330, 440], 0.1)),
      0.12
    );

    // Tune sweep (for radio toggle)
    tuneSound = makeHowl(bufferToWavBlob(createSweep(ctx, 200, 800, 0.3)), 0.08);

    // Achievement: exploration (C-E-G chord)
    achExploreSound = makeHowl(
      bufferToWavBlob(createChordBuffer(ctx, [330, 392, 523], 0.8)),
      0.10
    );

    // Achievement: decision (deep square)
    achDecisionSound = makeHowl(
      bufferToWavBlob(createOscillatorBuffer(ctx, 0.4, 55, "square")),
      0.12
    );

    // Achievement: obsession (echo)
    achObsessionSound = makeHowl(bufferToWavBlob(createEchoBuffer(ctx, 260)), 0.10);

    // Achievement: verification (beep x3)
    achVerifySound = makeHowl(bufferToWavBlob(createBeepSequence(ctx, 1200, 3)), 0.08);

    // Achievement: balance (dissonance → resolve)
    const balBuf = ctx.createBuffer(1, ctx.sampleRate * 1, ctx.sampleRate);
    const balData = balBuf.getChannelData(0);
    for (let i = 0; i < balBuf.length; i++) {
      const t = i / ctx.sampleRate;
      const f2 = 415 + (392 - 415) * Math.min(t / 0.7, 1);
      const s = (Math.sin(2 * Math.PI * 370 * t) + Math.sin(2 * Math.PI * f2 * t)) * 0.5;
      balData[i] = s * Math.exp(-t * 1.5) * 0.1;
    }
    achBalanceSound = makeHowl(bufferToWavBlob(balBuf), 0.10);

    ctx.close();
  } catch {
    console.warn("Audio init failed — running without sound");
  }
}

// ─── Export types ───
export type AchievementCategory = "exploration" | "decision" | "obsession" | "verification" | "balance" | "general";

// ─── Drone control ───

function getDrone(act: 1 | 2 | 3 | "revelation"): Howl | null {
  if (act === 1) return droneAct1;
  if (act === 2) return droneAct2;
  if (act === 3) return droneAct3;
  return droneRevelation;
}

export function setAct(act: 1 | 2 | 3 | "revelation") {
  if (act === currentAct) return;
  const oldDrone = activeDrone;
  const newDrone = getDrone(act);
  currentAct = act;

  if (newDrone && !newDrone.playing()) {
    newDrone.volume(0);
    newDrone.play();
  }

  // Crossfade 2 seconds
  const steps = 40;
  const interval = 2000 / steps;
  let step = 0;

  const crossfadeInterval = setInterval(() => {
    step++;
    const progress = step / steps;

    if (oldDrone) oldDrone.volume(Math.max(0, (1 - progress) * 0.10 * globalVolume));
    if (newDrone) newDrone.volume(progress * 0.10 * globalVolume);

    if (step >= steps) {
      clearInterval(crossfadeInterval);
      if (oldDrone && oldDrone !== newDrone) oldDrone.stop();
      activeDrone = newDrone;
    }
  }, interval);
}

export function playAmbient() {
  const drone = getDrone(currentAct);
  if (drone && !drone.playing()) {
    drone.volume(0.10 * globalVolume);
    drone.play();
    activeDrone = drone;
  }
}

export function stopAmbient() {
  [droneAct1, droneAct2, droneAct3, droneRevelation].forEach((d) => d?.stop());
  activeDrone = null;
}

// ─── Volume control ───

export function setGlobalVolume(vol: number) {
  globalVolume = Math.max(0, Math.min(1, vol));
  if (activeDrone) activeDrone.volume(0.10 * globalVolume);
}

export function getGlobalVolume(): number {
  return globalVolume;
}

export function getCurrentAct(): 1 | 2 | 3 | "revelation" {
  return currentAct;
}

// ─── Fade in/out ───

export function fadeInAudio(durationMs = 1500) {
  const drone = activeDrone || getDrone(currentAct);
  if (!drone) return;
  if (!drone.playing()) { drone.volume(0); drone.play(); activeDrone = drone; }
  drone.fade(0, 0.10 * globalVolume, durationMs);
}

export function fadeOutAudio(durationMs = 1500) {
  if (!activeDrone) return;
  activeDrone.fade(activeDrone.volume(), 0, durationMs);
}

// ─── SFX ───

export function playTypewriter() {
  if (typewriterSounds.length === 0) return;
  const idx = Math.floor(Math.random() * typewriterSounds.length);
  typewriterSounds[idx].play();
}

export function playChainConfirm() {
  chainSound?.play();
}

export function playChoice() {
  choiceSound?.play();
}

export function playDiscovery() {
  discoverySound?.play();
}

export function playTuneIn() {
  tuneSound?.play();
}

export function playAchievementSound(category: AchievementCategory) {
  switch (category) {
    case "exploration": achExploreSound?.play(); break;
    case "decision": achDecisionSound?.play(); break;
    case "obsession": achObsessionSound?.play(); break;
    case "verification": achVerifySound?.play(); break;
    case "balance": achBalanceSound?.play(); break;
    default: achExploreSound?.play(); break;
  }
}

export function setAmbientVolume(vol: number) {
  setGlobalVolume(vol);
}
