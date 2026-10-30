import { expect, test } from '@playwright/test'

test('四名角色拥有不同的摔倒动作，减少动态模式仍能辨认摔倒', async ({ page }, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto('/')
  await page.getByRole('button', { name: '添加选手' }).click()
  await page.getByRole('button', { name: '添加选手' }).click()
  for (let i = 0; i < 4; i += 1) await page.getByTestId('option-input').nth(i).fill(`选项 ${i + 1}`)
  await page.getByRole('button', { name: '抽取角色' }).click()
  await page.evaluate(() => {
    const stadium = document.querySelector<HTMLElement>('#race-stadium')!
    stadium.dataset.state = 'running'
    for (const lane of document.querySelectorAll<HTMLElement>('.race-lane')) lane.dataset.event = 'fall'
  })
  const names = await page.locator('.lane-character-art').evaluateAll((elements) =>
    elements.map((element) => getComputedStyle(element).animationName),
  )
  expect(new Set(names)).toEqual(new Set(['eye-fall', 'belly-fall', 'legs-fall', 'potato-roll']))
  await page.waitForTimeout(500)
  await page.locator('#race-stadium').screenshot({ path: testInfo.outputPath('four-falls.png') })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const reduced = await page.locator('.lane-character-art').evaluateAll((elements) =>
    elements.map((element) => ({ animation: getComputedStyle(element).animationName, transform: getComputedStyle(element).transform })),
  )
  expect(reduced.every((item) => item.animation === 'none' && item.transform !== 'none')).toBe(true)
  expect(errors).toEqual([])
})
