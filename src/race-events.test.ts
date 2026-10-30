import { describe, expect, it } from 'vitest'
import { createRaceEvents, eventTime } from './race-events'

describe('比赛事件', () => {
  it('生成三个不重叠的事件，选手都属于参赛名单', () => {
    const events = createRaceEvents([1, 2], () => 0.4)
    expect(new Set(events.map((event) => event.type))).toEqual(new Set(['boost', 'fall', 'tired']))
    expect(events.every((event) => [1, 2].includes(event.optionId))).toBe(true)
    expect(events[0]!.endMs).toBeLessThan(events[1]!.startMs)
    expect(events[1]!.endMs).toBeLessThan(events[2]!.startMs)
  })

  it('事件开始和结束时不改变时间线，期间速度有变化且不会倒退', () => {
    for (const event of createRaceEvents([1, 2], () => 0)) {
      expect(eventTime(event.startMs, event)).toBe(event.startMs)
      expect(eventTime(event.endMs, event)).toBe(event.endMs)
      const times = Array.from({ length: 15 }, (_, i) => eventTime(event.startMs + i * 100, event))
      expect(times[7]).not.toBe(event.startMs + 700)
      expect(times.every((value, index) => index === 0 || value >= times[index - 1]!)).toBe(true)
    }
  })
})
