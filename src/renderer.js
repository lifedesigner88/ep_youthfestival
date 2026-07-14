import { CATEGORIES } from './data/parts.js'

export const CARD_SIZE = 1080
export const GAME_PREVIEW_SIZE = 720
export const HAND_FONT = '"Nanum Pen Script Local", "Apple SD Gothic Neo", sans-serif'

const COLORS = Object.freeze({
  paper: '#f3e7c5',
  paperLight: '#fffaf0',
  ink: '#29486b',
  inkSoft: '#58738c',
  red: '#c9544d',
  green: '#456557',
  yellow: '#f0c75e',
  lineBlue: '#8db2cc',
  cheek: '#e8928e',
})

const SKIN_TONES = ['#f5cba5', '#efbd94', '#e7ad82', '#f1c39f', '#d99c73']
const HAIR_TONES = ['#3d3030', '#4d3937', '#27384a', '#6a4634', '#2f2d38']

export function renderGameCard(
  canvas,
  parts,
  { currentCategory = 'face', visibleCount = 1 } = {},
) {
  const ctx = prepareCanvas(canvas, GAME_PREVIEW_SIZE)
  drawNotebookPaper(ctx)
  drawTopLabel(ctx, '공책 속 우리 반 친구 만들기')
  drawCharacter(ctx, parts, { visibleCount })
  drawGameFooter(ctx, parts, currentCategory, visibleCount)
}

export function renderResultCard(canvas, result, { friendName = '' } = {}) {
  const ctx = prepareCanvas(canvas, CARD_SIZE)
  drawNotebookPaper(ctx)
  drawTopLabel(ctx, '그 시절, 이런 친구 있었지!')
  drawCharacter(ctx, result.parts)
  drawResultFooter(ctx, result.trait, friendName)
}

function prepareCanvas(canvas, outputSize) {
  if (canvas.width !== outputSize) canvas.width = outputSize
  if (canvas.height !== outputSize) canvas.height = outputSize
  const ctx = canvas.getContext('2d')
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, outputSize, outputSize)
  ctx.scale(outputSize / CARD_SIZE, outputSize / CARD_SIZE)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  return ctx
}

function drawNotebookPaper(ctx) {
  ctx.fillStyle = COLORS.paper
  ctx.fillRect(0, 0, CARD_SIZE, CARD_SIZE)

  ctx.save()
  ctx.globalAlpha = 0.36
  ctx.strokeStyle = COLORS.lineBlue
  ctx.lineWidth = 3
  for (let y = 74; y < CARD_SIZE; y += 72) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(CARD_SIZE, y + Math.sin(y) * 1.2)
    ctx.stroke()
  }

  ctx.strokeStyle = COLORS.red
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.moveTo(112, 0)
  ctx.lineTo(108, CARD_SIZE)
  ctx.stroke()
  ctx.restore()

  ctx.save()
  ctx.globalAlpha = 0.08
  ctx.fillStyle = COLORS.ink
  for (let index = 0; index < 145; index += 1) {
    const x = (index * 83 + 29) % CARD_SIZE
    const y = (index * 137 + 61) % CARD_SIZE
    const radius = 0.8 + ((index * 7) % 4) * 0.35
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()

  drawPaperDoodles(ctx)
}

function drawPaperDoodles(ctx) {
  ctx.save()
  ctx.strokeStyle = COLORS.red
  ctx.fillStyle = COLORS.red
  ctx.lineWidth = 5
  ctx.globalAlpha = 0.76

  drawStar(ctx, 930, 130, 30, 14)

  ctx.font = `54px ${HAND_FONT}`
  ctx.save()
  ctx.translate(82, 680)
  ctx.rotate(-0.13)
  ctx.fillText('♡', 0, 0)
  ctx.restore()

  ctx.strokeStyle = COLORS.green
  ctx.beginPath()
  ctx.moveTo(905, 665)
  ctx.bezierCurveTo(950, 632, 1005, 651, 1030, 610)
  ctx.stroke()
  ctx.restore()
}

