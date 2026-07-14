import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CATEGORIES,
  MODES,
  PARTS,
  TRAIT_COMBINATION_COUNT,
  createInitialParts,
  getCombinationCount,
  getPool,
  getTraitForParts,
  getTraitIndexForParts,
  hydrateParts,
  serializeParts,
} from '../src/data/parts.js'

function forEachCombination(mode, callback) {
  const facePool = getPool(mode, 'face')
  const eyesPool = getPool(mode, 'eyes')
  const nosePool = getPool(mode, 'nose')
  const mouthPool = getPool(mode, 'mouth')
  const hairPool = getPool(mode, 'hair')

  for (const face of facePool) {
    for (const eyes of eyesPool) {
      for (const nose of nosePool) {
        for (const mouth of mouthPool) {
          for (const hair of hairPool) {
            callback({ face, eyes, nose, mouth, hair })
          }
        }
      }
    }
  }
}

function increment(frequencies, value) {
  frequencies.set(value, (frequencies.get(value) ?? 0) + 1)
}

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

test('직렬화한 파츠는 동일한 파츠와 별명으로 복원된다', () => {
  const parts = createInitialParts(MODES.MIXED, () => 0.72)
  const serialized = serializeParts(parts)
  const hydrated = hydrateParts(serialized)

  assert.ok(hydrated)
  assert.deepEqual(serializeParts(hydrated), serialized)
  assert.equal(getTraitIndexForParts(hydrated), getTraitIndexForParts(parts))
  assert.equal(getTraitForParts(hydrated), getTraitForParts(parts))
})

test('같은 조합은 호출할 때마다 같은 별명과 인덱스를 가진다', () => {
  const parts = createInitialParts(MODES.BOY, () => 0.31)

  assert.equal(getTraitIndexForParts(parts), getTraitIndexForParts(parts))
  assert.equal(getTraitForParts(parts), getTraitForParts(parts))
})

test('별명 인덱스는 파츠 숫자를 섞는 정해진 공식으로 계산된다', () => {
  const parts = {
    face: PARTS.boy.face[0],
    eyes: PARTS.boy.eyes[1],
    nose: PARTS.girl.nose[2],
    mouth: PARTS.girl.mouth[3],
    hair: PARTS.boy.hair[4],
  }

  // 파츠 숫자 [0, 1, 7, 8, 4]는 r=281을 거쳐 별명 인덱스 708이 된다.
  assert.equal(getTraitIndexForParts(parts), 708)
})

test('랜덤 모드 100,000개 얼굴은 1,000개 별명에 정확히 100개씩 배정된다', () => {
  const nicknameFrequencies = new Map()
  const indexFrequencies = new Map()

  forEachCombination(MODES.MIXED, (parts) => {
    increment(nicknameFrequencies, getTraitForParts(parts))
    increment(indexFrequencies, getTraitIndexForParts(parts))
  })

  assert.equal(TRAIT_COMBINATION_COUNT, 1_000)
  assert.equal(nicknameFrequencies.size, TRAIT_COMBINATION_COUNT)
  assert.equal(indexFrequencies.size, TRAIT_COMBINATION_COUNT)
  assert.ok([...nicknameFrequencies.values()].every((count) => count === 100))
  assert.ok([...indexFrequencies.values()].every((count) => count === 100))
})

test('남학생과 여학생 모드도 각각 모든 별명에 2~5개 얼굴을 배정한다', () => {
  for (const mode of [MODES.BOY, MODES.GIRL]) {
    const frequencies = new Map()

    forEachCombination(mode, (parts) => {
      increment(frequencies, getTraitForParts(parts))
    })

    const counts = [...frequencies.values()]
    assert.equal(frequencies.size, TRAIT_COMBINATION_COUNT)
    assert.equal(counts.reduce((sum, count) => sum + count, 0), 3_125)
    assert.equal(Math.min(...counts), 2)
    assert.equal(Math.max(...counts), 5)
    assert.ok(counts.every((count) => count >= 2 && count <= 5))
  }
})

test('다섯 파츠 중 어느 하나가 바뀌어도 별명 인덱스가 달라진다', () => {
  const baseParts = Object.fromEntries(
    CATEGORIES.map(({ key }) => [key, getPool(MODES.MIXED, key)[0]]),
  )
  const baseIndex = getTraitIndexForParts(baseParts)

  for (const { key } of CATEGORIES) {
    for (const replacement of getPool(MODES.MIXED, key).slice(1)) {
      const changedParts = { ...baseParts, [key]: replacement }
      assert.notEqual(
        getTraitIndexForParts(changedParts),
        baseIndex,
        `${key} 파츠 변경이 별명 인덱스에 반영되어야 한다`,
      )
    }
  }
})
