import { describe, expect, it } from 'vitest'
import {
  MAX_OPTION_NAME_LENGTH,
  prepareRaceOptions,
  type RawRaceOption,
} from './race-options'

function option(id: number, value: string): RawRaceOption {
  return { id, value }
}

describe('prepareRaceOptions', () => {
  it('去除首尾空格并忽略空白项', () => {
    const result = prepareRaceOptions([
      option(1, '  火锅  '),
      option(2, '散步'),
      option(3, '   '),
    ])

    expect(result.isValid).toBe(true)
    expect(result.options).toEqual([
      { id: 1, name: '火锅' },
      { id: 2, name: '散步' },
    ])
  })

  it('少于两个非空选项时不能开赛', () => {
    const result = prepareRaceOptions([option(1, '火锅'), option(2, '\t')])

    expect(result.isValid).toBe(false)
    expect(result.formMessage).toBe('还差一个有效选项就能开赛。')
  })

  it('拒绝去除首尾空格后完全相同的选项', () => {
    const result = prepareRaceOptions([option(1, '火锅'), option(2, ' 火锅 ')])

    expect(result.isValid).toBe(false)
    expect(result.issues).toEqual([
      { optionId: 1, code: 'duplicate', message: '和其他选项重复了' },
      { optionId: 2, code: 'duplicate', message: '和其他选项重复了' },
    ])
  })

  it('接受 40 个字符并拒绝第 41 个字符，包括 emoji', () => {
    const accepted = prepareRaceOptions([
      option(1, '😀'.repeat(MAX_OPTION_NAME_LENGTH)),
      option(2, '散步'),
    ])
    const rejected = prepareRaceOptions([
      option(1, '😀'.repeat(MAX_OPTION_NAME_LENGTH + 1)),
      option(2, '散步'),
    ])

    expect(accepted.isValid).toBe(true)
    expect(rejected.isValid).toBe(false)
    expect(rejected.issues).toContainEqual({
      optionId: 1,
      code: 'too-long',
      message: '名称最多 40 个字符',
    })
  })

  it('把类似 HTML 的特殊字符保留为普通选项文字', () => {
    const specialName = '<img src=x onerror=alert(1)> & “火锅”'
    const result = prepareRaceOptions([option(1, specialName), option(2, '散步')])

    expect(result.isValid).toBe(true)
    expect(result.options[0]?.name).toBe(specialName)
  })
})
