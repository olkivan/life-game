import { base64ToBytes, bytesToBase64 } from 'byte-base64'

import FrameContainer, { toBoolArray, getKeyFrames } from './FrameContainer'
import applyLifeRules from './LifeLogic'



const HTTP_TIMEOUT = 1000
const API_URL = '/api'


function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c === 'x' ? r : ((r & 0x3) | 0x8);
    return v.toString(16);
  });
}

export default class RemoteStorageProvider {
  static url = window.location

  static put = async (obj, itemId) => {
    const URL = `${API_URL}/game`

    let timeoutID = undefined

    try {
      const abortConroller = new AbortController()
      timeoutID = setTimeout(_ => abortConroller.abort(), HTTP_TIMEOUT)

      obj._id = itemId || uuidv4()

      const response = await fetch(URL, {
        method: 'PUT',
        signal: abortConroller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(obj)
      })
      if (response.status === 200) {
        return response.json()
      }
    } catch (reason) {
      console.log('remote storage put failed: ', reason)
    } finally {
      clearTimeout(timeoutID)
    }
  }

  static get = async (key) => {
    const URL = `${API_URL}/game/${key}`

    let timeoutID = undefined

    try {
      const abortConroller = new AbortController()
      timeoutID = setTimeout(_ => abortConroller.abort(), HTTP_TIMEOUT)

      const response = await fetch(URL, {
        method: 'GET',
        signal: abortConroller.signal,
      })

      if (response.status === 200) {
        return response.json()
      }
    } catch (reason) {
      console.log('remote storage get failed: ', reason)
    } finally {
      clearTimeout(timeoutID)
    }
  }

  static delete = async (key) => {
    const URL = `${API_URL}/game/${key}`

    let timeoutID = undefined

    try {
      const abortConroller = new AbortController()
      timeoutID = setTimeout(_ => abortConroller.abort(), HTTP_TIMEOUT)

      const response = await fetch(URL, {
        method: 'DELETE',
        signal: abortConroller.signal
      })

      if (response.status === 200) {
        return response.json()
      }
    } catch (reason) {
      console.log('remote storage delete failed: ', reason)
    } finally {
      clearTimeout(timeoutID)
    }
  }

  static list = async () => {
    const URL = `${API_URL}/gamelist`

    let timeoutID = undefined

    try {
      const abortConroller = new AbortController()
      timeoutID = setTimeout(_ => abortConroller.abort(), HTTP_TIMEOUT)

      const response = await fetch(URL, {
        method: 'GET',
        signal: abortConroller.signal,
      })

      if (response.status === 200) {
        return response.json()
      }
    } catch (reason) {
      console.log('remote storage get failed: ', reason)
    } finally {
      clearTimeout(timeoutID)
    }
  }
}

export function keyFrameToBoolArray(data, columns, rows) {
  const bytesView = base64ToBytes(data)
  const buf = bytesView.buffer.slice(0, bytesView.length)
  const uint32data = new Uint32Array(buf)
  return toBoolArray(uint32data, columns * rows)
}


export async function restoreLife(storedLife, progressCallback, setCancelCb) {
  return new Promise(async (resolve, reject) => {
    let canceled = false

    setCancelCb({ cb: () => { canceled = true } })

    const { totalFrames, frames, columns, rows } = storedLife
    // TODO: fix loop detection max size serialization logic
    const fc = new FrameContainer(columns, rows, 1000)
    for (let i = 0; i < frames.length; ++i) {
      let frameData = keyFrameToBoolArray(frames[i].data, columns, rows)
      const isLastKeyFrame = (i + 1) >= frames.length
      const frameCount = isLastKeyFrame
        ? totalFrames - fc.length
        : frames[i + 1].index - frames[i].index

      fc.push(frameData)

      for (let frameIdx = 1; frameIdx < frameCount; ++frameIdx) {
        if (canceled)
          reject(new Error('restore life canceled'))
        const wrapEdges = true
        frameData = applyLifeRules(frameData, columns, rows, wrapEdges)
        fc.push(frameData)

        if (frameIdx % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0))
          progressCallback && progressCallback(fc.length)
        }
      }
    }

    resolve(fc)
  })

}


export async function saveLife(lifeData, progressCallback, setCancelCb) {
  let canceled = false
  setCancelCb({ cb: () => { canceled = true } })

  const { frameContainer, from, to, title, description, itemId } = lifeData
  let totalFrames = 0
  const keyFrames = await getKeyFrames(frameContainer,
    async (frame, columns, rows) => {
      if (canceled)
        throw new Error('save life canceled')
      const wrapEdges = true
      if (++totalFrames % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0))
        progressCallback && progressCallback(totalFrames)
      }

      return applyLifeRules(frame, columns, rows, wrapEdges)
    },
    from, to
  )

  const framesBase64 = await Promise.all(keyFrames.map(async frame => {
    return {
      index: frame.index,
      data: bytesToBase64(new Uint8Array(frame.data.buffer))
    }
  }))


  const lifeInfo = {
    title: title.trim(),
    description: description.trim(),
    columns: frameContainer.columns,
    rows: frameContainer.rows,
    frames: framesBase64,
    totalFrames: (to - from) + 1
  }

  RemoteStorageProvider.put(lifeInfo, itemId)
}
