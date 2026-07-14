import './styles/base.css'
import './styles/game.css'
import './styles/responsive.css'

import { CATEGORIES, MODES, getTraitForParts, hydrateParts, isValidMode } from './data/parts.js'
import { canvasToBlob, createDownloadName, isLikelyInAppBrowser, triggerDownload } from './download.js'
import { FriendGame } from './game.js'
import { renderGameCard, renderResultCard } from './renderer.js'
import { loadLocalState, saveLastMode, saveRecentResult } from './storage.js'

const MODE_LABELS = {
  [MODES.BOY]: '남학생 모습으로 조합 중',
  [MODES.GIRL]: '여학생 모습으로 조합 중',
  [MODES.MIXED]: '모든 파츠를 랜덤 조합 중',
}

const views = {
  intro: document.querySelector('#introView'),
  game: document.querySelector('#gameView'),
  result: document.querySelector('#resultView'),
}

const elements = {
  app: document.querySelector('#app'),
  homeButton: document.querySelector('#homeButton'),
  modeButtons: [...document.querySelectorAll('[data-mode]')],
  recentButton: document.querySelector('#recentButton'),
  gameModeLabel: document.querySelector('#gameModeLabel'),
  gameTitle: document.querySelector('#gameTitle'),
  quitGameButton: document.querySelector('#quitGameButton'),
  progressItems: [...document.querySelectorAll('#progressList li')],
  gameCanvas: document.querySelector('#gameCanvas'),
  gameCanvasFrame: document.querySelector('#gameCanvasFrame'),
  stepCounter: document.querySelector('#stepCounter'),
  gameInstruction: document.querySelector('#gameInstruction'),
  stopButton: document.querySelector('#stopButton'),
  stopButtonLabel: document.querySelector('#stopButtonLabel'),
  gameAnnouncement: document.querySelector('#gameAnnouncement'),
  resultCanvas: document.querySelector('#resultCanvas'),
  traitLabel: document.querySelector('#traitLabel'),
  friendName: document.querySelector('#friendName'),
  nameCounter: document.querySelector('#nameCounter'),
  nameHelp: document.querySelector('#nameHelp'),
  downloadButton: document.querySelector('#downloadButton'),
  retryButton: document.querySelector('#retryButton'),
  backToIntroButton: document.querySelector('#backToIntroButton'),
  toast: document.querySelector('#toast'),
  saveDialog: document.querySelector('#saveDialog'),
  closeSaveDialog: document.querySelector('#closeSaveDialog'),
  savePreviewImage: document.querySelector('#savePreviewImage'),
  saveAgainLink: document.querySelector('#saveAgainLink'),
}

let activeView = 'intro'
let currentMode = MODES.MIXED
let currentResult = null
let toastTimer = null
let saveDialogUrl = null

const localState = loadLocalState()
if (isValidMode(localState.lastMode)) currentMode = localState.lastMode

const fontReady = loadHandwritingFont()

const game = new FriendGame({
  onUpdate: handleGameUpdate,
  onComplete: handleGameComplete,
})

initializeRecentResult()
setView('intro', { focus: false })

elements.modeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    startGame(button.dataset.mode ?? MODES.MIXED)
  })
})

elements.stopButton.addEventListener('click', () => {
  game.lockCurrent()
})

elements.retryButton.addEventListener('click', () => {
  startGame(currentResult?.mode ?? currentMode)
})

elements.homeButton.addEventListener('click', goToIntro)
elements.quitGameButton.addEventListener('click', goToIntro)
elements.backToIntroButton.addEventListener('click', goToIntro)

elements.recentButton.addEventListener('click', () => {
  const state = loadLocalState()
  if (!state.recentResult) {
    elements.recentButton.hidden = true
    showToast('최근에 만든 친구가 없어요.')
    return
  }

  const parts = hydrateParts(state.recentResult.partIds)
  if (!parts) {
    elements.recentButton.hidden = true
    showToast('이전 친구를 다시 불러오지 못했어요.')
    return
  }

  currentMode = state.recentResult.mode
  showResult({
    ...state.recentResult,
    parts,
    trait: getTraitForParts(parts),
  })
})

elements.friendName.addEventListener('input', handleNameInput)
elements.friendName.addEventListener('blur', () => {
  const normalized = normalizeFriendName(elements.friendName.value, { trim: true })
  if (normalized !== elements.friendName.value) elements.friendName.value = normalized
  updateNameState()
})

elements.downloadButton.addEventListener('click', downloadCurrentCard)
elements.closeSaveDialog.addEventListener('click', () => elements.saveDialog.close())
elements.saveDialog.addEventListener('close', clearSaveDialogUrl)

document.addEventListener('keydown', (event) => {
  if (activeView !== 'game' || event.repeat) return
  if (
    event.target instanceof Element &&
    event.target.closest('button, a, input, textarea, select, [contenteditable="true"]')
  ) return

  if (event.code === 'Space' || event.code === 'Enter') {
    event.preventDefault()
    game.lockCurrent()
  }
})

