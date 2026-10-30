import { expect, test, type Page } from '@playwright/test'

function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = []

  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text())
    }
  })

  return errors
}

test('空白项会被忽略，两个有效选项可以整理成参赛名单', async ({ page }, testInfo) => {
  const consoleErrors = collectConsoleErrors(page)

  await page.goto('/')

  const inputs = page.getByTestId('option-input')
  const startButton = page.getByRole('button', { name: '抽取角色' })

  await expect(startButton).toBeDisabled()
  await expect(page.getByText('请填写至少两个有效选项，空白项不会参赛。')).toBeVisible()

  await inputs.nth(0).fill('  火锅  ')
  await expect(startButton).toBeDisabled()
  await expect(page.getByText('还差一个有效选项就能开赛。')).toBeVisible()

  await inputs.nth(1).fill('散步')
  await expect(startButton).toBeEnabled()
  await expect(page.getByText('报名表检查通过，2 名选手可以开赛。')).toBeVisible()

  await page.getByRole('button', { name: '添加选手' }).click()
  await expect(startButton).toBeEnabled()
  await startButton.click()

  const characterSelection = page.locator('#character-selection')
  await expect(characterSelection).toBeVisible()
  await expect(
    characterSelection.getByText('2 名选手已随机分配不重复角色；角色不会影响获胜机会。'),
  ).toBeVisible()
  await expect(characterSelection.locator('.racer-option-name')).toHaveText(['火锅', '散步'])
  expect(consoleErrors).toEqual([])

  await page.screenshot({
    path: testInfo.outputPath('stage-2-ready-roster.png'),
    fullPage: true,
  })
})

test('重复和超长选项会给出明确提示，特殊字符只作为文字显示', async ({ page }, testInfo) => {
  const consoleErrors = collectConsoleErrors(page)

  await page.goto('/')

  const inputs = page.getByTestId('option-input')
  const startButton = page.getByRole('button', { name: '抽取角色' })

  await inputs.nth(0).fill('火锅')
  await inputs.nth(1).fill(' 火锅 ')

  await expect(startButton).toBeDisabled()
  await expect(page.getByText('请先修改标红的选项。')).toBeVisible()
  await expect(page.getByText('和其他选项重复了')).toHaveCount(2)
  await expect(inputs.nth(0)).toHaveAttribute('aria-invalid', 'true')
  await expect(inputs.nth(1)).toHaveAttribute('aria-invalid', 'true')

  await page.screenshot({
    path: testInfo.outputPath('stage-2-duplicate-error.png'),
    fullPage: true,
  })

  await inputs.nth(1).fill('长'.repeat(41))
  await expect(startButton).toBeDisabled()
  await expect(page.getByTestId('option-error').nth(1)).toHaveText('名称最多 40 个字符')
  await expect(inputs.nth(0)).toHaveAttribute('aria-invalid', 'false')
  await expect(inputs.nth(1)).toHaveAttribute('aria-invalid', 'true')

  const specialName = '<img src=x onerror=window.x=1> & 火锅'
  await inputs.nth(0).fill(specialName)
  await inputs.nth(1).fill('散步')
  await expect(startButton).toBeEnabled()
  await startButton.click()

  const characterSelection = page.locator('#character-selection')
  await expect(characterSelection.locator('.racer-option-name').nth(0)).toHaveText(specialName)
  await expect(characterSelection.locator('img')).toHaveCount(0)
  const injected = await page.evaluate(() => (window as Window & { x?: number }).x ?? 0)
  expect(injected).toBe(0)
  expect(consoleErrors).toEqual([])
})

test('360px 手机宽度能显示 40 字符选项且不会横向溢出', async ({ page }, testInfo) => {
  const consoleErrors = collectConsoleErrors(page)

  await page.setViewportSize({ width: 360, height: 900 })
  await page.goto('/')

  const inputs = page.getByTestId('option-input')
  const longName = '😀'.repeat(40)

  await inputs.nth(0).fill(longName)
  await inputs.nth(1).fill('散步')
  await page.getByRole('button', { name: '抽取角色' }).click()

  await expect(page.locator('#character-selection')).toBeVisible()
  await expect(page.locator('.racer-option-name').nth(0)).toHaveText(longName)

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )

  expect(hasHorizontalOverflow).toBe(false)
  expect(consoleErrors).toEqual([])

  await page.screenshot({
    path: testInfo.outputPath('stage-2-mobile-long-name.png'),
    fullPage: true,
  })
})
