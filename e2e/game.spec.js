import { expect, test } from '@playwright/test'

const STORAGE_KEY = 'epYouthFestival:friendMaker:v1'
const SEEDED_STATE = {
  lastMode: 'mixed',
  recentResult: {
    mode: 'mixed',
    partIds: {
      face: 'boy-face-1',
      eyes: 'girl-eyes-1',
      nose: 'boy-nose-1',
      mouth: 'girl-mouth-1',
      hair: 'boy-hair-1',
    },
    createdAt: '2026-07-14T00:00:00.000Z',
  },
}

async function openReadyResult(page, url = './') {
  await page.addInitScript(
    ({ key, state }) => localStorage.setItem(key, JSON.stringify(state)),
    { key: STORAGE_KEY, state: SEEDED_STATE },
  )
  await page.goto(url)
  await page.getByRole('button', { name: '최근에 만든 친구 다시 보기' }).click()
  await page.getByLabel('누구를 닮았나요?').fill('은평이')
}

test('세 모드 카드는 한 번 누르면 바로 게임을 시작한다', async ({ page }) => {
  const modes = [
    ['남학생 모습', '남학생 모습으로 조합 중'],
    ['여학생 모습', '여학생 모습으로 조합 중'],
    ['랜덤으로 떠올리기', '모든 파츠를 랜덤 조합 중'],
  ]

  for (const [buttonName, modeLabel] of modes) {
    await page.goto('./')
    await expect(page.getByRole('button', { name: '그때로 돌아가기' })).toHaveCount(0)
    await page.getByRole('button', { name: new RegExp(buttonName) }).click()
    await expect(page.locator('body')).toHaveAttribute('data-view', 'game')
    await expect(page.locator('#gameModeLabel')).toHaveText(modeLabel)
  }
})

test('다섯 번 멈춰 친구를 완성하고 PNG를 저장한다', async ({ page }, testInfo) => {
  const pageErrors = []
  page.on('pageerror', (error) => pageErrors.push(error.message))

  await page.goto('./')
  await expect(page.getByRole('heading', { name: /나의 초등학교 시절엔/ })).toBeVisible()
  await expect(page.locator('body')).toHaveAttribute('data-view', 'intro')
  await page.screenshot({ path: testInfo.outputPath('intro.png'), fullPage: true })

  await page.getByRole('button', { name: /랜덤으로 떠올리기/ }).click()
  await expect(page.locator('body')).toHaveAttribute('data-view', 'game')
  await page.screenshot({ path: testInfo.outputPath('game.png'), fullPage: true })

  const stopButton = page.getByRole('button', { name: /멈추기/ })
  const stages = [
    ['face', '얼굴 멈추기'],
    ['face eyes', '눈 멈추기'],
    ['face eyes nose', '코 멈추기'],
    ['face eyes nose mouth', '입 멈추기'],
    ['face eyes nose mouth hair', '머리 멈추기'],
  ]
  for (let step = 1; step <= 5; step += 1) {
    await expect(page.locator('#stepCounter')).toHaveText(`${step} / 5`)
    await expect(page.locator('#gameCanvas')).toHaveAttribute(
      'data-visible-parts',
      stages[step - 1][0],
    )
    await expect(stopButton).toHaveAccessibleName(stages[step - 1][1])
    await stopButton.click()
    if (step < 5) await expect(stopButton).toBeEnabled()
  }

  await expect(page.locator('body')).toHaveAttribute('data-view', 'result')
  await expect(page.getByRole('heading', { name: '친구가 완성됐어요' })).toBeVisible()
  const nickname = await page.locator('#traitLabel').textContent()
  expect(nickname?.trim().split(/\s+/).length).toBeGreaterThanOrEqual(3)

  const friendName = page.getByLabel('누구를 닮았나요?')
  await friendName.fill('은평이')
  await page.screenshot({ path: testInfo.outputPath('result.png'), fullPage: true })
  const downloadButton = page.getByRole('button', { name: '친구 카드 저장하기' })
  await expect(downloadButton).toBeEnabled()

  let downloadPromise
  let mobileDialog = null
  if (testInfo.project.name === 'desktop-chrome') {
    downloadPromise = page.waitForEvent('download')
    await downloadButton.click()
    await expect(page.locator('#saveDialog')).not.toBeVisible()
  } else {
    await downloadButton.click()
    mobileDialog = page.getByRole('dialog', { name: '친구 카드 다운로드' })
    await expect(mobileDialog).toBeVisible()
    const downloadLink = mobileDialog.getByRole('link', { name: '다운로드', exact: true })
    downloadPromise = page.waitForEvent('download')
    await downloadLink.click()
  }

  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/^school-friend-\d{8}-\d{6}\.png$/)
  const path = await download.path()
  expect(path).toBeTruthy()
  if (mobileDialog) {
    await mobileDialog.getByRole('button', { name: '닫기' }).click()
    await expect(mobileDialog).not.toBeVisible()
  }

  const storedState = await page.evaluate(() => localStorage.getItem('epYouthFestival:friendMaker:v1'))
  expect(storedState).not.toContain('은평이')
  expect(storedState).not.toContain('trait')

  await page.getByRole('button', { name: '모드 다시 고르기' }).click()
  await page.getByRole('button', { name: '최근에 만든 친구 다시 보기' }).click()
  await expect(page.locator('#traitLabel')).toHaveText(nickname.trim())
  expect(pageErrors).toEqual([])
})