window.addEventListener('pagehide', (event) => {
  if (event.persisted) return
  game.stop()
  clearSaveDialogUrl()
})

fontReady.then(() => {
  if (activeView === 'result' && currentResult) updateResultPreview()
})

function startGame(mode) {
  if (!isValidMode(mode)) mode = MODES.MIXED
  currentMode = mode
  currentResult = null
  saveLastMode(mode)
  elements.gameModeLabel.textContent = MODE_LABELS[mode]
  elements.gameAnnouncement.textContent = ''
  setView('game')
  game.start(mode)
  elements.stopButton.focus({ preventScroll: true })
}

function handleGameUpdate(snapshot, meta) {
  const nextCategory = CATEGORIES[Math.min(snapshot.lockedCount, CATEGORIES.length - 1)]
  const visibleCategories = CATEGORIES.slice(0, snapshot.visibleCount)
  elements.gameCanvas.dataset.visibleParts = visibleCategories.map(({ key }) => key).join(' ')
  elements.gameCanvas.setAttribute(
    'aria-label',
    `${visibleCategories.map(({ label }) => label).join(', ')}까지 보이는 친구 얼굴. 현재 ${nextCategory.label} 파츠가 바뀌고 있습니다.`,
  )
  renderGameCard(elements.gameCanvas, snapshot.parts, {
    currentCategory: nextCategory.key,
    visibleCount: snapshot.visibleCount,
  })

  if (meta.reason === 'spin') return

  updateProgress(snapshot)
  elements.stopButton.disabled = snapshot.busy || snapshot.lockedCount >= CATEGORIES.length

  if (meta.reason === 'lock' && meta.category) {
    replayLockAnimation()
    const isLast = snapshot.lockedCount === CATEGORIES.length
    const message = isLast
      ? `${meta.category.label}까지 완성! 친구를 만나러 가요.`
      : `${meta.category.label} 완성! 다음은 ${nextCategory.label}이에요.`
    elements.gameAnnouncement.textContent = message
    showToast(message)
  }
}

function updateProgress(snapshot) {
  const nextIndex = Math.min(snapshot.lockedCount, CATEGORIES.length - 1)

  elements.progressItems.forEach((item, index) => {
    const isComplete = index < snapshot.lockedCount
    const isCurrent = index === snapshot.lockedCount && snapshot.lockedCount < CATEGORIES.length
    item.classList.toggle('is-complete', isComplete)
    item.classList.toggle('is-current', isCurrent)
    if (isCurrent) item.setAttribute('aria-current', 'step')
    else item.removeAttribute('aria-current')

    const status = item.querySelector('small')
    if (status) status.textContent = isComplete ? '완성' : isCurrent ? '진행 중' : '대기'
    const number = item.querySelector('span')
    if (number) number.textContent = isComplete ? '✓' : String(index + 1)
  })

  if (snapshot.lockedCount >= CATEGORIES.length) {
    elements.stepCounter.textContent = '5 / 5'
    elements.gameTitle.textContent = '친구를 완성하는 중이에요'
    elements.gameInstruction.textContent = '마지막 도장을 찍고 있어요.'
    elements.stopButtonLabel.textContent = '완성!'
    return
  }

  const category = CATEGORIES[nextIndex]
  elements.stepCounter.textContent = `${nextIndex + 1} / 5`
  elements.gameTitle.textContent = `${category.objectLabel} 멈춰 주세요`
  elements.gameInstruction.textContent = '마음에 드는 순간 버튼을 눌러 주세요.'
  elements.stopButtonLabel.textContent = `${category.label} 멈추기`
}

function handleGameComplete(snapshot) {
  const result = {
    mode: snapshot.mode,
    parts: snapshot.parts,
    partIds: snapshot.partIds,
    trait: getTraitForParts(snapshot.parts),
    createdAt: new Date().toISOString(),
  }
  saveRecentResult(result)
  elements.recentButton.hidden = false
  showResult(result)
}

function showResult(result) {
  game.stop()
  currentResult = result
  currentMode = result.mode
  elements.traitLabel.textContent = result.trait
  elements.friendName.value = ''
  elements.nameCounter.textContent = '0 / 12'
  elements.nameHelp.textContent = '이름은 이미지에만 들어가며 저장되지 않아요.'
  elements.downloadButton.disabled = true
  updateResultPreview()
  setView('result')
}

function handleNameInput() {
  const normalized = normalizeFriendName(elements.friendName.value)
  if (normalized !== elements.friendName.value) {
    const cursor = Math.min(normalized.length, elements.friendName.selectionStart ?? normalized.length)
    elements.friendName.value = normalized
    elements.friendName.setSelectionRange(cursor, cursor)
  }
  updateNameState()
}

