let ctx: AudioContext | null = null;
let started = false;
let droneOsc: OscillatorNode | null = null;
let droneGain: GainNode | null = null;
let masterGain: GainNode | null = null;
let melodicTimer: ReturnType<typeof setTimeout> | null = null;

function ensure(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.5;
    masterGain.connect(ctx.destination);
  }
  return ctx;
}

export function initGameAudio() {
  ensure();
  if (!started) {
    const start = async () => {
      const c = ensure();
      if (c.state === "suspended") await c.resume();
      started = true;
      window.removeEventListener("click", start);
      window.removeEventListener("touchstart", start);
    };
    window.addEventListener("click", start, { once: true });
    window.addEventListener("touchstart", start, { once: true });
  }
}

function tone(freq: number, dur: number, type: OscillatorType = "sine", vol = 0.1) {
  if (!ctx || !masterGain || !started) return;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  g.connect(masterGain);
  const o = ctx.createOscillator();
  o.type = type; o.frequency.value = freq;
  o.connect(g); o.start(); o.stop(ctx.currentTime + dur + 0.05);
}

function noise(dur: number, vol = 0.1) {
  if (!ctx || !masterGain || !started) return;
  const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-(i / d.length) * 4);
  const s = ctx.createBufferSource(); s.buffer = buf;
  const g = ctx.createGain(); g.gain.value = vol;
  s.connect(g); g.connect(masterGain); s.start();
}

export function jumpSound() { tone(200, 0.15, "sine", 0.12); setTimeout(() => tone(400, 0.05, "sine", 0.08), 50); }
export function landSound() { noise(0.05, 0.15); }
export function footstepSound() { tone(Math.random() > 0.5 ? 80 : 90, 0.03, "square", 0.06); }
export function enemyDetectSound() {
  if (!ctx || !masterGain || !started) return;
  const o = ctx.createOscillator(); const g = ctx.createGain();
  o.type = "sine"; o.frequency.setValueAtTime(300, ctx.currentTime);
  o.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.2);
  g.gain.setValueAtTime(0.12, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
  o.connect(g); g.connect(masterGain); o.start(); o.stop(ctx.currentTime + 0.3);
}
export function damageSound() { noise(0.1, 0.2); setTimeout(() => tone(80, 0.2, "sine", 0.15), 50); }
export function collectSound() { [440, 554, 659].forEach((f, i) => setTimeout(() => tone(f, 0.2, "sine", 0.1), i * 80)); }
export function checkpointSound() { tone(440, 0.4, "sine", 0.06); tone(554, 0.4, "sine", 0.06); tone(659, 0.4, "sine", 0.06); }

const DRONE_FREQS = [55, 46, 65, 41, 55];
export function startGameMusic(levelId: number) {
  stopGameMusic();
  if (!ctx || !masterGain || !started) return;
  const freq = DRONE_FREQS[Math.min(levelId - 1, 4)];
  droneGain = ctx.createGain(); droneGain.gain.value = 0; droneGain.connect(masterGain);
  droneOsc = ctx.createOscillator(); droneOsc.type = "sine"; droneOsc.frequency.value = freq;
  const lfo = ctx.createOscillator(); const lfoG = ctx.createGain();
  lfo.frequency.value = 0.15; lfoG.gain.value = freq * 0.03;
  lfo.connect(lfoG); lfoG.connect(droneOsc.frequency); lfo.start();
  droneOsc.connect(droneGain); droneOsc.start();
  droneGain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 2);
  scheduleMelody();
}

function scheduleMelody() {
  const notes = [220, 261, 293, 330, 392];
  const delay = 3000 + Math.random() * 4000;
  melodicTimer = setTimeout(() => {
    tone(notes[Math.floor(Math.random() * notes.length)], 0.8 + Math.random() * 0.5, "sine", 0.025);
    scheduleMelody();
  }, delay);
}

export function stopGameMusic() {
  try { droneOsc?.stop(); } catch { /* */ }
  droneOsc = null; droneGain = null;
  if (melodicTimer) { clearTimeout(melodicTimer); melodicTimer = null; }
}
