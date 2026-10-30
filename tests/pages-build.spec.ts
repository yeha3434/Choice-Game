import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { resolve, sep } from 'node:path'
import { expect, test } from '@playwright/test'

test('生产构建在项目子路径下正确加载脚本、样式和图标', async ({ page }, testInfo) => {
  const root = resolve('dist')
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  const server = createServer(async (request, response) => {
    const pathname = new URL(request.url ?? '/', 'http://localhost').pathname
    if (!pathname.startsWith('/sample-project/')) { response.writeHead(404).end(); return }
    const relative = pathname.slice('/sample-project/'.length) || 'index.html'
    const file = resolve(root, relative)
    if (!file.startsWith(root + sep)) { response.writeHead(400).end(); return }
    try {
      const content = await readFile(file)
      const type = file.endsWith('.html') ? 'text/html' : file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : file.endsWith('.svg') ? 'image/svg+xml' : 'application/octet-stream'
      response.writeHead(200, { 'content-type': type }).end(content)
    } catch { response.writeHead(404).end() }
  })
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done))
  try {
    const address = server.address()
    if (!address || typeof address === 'string') throw new Error('无法启动构建验证服务')
    const base = `http://127.0.0.1:${address.port}/sample-project/`
    await page.goto(base)
    await expect(page.getByRole('heading', { name: '选什么' })).toBeVisible()
    await expect(page.getByTestId('option-input')).toHaveCount(2)
    const icon = await page.request.get(new URL('favicon.svg', base).href)
    expect(icon.ok()).toBe(true)
    expect(errors).toEqual([])
    await page.screenshot({ path: testInfo.outputPath('pages-subpath.png') })
  } finally {
    await new Promise<void>((done, reject) => server.close((error) => error ? reject(error) : done()))
  }
})
