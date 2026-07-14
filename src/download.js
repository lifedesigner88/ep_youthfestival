export function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('PNG 이미지를 만들지 못했습니다.'))
    }, 'image/png')
  })
}

export function createDownloadName(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0')
  const datePart = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`
  const timePart = `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  return `school-friend-${datePart}-${timePart}.png`
}

export function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.rel = 'noopener'
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 12_000)
}

export function isMobileDevice({
  userAgent = navigator.userAgent,
  platform = navigator.platform,
  maxTouchPoints = navigator.maxTouchPoints,
  userAgentData = navigator.userAgentData,
} = {}) {
  if (userAgentData?.mobile === true) return true

  const hasMobileUserAgent =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(userAgent)
  const isIPadWithDesktopUserAgent =
    /Mac/i.test(platform) && Number(maxTouchPoints) > 1

  return hasMobileUserAgent || isIPadWithDesktopUserAgent
}
