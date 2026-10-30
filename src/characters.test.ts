import { describe, expect, it } from 'vitest'
import {
  CHARACTERS,
  CHARACTER_IDS,
  createCharacterAssignments,
  selectCharacter,
  type CharacterAssignment,
} from './characters'

describe('角色分配', () => {
  it('提供四个名称和造型各不相同的角色', () => {
    expect(CHARACTERS.map(({ name }) => name)).toEqual(['大眼仔', '肚肚侠', '长腿哥', '淡定薯'])
    expect(new Set(CHARACTERS.map(({ svg }) => svg)).size).toBe(4)
  })

  it.each([2, 3, 4])('为 %i 名选手分配不重复角色', (count) => {
    const optionIds = Array.from({ length: count }, (_, index) => index + 1)
    const assignments = createCharacterAssignments(optionIds, () => 0)
    const characterIds = assignments.map(({ characterId }) => characterId)

    expect(assignments).toHaveLength(count)
    expect(new Set(characterIds).size).toBe(count)
    expect(characterIds.every((characterId) => CHARACTER_IDS.includes(characterId))).toBe(true)
  })

  it('选择空闲角色时只更换当前选手', () => {
    const assignments: CharacterAssignment[] = [
      { optionId: 1, characterId: 'big-eye' },
      { optionId: 2, characterId: 'belly-hero' },
    ]

    expect(selectCharacter(assignments, 1, 'calm-potato')).toEqual([
      { optionId: 1, characterId: 'calm-potato' },
      { optionId: 2, characterId: 'belly-hero' },
    ])
  })

  it('选择已占用角色时交换两名选手的角色', () => {
    const assignments: CharacterAssignment[] = [
      { optionId: 1, characterId: 'big-eye' },
      { optionId: 2, characterId: 'belly-hero' },
      { optionId: 3, characterId: 'long-legs' },
    ]

    const swapped = selectCharacter(assignments, 1, 'belly-hero')

    expect(swapped).toEqual([
      { optionId: 1, characterId: 'belly-hero' },
      { optionId: 2, characterId: 'big-eye' },
      { optionId: 3, characterId: 'long-legs' },
    ])
    expect(new Set(swapped.map(({ characterId }) => characterId)).size).toBe(3)
  })
})
