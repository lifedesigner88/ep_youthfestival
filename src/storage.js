import { hydrateParts, isValidMode } from './data/parts.js'

const STORAGE_KEY = 'epYouthFestival:friendMaker:v1'

const EMPTY_STATE = Object.freeze({
  lastMode: 'mixed',
  recentResult: null,
})

export function loadLocalState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    if (!stored || typeof stored !== 'object') return { ...EMPTY_STATE }

    const lastMode = isValidMode(stored.lastMode) ? stored.lastMode : EMPTY_STATE.lastMode
    const recentResult = validateRecentResult(stored.recentResult)
    return { lastMode, recentResult }
  } catch {
    return { ...EMPTY_STATE }
  }
}

export function saveLastMode(lastMode) {
  const current = loadLocalState()
  writeState({ ...current, lastMode: isValidMode(lastMode) ? lastMode : 'mixed' })
}

export function saveRecentResult(result) {
  const current = loadLocalState()
  const recentResult = {
    mode: result.mode,
    partIds: { ...result.partIds },
    createdAt: result.createdAt,
  }
  writeState({ ...current, lastMode: result.mode, recentResult })
}

function validateRecentResult(result) {
  if (!result || !isValidMode(result.mode) || !hydrateParts(result.partIds)) return null
  if (typeof result.createdAt !== 'string') return null

  // 별명은 파츠에서 항상 다시 계산한다. 이전 버전이 저장한 trait은 의도적으로 버린다.
  return {
    mode: result.mode,
    partIds: { ...result.partIds },
    createdAt: result.createdAt,
  }
}

function writeState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}
