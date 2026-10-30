export const RACE_DURATION_MS = 18_000

const UINT32_RANGE = 0x1_0000_0000
const OPENING_TIME_MS = 3_500
const MIDWAY_TIME_MS = 8_500
const SPRINT_TIME_MS = 13_500

export interface RandomSource {
  nextUint32(): number
}

export type RacePhase = 'start' | 'opening' | 'midway' | 'sprint' | 'finish'
export type SharedRacePhase = Exclude<RacePhase, 'start'>

export interface RaceKeyframe {
  phase: RacePhase
  atMs: number
  progress: number
}

export interface RacerTimeline {
  optionId: number
  finishPlace: number
  finishTimeMs: number
  keyframes: RaceKeyframe[]
}

export interface RaceSimulation {
  durationMs: number
  winnerOptionId: number
  finishOrder: number[]
  leaderByPhase: Record<SharedRacePhase, number>
  racers: RacerTimeline[]
}

const secureRandomSource: RandomSource = {
  nextUint32(): number {
    const values = new Uint32Array(1)
    crypto.getRandomValues(values)
    const value = values[0]

    if (value === undefined) {
      throw new Error('浏览器没有返回安全随机数')
    }

    return value
  },
}

function readUint32(randomSource: RandomSource): number {
  const value = randomSource.nextUint32()

  if (!Number.isInteger(value) || value < 0 || value >= UINT32_RANGE) {
    throw new Error('随机源必须返回 0 到 2³²-1 之间的整数')
  }

  return value
}

function drawUnbiasedIndex(upperBound: number, randomSource: RandomSource): number {
  if (!Number.isInteger(upperBound) || upperBound <= 0) {
    throw new Error('随机上限必须是正整数')
  }

  const acceptableLimit = UINT32_RANGE - (UINT32_RANGE % upperBound)
  let value = readUint32(randomSource)

  while (value >= acceptableLimit) {
    value = readUint32(randomSource)
  }

  return value % upperBound
}

function drawUnitInterval(randomSource: RandomSource): number {
  return readUint32(randomSource) / UINT32_RANGE
}

function shuffle<T>(values: readonly T[], randomSource: RandomSource): T[] {
  const shuffled = [...values]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = drawUnbiasedIndex(index + 1, randomSource)
    const currentValue = shuffled[index]
    const swapValue = shuffled[swapIndex]

    if (currentValue === undefined || swapValue === undefined) {
      throw new Error('比赛排名洗牌失败')
    }

    shuffled[index] = swapValue
    shuffled[swapIndex] = currentValue
  }

  return shuffled
}

function roundProgress(progress: number): number {
  return Math.round(progress * 1_000) / 1_000
}

function createPhaseProgress(
  optionIds: readonly number[],
  leaderOptionId: number,
  phase: 'opening' | 'midway' | 'sprint',
  winnerOptionId: number,
  randomSource: RandomSource,
): Map<number, number> {
  const progressByOptionId = new Map<number, number>()

  for (const optionId of optionIds) {
    let progress: number

    if (optionId === leaderOptionId) {
      progress = phase === 'opening' ? 0.27 : phase === 'midway' ? 0.56 : 0.86
    } else if (phase === 'opening') {
      progress = 0.18 + drawUnitInterval(randomSource) * 0.05
    } else if (phase === 'midway') {
      progress = 0.44 + drawUnitInterval(randomSource) * 0.07
    } else if (optionId === winnerOptionId) {
      progress = 0.81 + drawUnitInterval(randomSource) * 0.02
    } else {
      progress = 0.72 + drawUnitInterval(randomSource) * 0.07
    }

    progressByOptionId.set(optionId, roundProgress(progress))
  }

  return progressByOptionId
}

function validateOptionIds(optionIds: readonly number[]): void {
  if (optionIds.length < 2 || optionIds.length > 4) {
    throw new Error('比赛必须有 2～4 名选手')
  }

  if (optionIds.some((optionId) => !Number.isInteger(optionId))) {
    throw new Error('选手编号必须是整数')
  }

  if (new Set(optionIds).size !== optionIds.length) {
    throw new Error('选手编号不能重复')
  }
}

export function createRaceSimulation(
  optionIds: readonly number[],
  randomSource: RandomSource = secureRandomSource,
): RaceSimulation {
  validateOptionIds(optionIds)

  const winnerIndex = drawUnbiasedIndex(optionIds.length, randomSource)
  const winnerOptionId = optionIds[winnerIndex]

  if (winnerOptionId === undefined) {
    throw new Error('无法选出冠军')
  }

  const otherOptionIds = optionIds.filter((optionId) => optionId !== winnerOptionId)
  const finishOrder = [winnerOptionId, ...shuffle(otherOptionIds, randomSource)]
  const firstRivalOptionId = finishOrder[1]

  if (firstRivalOptionId === undefined) {
    throw new Error('比赛缺少对手')
  }

  const midwayLeaderOptionId = finishOrder[2] ?? winnerOptionId
  const leaderByPhase: Record<SharedRacePhase, number> = {
    opening: firstRivalOptionId,
    midway: midwayLeaderOptionId,
    sprint: firstRivalOptionId,
    finish: winnerOptionId,
  }
  const openingProgress = createPhaseProgress(
    optionIds,
    leaderByPhase.opening,
    'opening',
    winnerOptionId,
    randomSource,
  )
  const midwayProgress = createPhaseProgress(
    optionIds,
    leaderByPhase.midway,
    'midway',
    winnerOptionId,
    randomSource,
  )
  const sprintProgress = createPhaseProgress(
    optionIds,
    leaderByPhase.sprint,
    'sprint',
    winnerOptionId,
    randomSource,
  )

  const racers: RacerTimeline[] = optionIds.map((optionId) => {
    const finishIndex = finishOrder.indexOf(optionId)

    if (finishIndex === -1) {
      throw new Error(`选手 ${optionId} 缺少冲线排名`)
    }

    const opening = openingProgress.get(optionId)
    const midway = midwayProgress.get(optionId)
    const sprint = sprintProgress.get(optionId)

    if (opening === undefined || midway === undefined || sprint === undefined) {
      throw new Error(`选手 ${optionId} 缺少比赛进度`)
    }

    const finishTimeMs = 16_300 + finishIndex * 500 + Math.floor(drawUnitInterval(randomSource) * 100)

    return {
      optionId,
      finishPlace: finishIndex + 1,
      finishTimeMs,
      keyframes: [
        { phase: 'start', atMs: 0, progress: 0 },
        { phase: 'opening', atMs: OPENING_TIME_MS, progress: opening },
        { phase: 'midway', atMs: MIDWAY_TIME_MS, progress: midway },
        { phase: 'sprint', atMs: SPRINT_TIME_MS, progress: sprint },
        { phase: 'finish', atMs: finishTimeMs, progress: 1 },
      ],
    }
  })

  return {
    durationMs: RACE_DURATION_MS,
    winnerOptionId,
    finishOrder,
    leaderByPhase,
    racers,
  }
}
