export const CHARACTER_IDS = ['big-eye', 'belly-hero', 'long-legs', 'calm-potato'] as const

export type CharacterId = (typeof CHARACTER_IDS)[number]

export interface CharacterDefinition {
  id: CharacterId
  name: string
  tagline: string
  svg: string
}

export interface CharacterAssignment {
  optionId: number
  characterId: CharacterId
}

type RandomIndex = (upperBound: number) => number

export const CHARACTERS: readonly CharacterDefinition[] = [
  {
    id: 'big-eye',
    name: '大眼仔',
    tagline: '两只眼睛各看各的，顺便观察隔壁跑道。',
    svg: `
      <svg class="character-svg character-svg--big-eye" viewBox="0 0 180 190" aria-hidden="true">
        <ellipse cx="91" cy="174" rx="55" ry="9" fill="#d5aa86" opacity=".45" />
        <g fill="none" stroke="#432519" stroke-linecap="round" stroke-width="6">
          <path d="M48 111 Q25 119 18 101" />
          <path d="M132 111 Q154 120 164 101" />
          <path d="M70 142 Q62 159 55 170" />
          <path d="M111 142 Q122 157 130 169" />
        </g>
        <path d="M43 78 Q47 39 88 30 Q133 33 140 82 L136 126 Q128 149 91 151 Q53 148 42 124 Z" fill="#ffd85a" stroke="#432519" stroke-width="7" />
        <circle cx="72" cy="75" r="31" fill="#fffdf6" stroke="#432519" stroke-width="6" />
        <circle cx="116" cy="79" r="21" fill="#fffdf6" stroke="#432519" stroke-width="6" />
        <circle cx="78" cy="80" r="10" fill="#432519" />
        <circle cx="111" cy="75" r="7" fill="#432519" />
        <circle cx="82" cy="76" r="3" fill="#fff" />
        <circle cx="114" cy="72" r="2.5" fill="#fff" />
        <path d="M79 121 Q93 131 107 120" fill="none" stroke="#432519" stroke-linecap="round" stroke-width="5" />
        <path d="M50 57 Q61 43 78 45" fill="none" stroke="#432519" stroke-linecap="round" stroke-width="5" />
        <path d="M108 53 Q119 47 129 55" fill="none" stroke="#432519" stroke-linecap="round" stroke-width="5" />
      </svg>
    `,
  },
  {
    id: 'belly-hero',
    name: '肚肚侠',
    tagline: '披风很短，肚子很圆，气势倒是十分充足。',
    svg: `
      <svg class="character-svg character-svg--belly-hero" viewBox="0 0 180 190" aria-hidden="true">
        <ellipse cx="92" cy="174" rx="57" ry="9" fill="#d5aa86" opacity=".45" />
        <path d="M50 65 Q20 71 24 139 Q45 124 65 126 Z" fill="#ef6548" stroke="#432519" stroke-linejoin="round" stroke-width="7" />
        <g fill="none" stroke="#432519" stroke-linecap="round" stroke-width="8">
          <path d="M43 105 Q20 111 18 94" />
          <path d="M139 103 Q159 112 166 95" />
          <path d="M72 151 L65 169" />
          <path d="M113 151 L122 169" />
        </g>
        <path d="M46 81 Q51 39 92 36 Q135 39 142 83 L143 119 Q137 156 93 158 Q50 156 43 120 Z" fill="#68c9c1" stroke="#432519" stroke-width="7" />
        <path d="M53 70 Q91 47 132 70 L126 91 Q92 79 59 92 Z" fill="#5d4eb5" stroke="#432519" stroke-linejoin="round" stroke-width="6" />
        <circle cx="76" cy="75" r="6" fill="#fffdf6" />
        <circle cx="111" cy="74" r="6" fill="#fffdf6" />
        <circle cx="77" cy="76" r="3" fill="#432519" />
        <circle cx="110" cy="75" r="3" fill="#432519" />
        <path d="M78 103 Q93 111 108 103" fill="none" stroke="#432519" stroke-linecap="round" stroke-width="5" />
        <path d="M64 119 Q93 141 122 118" fill="none" stroke="#318d88" stroke-linecap="round" stroke-width="6" />
        <circle cx="52" cy="67" r="7" fill="#ffe169" stroke="#432519" stroke-width="4" />
      </svg>
    `,
  },
  {
    id: 'long-legs',
    name: '长腿哥',
    tagline: '身体迷你，腿长得像是借了别人的两条。',
    svg: `
      <svg class="character-svg character-svg--long-legs" viewBox="0 0 180 190" aria-hidden="true">
        <ellipse cx="92" cy="176" rx="60" ry="8" fill="#d5aa86" opacity=".45" />
        <g fill="none" stroke="#432519" stroke-linecap="round" stroke-width="11">
          <path d="M73 91 Q57 126 53 164" />
          <path d="M105 91 Q128 126 132 164" />
        </g>
        <path d="M35 166 Q53 156 68 168 Q58 178 38 176 Z" fill="#ef7842" stroke="#432519" stroke-linejoin="round" stroke-width="6" />
        <path d="M117 168 Q134 156 151 168 Q140 179 119 177 Z" fill="#ef7842" stroke="#432519" stroke-linejoin="round" stroke-width="6" />
        <g fill="none" stroke="#432519" stroke-linecap="round" stroke-width="6">
          <path d="M57 64 Q34 70 24 56" />
          <path d="M119 63 Q143 69 154 54" />
        </g>
        <path d="M52 44 Q60 20 90 19 Q121 21 129 47 L119 84 Q91 102 59 84 Z" fill="#b99de8" stroke="#432519" stroke-linejoin="round" stroke-width="7" />
        <circle cx="75" cy="52" r="8" fill="#fffdf6" stroke="#432519" stroke-width="4" />
        <circle cx="104" cy="52" r="8" fill="#fffdf6" stroke="#432519" stroke-width="4" />
        <circle cx="77" cy="53" r="3" fill="#432519" />
        <circle cx="102" cy="53" r="3" fill="#432519" />
        <path d="M78 72 Q90 79 102 71" fill="none" stroke="#432519" stroke-linecap="round" stroke-width="4" />
        <path d="M63 29 L55 15 M112 29 L120 14" stroke="#432519" stroke-linecap="round" stroke-width="5" />
      </svg>
    `,
  },
  {
    id: 'calm-potato',
    name: '淡定薯',
    tagline: '看起来不太想跑，但已经很给面子地站起来了。',
    svg: `
      <svg class="character-svg character-svg--calm-potato" viewBox="0 0 180 190" aria-hidden="true">
        <ellipse cx="91" cy="174" rx="55" ry="9" fill="#d5aa86" opacity=".45" />
        <g fill="none" stroke="#432519" stroke-linecap="round" stroke-width="7">
          <path d="M48 105 Q28 116 20 106" />
          <path d="M132 107 Q151 116 161 105" />
          <path d="M72 151 L65 169" />
          <path d="M109 151 L117 169" />
        </g>
        <path d="M65 30 Q93 15 119 35 Q143 53 137 82 Q151 108 132 136 Q117 158 84 154 Q50 157 39 129 Q26 103 43 80 Q38 49 65 30 Z" fill="#c9965c" stroke="#432519" stroke-linejoin="round" stroke-width="7" />
        <circle cx="60" cy="64" r="6" fill="#b27c45" />
        <circle cx="121" cy="112" r="8" fill="#b27c45" />
        <circle cx="61" cy="126" r="5" fill="#b27c45" />
        <path d="M61 79 Q73 85 84 79" fill="none" stroke="#432519" stroke-linecap="round" stroke-width="6" />
        <path d="M99 79 Q111 84 122 78" fill="none" stroke="#432519" stroke-linecap="round" stroke-width="6" />
        <path d="M82 111 Q92 106 103 111" fill="none" stroke="#432519" stroke-linecap="round" stroke-width="5" />
        <path d="M49 43 Q56 31 68 28" fill="none" stroke="#efd07b" stroke-linecap="round" stroke-width="5" />
      </svg>
    `,
  },
]

