export const MIN_RACE_OPTION_COUNT = 2
export const MAX_RACE_OPTION_COUNT = 4
export const MAX_OPTION_NAME_LENGTH = 40

export interface RawRaceOption {
  id: number
  value: string
}

export interface RaceOption {
  id: number
  name: string
}

export type OptionIssueCode = 'duplicate' | 'too-long'

export interface OptionIssue {
  optionId: number
  code: OptionIssueCode
  message: string
}

export interface RaceOptionValidation {
  isValid: boolean
  options: RaceOption[]
  issues: OptionIssue[]
  formMessage: string
}

function countCharacters(value: string): number {
  return Array.from(value).length
}

export function prepareRaceOptions(rawOptions: readonly RawRaceOption[]): RaceOptionValidation {
  const options = rawOptions
    .map(({ id, value }) => ({ id, name: value.trim() }))
    .filter(({ name }) => name.length > 0)
  const issues: OptionIssue[] = []
  const optionIdsByName = new Map<string, number[]>()

  for (const option of options) {
    if (countCharacters(option.name) > MAX_OPTION_NAME_LENGTH) {
      issues.push({
        optionId: option.id,
        code: 'too-long',
        message: `名称最多 ${MAX_OPTION_NAME_LENGTH} 个字符`,
      })
    }

    const matchingIds = optionIdsByName.get(option.name)

    if (matchingIds) {
      matchingIds.push(option.id)
    } else {
      optionIdsByName.set(option.name, [option.id])
    }
  }

  for (const optionIds of optionIdsByName.values()) {
    if (optionIds.length < 2) {
      continue
    }

    for (const optionId of optionIds) {
      issues.push({
        optionId,
        code: 'duplicate',
        message: '和其他选项重复了',
      })
    }
  }

  const hasEnoughOptions = options.length >= MIN_RACE_OPTION_COUNT
  const isValid = hasEnoughOptions && issues.length === 0
  let formMessage = '请填写至少两个有效选项，空白项不会参赛。'

  if (options.length === 1) {
    formMessage = '还差一个有效选项就能开赛。'
  } else if (hasEnoughOptions && issues.length > 0) {
    formMessage = '请先修改标红的选项。'
  } else if (isValid) {
    formMessage = `报名表检查通过，${options.length} 名选手可以开赛。`
  }

  return {
    isValid,
    options,
    issues,
    formMessage,
  }
}
