export type RaceEventType = 'boost' | 'fall' | 'tired'

export interface RaceEvent {
  optionId: number
  type: RaceEventType
  startMs: number
  endMs: number
  obstacle?: 'banana' | 'puddle' | 'fan'
}

export function createRaceEvents(optionIds: readonly number[], random: () => number = Math.random): RaceEvent[] {
  if (optionIds.length < 2) throw new Error('至少需要两名选手')
  const types: RaceEventType[] = ['boost', 'fall', 'tired']
  for (let i = types.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    const a = types[i]
    const b = types[j]
    if (!a || !b) throw new Error('事件随机值无效')
    types[i] = b
    types[j] = a
  }
  return types.map((type, index) => {
    const optionId = optionIds[Math.floor(random() * optionIds.length)]
    if (optionId === undefined) throw new Error('事件选手无效')
    const startMs = [4200, 7600, 10800][index]
    if (startMs === undefined) throw new Error('事件时间无效')
    const obstacle = type === 'boost' ? 'fan' : type === 'fall' ? (random() < 0.5 ? 'banana' : 'puddle') : undefined
    return { optionId, type, startMs, endMs: startMs + 1400, obstacle }
  })
}

// 保持事件前后的时间点一致，仅改变期间速度，故不会改写冲线顺序。
export function eventTime(elapsed: number, event: RaceEvent): number {
  if (elapsed <= event.startMs || elapsed >= event.endMs) return elapsed
  const duration = event.endMs - event.startMs
  const x = (elapsed - event.startMs) / duration
  const mapped = event.type === 'tired' ? Math.pow(x, 1.5) : x * x
  return event.startMs + mapped * duration
}
