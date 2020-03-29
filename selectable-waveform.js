const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d')
const audioCtx = new AudioContext()

const background = '#3E3E3E'
const color = '#0DBC79'

canvas.width = window.innerWidth - 64
canvas.height = 256
canvas.style.border = '4px solid ' + color

const w = canvas.width
const h = canvas.height

let selectionStart = null
let selectionEnd = null

ctx.fillStyle = color

const normalize = (arr, to = .95) => {
  const max = arr.reduce((prev, curr) => curr > prev ? curr : prev)
  return arr.map(sample => sample * (to / max))
}

const amplify = (arr) => {
  return arr.map(sample => sample * h / 2)
}

const quantize = (arr) => {
  return arr.map(sample => sample > 0 ? Math.ceil(sample) : Math.floor(sample))
}

const isSelected = (x) => {
  return x + begin >= selectionStart && x + begin <= selectionEnd
}

const renderArray = (arr) => {
  for (x=0;x<w;x++) {
    const y = h / 2
    const rectW = 1
    const rectH = arr[x]

    if (selectionStart 
        && selectionEnd 
        && isSelected(x)) {
      ctx.fillStyle = color
      ctx.fillRect(x,0,1,h)
      ctx.fillStyle = background
      ctx.fillRect(x, y, rectW, rectH)
    } else {
      ctx.fillStyle = color
      ctx.fillRect(x, y, rectW, rectH)
    }
  }
}

const drawWave = (wave, begin) => {
  ctx.clearRect(0,0,w,h)
  renderArray(wave.subarray(begin, begin + w))
}

let begin = 0
let wave
let buffer

fetch('snd.wav')
.then(response => response.arrayBuffer())
.then(arrayBuffer => audioCtx.decodeAudioData(arrayBuffer))
.then(audioBuffer => {
  const channelData = audioBuffer.getChannelData(0)
  wave = amplify(normalize(channelData))
  drawWave(wave, begin)

  buffer = audioBuffer
})

const handleScrollCanvas = (e) => {
  const deltaX = Math.floor(e.deltaY)
  const newBegin = begin + deltaX

  if (newBegin < 0) {
    begin = 0
  } else if (newBegin > wave.length - w) {
    begin = wave.length - w
  } else {
    begin = newBegin
  }

  drawWave(wave, begin)
}

canvas.onwheel = handleScrollCanvas

canvas.onmousedown = (e) => {
  e.preventDefault()

  selectionStart = null
  selectionEnd = null

  const rect = canvas.getBoundingClientRect()
  const anchorX = Math.floor(e.clientX - rect.left)

  const anchor = begin + anchorX

  drawWave(wave, begin)

  window.onmousemove = (e) => {
    e.preventDefault()

    const targetX = Math.floor(e.clientX - rect.left) 
    const target = begin + targetX

    selectionStart = Math.min(anchor, target)
    selectionEnd = Math.max(anchor, target)

    drawWave(wave, begin)
  }
}

window.onmouseup = () => {
  window.onmousemove = null
}

const button = document.querySelector('#play')

button.onclick = () => {
  audioCtx.resume()

  const startSample = selectionStart === null ? 0 : selectionStart
  const endSample = selectionEnd === null ? 0 : selectionEnd
  const durationSamples = endSample - startSample

  const startSecs = startSample / buffer.sampleRate
  const durationSecs = durationSamples / buffer.sampleRate

  const buf = audioCtx.createBufferSource()
  buf.buffer = buffer
  buf.connect(audioCtx.destination)
  buf.start(0, startSecs, durationSecs)
}