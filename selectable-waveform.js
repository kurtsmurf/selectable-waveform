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

const isBetween = (target, a, b) => {
  return (target < a && target > b) || (target > a && target < b)
}

const renderArray = (arr) => {
  for (x=0;x<w;x++) {
    const y = h / 2
    const rectW = 1
    const rectH = arr[x]


    if (selectionStart 
        && selectionEnd 
        && isBetween(
          begin + x,
          selectionStart,
          selectionEnd)) {
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

fetch('snd.wav')
.then(response => response.arrayBuffer())
.then(arrayBuffer => audioCtx.decodeAudioData(arrayBuffer))
.then(audioBuffer => audioBuffer.getChannelData(0))
.then(leftChannel => {
  wave = amplify(normalize(leftChannel))
  drawWave(wave, begin)
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
  selectionStart = null
  selectionEnd = null

  const rect = canvas.getBoundingClientRect()
  const startX = Math.floor(e.clientX - rect.left)

  selectionStart = begin + startX

  drawWave(wave, begin)

  window.onmousemove = (e) => {
    const endX = Math.floor(e.clientX - rect.left)
    selectionEnd = begin + endX

    drawWave(wave, begin)
  }
}

window.onmouseup = () => {
  window.onmousemove = null
}