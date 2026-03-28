import type { ButtonColor } from '../types'

const FREQUENCIES: Record<ButtonColor, number> = {
  orange: 415,  // G#4
  blue:   523,  // C5
  green:  659,  // E5
  yellow: 784,  // G5
}

let audioCtx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext()
  return audioCtx
}

function playOsc(
  freq: number,
  type: OscillatorType,
  startVolume: number,
  duration: number,
  delay = 0
): void {
  const ctx = getCtx()
  if (ctx.state === 'suspended') ctx.resume()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = type
  osc.frequency.value = freq
  const t = ctx.currentTime + delay
  gain.gain.setValueAtTime(0, t)
  gain.gain.linearRampToValueAtTime(startVolume, t + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration)
  osc.start(t)
  osc.stop(t + duration)
}

export function playTone(color: ButtonColor, duration = 0.22): void {
  try {
    playOsc(FREQUENCIES[color], 'sine', 0.28, duration)
  } catch { /* 오디오 미지원 환경 무시 */ }
}

// 게임 시작: 4음 상행 아르페지오
export function playGameStart(): void {
  try {
    const order: ButtonColor[] = ['orange', 'blue', 'green', 'yellow']
    order.forEach((color, i) => {
      setTimeout(() => playOsc(FREQUENCIES[color], 'sine', 0.22, 0.15), i * 90)
    })
  } catch { /* ignore */ }
}

// 환호성 효과음 (5스테이지마다) — 여러 목소리 피치 상승 "와~"
export function playApplause(): void {
  try {
    const ctx = getCtx()
    if (ctx.state === 'suspended') ctx.resume()

    const now = ctx.currentTime
    const duration = 1.6

    // 여러 목소리 (다양한 기본 주파수로 군중 느낌)
    const baseFreqs = [140, 170, 210, 250, 180, 230, 160, 290]
    baseFreqs.forEach((baseFreq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const lfo = ctx.createOscillator()
      const lfoGain = ctx.createGain()

      lfo.connect(lfoGain)
      lfoGain.connect(gain.gain)
      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.type = 'sawtooth'
      const startFreq = baseFreq + Math.random() * 15
      // 피치 상승 → 와~
      osc.frequency.setValueAtTime(startFreq, now + i * 0.015)
      osc.frequency.linearRampToValueAtTime(startFreq * 1.35, now + duration * 0.65)
      osc.frequency.linearRampToValueAtTime(startFreq * 1.2, now + duration)

      // 떨림(vibrato) LFO
      lfo.type = 'sine'
      lfo.frequency.value = 5.5 + Math.random() * 2.5
      lfoGain.gain.value = 0.035

      const vol = 0.06 + Math.random() * 0.045
      const t0 = now + i * 0.015
      gain.gain.setValueAtTime(0, t0)
      gain.gain.linearRampToValueAtTime(vol, t0 + 0.12)
      gain.gain.setValueAtTime(vol, now + duration - 0.35)
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration)

      lfo.start(t0)
      osc.start(t0)
      lfo.stop(now + duration)
      osc.stop(now + duration)
    })

    // 군중 웅성임 텍스처 (bandpass 노이즈)
    const noiseLen = Math.ceil(ctx.sampleRate * duration)
    const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate)
    const nd = noiseBuf.getChannelData(0)
    for (let j = 0; j < noiseLen; j++) nd[j] = Math.random() * 2 - 1

    const noise = ctx.createBufferSource()
    noise.buffer = noiseBuf

    const bpf = ctx.createBiquadFilter()
    bpf.type = 'bandpass'
    bpf.frequency.value = 700
    bpf.Q.value = 1.2

    const ng = ctx.createGain()
    noise.connect(bpf)
    bpf.connect(ng)
    ng.connect(ctx.destination)

    ng.gain.setValueAtTime(0, now)
    ng.gain.linearRampToValueAtTime(0.07, now + 0.1)
    ng.gain.setValueAtTime(0.07, now + duration - 0.4)
    ng.gain.exponentialRampToValueAtTime(0.001, now + duration)

    noise.start(now)
    noise.stop(now + duration)
  } catch { /* ignore */ }
}

// 게임 오버: 하강 버저 + 짧은 쿵 느낌
export function playGameOver(): void {
  try {
    const ctx = getCtx()
    if (ctx.state === 'suspended') ctx.resume()

    // 하강 사인파 sweep
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sawtooth'
    const now = ctx.currentTime
    osc.frequency.setValueAtTime(320, now)
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.7)
    gain.gain.setValueAtTime(0.25, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7)
    osc.start(now)
    osc.stop(now + 0.7)

    // 짧은 쿵 (저음 충격)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(80, now)
    osc2.frequency.exponentialRampToValueAtTime(30, now + 0.3)
    gain2.gain.setValueAtTime(0.35, now)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
    osc2.start(now)
    osc2.stop(now + 0.3)
  } catch { /* ignore */ }
}
