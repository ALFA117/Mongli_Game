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

    this._osc(55, 'sine', 0.12)
    this._osc(110, 'sine', 0.06)
    this._osc(82.5, 'triangle', 0.04)

    const melody = [130.8, 146.8, 155.6, 174.6, 196, 174.6, 155.6, 130.8]
    let i = 0
    const playNote = () => {
      if (!this.ctx || !this.masterGain || !this.running) return
      const osc = this.ctx.createOscillator()
      const g = this.ctx.createGain()
      osc.frequency.value = melody[i % melody.length]
      osc.type = 'triangle'
      g.gain.setValueAtTime(0, this.ctx.currentTime)
      g.gain.linearRampToValueAtTime(0.03, this.ctx.currentTime + 0.3)
      g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 2.5)
      osc.connect(g)
      g.connect(this.masterGain!)
      osc.start()
      osc.stop(this.ctx.currentTime + 2.5)
      i++
      setTimeout(playNote, 2800 + Math.random() * 1200)
    }
    setTimeout(playNote, 1000)

    this._noise(0.02)
    this._heartbeat()
    this.running = true
    return this
  }

  stop() {
    this.running = false
    if (this.ctx) {
      this.ctx.close()
      this.ctx = null
      this.masterGain = null
    }
  }

  toggle(): boolean {
    if (this.running) {
      this.stop()
      return false
    }
    this.start()
    return true
  }

  isRunning() {
    return this.running
  }

  setVolume(v: number) {
    if (this.masterGain) this.masterGain.gain.value = Math.max(0, Math.min(1, v))
  }

  getVolume(): number {
    return this.masterGain?.gain.value ?? 0.4
  }

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

  private _osc(freq: number, type: OscillatorType, vol: number) {
    if (!this.ctx || !this.masterGain) return
    const osc = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    osc.frequency.value = freq
    osc.type = type
    g.gain.value = vol
    osc.connect(g)
    g.connect(this.masterGain)
    osc.start()
  }

  private _noise(vol: number) {
    if (!this.ctx || !this.masterGain) return
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 3, this.ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let j = 0; j < d.length; j++) d[j] = Math.random() * 2 - 1
    const src = this.ctx.createBufferSource()
    src.buffer = buf
    src.loop = true
    const f = this.ctx.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.value = 300
    const g = this.ctx.createGain()
    g.gain.value = vol
    src.connect(f)
    f.connect(g)
    g.connect(this.masterGain)
    src.start()
  }

  private _heartbeat() {
    if (!this.ctx || !this.masterGain || !this.running) return
    const osc = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    osc.frequency.value = 60
    osc.type = 'sine'
    g.gain.setValueAtTime(0, this.ctx.currentTime)
    g.gain.linearRampToValueAtTime(0.18, this.ctx.currentTime + 0.04)
    g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.25)
    osc.connect(g)
    g.connect(this.masterGain)
    osc.start()
    osc.stop(this.ctx.currentTime + 0.25)
    setTimeout(() => this._heartbeat(), 1800 + Math.random() * 800)
  }
}

export const audioEngine = new AudioEngine()
