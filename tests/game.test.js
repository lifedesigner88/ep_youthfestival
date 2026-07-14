import assert from 'node:assert/strict'
import test from 'node:test'

import { CATEGORIES, MODES } from '../src/data/parts.js'
import { FriendGame, getVisibleCount } from '../src/game.js'

test('고정 횟수에 따라 보이는 파츠가 하나씩 늘어난다', () => {
  assert.deepEqual(
    [0, 1, 2, 3, 4, 5].map(getVisibleCount),
    [1, 2, 3, 4, 5, 5],
  )
})

test('게임 루프는 현재 차례 파츠 하나만 변경한다', () => {
  const originalRequestAnimationFrame = globalThis.requestAnimationFrame
  const originalCancelAnimationFrame = globalThis.cancelAnimationFrame
  globalThis.requestAnimationFrame = () => 1
  globalThis.cancelAnimationFrame = () => {}

  let randomCalls = 0
  const random = () => {
    const value = randomCalls < CATEGORIES.length ? 0 : 0.9
    randomCalls += 1
    return value
  }

  const game = new FriendGame({ random })

  try {
    game.start(MODES.BOY)
    const before = game.getSnapshot().partIds
    CATEGORIES.forEach(({ key }) => {
      game.nextChangeAt[key] = 0
    })

    game.tick(performance.now())
    const after = game.getSnapshot().partIds

    assert.notEqual(after.face, before.face)
    CATEGORIES.slice(1).forEach(({ key }) => {
      assert.equal(after[key], before[key])
    })
  } finally {
    game.stop()
    if (originalRequestAnimationFrame) {
      globalThis.requestAnimationFrame = originalRequestAnimationFrame
    } else {
      delete globalThis.requestAnimationFrame
    }
    if (originalCancelAnimationFrame) {
      globalThis.cancelAnimationFrame = originalCancelAnimationFrame
    } else {
      delete globalThis.cancelAnimationFrame
    }
  }
})
