import { expect, test } from '@playwright/test'

test('项目骨架能在真实浏览器中打开且没有控制台错误', async ({ page }, testInfo) => {
  const consoleErrors: string[] = []

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text())
    }
  })

  await page.goto('/')

  await expect(page.getByRole('heading', { name: '项目骨架已就位' })).toBeVisible()
  await expect(page.getByTestId('stage')).toHaveText('阶段 0')
  expect(consoleErrors).toEqual([])

  await page.screenshot({
    path: testInfo.outputPath('stage-0-desktop.png'),
    fullPage: true,
  })
})
