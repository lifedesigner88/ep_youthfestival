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

export const TRAITS = Object.freeze([
  '공책 낙서 장인',
  '쉬는 시간 운동장 대장',
  '준비물 척척 박사',
  '급식 시간 행복 요정',
  '발표할 때 손 번쩍 친구',
  '문방구 신상 수집가',
  '짝꿍 웃음 버튼',
  '알림장 정리의 달인',
  '컴퓨터실 자리 선점왕',
  '체육 시간 에너지 대장',
  '쉬는 시간 만화가',
  '반장 선거 응원 단장',
])

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

export function getTraitForParts(parts) {
  const signature = CATEGORIES.map(({ key }) => parts[key]?.id ?? '').join('|')
  let hash = 0
  for (let index = 0; index < signature.length; index += 1) {
    hash = (hash * 31 + signature.charCodeAt(index)) >>> 0
  }
  return TRAITS[hash % TRAITS.length]
}

export function getCombinationCount(mode) {
  return CATEGORIES.reduce((count, { key }) => count * getPool(mode, key).length, 1)
}