export function isCharacterId(value: string): value is CharacterId {
  return (CHARACTER_IDS as readonly string[]).includes(value)
}

export function getCharacter(characterId: CharacterId): CharacterDefinition {
  const character = CHARACTERS.find(({ id }) => id === characterId)

  if (!character) {
    throw new Error(`找不到角色 ${characterId}`)
  }

  return character
}

function secureRandomIndex(upperBound: number): number {
  if (!Number.isInteger(upperBound) || upperBound <= 0) {
    throw new Error('随机上限必须是正整数')
  }

  const range = 0x1_0000_0000
  const acceptableLimit = range - (range % upperBound)
  const randomValues = new Uint32Array(1)
  let value = acceptableLimit

  while (value >= acceptableLimit) {
    crypto.getRandomValues(randomValues)
    value = randomValues[0] ?? acceptableLimit
  }

  return value % upperBound
}

export function createCharacterAssignments(
  optionIds: readonly number[],
  randomIndex: RandomIndex = secureRandomIndex,
): CharacterAssignment[] {
  if (optionIds.length > CHARACTER_IDS.length) {
    throw new Error('角色数量不足，最多只能分配四名选手')
  }

  if (new Set(optionIds).size !== optionIds.length) {
    throw new Error('选手编号不能重复')
  }

  const shuffledCharacters = [...CHARACTER_IDS]

  for (let index = shuffledCharacters.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndex(index + 1)

    if (!Number.isInteger(swapIndex) || swapIndex < 0 || swapIndex > index) {
      throw new Error(`随机索引必须在 0 到 ${index} 之间`)
    }

    const currentCharacter = shuffledCharacters[index]
    const swapCharacter = shuffledCharacters[swapIndex]

    if (!currentCharacter || !swapCharacter) {
      throw new Error('角色洗牌失败')
    }

    shuffledCharacters[index] = swapCharacter
    shuffledCharacters[swapIndex] = currentCharacter
  }

  return optionIds.map((optionId, index) => {
    const characterId = shuffledCharacters[index]

    if (!characterId) {
      throw new Error('角色分配失败')
    }

    return { optionId, characterId }
  })
}

export function selectCharacter(
  assignments: readonly CharacterAssignment[],
  optionId: number,
  nextCharacterId: CharacterId,
): CharacterAssignment[] {
  const currentAssignment = assignments.find((assignment) => assignment.optionId === optionId)

  if (!currentAssignment) {
    throw new Error(`找不到选手 ${optionId} 的角色分配`)
  }

  if (currentAssignment.characterId === nextCharacterId) {
    return assignments.map((assignment) => ({ ...assignment }))
  }

  const otherAssignment = assignments.find(
    (assignment) => assignment.characterId === nextCharacterId,
  )

  return assignments.map((assignment) => {
    if (assignment.optionId === optionId) {
      return { ...assignment, characterId: nextCharacterId }
    }

    if (otherAssignment && assignment.optionId === otherAssignment.optionId) {
      return { ...assignment, characterId: currentAssignment.characterId }
    }

    return { ...assignment }
  })
}
