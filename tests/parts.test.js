import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CATEGORIES,
  MODES,
  PARTS,
  createInitialParts,
  getCombinationCount,
  getPool,
  getTraitForParts,
  hydrateParts,
  serializeParts,
} from '../src/data/parts.js'

test('각 스타일은 부위마다 정확히 5개 파츠를 가진다', () => {
  for (const source of ['boy', 'girl']) {
    for (const { key } of CATEGORIES) {
      assert.equal(PARTS[source][key].length, 5)
    }
  }
})

test('랜덤 모드는 각 부위에서 두 스타일의 10개 파츠를 사용한다', () => {
  for (const { key } of CATEGORIES) {
    const pool = getPool(MODES.MIXED, key)
    assert.equal(pool.length, 10)
    assert.equal(new Set(pool.map((part) => part.source)).size, 2)
  }
})

test('모드별 조합 수가 기획과 일치한다', () => {
  assert.equal(getCombinationCount(MODES.BOY), 3_125)
  assert.equal(getCombinationCount(MODES.GIRL), 3_125)
  assert.equal(getCombinationCount(MODES.MIXED), 100_000)
})

test('직렬화한 파츠는 동일한 파츠로 복원된다', () => {
  const parts = createInitialParts(MODES.MIXED, () => 0.72)
  const serialized = serializeParts(parts)
  const hydrated = hydrateParts(serialized)

  assert.ok(hydrated)
  assert.deepEqual(serializeParts(hydrated), serialized)
})

test('같은 조합은 항상 같은 결과 별명을 가진다', () => {
  const parts = createInitialParts(MODES.BOY, () => 0.31)
  assert.equal(getTraitForParts(parts), getTraitForParts(parts))
})
