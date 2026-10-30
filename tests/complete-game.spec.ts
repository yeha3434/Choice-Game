import { expect, test } from '@playwright/test'

test('连续五局、确认结果和修改选项', async ({ page }, testInfo) => {
  test.setTimeout(60000)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  await page.clock.install()
  await page.setViewportSize({ width: 360, height: 900 })
  await page.goto('/')
  await page.getByTestId('option-input').nth(0).fill('火锅')
  await page.getByTestId('option-input').nth(1).fill('散步')
  await page.getByRole('button', { name: '抽取角色' }).click()
  await page.getByRole('button', { name: '开始比赛' }).click()
  for (let round = 0; round < 5; round += 1) {
    await page.clock.fastForward(22000)
    await expect(page.locator('#race-result')).toBeVisible()
    await expect(page.locator('#result-ranking li')).toHaveCount(2)
    const winner = await page.locator('#result-title').textContent()
    await expect(page.locator('#result-ranking li').first()).toContainText(winner ?? '')
    await expect(page.locator('.leader-crown:visible')).toHaveCount(1)
    if (round < 4) {
      await page.getByRole('button', { name: '不服，再来一局' }).click()
      await expect(page.locator('#race-result')).toBeHidden()
      await expect(page.getByTestId('option-input').nth(0)).toHaveValue('火锅')
    }
  }
  await page.locator('#race-result').screenshot({ path: testInfo.outputPath('result-mobile.png') })
  await page.getByRole('button', { name: '就这么办' }).click()
  await expect(page.getByText('决定已确认！')).toBeVisible()
  await expect(page.getByRole('button', { name: '不服，再来一局' })).toBeHidden()
  await page.getByRole('button', { name: '修改选项' }).click()
  await expect(page.locator('#race-stadium')).toBeHidden()
  await expect(page.getByTestId('option-input').nth(0)).toHaveValue('火锅')
  expect(errors).toEqual([])
})

test('音乐与音效设置相互独立并在刷新后保留', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '音乐：开' }).click()
  await expect(page.getByRole('button', { name: '音乐：关' })).toHaveAttribute('aria-pressed', 'false')
  await expect(page.getByRole('button', { name: '音效：开' })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: '音效：开' }).click()
  await page.reload()
  await expect(page.getByRole('button', { name: '音乐：关' })).toBeVisible()
  await expect(page.getByRole('button', { name: '音效：关' })).toBeVisible()
})

test('2、3、4 名选手都能完成比赛并显示完整排名', async ({ page }) => {
  await page.clock.install()
  for (const count of [2, 3, 4]) {
    await page.goto('/')
    for (let i = 2; i < count; i += 1) await page.getByRole('button', { name: '添加选手' }).click()
    for (let i = 0; i < count; i += 1) await page.getByTestId('option-input').nth(i).fill(`选项 ${i + 1}`)
    await page.getByRole('button', { name: '抽取角色' }).click()
    await page.getByRole('button', { name: '开始比赛' }).click()
    await page.clock.fastForward(22000)
    await expect(page.locator('#race-result')).toBeVisible()
    await expect(page.locator('#result-ranking li')).toHaveCount(count)
    const names = await page.locator('#result-ranking li').allTextContents()
    expect(new Set(names.map((name) => name.split('：')[1])).size).toBe(count)
  }
})
