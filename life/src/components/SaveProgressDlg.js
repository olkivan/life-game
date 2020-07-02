import React, { useState, useEffect } from 'react'
import './SaveProgressDlg.css'
import { saveLife } from '../Storage'

export default ({ lifeData, onSave, setBtnHandler }) => {
  const [numSaved, setNumSaved] = useState(0)
  const [cancelcb, setCancelCb] = useState({ cb: null })

  useEffect(() => {
    (async () => {
      try {
        await saveLife(lifeData, setNumSaved, setCancelCb)
        onSave && onSave()
      } catch(e) {
        console.log('got save error', e)
      }
    })()
  }, [lifeData, onSave])


  useEffect(() => {
    setBtnHandler({
      onCancel: _ => {
        cancelcb.cb && cancelcb.cb()
        return true
      }
    })
  })


  const totalFrames = lifeData.to - lifeData.from
  const percent = Math.ceil((numSaved / totalFrames) * 100)

  const progressStyle = {
    background: `linear-gradient(to right, #909090 ${percent}%, white ${percent}%)`
  }

  const label = `Saved ${numSaved} frames of ${totalFrames}`

  return <>
    <div className="save-progress-dlg">
      <div className="save-progress-dlg-progressbar" style={progressStyle}></div>
      <div className="save-progress-dlg-label">{label}</div>
    </div>
  </>
}
