import assert from 'node:assert/strict'
import test from 'node:test'

import { isMobileDevice } from '../src/download.js'

const DESKTOP_DEFAULTS = {
  platform: 'Win32',
  maxTouchPoints: 0,
  userAgentData: { mobile: false },
}

function detectMobile(userAgent, overrides = {}) {
  return isMobileDevice({
    ...DESKTOP_DEFAULTS,
    userAgent,
    ...overrides,
  })
}

test('일반 스마트폰과 인앱 브라우저를 모두 모바일로 판별한다', () => {
  const mobileUserAgents = [
    'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/149 Mobile Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Instagram 390.0.0',
    'Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Mobile KAKAOTALK 26.5.0',
  ]

  for (const userAgent of mobileUserAgents) {
    assert.equal(detectMobile(userAgent), true)
  }
})

test('UA Client Hints가 모바일이라고 알리면 모바일로 판별한다', () => {
  assert.equal(
    detectMobile('Mozilla/5.0 AppleWebKit/537.36', { userAgentData: { mobile: true } }),
    true,
  )
})

test('데스크톱과 iPad의 데스크톱 사용자 에이전트를 구분한다', () => {
  const desktopUserAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/149 Safari/537.36'
  const ipadDesktopUserAgent =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15'

  assert.equal(detectMobile(desktopUserAgent), false)
  assert.equal(
    detectMobile(ipadDesktopUserAgent, { platform: 'MacIntel', maxTouchPoints: 5 }),
    true,
  )
})
