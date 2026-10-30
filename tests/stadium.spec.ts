import { expect, test, type Locator, type Page } from '@playwright/test'

const OPTION_NAMES = ['火锅', '去公园', '看电影', '在家休息']

function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = []

  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text())
    }
  })

  return errors
}

async function openStadium(
  page: Page,
  optionCount: number,
  optionNames: readonly string[] = OPTION_NAMES,
): Promise<void> {
  await page.goto('/')

  for (let index = 2; index < optionCount; index += 1) {
    await page.getByRole('button', { name: '添加选手' }).click()
  }

  const inputs = page.getByTestId('option-input')

  for (let index = 0; index < optionCount; index += 1) {
    await inputs.nth(index).fill(optionNames[index] ?? `选项 ${index + 1}`)
  }

  await page.getByRole('button', { name: '抽取角色' }).click()
  await expect(page.locator('#race-stadium')).toBeVisible()
}

async function getAssignments(elements: Locator): Promise<string[]> {
  return elements.evaluateAll((items) =>
    items
      .map((item) => `${item.getAttribute('data-option-id')}:${item.getAttribute('data-character-id')}`)
      .sort(),
  )
}

test('2、3、4 名选手会生成对应跑道和完整社区运动场', async ({ page }, testInfo) => {
  const consoleErrors = collectConsoleErrors(page)

  for (const optionCount of [2, 3, 4]) {
    await openStadium(page, optionCount)

    const stadium = page.locator('#race-stadium')
    const lanes = page.getByTestId('race-lane')

    await expect(lanes).toHaveCount(optionCount)
    await expect(stadium.getByText('各位选手，请就位')).toBeVisible()
    await expect(stadium.locator('.finish-ribbon')).toHaveText('终点')
    await expect(page.getByTestId('cardboard-podium')).toBeVisible()
    await expect(page.getByTestId('spectator-bird')).toBeVisible()
    await expect(page.getByTestId('spectator-cat')).toBeVisible()
    await expect(page.getByTestId('spectator-referee')).toBeVisible()

    const cardAssignments = await getAssignments(page.getByTestId('character-card'))
    const laneAssignments = await getAssignments(lanes)
    expect(laneAssignments).toEqual(cardAssignments)

    if (optionCount === 4) {
      await page.screenshot({
        path: testInfo.outputPath('stage-5-desktop-four-lanes.png'),
        fullPage: true,
      })
    }
  }

  expect(consoleErrors).toEqual([])
})

test('长名称保持两行以内，手动换角色会同步到跑道', async ({ page }) => {
  const consoleErrors = collectConsoleErrors(page)
  const longName = '这是一个非常非常长但仍然有效的参赛选项名称需要显示两行'

  await openStadium(page, 3, [longName, '散步', '看电影'])

  const firstCard = page.getByTestId('character-card').nth(0)
  const firstSelect = firstCard.getByTestId('character-select')
  const initialCharacterId = await firstCard.getAttribute('data-character-id')
  const alternativeCharacterId = await firstSelect.locator('option').evaluateAll(
    (options, currentCharacterId) =>
      options
        .map((option) => (option as HTMLOptionElement).value)
        .find((characterId) => characterId !== currentCharacterId),
    initialCharacterId,
  )

  if (!alternativeCharacterId) {
    throw new Error('应该存在可以更换的角色')
  }

  await firstSelect.selectOption(alternativeCharacterId)

  const cardAssignments = await getAssignments(page.getByTestId('character-card'))
  const laneAssignments = await getAssignments(page.getByTestId('race-lane'))
  expect(laneAssignments).toEqual(cardAssignments)

  const firstLane = page.getByTestId('race-lane').nth(0)
  const laneName = firstLane.getByTestId('lane-option-name')
  const laneNameBox = await laneName.boundingBox()
  const runnerBox = await firstLane.locator('.lane-runner').boundingBox()

  expect(await laneName.getAttribute('title')).toBe(longName)
  expect(await laneName.textContent()).toBe(longName)
  expect(laneNameBox).not.toBeNull()
  expect(runnerBox).not.toBeNull()
  expect(laneNameBox?.height ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(44)
  expect((laneNameBox?.x ?? 0) + (laneNameBox?.width ?? 0)).toBeLessThanOrEqual(
    (runnerBox?.x ?? 0) + 1,
  )
  expect(consoleErrors).toEqual([])
})

test('360px 手机宽度能看清四条跑道且页面不横向溢出', async ({ page }, testInfo) => {
  const consoleErrors = collectConsoleErrors(page)
  const longName = '这是一个很长很长需要在手机跑道上显示两行的选项名称'

  await page.setViewportSize({ width: 360, height: 900 })
  await openStadium(page, 4, [longName, '去公园', '看电影', '在家休息'])

  await expect(page.getByTestId('race-lane')).toHaveCount(4)
  await expect(page.locator('.lane-character-art')).toHaveCount(4)

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
  const lanesFitViewport = await page.getByTestId('race-lane').evaluateAll((lanes) =>
    lanes.every((lane) => {
      const bounds = lane.getBoundingClientRect()
      return bounds.left >= 0 && bounds.right <= document.documentElement.clientWidth
    }),
  )

  expect(hasHorizontalOverflow).toBe(false)
  expect(lanesFitViewport).toBe(true)
  expect(consoleErrors).toEqual([])

  await page.screenshot({
    path: testInfo.outputPath('stage-5-mobile-four-lanes.png'),
    fullPage: true,
  })
})