function drawTopLabel(ctx, text) {
  ctx.save()
  ctx.translate(143, 68)
  ctx.rotate(-0.015)
  roundedRect(ctx, 0, 0, 470, 64, 12)
  ctx.fillStyle = 'rgba(255,250,240,0.91)'
  ctx.fill()
  ctx.strokeStyle = COLORS.ink
  ctx.lineWidth = 4
  ctx.stroke()
  ctx.fillStyle = COLORS.ink
  ctx.font = `700 34px ${HAND_FONT}`
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 23, 34)
  ctx.restore()

  ctx.save()
  ctx.translate(760, 72)
  ctx.rotate(0.035)
  roundedRect(ctx, 0, 0, 190, 58, 8)
  ctx.fillStyle = COLORS.yellow
  ctx.fill()
  ctx.strokeStyle = COLORS.ink
  ctx.lineWidth = 4
  ctx.stroke()
  ctx.fillStyle = COLORS.ink
  ctx.font = '900 23px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('2000—2010', 95, 31)
  ctx.restore()
}

function drawCharacter(ctx, parts, { visibleCount = CATEGORIES.length } = {}) {
  const facePart = parts.face
  const hairPart = parts.hair
  const skinTone = SKIN_TONES[(facePart.index + (facePart.source === 'girl' ? 2 : 0)) % SKIN_TONES.length]
  const hairTone = HAIR_TONES[(hairPart.index + (hairPart.source === 'girl' ? 1 : 0)) % HAIR_TONES.length]

  ctx.save()
  drawCharacterShadow(ctx)
  drawShoulders(ctx, parts, skinTone)
  if (visibleCount >= 5) drawHairBack(ctx, hairPart, hairTone)
  drawEars(ctx, skinTone)
  drawFace(ctx, facePart, skinTone)
  if (visibleCount >= 4) drawCheeks(ctx, parts)
  if (visibleCount >= 2) drawEyes(ctx, parts.eyes)
  if (visibleCount >= 3) drawNose(ctx, parts.nose)
  if (visibleCount >= 4) drawMouth(ctx, parts.mouth)
  if (visibleCount >= 5) drawHairFront(ctx, hairPart, hairTone)
  ctx.restore()
}

