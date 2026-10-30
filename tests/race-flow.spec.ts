import { expect, test } from '@playwright/test'

test('倒计时后比赛跑完，皇冠跟随领先且结果与冲线一致', async ({ page }, testInfo) => {
  test.setTimeout(45000)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto('/')
  await page.getByTestId('option-input').nth(0).fill('火锅')
  await page.getByTestId('option-input').nth(1).fill('散步')
  await page.getByRole('button', { name: '抽取角色' }).click()
  await page.evaluate(() => {
    const evidence = { leaders: [] as string[], finishers: [] as string[] }
    ;(window as Window & { raceEvidence?: typeof evidence }).raceEvidence = evidence
    const observe = () => {
      const stadium = document.querySelector<HTMLElement>('#race-stadium')
      for (const lane of document.querySelectorAll<HTMLElement>('.race-lane')) {
        const id = lane.dataset.optionId ?? ''
        const crown = lane.querySelector<HTMLElement>('.leader-crown')
        if (crown && !crown.hidden && evidence.leaders.at(-1) !== id) evidence.leaders.push(id)
        if (Number(lane.style.getPropertyValue('--progress')) >= 1 && !evidence.finishers.includes(id)) evidence.finishers.push(id)
      }
      if (stadium?.dataset.state !== 'finished') requestAnimationFrame(observe)
    }
    requestAnimationFrame(observe)
  })
  const start = page.getByRole('button', { name: '开始比赛' })
  await start.click()
  await expect(start).toBeDisabled()
  await expect(page.locator('#race-status')).toHaveText('3')
  await expect(page.locator('#race-stadium')).toHaveAttribute('data-state', 'running', { timeout: 5000 })
  await expect(page.locator('.leader-crown:visible')).toHaveCount(1)
  await page.locator('#race-stadium').screenshot({ path: testInfo.outputPath('race-running.png') })
  await expect(page.locator('#race-stadium')).toHaveAttribute('data-state', 'finished', { timeout: 23000 })
  const winner = await page.locator('.race-lane').filter({ has: page.locator('.leader-crown:visible') }).getByTestId('lane-option-name').textContent()
  const winnerId = await page.locator('.race-lane').filter({ has: page.locator('.leader-crown:visible') }).getAttribute('data-option-id')
  await expect(page.locator('#race-status')).toContainText(`${winner}获得第一名`)
  const evidence = await page.evaluate(() => (window as Window & { raceEvidence?: { leaders: string[]; finishers: string[] } }).raceEvidence)
  expect(new Set(evidence?.leaders).size).toBeGreaterThan(1)
  expect(evidence?.finishers[0]).toBe(winnerId)
  await expect(page.getByRole('button', { name: '再看一场' })).toBeEnabled()
  expect(errors).toEqual([])
  await page.locator('#race-stadium').screenshot({ path: testInfo.outputPath('race-finished.png') })
})
