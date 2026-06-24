"use client";

import { useEffect, useRef, useState } from "react";

export default function AmbientAudio() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [playing, setPlaying] = useState(false);

  const startAudio = () => {
    if (audioCtxRef.current) return;

    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    // Dark drone - low oscillator
    const osc1 = ctx.createOscillator();
    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(55, ctx.currentTime);
    osc1.frequency.linearRampToValueAtTime(50, ctx.currentTime + 4);

    const gain1 = ctx.createGain();
    gain1.gain.setValueAtTime(0, ctx.currentTime);
    gain1.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 3);

    const filter1 = ctx.createBiquadFilter();
    filter1.type = "lowpass";
    filter1.frequency.setValueAtTime(200, ctx.currentTime);

    osc1.connect(filter1).connect(gain1).connect(ctx.destination);
    osc1.start();

    // Sub bass rumble
    const osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(30, ctx.currentTime);

    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0, ctx.currentTime);
    gain2.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 5);

    // LFO for pulsing
    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.2, ctx.currentTime);
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(0.015, ctx.currentTime);

    lfo.connect(lfoGain).connect(gain2.gain);
    lfo.start();

    osc2.connect(gain2).connect(ctx.destination);
    osc2.start();

    // White noise whisper
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0, ctx.currentTime);
    noiseGain.gain.linearRampToValueAtTime(0.008, ctx.currentTime + 4);

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.setValueAtTime(800, ctx.currentTime);
    noiseFilter.Q.setValueAtTime(0.5, ctx.currentTime);

    noise.connect(noiseFilter).connect(noiseGain).connect(ctx.destination);
    noise.start();

    setPlaying(true);
  };

  const stopAudio = () => {
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
      setPlaying(false);
    }
  };

  useEffect(() => {
    return () => {
      audioCtxRef.current?.close();
    };
  }, []);

  return (
    <button
      onClick={playing ? stopAudio : startAudio}
      className="fixed bottom-4 right-4 z-50 border border-red-900/30 bg-black/80 px-3 py-1.5
        font-mono text-[10px] text-red-400/50 hover:text-red-400 hover:border-red-700/50
        transition-all cursor-pointer uppercase tracking-widest"
    >
      {playing ? "♪ silenciar" : "♪ ambiente"}
    </button>
  );
}
