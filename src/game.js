import {
  CATEGORIES,
  createInitialParts,
  isValidMode,
  pickRandomPart,
  serializeParts,
} from './data/parts.js'

const LOCK_DURATION = 360

export function getVisibleCount(lockedCount) {
  return Math.min(Math.max(lockedCount + 1, 1), CATEGORIES.length)
}

export class FriendGame {
  constructor({ onUpdate = () => {}, onComplete = () => {}, random = Math.random } = {}) {
    this.onUpdate = onUpdate
    this.onComplete = onComplete
    this.random = random
    this.mode = null
    this.parts = null
    this.lockedCount = 0
    this.busy = false
    this.running = false
    this.frameId = null
    this.finishTimer = null
    this.nextChangeAt = {}
    this.boundTick = this.tick.bind(this)
  }

  start(mode) {
    if (!isValidMode(mode)) throw new Error(`Invalid mode: ${mode}`)

    this.stop()
    this.mode = mode
    this.parts = createInitialParts(mode, this.random)
    this.lockedCount = 0
    this.busy = false
    this.running = true

    const now = performance.now()
    for (const category of CATEGORIES) {
      this.nextChangeAt[category.key] = now + category.interval
    }

    this.emit('start')
    this.frameId = requestAnimationFrame(this.boundTick)
  }

  restart() {
    if (!this.mode) return
    this.start(this.mode)
  }

  tick(now) {
    if (!this.running) return

    const category = CATEGORIES[this.lockedCount]
    if (category && now >= this.nextChangeAt[category.key]) {
      const previousId = this.parts[category.key].id
      this.parts[category.key] = pickRandomPart(
        this.mode,
        category.key,
        previousId,
        this.random,
      )
      this.nextChangeAt[category.key] = now + category.interval
      this.emit('spin')
    }

    this.frameId = requestAnimationFrame(this.boundTick)
  }

  lockCurrent() {
    if (!this.running || this.busy || this.lockedCount >= CATEGORIES.length) return false

    const lockedCategory = CATEGORIES[this.lockedCount]
    this.busy = true
    this.lockedCount += 1
    this.emit('lock', lockedCategory)

    clearTimeout(this.finishTimer)
    this.finishTimer = window.setTimeout(() => {
      this.busy = false

      if (this.lockedCount === CATEGORIES.length) {
        this.running = false
        if (this.frameId) cancelAnimationFrame(this.frameId)
        this.frameId = null
        const snapshot = this.getSnapshot()
        this.emit('complete')
        this.onComplete(snapshot)
        return
      }

      this.emit('ready')
    }, LOCK_DURATION)

    return true
  }

  getSnapshot() {
    return {
      mode: this.mode,
      parts: { ...this.parts },
      partIds: serializeParts(this.parts),
      lockedCount: this.lockedCount,
      visibleCount: getVisibleCount(this.lockedCount),
      busy: this.busy,
      running: this.running,
    }
  }

  emit(reason, category = null) {
    this.onUpdate(this.getSnapshot(), { reason, category })
  }

  stop() {
    this.running = false
    this.busy = false
    if (this.frameId) cancelAnimationFrame(this.frameId)
    if (this.finishTimer) clearTimeout(this.finishTimer)
    this.frameId = null
    this.finishTimer = null
  }

  destroy() {
    this.stop()
    this.parts = null
    this.mode = null
  }
}
