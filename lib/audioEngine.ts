export class AudioEngine {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private running = false

  start() {
    if (this.running) return this
    this.ctx = new AudioContext()
    this.masterGain = this.ctx.createGain()
    this.masterGain.gain.value = 0.4
    this.masterGain.connect(this.ctx.destination)

    this._drones()
    this._playMelody()
    this._noise(0.015)
    this._heartbeat()
    this.running = true
    return this
  }

  stop() {
    this.running = false
    if (this.ctx) { this.ctx.close(); this.ctx = null; this.masterGain = null }
  }

  toggle(): boolean {
    if (this.running) { this.stop(); return false }
    this.start(); return true
  }

  isRunning() { return this.running }

  setVolume(v: number) {
    if (this.masterGain) this.masterGain.gain.value = Math.max(0, Math.min(1, v))
  }

  getVolume(): number { return this.masterGain?.gain.value ?? 0.4 }

  playGlitch() {
    if (!this.ctx || !this.masterGain || !this.running) return
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.06, this.ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let j = 0; j < d.length; j++) d[j] = (Math.random() * 2 - 1) * 0.3
    const src = this.ctx.createBufferSource()
    src.buffer = buf
    const g = this.ctx.createGain()
    g.gain.value = 0.5
    src.connect(g)
    g.connect(this.masterGain)
    src.start()
  }

  private _drones() {
    if (!this.ctx || !this.masterGain) return
    const droneGain = this.ctx.createGain()
    droneGain.gain.value = 1.0
    droneGain.connect(this.masterGain)

    const freqs: [number, OscillatorType, number][] = [[55, 'sine', 0.10], [110, 'sine', 0.05], [82.5, 'triangle', 0.04]]
    freqs.forEach(([freq, type, vol]) => {
      const osc = this.ctx!.createOscillator()
      const g = this.ctx!.createGain()
      osc.frequency.value = freq; osc.type = type; g.gain.value = vol
      osc.connect(g); g.connect(droneGain); osc.start()
    })

    const lfo = this.ctx.createOscillator()
    const lfoGain = this.ctx.createGain()
    lfo.frequency.value = 0.3
    lfo.type = 'sine'
    lfoGain.gain.value = 0.03
    lfo.connect(lfoGain)
    lfoGain.connect(droneGain.gain)
    lfo.start()

    this._addReverb(droneGain)
  }

  private _playMelody() {
    if (!this.ctx || !this.masterGain) return
    const scale = [220.0, 246.9, 261.6, 293.7, 329.6, 349.2, 392.0, 440.0]
    const pattern = [0, 0, 2, 1, 0, 5, 4, 0, 3, 2, 0, 7, 6, 5, 3, 2]
    let i = 0

    const melodyBus = this.ctx.createGain()
    melodyBus.gain.value = 1.0
    melodyBus.connect(this.masterGain)
    this._addReverb(melodyBus)

    const playNote = () => {
      if (!this.ctx || !this.running) return
      const freq = scale[pattern[i % pattern.length]] / 2
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = i % 3 === 0 ? 'sine' : 'triangle'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, this.ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.04, this.ctx.currentTime + 0.1)
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.8)
      osc.connect(gain)
      gain.connect(melodyBus)
      osc.start(this.ctx.currentTime)
      osc.stop(this.ctx.currentTime + 1.8)
      i++
      const delay = i % 4 === 0 ? 2200 : 800 + Math.random() * 600
      setTimeout(playNote, delay)
    }
    setTimeout(playNote, 1200)
  }

  private _addReverb(input: AudioNode) {
    if (!this.ctx || !this.masterGain) return
    const length = this.ctx.sampleRate * 2
    const impulse = this.ctx.createBuffer(2, length, this.ctx.sampleRate)
    for (let ch = 0; ch < 2; ch++) {
      const d = impulse.getChannelData(ch)
      for (let j = 0; j < length; j++) {
        d[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / length, 2)
      }
    }
    const convolver = this.ctx.createConvolver()
    convolver.buffer = impulse
    const reverbGain = this.ctx.createGain()
    reverbGain.gain.value = 0.25
    input.connect(convolver)
    convolver.connect(reverbGain)
    reverbGain.connect(this.masterGain)
  }

  private _noise(vol: number) {
    if (!this.ctx || !this.masterGain) return
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 4, this.ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let j = 0; j < d.length; j++) d[j] = Math.random() * 2 - 1
    const src = this.ctx.createBufferSource()
    src.buffer = buf; src.loop = true
    const f = this.ctx.createBiquadFilter()
    f.type = 'lowpass'; f.frequency.value = 250
    const g = this.ctx.createGain()
    g.gain.value = vol
    src.connect(f); f.connect(g); g.connect(this.masterGain); src.start()
  }

  private _heartbeat() {
    if (!this.ctx || !this.masterGain || !this.running) return
    const osc = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    osc.frequency.value = 58; osc.type = 'sine'
    g.gain.setValueAtTime(0, this.ctx.currentTime)
    g.gain.linearRampToValueAtTime(0.15, this.ctx.currentTime + 0.05)
    g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.3)
    osc.connect(g); g.connect(this.masterGain)
    osc.start(); osc.stop(this.ctx.currentTime + 0.3)
    setTimeout(() => this._heartbeat(), 1600 + Math.random() * 800)
  }
}

export const audioEngine = new AudioEngine()