function updateNameState() {
  const name = normalizeFriendName(elements.friendName.value, { trim: true })
  const length = countGraphemes(elements.friendName.value)
  elements.nameCounter.textContent = `${Math.min(length, 12)} / 12`
  elements.downloadButton.disabled = name.length === 0 || !currentResult
  elements.nameHelp.textContent = name
    ? '이름은 이미지에만 들어가며 저장되지 않아요.'
    : '친구 이름을 한 글자 이상 적어 주세요.'
  updateResultPreview()
}

function updateResultPreview() {
  if (!currentResult) return
  renderResultCard(elements.resultCanvas, currentResult, {
    friendName: normalizeFriendName(elements.friendName.value, { trim: true }),
  })
}

async function downloadCurrentCard() {
  if (!currentResult) return
  const result = currentResult
  const friendName = normalizeFriendName(elements.friendName.value, { trim: true })
  if (!friendName) {
    elements.friendName.focus()
    showToast('친구 이름을 먼저 적어 주세요.')
    return
  }

  const originalLabel = elements.downloadButton.innerHTML
  elements.downloadButton.disabled = true
  elements.downloadButton.textContent = '카드를 만드는 중…'

  try {
    await fontReady
    renderResultCard(elements.resultCanvas, result, { friendName })
    const blob = await canvasToBlob(elements.resultCanvas)
    const filename = createDownloadName()

    if (isLikelyInAppBrowser()) {
      openSaveDialog(blob, filename)
      showToast('이미지를 길게 눌러 저장할 수 있어요.')
    } else {
      triggerDownload(blob, filename)
      showToast('친구 카드 저장을 시작했어요!')
    }
  } catch (error) {
    console.error(error)
    showToast('카드를 저장하지 못했어요. 잠시 후 다시 시도해 주세요.')
  } finally {
    elements.downloadButton.innerHTML = originalLabel
    const currentName = normalizeFriendName(elements.friendName.value, { trim: true })
    elements.downloadButton.disabled = activeView !== 'result' || !currentResult || !currentName
  }
}

function openSaveDialog(blob, filename) {
  clearSaveDialogUrl()
  saveDialogUrl = URL.createObjectURL(blob)
  elements.savePreviewImage.src = saveDialogUrl
  elements.saveAgainLink.href = saveDialogUrl
  elements.saveAgainLink.download = filename

  if (typeof elements.saveDialog.showModal === 'function') {
    elements.saveDialog.showModal()
  } else {
    elements.saveDialog.setAttribute('open', '')
  }
}

function clearSaveDialogUrl() {
  if (!saveDialogUrl) return
  URL.revokeObjectURL(saveDialogUrl)
  saveDialogUrl = null
  elements.savePreviewImage.removeAttribute('src')
  elements.saveAgainLink.removeAttribute('href')
}

function goToIntro() {
  game.stop()
  currentResult = null
  setView('intro')
}

function setView(name, { focus = true } = {}) {
  activeView = name
  Object.entries(views).forEach(([viewName, view]) => {
    view.hidden = viewName !== name
  })
  document.body.dataset.view = name
  window.scrollTo({ top: 0, behavior: 'auto' })
  if (focus) elements.app.focus({ preventScroll: true })
}

function replayLockAnimation() {
  elements.gameCanvasFrame.classList.remove('is-locking')
  void elements.gameCanvasFrame.offsetWidth
  elements.gameCanvasFrame.classList.add('is-locking')
}

function initializeRecentResult() {
  elements.recentButton.hidden = !localState.recentResult
}

function normalizeFriendName(value, { trim = false } = {}) {
  const withoutControls = String(value).replace(/[\r\n\t\u0000-\u001f\u007f]/g, ' ')
  const compact = withoutControls.replace(/ {2,}/g, ' ')
  const limited = sliceGraphemes(compact, 12)
  return trim ? limited.trim() : limited
}

function countGraphemes(value) {
  if (typeof Intl.Segmenter === 'function') {
    const segmenter = new Intl.Segmenter('ko', { granularity: 'grapheme' })
    return [...segmenter.segment(value)].length
  }
  return Array.from(value).length
}

function sliceGraphemes(value, maxLength) {
  if (typeof Intl.Segmenter === 'function') {
    const segmenter = new Intl.Segmenter('ko', { granularity: 'grapheme' })
    return [...segmenter.segment(value)]
      .slice(0, maxLength)
      .map(({ segment }) => segment)
      .join('')
  }
  return Array.from(value).slice(0, maxLength).join('')
}

function showToast(message) {
  clearTimeout(toastTimer)
  elements.toast.textContent = message
  elements.toast.hidden = false
  toastTimer = window.setTimeout(() => {
    elements.toast.hidden = true
  }, 2400)
}

async function loadHandwritingFont() {
  if (!document.fonts) return
  try {
    await document.fonts.load('72px "Nanum Pen Script Local"', '친구 민지 2000')
    await document.fonts.ready
  } catch (error) {
    console.warn('손글씨 글꼴을 불러오지 못해 시스템 글꼴을 사용합니다.', error)
  }
}