test('화면 너비를 넘는 UI가 없다', async ({ page }) => {
  await page.goto('./')
  const introOverflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
  expect(introOverflow).toBeLessThanOrEqual(1)

  await page.getByRole('button', { name: /랜덤으로 떠올리기/ }).click()
  const gameOverflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
  expect(gameOverflow).toBeLessThanOrEqual(1)
  const stopButton = page.getByRole('button', { name: /얼굴 멈추기/ })
  await stopButton.scrollIntoViewIfNeeded()
  await expect(stopButton).toBeInViewport()
})

test('게임 중 다른 버튼의 키보드 동작을 가로채지 않는다', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: /랜덤으로 떠올리기/ }).click()
  const quitButton = page.getByRole('button', { name: '처음으로' })
  await quitButton.focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('body')).toHaveAttribute('data-view', 'intro')
})

test('스마트폰은 앱 종류와 관계없이 같은 다운로드 팝업을 연다', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chrome')

  const userAgents = [
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Instagram 390.0.0',
    'Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Mobile KAKAOTALK 26.5.0',
  ]

  for (const userAgent of userAgents) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      userAgent,
    })
    const page = await context.newPage()
    await openReadyResult(page, String(testInfo.project.use.baseURL))
    await page.getByRole('button', { name: '친구 카드 저장하기' }).click()

    const dialog = page.getByRole('dialog', { name: '친구 카드 다운로드' })
    await expect(dialog).toBeVisible()
    await expect(dialog).not.toContainText(/인스타그램|카카오톡|페이스북|네이버/)
    await expect(dialog.locator('img')).toHaveAttribute('src', /^blob:/)
    await expect.poll(() => dialog.locator('img').evaluate((image) => image.naturalWidth)).toBe(1080)
    const downloadLink = dialog.getByRole('link', { name: '다운로드', exact: true })
    await expect(downloadLink).toHaveAttribute('href', /^blob:/)
    await expect(downloadLink).toHaveAttribute('download', /^school-friend-\d{8}-\d{6}\.png$/)
    await context.close()
  }
})

test('카드를 만드는 동안 저장 버튼에 로딩 스피너를 표시한다', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chrome')

  await page.addInitScript(() => {
    const nativeToBlob = HTMLCanvasElement.prototype.toBlob
    HTMLCanvasElement.prototype.toBlob = function holdCardBlob(callback, type, quality) {
      const canvas = this
      window.__cardBlobPending = true
      window.__releaseCardBlob = () => {
        window.__cardBlobPending = false
        nativeToBlob.call(canvas, callback, type, quality)
      }
    }
  })
  await openReadyResult(page)

  const downloadButton = page.locator('#downloadButton')
  await downloadButton.click()
  await expect.poll(() => page.evaluate(() => window.__cardBlobPending)).toBe(true)
  await expect(downloadButton).toBeDisabled()
  await expect(downloadButton).toHaveAttribute('aria-busy', 'true')
  await expect(downloadButton).toHaveAccessibleName('카드를 만드는 중…')
  await expect(downloadButton.locator('.download-button-spinner')).toBeVisible()
  await expect(page.getByLabel('누구를 닮았나요?')).toBeDisabled()
  await expect(downloadButton.locator('.download-button-spinner')).toHaveCSS(
    'animation-name',
    'download-spinner',
  )
  await expect(page.locator('#saveDialog')).not.toBeVisible()

  await page.evaluate(() => window.__releaseCardBlob())
  await expect(page.getByRole('dialog', { name: '친구 카드 다운로드' })).toBeVisible()
  await expect(downloadButton).not.toHaveAttribute('aria-busy')
  await expect(downloadButton).toHaveAccessibleName('친구 카드 저장하기')
  await expect(page.getByLabel('누구를 닮았나요?')).toBeEnabled()
})
