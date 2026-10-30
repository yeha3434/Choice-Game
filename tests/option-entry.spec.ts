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

test('默认两名选手，并能在两到四名之间增加和删除', async ({ page }, testInfo) => {
  const consoleErrors = collectConsoleErrors(page)

  await page.goto('/')

  const rows = page.getByTestId('option-row')
  const inputs = page.getByTestId('option-input')
  const removeButtons = page.locator('[data-action="remove"]')
  const addButton = page.getByRole('button', { name: '添加选手' })

  await expect(page.getByRole('heading', { name: '纠结运动会' })).toBeVisible()
  await expect(rows).toHaveCount(2)
  await expect(removeButtons).toHaveCount(2)
  await expect(removeButtons.nth(0)).toBeDisabled()
  await expect(removeButtons.nth(1)).toBeDisabled()

  await inputs.nth(0).fill('火锅')
  await inputs.nth(1).fill('散步')
  await addButton.click()
  await expect(rows).toHaveCount(3)
  await expect(inputs.nth(0)).toHaveValue('火锅')
  await expect(inputs.nth(1)).toHaveValue('散步')

  await page.getByRole('button', { name: '添加选手' }).click()
  await expect(rows).toHaveCount(4)
  await expect(page.getByRole('button', { name: '选手已满员' })).toBeDisabled()

  await inputs.nth(2).fill('看电影')
  await inputs.nth(3).fill('在家休息')
  await page.screenshot({
    path: testInfo.outputPath('stage-1-desktop-four-options.png'),
    fullPage: true,
  })

  await page.getByRole('button', { name: '删除选手 2' }).click()
  await expect(rows).toHaveCount(3)
  await expect(inputs.nth(0)).toHaveValue('火锅')
  await expect(inputs.nth(1)).toHaveValue('看电影')
  await expect(inputs.nth(2)).toHaveValue('在家休息')

  await page.getByRole('button', { name: '删除选手 3' }).click()
  await expect(rows).toHaveCount(2)
  await expect(removeButtons.nth(0)).toBeDisabled()
  await expect(removeButtons.nth(1)).toBeDisabled()
  expect(consoleErrors).toEqual([])
})

test('360px 手机宽度下四名选手仍可操作且页面不横向溢出', async ({ page }, testInfo) => {
  const consoleErrors = collectConsoleErrors(page)

  await page.setViewportSize({ width: 360, height: 900 })
  await page.goto('/')

  await page.getByRole('button', { name: '添加选手' }).click()
  await page.getByRole('button', { name: '添加选手' }).click()

  const inputs = page.getByTestId('option-input')
  await inputs.nth(0).fill('火锅')
  await inputs.nth(1).fill('去公园')
  await inputs.nth(2).fill('看电影')
  await inputs.nth(3).fill('在家休息')

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )

  expect(hasHorizontalOverflow).toBe(false)
  await expect(page.getByTestId('option-row')).toHaveCount(4)
  await expect(page.getByRole('button', { name: '选手已满员' })).toBeDisabled()
  expect(consoleErrors).toEqual([])

  await page.screenshot({
    path: testInfo.outputPath('stage-1-mobile-360px.png'),
    fullPage: true,
  })
})
