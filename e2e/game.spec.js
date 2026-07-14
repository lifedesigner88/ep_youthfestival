import { expect, test } from '@playwright/test'

test('다섯 번 멈춰 친구를 완성하고 PNG를 저장한다', async ({ page }, testInfo) => {
  const pageErrors = []
  page.on('pageerror', (error) => pageErrors.push(error.message))

  await page.goto('./')
  await expect(page.getByRole('heading', { name: /나의 초등학교 시절엔/ })).toBeVisible()
  await expect(page.locator('body')).toHaveAttribute('data-view', 'intro')
  await page.screenshot({ path: testInfo.outputPath('intro.png'), fullPage: true })

  await page.getByRole('button', { name: '그때로 돌아가기' }).click()
  await expect(page.locator('body')).toHaveAttribute('data-view', 'game')
  await page.screenshot({ path: testInfo.outputPath('game.png'), fullPage: true })

  const stopButton = page.getByRole('button', { name: /멈추기/ })
  for (let step = 1; step <= 5; step += 1) {
    await expect(page.locator('#stepCounter')).toHaveText(`${step} / 5`)
    await stopButton.click()
    if (step < 5) await expect(stopButton).toBeEnabled()
  }

  await expect(page.locator('body')).toHaveAttribute('data-view', 'result')
  await expect(page.getByRole('heading', { name: '친구가 완성됐어요' })).toBeVisible()

  const friendName = page.getByLabel('누구를 닮았나요?')
  await friendName.fill('은평이')
  await page.screenshot({ path: testInfo.outputPath('result.png'), fullPage: true })
  const downloadButton = page.getByRole('button', { name: '친구 카드 저장하기' })
  await expect(downloadButton).toBeEnabled()

  const downloadPromise = page.waitForEvent('download')
  await downloadButton.click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/^school-friend-\d{8}-\d{6}\.png$/)
  const path = await download.path()
  expect(path).toBeTruthy()

  const storedState = await page.evaluate(() => localStorage.getItem('epYouthFestival:friendMaker:v1'))
  expect(storedState).not.toContain('은평이')
  expect(pageErrors).toEqual([])
})

test('화면 너비를 넘는 UI가 없다', async ({ page }) => {
  await page.goto('./')
  const introOverflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
  expect(introOverflow).toBeLessThanOrEqual(1)

  await page.getByRole('button', { name: '그때로 돌아가기' }).click()
  const gameOverflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
  expect(gameOverflow).toBeLessThanOrEqual(1)
  const stopButton = page.getByRole('button', { name: /얼굴 멈추기/ })
  await stopButton.scrollIntoViewIfNeeded()
  await expect(stopButton).toBeInViewport()
})

test('게임 중 다른 버튼의 키보드 동작을 가로채지 않는다', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: '그때로 돌아가기' }).click()
  const quitButton = page.getByRole('button', { name: '처음으로' })
  await quitButton.focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('body')).toHaveAttribute('data-view', 'intro')
})

test('인스타그램 인앱 브라우저에서는 길게 누르기 저장 화면을 연다', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chrome')

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Instagram 390.0.0',
  })
  const page = await context.newPage()
  await page.goto(String(testInfo.project.use.baseURL))
  await page.getByRole('button', { name: '그때로 돌아가기' }).click()

  const stopButton = page.getByRole('button', { name: /멈추기/ })
  for (let step = 1; step <= 5; step += 1) {
    await stopButton.click()
    if (step < 5) await expect(stopButton).toBeEnabled()
  }

  await page.getByLabel('누구를 닮았나요?').fill('은평이')
  await page.getByRole('button', { name: '친구 카드 저장하기' }).click()
  const dialog = page.getByRole('dialog', { name: '이미지를 길게 눌러 저장해 주세요' })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('img')).toHaveAttribute('src', /^blob:/)
  await expect.poll(() => dialog.locator('img').evaluate((image) => image.naturalWidth)).toBe(1080)
  await context.close()
})
