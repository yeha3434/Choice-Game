type Sound = 'count' | 'start' | 'boost' | 'fall' | 'lead' | 'sprint' | 'win'
type MusicMode = 'menu' | 'race' | 'sprint'

export class GameAudio {
  private context: AudioContext | undefined
  private timer: number | undefined
  private mode: MusicMode = 'menu'
  private step = 0
  private lastEffect = 0
  music = this.load('music')
  effects = this.load('effects')

  private load(key: string): boolean {
    try { return localStorage.getItem(`choice-sports-${key}`) !== 'off' } catch { return true }
  }
  private save(key: string, enabled: boolean): void {
    try { localStorage.setItem(`choice-sports-${key}`, enabled ? 'on' : 'off') } catch { /* storage may be unavailable */ }
  }
  async unlock(): Promise<void> {
    try {
      this.context ??= new AudioContext()
      if (this.context.state === 'suspended') await this.context.resume()
      this.updateMusic()
    } catch { /* audio is optional */ }
  }
  setMusic(enabled: boolean): void { this.music = enabled; this.save('music', enabled); this.updateMusic() }
  setEffects(enabled: boolean): void { this.effects = enabled; this.save('effects', enabled) }
  setMode(mode: MusicMode): void { this.mode = mode }
  stopMusic(): void { if (this.timer !== undefined) window.clearInterval(this.timer); this.timer = undefined }
  private updateMusic(): void {
    this.stopMusic()
    if (!this.music || !this.context || this.context.state !== 'running' || document.hidden) return
    this.timer = window.setInterval(() => {
      const notes = this.mode === 'sprint' ? [220, 330, 277, 392] : this.mode === 'race' ? [196, 247, 294, 247] : [165, 220, 196, 247]
      this.tone(notes[this.step++ % notes.length] ?? 196, 0.12, this.mode === 'menu' ? 0.012 : 0.022, 'triangle')
    }, 300)
  }
  resumeMusic(): void { this.updateMusic() }
  private tone(frequency: number, duration: number, volume: number, type: OscillatorType, delay = 0): void {
    const context = this.context
    if (!context || context.state !== 'running') return
    const start = context.currentTime + delay
    const osc = context.createOscillator()
    const gain = context.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(frequency, start)
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
    osc.connect(gain).connect(context.destination)
    osc.start(start)
    osc.stop(start + duration + 0.01)
    osc.onended = () => { osc.disconnect(); gain.disconnect() }
  }
  private cheer(): void {
    const context = this.context
    if (!context || context.state !== 'running') return
    const buffer = context.createBuffer(1, Math.floor(context.sampleRate * 0.38), context.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length)
    const source = context.createBufferSource()
    const filter = context.createBiquadFilter()
    const gain = context.createGain()
    source.buffer = buffer
    filter.type = 'bandpass'
    filter.frequency.value = 900
    gain.gain.value = 0.025
    source.connect(filter).connect(gain).connect(context.destination)
    source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect() }
    source.start()
  }
  play(sound: Sound): void {
    if (!this.effects || !this.context || this.context.state !== 'running') return
    const now = performance.now()
    if (sound !== 'count' && sound !== 'start' && sound !== 'win' && now - this.lastEffect < 350) return
    this.lastEffect = now
    if (sound === 'win') {
      ;[392, 494, 587, 784].forEach((frequency, index) => this.tone(frequency, 0.24, 0.045, 'triangle', index * 0.12))
      this.cheer()
    } else {
      const tones: Record<Exclude<Sound, 'win'>, [number, number, OscillatorType]> = {
        count: [440, 0.1, 'sine'], start: [740, 0.2, 'square'], boost: [780, 0.1, 'sine'],
        fall: [145, 0.18, 'triangle'], lead: [540, 0.09, 'sine'], sprint: [640, 0.15, 'triangle'],
      }
      const [frequency, duration, type] = tones[sound]
      this.tone(frequency, duration, 0.035, type)
    }
  }
}
