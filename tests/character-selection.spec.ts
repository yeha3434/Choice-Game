import { expect, test, type Page } from '@playwright/test'

const OPTION_NAMES = ['火锅', '去公园', '看电影', '在家休息']
const CHARACTER_NAMES = ['大眼仔', '肚肚侠', '长腿哥', '淡定薯']

function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = []

  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text())
    }
  })

  return errors
}

async function openCharacterSelection(page: Page, optionCount: number): Promise<void> {
  await page.goto('/')

  for (let index = 2; index < optionCount; index += 1) {
    await page.getByRole('button', { name: '添加选手' }).click()
  }

  const inputs = page.getByTestId('option-input')

  for (let index = 0; index < optionCount; index += 1) {
    await inputs.nth(index).fill(OPTION_NAMES[index] ?? `选项 ${index + 1}`)
  }

  await page.getByRole('button', { name: '抽取角色' }).click()
  await expect(page.locator('#character-selection')).toBeVisible()
}

async function getCharacterIds(page: Page): Promise<string[]> {
  return page.getByTestId('character-card').evaluateAll((cards) =>
    cards.map((card) => card.getAttribute('data-character-id') ?? ''),
  )
}

test('2、3、4 名选手都获得不重复角色', async ({ page }, testInfo) => {
  const consoleErrors = collectConsoleErrors(page)

  for (const optionCount of [2, 3, 4]) {
    await openCharacterSelection(page, optionCount)

    const cards = page.getByTestId('character-card')
    const characterIds = await getCharacterIds(page)

    await expect(cards).toHaveCount(optionCount)
    await expect(page.getByTestId('character-artwork')).toHaveCount(optionCount)
    expect(new Set(characterIds).size).toBe(optionCount)

    if (optionCount === 4) {
      const visibleNames = await page.locator('.character-name').allTextContents()
      expect(visibleNames.sort()).toEqual([...CHARACTER_NAMES].sort())

      await page.getByRole('button', { name: '重新抽签' }).click()
      const rerolledCharacterIds = await getCharacterIds(page)
      expect(new Set(rerolledCharacterIds).size).toBe(4)

      await page.screenshot({
        path: testInfo.outputPath('stage-3-desktop-four-characters.png'),
        fullPage: true,
      })
    }
  }

  expect(consoleErrors).toEqual([])
})

test('手动选择已占用角色会交换，选择空闲角色不会产生重复', async ({ page }, testInfo) => {
  const consoleErrors = collectConsoleErrors(page)

  await openCharacterSelection(page, 3)

  const selects = page.getByTestId('character-select')
  const initialCharacterIds = await getCharacterIds(page)
  const firstCharacter = initialCharacterIds[0]
  const secondCharacter = initialCharacterIds[1]

  if (!firstCharacter || !secondCharacter) {
    throw new Error('角色分配结果缺少前两名选手')
  }

  await selects.nth(0).selectOption(secondCharacter)

  const swappedCharacterIds = await getCharacterIds(page)
  expect(swappedCharacterIds[0]).toBe(secondCharacter)
  expect(swappedCharacterIds[1]).toBe(firstCharacter)
  expect(new Set(swappedCharacterIds).size).toBe(3)

  const allCharacterIds = await selects
    .nth(0)
    .locator('option')
    .evaluateAll((options) => options.map((option) => (option as HTMLOptionElement).value))
  const unusedCharacter = allCharacterIds.find(
    (characterId) => !swappedCharacterIds.includes(characterId),
  )

  if (!unusedCharacter) {
    throw new Error('三人场景应该保留一个空闲角色')
  }

  await selects.nth(0).selectOption(unusedCharacter)

  const manuallyChangedIds = await getCharacterIds(page)
  expect(manuallyChangedIds[0]).toBe(unusedCharacter)
  expect(manuallyChangedIds[1]).toBe(firstCharacter)
  expect(new Set(manuallyChangedIds).size).toBe(3)
  expect(consoleErrors).toEqual([])

  await page.screenshot({
    path: testInfo.outputPath('stage-3-manual-character-change.png'),
    fullPage: true,
  })
})

test('360px 手机宽度能操作四名角色且页面不横向溢出', async ({ page }, testInfo) => {
  const consoleErrors = collectConsoleErrors(page)

  await page.setViewportSize({ width: 360, height: 900 })
  await openCharacterSelection(page, 4)

  await expect(page.getByTestId('character-card')).toHaveCount(4)
  await expect(page.getByTestId('character-select')).toHaveCount(4)

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )

  expect(hasHorizontalOverflow).toBe(false)
  expect(consoleErrors).toEqual([])

  await page.screenshot({
    path: testInfo.outputPath('stage-3-mobile-four-characters.png'),
    fullPage: true,
  })
})
