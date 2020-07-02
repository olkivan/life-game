export function toBoolArray(bits, length) {
  const bitsPerElement = bits.BYTES_PER_ELEMENT * 8

  console.assert(length <= bits.length * bitsPerElement)

  let idx = 0
  let bitidx = length >= bitsPerElement ? bitsPerElement - 1 : length - 1
  const boolArray = []

  for (let i = 0; i < length; ++i) {
    const bitstring = bits[idx]
    const val = !!((bitstring >> bitidx--) & 1)
    boolArray.push(val)

    if (i % bitsPerElement === bitsPerElement - 1) {
      ++idx
      if (length - i >= bitsPerElement) {
        bitidx = bitsPerElement - 1
      } else {
        bitidx = length - i - 2
      }
    }
  }

  return boolArray
}


function toBitArray(boolArray) {
  const bits = new Uint32Array(Math.ceil(boolArray.length / 32))

  const bitsPerElement = bits.BYTES_PER_ELEMENT * 8
  const length = boolArray.length

  let idx = 0
  let val = 0

  var i = 0

  for (; i < length; ++i) {
    val <<= 1
    val |= +(!!boolArray[i])
    if (i % bitsPerElement === bitsPerElement - 1) {
      bits[idx++] = Number(val)
      val = 0
    }
  }

  if (i % bitsPerElement !== 0) {
    bits[idx] = Number(val)
  }

  return bits
}


function areBitArraysEqual(lbits, rbits) {
  if (lbits.length !== rbits.length) {
    return false
  }

  for (let i = 0; i < lbits.length; ++i) {
    if (lbits[i] !== rbits[i]) {
      return false
    }
  }

  return true
}


export default class FrameContainer {
  constructor(columns, rows, trackLoopDepth = 0) {
    this.frameSize = columns * rows
    this.columns = columns
    this.rows = rows
    this.frames = []
    this.meta = []
    this.trackLoopDepth = trackLoopDepth
  }

  detectLoop = lastFrameChecksum => {
    const totalFramesToCheck = Math.min(this.frames.length, this.trackLoopDepth)
    const startFrameIdx = this.frames.length - 2
    const endFrameIdx = this.frames.length - totalFramesToCheck

    for (let i = startFrameIdx; i >= endFrameIdx; --i) {
      if (this.meta[i].checksum === lastFrameChecksum) {
        const lastFrameData = this.frames[this.frames.length - 1]
        if (areBitArraysEqual(this.frames[i], lastFrameData)) {
          return i
        }
      }
    }
  }

  push = data => {
    console.assert(data.length === this.frameSize)

    // this.frames.push(data)
    this.frames.push(toBitArray(data))

    const lastFrame = this.frames[this.frames.length - 1]
    const checksum = lastFrame.reduce((prev, item) => prev ^ item)

    const loopFrame = this.frames.length > 1 ? this.detectLoop(checksum) : undefined
    this.meta.push({ checksum, loopFrame })

    return loopFrame
  }

  pop = () => {
    if (this.frames.length === 0)
      return null

    this.meta.pop()

    // return this.frames.pop()
    return toBoolArray(this.frames.pop(), this.frameSize)
  }

  dropTail = () => {
    this.meta.pop()
    this.frames.pop()
  }

  getFrame = index => {
    if (index < 0 || index >= this.frames.length) return null

    // return this.frames[index]

    return [this.meta[index], toBoolArray(this.frames[index], this.frameSize)]
  }

  set = (index, data) => {
    console.assert(data.length === this.frameSize)
    console.assert(index >= 0 && index < this.frames.length)

    this.frames[index] = toBitArray(data)
  }

  get length() {
    return this.frames.length
  }
}


export async function getKeyFrames(fc, lifeRule, from, to) {
  const frames = fc.frames
  const keyFrames = []
  const columns = fc.columns
  const rows = fc.rows

  keyFrames.push({ index: 0, data: frames[from - 1] })

  for (let i = from; i < to; ++i) {
    const frame = toBoolArray(frames[i - 1], fc.frameSize)
    const nextFrameBits = frames[i]

    const nextFrame = await lifeRule(frame, columns, rows)
    const isNextFrameProducedByLifeRules =
      areBitArraysEqual(toBitArray(nextFrame), nextFrameBits)

    if (!isNextFrameProducedByLifeRules) {
      keyFrames.push({
        index: i,
        data: nextFrameBits
      })
    }
  }

  return keyFrames;
}
