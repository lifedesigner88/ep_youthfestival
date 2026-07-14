export const MODES = Object.freeze({
  BOY: 'boy',
  GIRL: 'girl',
  MIXED: 'mixed',
})

export const CATEGORIES = Object.freeze([
  { key: 'face', label: '얼굴', objectLabel: '얼굴을', interval: 176 },
  { key: 'eyes', label: '눈', objectLabel: '눈을', interval: 148 },
  { key: 'nose', label: '코', objectLabel: '코를', interval: 194 },
  { key: 'mouth', label: '입', objectLabel: '입을', interval: 162 },
  { key: 'hair', label: '머리', objectLabel: '머리를', interval: 212 },
])

const PART_NAMES = {
  boy: {
    face: ['동글동글', '네모반듯', '세모턱', '길쭉타원', '말랑땅콩'],
    eyes: ['점눈', '졸린눈', '동그란눈', '안경눈', '장난눈'],
    nose: ['점코', '짧은선코', '세모코', '둥근코', '콧구멍코'],
    mouth: ['활짝웃음', '일자입', '앞니웃음', '깜짝입', '메롱입'],
    hair: ['바가지머리', '반듯가르마', '삐죽머리', '복슬머리', '체육시간머리'],
  },
  girl: {
    face: ['복숭아형', '둥근네모', '뾰족턱', '달걀형', '통통볼형'],
    eyes: ['반짝눈', '속눈썹눈', '새침눈', '왕눈', '윙크눈'],
    nose: ['콩알코', '갈고리코', '세모점코', '동그라미코', '두점코'],
    mouth: ['방긋입', '삐죽입', '웃는앞니', '동그란입', '장난입'],
    hair: ['단발머리', '양갈래', '긴생머리', '높은포니', '핀꽂은머리'],
  },
}

function createParts(source, category) {
  return PART_NAMES[source][category].map((name, index) => ({
    id: `${source}-${category}-${index + 1}`,
    source,
    category,
    index,
    name,
  }))
}

export const PARTS = Object.freeze(
  Object.fromEntries(
    Object.keys(PART_NAMES).map((source) => [
      source,
      Object.freeze(
        Object.fromEntries(
          CATEGORIES.map(({ key }) => [key, Object.freeze(createParts(source, key))]),
        ),
      ),
    ]),
  ),
)

const PART_INDEX = new Map(
  Object.values(PARTS).flatMap((source) =>
    Object.values(source).flatMap((parts) => parts.map((part) => [part.id, part])),
  ),
)

// 아래 배열의 순서는 결과 별명의 일부입니다.
// 순서를 바꾸면 기존 얼굴의 별명도 바뀌므로 추가·수정 시 매핑 호환성을 검토해야 합니다.
const TRAIT_SCENES = Object.freeze([
  '우리 반의',
  '쉬는 시간의',
  '운동장의',
  '급식 시간의',
  '컴퓨터실의',
  '문방구 앞의',
  '공책 속의',
  '소풍날의',
  '방과 후의',
  '모둠 활동의',
])

const TRAIT_MOODS = Object.freeze([
  '신나는',
  '다정한',
  '유쾌한',
  '든든한',
  '야무진',
  '씩씩한',
  '반짝이는',
  '호기심 많은',
  '재치 있는',
  '명랑한',
])

const TRAIT_ROLES = Object.freeze([
  '웃음 요정',
  '놀이 대장',
  '응원 단장',
  '아이디어 박사',
  '척척 달인',
  '추억 수집가',
  '마음 지킴이',
  '이야기꾼',
  '행복 메이커',
  '상상 탐험가',
])

export const TRAIT_COMBINATION_COUNT =
  TRAIT_SCENES.length * TRAIT_MOODS.length * TRAIT_ROLES.length

export function isValidMode(mode) {
  return Object.values(MODES).includes(mode)
}

export function getPool(mode, category) {
  if (!CATEGORIES.some(({ key }) => key === category)) {
    throw new Error(`Unknown category: ${category}`)
  }

  if (mode === MODES.MIXED) {
    return [...PARTS.boy[category], ...PARTS.girl[category]]
  }

  if (mode === MODES.BOY || mode === MODES.GIRL) {
    return PARTS[mode][category]
  }

  throw new Error(`Unknown mode: ${mode}`)
}

export function getPartById(id) {
  return PART_INDEX.get(id) ?? null
}

export function pickRandomPart(mode, category, previousId = null, random = Math.random) {
  const pool = getPool(mode, category)
  if (pool.length === 1) return pool[0]

  let part = pool[Math.floor(random() * pool.length)]
  let attempts = 0
  while (part.id === previousId && attempts < 5) {
    part = pool[Math.floor(random() * pool.length)]
    attempts += 1
  }
  return part
}

export function createInitialParts(mode, random = Math.random) {
  return Object.fromEntries(
    CATEGORIES.map(({ key }) => [key, pickRandomPart(mode, key, null, random)]),
  )
}

export function serializeParts(parts) {
  return Object.fromEntries(CATEGORIES.map(({ key }) => [key, parts[key].id]))
}

export function hydrateParts(partIds) {
  if (!partIds || typeof partIds !== 'object') return null

  const entries = CATEGORIES.map(({ key }) => [key, getPartById(partIds[key])])
  if (entries.some(([, part]) => !part)) return null
  return Object.fromEntries(entries)
}

function getPartStyleIndex(part) {
  if (!part || !Number.isInteger(part.index) || part.index < 0 || part.index > 4) {
    throw new Error('Invalid character part')
  }

  if (part.source === MODES.BOY) return part.index
  if (part.source === MODES.GIRL) return part.index + 5
  throw new Error('Invalid character part source')
}

export function getTraitIndexForParts(parts) {
  const face = getPartStyleIndex(parts?.face)
  const eyes = getPartStyleIndex(parts?.eyes)
  const nose = getPartStyleIndex(parts?.nose)
  const mouth = getPartStyleIndex(parts?.mouth)
  const hair = getPartStyleIndex(parts?.hair)

  // 랜덤 모드의 100,000개 조합에서 1,000개 인덱스가 각각 100번씩 나온다.
  // 난수·시간·모드를 쓰지 않아 같은 다섯 파츠는 항상 같은 인덱스를 갖는다.
  const baseIndex =
    (241 * face + 497 * eyes + 100 * nose + 10 * mouth + hair) %
    TRAIT_COMBINATION_COUNT
  return (137 * baseIndex + 211) % TRAIT_COMBINATION_COUNT
}

export function getTraitForParts(parts) {
  const traitIndex = getTraitIndexForParts(parts)
  const sceneIndex = Math.floor(traitIndex / 100)
  const moodIndex = Math.floor(traitIndex / 10) % 10
  const roleIndex = traitIndex % 10

  return `${TRAIT_SCENES[sceneIndex]} ${TRAIT_MOODS[moodIndex]} ${TRAIT_ROLES[roleIndex]}`
}

export function getCombinationCount(mode) {
  return CATEGORIES.reduce((count, { key }) => count * getPool(mode, key).length, 1)
}
