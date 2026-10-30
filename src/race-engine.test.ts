import { describe, expect, it } from 'vitest'
import {
  RACE_DURATION_MS,
  createRaceSimulation,
  type RandomSource,
  type RaceSimulation,
} from './race-engine'

function sequenceRandom(values: readonly number[], fallback = 0): RandomSource {
  let index = 0

  return {
    nextUint32(): number {
      const value = values[index]
      index += 1
      return value ?? fallback
    },
  }
}

function assertConsistentRace(simulation: RaceSimulation, optionIds: readonly number[]): void {
  expect(simulation.durationMs).toBe(RACE_DURATION_MS)
  expect(simulation.racers).toHaveLength(optionIds.length)
  expect(simulation.finishOrder).toHaveLength(optionIds.length)
  expect(new Set(simulation.finishOrder)).toEqual(new Set(optionIds))
  expect(simulation.finishOrder[0]).toBe(simulation.winnerOptionId)
  expect(simulation.leaderByPhase.finish).toBe(simulation.winnerOptionId)

  const racersByFinish = [...simulation.racers].sort(
    (first, second) => first.finishTimeMs - second.finishTimeMs,
  )

  expect(racersByFinish.map(({ optionId }) => optionId)).toEqual(simulation.finishOrder)
  expect(racersByFinish.map(({ finishPlace }) => finishPlace)).toEqual(
    optionIds.map((_, index) => index + 1),
  )

  for (const racer of simulation.racers) {
    expect(racer.keyframes.map(({ phase }) => phase)).toEqual([
      'start',
      'opening',
      'midway',
      'sprint',
      'finish',
    ])
    expect(racer.keyframes[0]?.progress).toBe(0)
    expect(racer.keyframes.at(-1)?.progress).toBe(1)

    for (let index = 1; index < racer.keyframes.length; index += 1) {
      const previous = racer.keyframes[index - 1]
      const current = racer.keyframes[index]

      expect(previous).toBeDefined()
      expect(current).toBeDefined()
      expect(current?.atMs).toBeGreaterThan(previous?.atMs ?? Number.POSITIVE_INFINITY)
      expect(current?.progress).toBeGreaterThan(previous?.progress ?? Number.POSITIVE_INFINITY)
    }
  }
}

describe('公平比赛引擎', () => {
  it.each([2, 3, 4])('为 %i 名选手生成完整且一致的比赛', (count) => {
    const optionIds = Array.from({ length: count }, (_, index) => index + 10)
    const simulation = createRaceSimulation(optionIds, sequenceRandom([count - 1], 123_456))

    assertConsistentRace(simulation, optionIds)
  })

  it.each([2, 3, 4])('%i 名选手的每个位置都能以相同次数成为冠军', (count) => {
    const optionIds = Array.from({ length: count }, (_, index) => index + 1)
    const wins = new Map(optionIds.map((optionId) => [optionId, 0]))

    for (let draw = 0; draw < count * 100; draw += 1) {
      const simulation = createRaceSimulation(optionIds, sequenceRandom([draw], 0))
      const currentWins = wins.get(simulation.winnerOptionId)

      if (currentWins === undefined) {
        throw new Error('冠军不在参赛名单中')
      }

      wins.set(simulation.winnerOptionId, currentWins + 1)
    }

    expect([...wins.values()]).toEqual(optionIds.map(() => 100))
  })

  it('改变选手排列顺序不会让任何固定赛道获得更多冠军', () => {
    const optionIds = [11, 22, 33, 44]
    const wins = new Map(optionIds.map((optionId) => [optionId, 0]))

    for (let rotation = 0; rotation < optionIds.length; rotation += 1) {
      const rotatedOptionIds = [...optionIds.slice(rotation), ...optionIds.slice(0, rotation)]

      for (let draw = 0; draw < rotatedOptionIds.length; draw += 1) {
        const simulation = createRaceSimulation(rotatedOptionIds, sequenceRandom([draw], 0))
        const currentWins = wins.get(simulation.winnerOptionId)

        if (currentWins === undefined) {
          throw new Error('冠军不在参赛名单中')
        }

        wins.set(simulation.winnerOptionId, currentWins + 1)
      }
    }

    expect([...wins.values()]).toEqual([4, 4, 4, 4])
  })

  it('丢弃会造成取模偏差的 32 位尾值', () => {
    const simulation = createRaceSimulation(
      [1, 2, 3],
      sequenceRandom([0xffff_ffff, 2], 0),
    )

    expect(simulation.winnerOptionId).toBe(3)
  })

  it.each([2, 3, 4])('%i 人比赛在冲刺前保留悬念，冠军最后完成反超', (count) => {
    const optionIds = Array.from({ length: count }, (_, index) => index + 1)
    const simulation = createRaceSimulation(optionIds, sequenceRandom([0], 777))

    expect(simulation.leaderByPhase.opening).not.toBe(simulation.winnerOptionId)
    expect(simulation.leaderByPhase.sprint).not.toBe(simulation.winnerOptionId)
    expect(simulation.leaderByPhase.finish).toBe(simulation.winnerOptionId)
    expect(new Set(Object.values(simulation.leaderByPhase)).size).toBeGreaterThanOrEqual(2)
  })

  it('相同的固定随机源生成完全相同的比赛', () => {
    const randomValues = [2, 1, 0, 123, 456, 789, 101_112, 131_415, 161_718]
    const first = createRaceSimulation([1, 2, 3, 4], sequenceRandom(randomValues, 42))
    const second = createRaceSimulation([1, 2, 3, 4], sequenceRandom(randomValues, 42))

    expect(first).toEqual(second)
  })

  it('拒绝人数错误或编号重复的比赛', () => {
    expect(() => createRaceSimulation([1], sequenceRandom([0]))).toThrow('比赛必须有 2～4 名选手')
    expect(() => createRaceSimulation([1, 1], sequenceRandom([0]))).toThrow('选手编号不能重复')
    expect(() => createRaceSimulation([1, 2, 3, 4, 5], sequenceRandom([0]))).toThrow(
      '比赛必须有 2～4 名选手',
    )
  })
})
