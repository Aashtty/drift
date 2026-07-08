// apps/web/src/lib/audio/audioEngine.ts
'use client'

const RAMP_MS = 2000

class AudioEngine {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null

  private brownNode: AudioWorkletNode | null = null
  private brownGain: GainNode | null = null
  private brownWorkletLoaded = false

  private binauralLeft: OscillatorNode | null = null
  private binauralRight: OscillatorNode | null = null
  private binauralGain: GainNode | null = null
  private binauralMerger: ChannelMergerNode | null = null

  private async ensureContext(): Promise<AudioContext> {
    if (this.ctx) return this.ctx
    this.ctx = new AudioContext()
    this.masterGain = this.ctx.createGain()
    this.masterGain.gain.value = 0.3
    this.masterGain.connect(this.ctx.destination)
    return this.ctx
  }

  async setMasterVolume(volume: number): Promise<void> {
    const ctx = await this.ensureContext()
    if (!this.masterGain) return
    const now = ctx.currentTime
    this.masterGain.gain.cancelScheduledValues(now)
    this.masterGain.gain.linearRampToValueAtTime(Math.max(0.0001, volume), now + 0.1)
  }

  async startBrownNoise(): Promise<void> {
    const ctx = await this.ensureContext()
    if (!this.brownWorkletLoaded) {
      await ctx.audioWorklet.addModule('/worklets/brown-noise-processor.js')
      this.brownWorkletLoaded = true
    }
    if (this.brownNode) return // already running

    this.brownNode = new AudioWorkletNode(ctx, 'brown-noise-processor')
    this.brownGain = ctx.createGain()
    this.brownGain.gain.value = 0
    this.brownNode.connect(this.brownGain)
    this.brownGain.connect(this.masterGain!)

    const now = ctx.currentTime
    this.brownGain.gain.linearRampToValueAtTime(1, now + RAMP_MS / 1000)
  }

  async stopBrownNoise(): Promise<void> {
    if (!this.ctx || !this.brownGain || !this.brownNode) return
    const now = this.ctx.currentTime
    this.brownGain.gain.linearRampToValueAtTime(0, now + RAMP_MS / 1000)
    const node = this.brownNode
    const gain = this.brownGain
    setTimeout(() => {
      node.disconnect()
      gain.disconnect()
    }, RAMP_MS + 100)
    this.brownNode = null
    this.brownGain = null
  }

  /** 200Hz left ear, 214Hz right ear -> 14Hz beat frequency (beta / focus range). Only meant to run during FLOW. */
  async startBinaural(): Promise<void> {
    const ctx = await this.ensureContext()
    if (this.binauralLeft) return

    this.binauralMerger = ctx.createChannelMerger(2)
    this.binauralGain = ctx.createGain()
    this.binauralGain.gain.value = 0

    this.binauralLeft = ctx.createOscillator()
    this.binauralLeft.frequency.value = 200
    this.binauralLeft.connect(this.binauralMerger, 0, 0)

    this.binauralRight = ctx.createOscillator()
    this.binauralRight.frequency.value = 214
    this.binauralRight.connect(this.binauralMerger, 0, 1)

    this.binauralMerger.connect(this.binauralGain)
    this.binauralGain.connect(this.masterGain!)

    this.binauralLeft.start()
    this.binauralRight.start()

    const now = ctx.currentTime
    this.binauralGain.gain.linearRampToValueAtTime(0.5, now + RAMP_MS / 1000)
  }

  async stopBinaural(): Promise<void> {
    if (!this.ctx || !this.binauralGain || !this.binauralLeft || !this.binauralRight) return
    const now = this.ctx.currentTime
    this.binauralGain.gain.linearRampToValueAtTime(0, now + RAMP_MS / 1000)
    const left = this.binauralLeft
    const right = this.binauralRight
    setTimeout(() => {
      left.stop()
      right.stop()
      left.disconnect()
      right.disconnect()
    }, RAMP_MS + 100)
    this.binauralLeft = null
    this.binauralRight = null
  }
}

export const audioEngine = new AudioEngine()