function drawCharacterShadow(ctx) {
  ctx.save()
  ctx.globalAlpha = 0.13
  ctx.fillStyle = COLORS.ink
  ctx.beginPath()
  ctx.ellipse(548, 733, 250, 35, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawShoulders(ctx, parts, skinTone) {
  const colorIndex = (parts.face.index + (parts.face.source === 'girl' ? 1 : 0)) % 4
  const shirtColors = ['#6e91b4', '#d67b72', '#5e806e', '#d2a444']

  ctx.save()
  ctx.beginPath()
  ctx.moveTo(320, 760)
  ctx.bezierCurveTo(340, 677, 414, 646, 484, 640)
  ctx.lineTo(600, 640)
  ctx.bezierCurveTo(680, 648, 748, 690, 768, 760)
  ctx.closePath()
  ctx.fillStyle = shirtColors[colorIndex]
  ctx.fill()
  ctx.strokeStyle = COLORS.ink
  ctx.lineWidth = 11
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(476, 645)
  ctx.lineTo(539, 705)
  ctx.lineTo(605, 645)
  ctx.lineTo(580, 623)
  ctx.lineTo(501, 623)
  ctx.closePath()
  ctx.fillStyle = COLORS.paperLight
  ctx.fill()
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(506, 622)
  ctx.lineTo(506, 657)
  ctx.bezierCurveTo(525, 675, 557, 675, 578, 656)
  ctx.lineTo(578, 620)
  ctx.fillStyle = skinTone
  ctx.fill()
  ctx.stroke()
  ctx.restore()
}

function drawEars(ctx, skinTone) {
  ctx.save()
  ctx.fillStyle = skinTone
  ctx.strokeStyle = COLORS.ink
  ctx.lineWidth = 10
  for (const [x, rotation] of [
    [342, -0.18],
    [738, 0.18],
  ]) {
    ctx.save()
    ctx.translate(x, 462)
    ctx.rotate(rotation)
    ctx.beginPath()
    ctx.ellipse(0, 0, 39, 57, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(rotation < 0 ? 5 : -5, 5, 17, -1.2, 1.35)
    ctx.strokeStyle = 'rgba(41,72,107,.58)'
    ctx.lineWidth = 6
    ctx.stroke()
    ctx.restore()
  }
  ctx.restore()
}

function drawFace(ctx, part, skinTone) {
  const variant = part.index
  const sourceOffset = part.source === 'girl' ? 1 : 0
  ctx.save()
  ctx.beginPath()

  if (variant === 0) {
    ctx.ellipse(540, 443, 196 + sourceOffset * 7, 225, 0, 0, Math.PI * 2)
  } else if (variant === 1) {
    ctx.moveTo(390, 245)
    ctx.bezierCurveTo(330, 280, 338, 580, 401, 640)
    ctx.bezierCurveTo(455, 689, 626, 683, 682, 637)
    ctx.bezierCurveTo(748, 580, 747, 290, 685, 246)
    ctx.bezierCurveTo(626, 210, 449, 210, 390, 245)
  } else if (variant === 2) {
    ctx.moveTo(365, 270)
    ctx.bezierCurveTo(411, 200, 675, 201, 719, 276)
    ctx.bezierCurveTo(738, 354, 708, 564, 624, 646)
    ctx.bezierCurveTo(579, 692, 510, 695, 460, 644)
    ctx.bezierCurveTo(372, 556, 340, 353, 365, 270)
  } else if (variant === 3) {
    ctx.ellipse(540, 442, 176 + sourceOffset * 5, 246, 0, 0, Math.PI * 2)
  } else {
    ctx.moveTo(419, 236)
    ctx.bezierCurveTo(328, 264, 343, 413, 403, 449)
    ctx.bezierCurveTo(341, 510, 371, 638, 464, 677)
    ctx.bezierCurveTo(512, 699, 574, 698, 625, 674)
    ctx.bezierCurveTo(713, 630, 741, 507, 678, 450)
    ctx.bezierCurveTo(739, 404, 745, 276, 661, 238)
    ctx.bezierCurveTo(595, 205, 478, 206, 419, 236)
  }

  ctx.closePath()
  ctx.fillStyle = skinTone
  ctx.fill()
  ctx.strokeStyle = COLORS.ink
  ctx.lineWidth = 12
  ctx.stroke()

  ctx.save()
  ctx.globalAlpha = 0.16
  ctx.strokeStyle = COLORS.red
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.arc(414, 356, 30, 2.7, 4.2)
  ctx.stroke()
  ctx.restore()
  ctx.restore()
}

function drawCheeks(ctx, parts) {
  const showCheeks =
    (parts.eyes.index + (parts.eyes.source === 'girl' ? 1 : 0)) % 2 === 0
  if (!showCheeks) return

  ctx.save()
  ctx.fillStyle = COLORS.cheek
  ctx.globalAlpha = 0.27
  ctx.beginPath()
  ctx.ellipse(415, 529, 44, 19, -0.08, 0, Math.PI * 2)
  ctx.ellipse(665, 529, 44, 19, 0.08, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawEyes(ctx, part) {
  const variant = part.index + (part.source === 'girl' ? 5 : 0)
  const leftX = 455
  const rightX = 625
  const y = 424

  ctx.save()
  ctx.strokeStyle = COLORS.ink
  ctx.fillStyle = COLORS.ink
  ctx.lineWidth = 10

  if (variant === 0) {
    drawDotEye(ctx, leftX, y, 12)
    drawDotEye(ctx, rightX, y, 12)
  } else if (variant === 1) {
    drawArcEye(ctx, leftX, y, 34, 0.1)
    drawArcEye(ctx, rightX, y, 34, 0.1)
  } else if (variant === 2) {
    drawRoundEye(ctx, leftX, y, 30, 24, false)
    drawRoundEye(ctx, rightX, y, 30, 24, false)
  } else if (variant === 3) {
    drawRoundEye(ctx, leftX, y, 37, 31, false)
    drawRoundEye(ctx, rightX, y, 37, 31, false)
    ctx.beginPath()
    ctx.moveTo(leftX + 38, y)
    ctx.lineTo(rightX - 38, y)
    ctx.stroke()
  } else if (variant === 4) {
    drawAngledEye(ctx, leftX, y, -1)
    drawAngledEye(ctx, rightX, y, 1)
  } else if (variant === 5) {
    drawRoundEye(ctx, leftX, y, 32, 28, true)
    drawRoundEye(ctx, rightX, y, 32, 28, true)
    drawSpark(ctx, leftX + 10, y - 8)
    drawSpark(ctx, rightX + 10, y - 8)
  } else if (variant === 6) {
    drawRoundEye(ctx, leftX, y, 29, 23, false)
    drawRoundEye(ctx, rightX, y, 29, 23, false)
    drawLashes(ctx, leftX, y)
    drawLashes(ctx, rightX, y)
  } else if (variant === 7) {
    drawArcEye(ctx, leftX, y, 36, -0.08)
    drawArcEye(ctx, rightX, y, 36, -0.08)
  } else if (variant === 8) {
    drawRoundEye(ctx, leftX, y, 36, 35, true)
    drawRoundEye(ctx, rightX, y, 36, 35, true)
  } else {
    drawArcEye(ctx, leftX, y, 35, Math.PI)
    drawRoundEye(ctx, rightX, y, 31, 27, true)
    drawLashes(ctx, rightX, y)
  }

  ctx.restore()
}

function drawDotEye(ctx, x, y, radius) {
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()
}

function drawArcEye(ctx, x, y, width, rotation) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rotation)
  ctx.beginPath()
  ctx.arc(0, 0, width, 0.16 * Math.PI, 0.84 * Math.PI)
  ctx.stroke()
  ctx.restore()
}

function drawRoundEye(ctx, x, y, radiusX, radiusY, highlight) {
  ctx.beginPath()
  ctx.ellipse(x, y, radiusX, radiusY, 0, 0, Math.PI * 2)
  ctx.fillStyle = COLORS.paperLight
  ctx.fill()
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(x + 2, y + 2, Math.min(radiusX, radiusY) * 0.43, 0, Math.PI * 2)
  ctx.fillStyle = COLORS.ink
  ctx.fill()
  if (highlight) {
    ctx.beginPath()
    ctx.arc(x + 8, y - 7, 5, 0, Math.PI * 2)
    ctx.fillStyle = COLORS.paperLight
    ctx.fill()
  }
}

function drawAngledEye(ctx, x, y, direction) {
  ctx.beginPath()
  ctx.moveTo(x - 31, y - direction * 7)
  ctx.quadraticCurveTo(x, y + direction * 15, x + 31, y + direction * 7)
  ctx.stroke()
  drawDotEye(ctx, x, y + 6, 8)
}

function drawSpark(ctx, x, y) {
  ctx.save()
  ctx.fillStyle = COLORS.paperLight
  ctx.beginPath()
  ctx.arc(x, y, 5, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawLashes(ctx, x, y) {
  ctx.save()
  ctx.lineWidth = 6
  for (const offset of [-21, 0, 21]) {
    ctx.beginPath()
    ctx.moveTo(x + offset, y - 23)
    ctx.lineTo(x + offset - 4, y - 38)
    ctx.stroke()
  }
  ctx.restore()
}

function drawNose(ctx, part) {
  const variant = part.index + (part.source === 'girl' ? 5 : 0)
  const x = 540
  const y = 503
  ctx.save()
  ctx.strokeStyle = COLORS.ink
  ctx.fillStyle = COLORS.ink
  ctx.lineWidth = 8

  if (variant === 0) {
    drawDotEye(ctx, x, y, 7)
  } else if (variant === 1) {
    ctx.beginPath()
    ctx.moveTo(x + 2, y - 30)
    ctx.lineTo(x - 7, y + 17)
    ctx.lineTo(x + 19, y + 19)
    ctx.stroke()
  } else if (variant === 2) {
    ctx.beginPath()
    ctx.moveTo(x, y - 24)
    ctx.lineTo(x - 18, y + 18)
    ctx.lineTo(x + 21, y + 17)
    ctx.closePath()
    ctx.stroke()
  } else if (variant === 3) {
    ctx.beginPath()
    ctx.arc(x, y, 18, 0.15, Math.PI * 1.65)
    ctx.stroke()
  } else if (variant === 4) {
    drawDotEye(ctx, x - 12, y + 7, 5)
    drawDotEye(ctx, x + 12, y + 7, 5)
  } else if (variant === 5) {
    drawDotEye(ctx, x, y + 5, 6)
    ctx.beginPath()
    ctx.arc(x - 3, y, 20, -1.1, 0.35)
    ctx.stroke()
  } else if (variant === 6) {
    ctx.beginPath()
    ctx.moveTo(x + 8, y - 30)
    ctx.quadraticCurveTo(x - 16, y - 2, x + 12, y + 22)
    ctx.stroke()
  } else if (variant === 7) {
    ctx.beginPath()
    ctx.moveTo(x, y - 22)
    ctx.lineTo(x - 16, y + 15)
    ctx.lineTo(x + 5, y + 15)
    ctx.stroke()
    drawDotEye(ctx, x + 17, y + 15, 4)
  } else if (variant === 8) {
    ctx.beginPath()
    ctx.arc(x, y + 2, 16, 0, Math.PI * 2)
    ctx.stroke()
  } else {
    drawDotEye(ctx, x - 11, y + 9, 4)
    drawDotEye(ctx, x + 11, y + 9, 4)
    ctx.beginPath()
    ctx.arc(x, y - 1, 21, 0.35, Math.PI - 0.35)
    ctx.stroke()
  }
  ctx.restore()
}

function drawMouth(ctx, part) {
  const variant = part.index + (part.source === 'girl' ? 5 : 0)
  const x = 540
  const y = 581
  ctx.save()
  ctx.strokeStyle = COLORS.ink
  ctx.fillStyle = COLORS.ink
  ctx.lineWidth = 9

  if (variant === 0) {
    ctx.beginPath()
    ctx.arc(x, y - 25, 57, 0.18, Math.PI - 0.18)
    ctx.stroke()
  } else if (variant === 1) {
    ctx.beginPath()
    ctx.moveTo(x - 47, y)
    ctx.quadraticCurveTo(x, y - 5, x + 47, y)
    ctx.stroke()
  } else if (variant === 2) {
    roundedRect(ctx, x - 52, y - 19, 104, 43, 12)
    ctx.fillStyle = COLORS.paperLight
    ctx.fill()
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x, y - 17)
    ctx.lineTo(x, y + 20)
    ctx.stroke()
  } else if (variant === 3) {
    ctx.beginPath()
    ctx.ellipse(x, y, 28, 35, 0, 0, Math.PI * 2)
    ctx.fillStyle = '#9c4543'
    ctx.fill()
    ctx.stroke()
  } else if (variant === 4) {
    ctx.beginPath()
    ctx.arc(x, y - 22, 54, 0.22, Math.PI - 0.22)
    ctx.stroke()
    ctx.beginPath()
    ctx.ellipse(x, y + 22, 27, 17, 0, 0, Math.PI)
    ctx.fillStyle = '#df7779'
    ctx.fill()
    ctx.stroke()
  } else if (variant === 5) {
    ctx.beginPath()
    ctx.arc(x, y - 25, 50, 0.22, Math.PI - 0.22)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x - 32, y + 10)
    ctx.quadraticCurveTo(x, y + 28, x + 32, y + 10)
    ctx.strokeStyle = COLORS.red
    ctx.lineWidth = 5
    ctx.stroke()
  } else if (variant === 6) {
    ctx.beginPath()
    ctx.moveTo(x - 42, y + 7)
    ctx.quadraticCurveTo(x - 12, y - 13, x, y + 3)
    ctx.quadraticCurveTo(x + 13, y - 13, x + 42, y + 7)
    ctx.stroke()
  } else if (variant === 7) {
    roundedRect(ctx, x - 48, y - 17, 96, 40, 12)
    ctx.fillStyle = COLORS.paperLight
    ctx.fill()
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x, y - 13)
    ctx.lineTo(x, y + 18)
    ctx.stroke()
  } else if (variant === 8) {
    ctx.beginPath()
    ctx.arc(x, y, 27, 0, Math.PI * 2)
    ctx.fillStyle = '#9c4543'
    ctx.fill()
    ctx.stroke()
  } else {
    ctx.beginPath()
    ctx.moveTo(x - 48, y)
    ctx.quadraticCurveTo(x - 20, y + 22, x, y)
    ctx.quadraticCurveTo(x + 20, y + 22, x + 48, y)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(x, y + 4, 32, 0.1, Math.PI - 0.1)
    ctx.strokeStyle = COLORS.red
    ctx.lineWidth = 5
    ctx.stroke()
  }
  ctx.restore()
}

function drawHairBack(ctx, part, color) {
  const variant = part.index + (part.source === 'girl' ? 5 : 0)
  ctx.save()
  ctx.fillStyle = color
  ctx.strokeStyle = COLORS.ink
  ctx.lineWidth = 12

  if (variant === 3) {
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 7) {
      const x = 540 + Math.cos(angle) * 196
      const y = 420 + Math.sin(angle) * 215
      ctx.beginPath()
      ctx.arc(x, y, 54, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    }
  } else if (variant === 5) {
    ctx.beginPath()
    ctx.ellipse(540, 435, 235, 259, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  } else if (variant === 6) {
    for (const x of [300, 780]) {
      ctx.beginPath()
      ctx.ellipse(x, 438, 92, 130, x < 540 ? -0.25 : 0.25, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(x < 540 ? 364 : 716, 330, 27, 0, Math.PI * 2)
      ctx.fillStyle = COLORS.red
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = color
    }
  } else if (variant === 7) {
    ctx.beginPath()
    ctx.moveTo(334, 300)
    ctx.bezierCurveTo(350, 175, 716, 170, 744, 300)
    ctx.lineTo(732, 735)
    ctx.bezierCurveTo(671, 772, 409, 772, 350, 731)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  } else if (variant === 8) {
    ctx.beginPath()
    ctx.ellipse(779, 351, 101, 165, 0.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(700, 283, 31, 0, Math.PI * 2)
    ctx.fillStyle = COLORS.yellow
    ctx.fill()
    ctx.stroke()
  }
  ctx.restore()
}

function drawHairFront(ctx, part, color) {
  const variant = part.index + (part.source === 'girl' ? 5 : 0)
  ctx.save()
  ctx.fillStyle = color
  ctx.strokeStyle = COLORS.ink
  ctx.lineWidth = 12

  if (variant === 0) {
    ctx.beginPath()
    ctx.moveTo(349, 344)
    ctx.bezierCurveTo(338, 203, 454, 174, 546, 181)
    ctx.bezierCurveTo(674, 169, 750, 235, 731, 354)
    ctx.bezierCurveTo(677, 311, 635, 333, 590, 302)
    ctx.bezierCurveTo(544, 343, 491, 305, 449, 334)
    ctx.bezierCurveTo(411, 310, 380, 340, 349, 344)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  } else if (variant === 1) {
    ctx.beginPath()
    ctx.moveTo(351, 360)
    ctx.bezierCurveTo(334, 209, 469, 171, 566, 184)
    ctx.bezierCurveTo(675, 181, 735, 242, 729, 343)
    ctx.bezierCurveTo(665, 311, 599, 273, 566, 211)
    ctx.bezierCurveTo(515, 291, 435, 338, 351, 360)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(566, 211)
    ctx.lineTo(581, 323)
    ctx.stroke()
  } else if (variant === 2) {
    const points = [
      [349, 358], [363, 249], [405, 271], [425, 181], [474, 226], [519, 146],
      [554, 220], [613, 158], [632, 239], [704, 199], [694, 286], [742, 300],
      [728, 365], [652, 313], [593, 327], [534, 298], [475, 330], [411, 306],
    ]
    polygon(ctx, points)
    ctx.fill()
    ctx.stroke()
  } else if (variant === 3) {
    for (const [x, y, radius] of [
      [388, 286, 72], [460, 224, 78], [548, 211, 83], [635, 235, 79], [700, 302, 69],
    ]) {
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    }
  } else if (variant === 4) {
    const points = [
      [354, 362], [357, 246], [409, 269], [428, 190], [476, 239], [527, 163],
      [551, 236], [616, 181], [620, 253], [700, 226], [682, 303], [737, 320],
      [720, 369], [658, 329], [602, 345], [548, 318], [487, 342], [426, 319],
    ]
    polygon(ctx, points)
    ctx.fill()
    ctx.stroke()
  } else if (variant === 5) {
    ctx.beginPath()
    ctx.moveTo(337, 354)
    ctx.bezierCurveTo(329, 188, 452, 168, 550, 177)
    ctx.bezierCurveTo(680, 167, 755, 239, 741, 369)
    ctx.bezierCurveTo(680, 332, 638, 328, 591, 305)
    ctx.bezierCurveTo(539, 349, 491, 302, 449, 338)
    ctx.bezierCurveTo(402, 309, 370, 350, 337, 354)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  } else if (variant === 6) {
    ctx.beginPath()
    ctx.moveTo(350, 351)
    ctx.bezierCurveTo(337, 207, 453, 166, 540, 181)
    ctx.bezierCurveTo(657, 161, 748, 226, 731, 354)
    ctx.bezierCurveTo(665, 310, 612, 281, 544, 209)
    ctx.bezierCurveTo(499, 281, 424, 328, 350, 351)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(544, 209)
    ctx.lineTo(544, 327)
    ctx.stroke()
  } else if (variant === 7) {
    ctx.beginPath()
    ctx.moveTo(342, 355)
    ctx.bezierCurveTo(329, 190, 445, 161, 546, 171)
    ctx.bezierCurveTo(678, 162, 756, 233, 736, 357)
    ctx.lineTo(674, 316)
    ctx.lineTo(630, 357)
    ctx.lineTo(586, 310)
    ctx.lineTo(543, 354)
    ctx.lineTo(498, 307)
    ctx.lineTo(451, 349)
    ctx.lineTo(407, 310)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  } else if (variant === 8) {
    ctx.beginPath()
    ctx.moveTo(346, 363)
    ctx.bezierCurveTo(335, 203, 459, 161, 553, 180)
    ctx.bezierCurveTo(666, 168, 748, 242, 729, 353)
    ctx.bezierCurveTo(657, 321, 599, 269, 564, 206)
    ctx.bezierCurveTo(508, 293, 430, 345, 346, 363)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  } else {
    const points = [
      [346, 356], [358, 236], [402, 263], [428, 189], [474, 231], [530, 162],
      [551, 224], [618, 179], [624, 248], [700, 215], [686, 292], [739, 311],
      [727, 361], [665, 322], [607, 342], [550, 309], [490, 339], [425, 317],
    ]
    polygon(ctx, points)
    ctx.fill()
    ctx.stroke()
    ctx.save()
    ctx.translate(672, 287)
    ctx.rotate(-0.17)
    roundedRect(ctx, 0, 0, 62, 22, 6)
    ctx.fillStyle = COLORS.red
    ctx.fill()
    ctx.strokeStyle = COLORS.ink
    ctx.lineWidth = 5
    ctx.stroke()
    ctx.restore()
  }
  ctx.restore()
}

function drawGameFooter(ctx, parts, currentCategory, visibleCount) {
  ctx.save()
  ctx.translate(138, 806)
  ctx.rotate(-0.008)
  roundedRect(ctx, 0, 0, 804, 206, 17)
  ctx.fillStyle = 'rgba(255,250,240,0.94)'
  ctx.fill()
  ctx.strokeStyle = COLORS.ink
  ctx.lineWidth = 6
  ctx.stroke()

  ctx.fillStyle = COLORS.red
  ctx.font = `700 31px ${HAND_FONT}`
  ctx.fillText('지금 돌아가는 얼굴 조각', 35, 49)

  const category = CATEGORIES.find(({ key }) => key === currentCategory)
  ctx.fillStyle = COLORS.ink
  ctx.font = `700 55px ${HAND_FONT}`
  ctx.fillText(`${category?.objectLabel ?? '친구를'} 멈춰 주세요!`, 35, 112)

  ctx.fillStyle = COLORS.inkSoft
  ctx.font = `700 25px ${HAND_FONT}`
  const partNames = CATEGORIES.slice(0, visibleCount)
    .map(({ key }) => parts[key].name)
    .join(' · ')
  fitText(ctx, partNames, 35, 163, 730, 25, 18)
  ctx.restore()
}

function drawResultFooter(ctx, trait, friendName) {
  ctx.save()
  ctx.translate(133, 788)
  ctx.rotate(0.006)
  roundedRect(ctx, 0, 0, 814, 249, 18)
  ctx.fillStyle = 'rgba(255,250,240,0.97)'
  ctx.fill()
  ctx.strokeStyle = COLORS.ink
  ctx.lineWidth = 7
  ctx.stroke()

  ctx.setLineDash([13, 10])
  ctx.strokeStyle = COLORS.red
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(30, 72)
  ctx.lineTo(784, 72)
  ctx.stroke()
  ctx.setLineDash([])

  ctx.fillStyle = COLORS.inkSoft
  ctx.textAlign = 'center'
  ctx.font = `700 28px ${HAND_FONT}`
  ctx.fillText('내 초등학교 친구', 407, 47)

  const displayName = friendName.trim() || '이름을 적어 주세요'
  ctx.fillStyle = friendName.trim() ? COLORS.red : '#8b989f'
  ctx.font = `700 82px ${HAND_FONT}`
  fitText(ctx, displayName, 407, 153, 700, 82, 46, 'center')

  ctx.fillStyle = COLORS.ink
  ctx.font = `700 33px ${HAND_FONT}`
  fitText(ctx, trait, 407, 214, 710, 33, 25, 'center')
  ctx.restore()
}

function fitText(ctx, text, x, y, maxWidth, initialSize, minSize, align = 'left') {
  let size = initialSize
  ctx.textAlign = align
  while (size > minSize && ctx.measureText(text).width > maxWidth) {
    size -= 2
    ctx.font = ctx.font.replace(/\d+(?:\.\d+)?px/, `${size}px`)
  }
  ctx.fillText(text, x, y)
}

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + width, y, x + width, y + height, r)
  ctx.arcTo(x + width, y + height, x, y + height, r)
  ctx.arcTo(x, y + height, x, y, r)
  ctx.arcTo(x, y, x + width, y, r)
  ctx.closePath()
}

function polygon(ctx, points) {
  ctx.beginPath()
  ctx.moveTo(points[0][0], points[0][1])
  for (let index = 1; index < points.length; index += 1) {
    ctx.lineTo(points[index][0], points[index][1])
  }
  ctx.closePath()
}

function drawStar(ctx, x, y, outerRadius, innerRadius) {
  ctx.beginPath()
  for (let point = 0; point < 10; point += 1) {
    const radius = point % 2 === 0 ? outerRadius : innerRadius
    const angle = -Math.PI / 2 + (point * Math.PI) / 5
    const px = x + Math.cos(angle) * radius
    const py = y + Math.sin(angle) * radius
    if (point === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.stroke()
}
