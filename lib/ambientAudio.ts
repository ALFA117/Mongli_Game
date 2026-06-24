let audioCtx: AudioContext | null = null;

export function startAmbientAudio(): AudioContext {
  if (audioCtx) return audioCtx;
  const ctx = new AudioContext();
  audioCtx = ctx;

  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.frequency.value = 55;
  osc1.type = "sine";
  gain1.gain.value = 0.08;
  osc1.connect(gain1).connect(ctx.destination);
  osc1.start();

  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.frequency.value = 110;
  osc2.type = "sine";
  gain2.gain.value = 0.04;
  osc2.connect(gain2).connect(ctx.destination);
  osc2.start();

  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 200;
  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0.015;
  noise.connect(filter).connect(noiseGain).connect(ctx.destination);
  noise.start();

  function heartbeat() {
    if (!audioCtx || audioCtx.state === "closed") return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = 80;
    o.type = "sine";
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05);
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.3);
    setTimeout(heartbeat, 2000 + Math.random() * 1000);
  }
  setTimeout(heartbeat, 1000);

  return ctx;
}

export function stopAmbientAudio() {
  if (audioCtx) {
    audioCtx.close();
    audioCtx = null;
  }
}

export function toggleAmbientAudio(): boolean {
  if (audioCtx) {
    stopAmbientAudio();
    return false;
  }
  startAmbientAudio();
  return true;
}

export function playGlitchSound() {
  if (!audioCtx || audioCtx.state === "closed") return;
  const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.06, audioCtx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.3;
  const src = audioCtx.createBufferSource();
  src.buffer = buf;
  src.connect(audioCtx.destination);
  src.start();
}
