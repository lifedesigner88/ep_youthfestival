import assert from 'node:assert/strict'
import test from 'node:test'

import { MODES, createInitialParts, serializeParts } from '../src/data/parts.js'
import { loadLocalState, saveRecentResult } from '../src/storage.js'

const STORAGE_KEY = 'epYouthFestival:friendMaker:v1'

function useMemoryStorage(initialState = null) {
  const values = new Map()
  if (initialState) values.set(STORAGE_KEY, JSON.stringify(initialState))

  globalThis.localStorage = {
    getItem(key) {
      return values.get(key) ?? null
    },
    setItem(key, value) {
      values.set(key, String(value))
    },
  }

  return values
}

test('예전 결과에 저장된 별명은 버리고 파츠 정보만 불러온다', () => {
  const partIds = serializeParts(createInitialParts(MODES.MIXED, () => 0.42))
  useMemoryStorage({
    lastMode: MODES.MIXED,
    recentResult: {
      mode: MODES.MIXED,
      partIds,
      trait: '이전 버전 별명',
      createdAt: '2026-07-14T00:00:00.000Z',
    },
  })

  const state = loadLocalState()

  assert.deepEqual(state.recentResult, {
    mode: MODES.MIXED,
    partIds,
    createdAt: '2026-07-14T00:00:00.000Z',
  })
})

test('최근 결과에는 다시 계산할 수 있는 값만 저장한다', () => {
  const values = useMemoryStorage()
  const partIds = serializeParts(createInitialParts(MODES.BOY, () => 0.24))

  saveRecentResult({
    mode: MODES.BOY,
    partIds,
    trait: '저장하지 않을 별명',
    createdAt: '2026-07-14T00:00:00.000Z',
  })

  const stored = JSON.parse(values.get(STORAGE_KEY))
  assert.deepEqual(stored.recentResult, {
    mode: MODES.BOY,
    partIds,
    createdAt: '2026-07-14T00:00:00.000Z',
  })
})
