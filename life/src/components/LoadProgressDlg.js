import React, { useState, useEffect } from 'react'
import './LoadProgressDlg.css'
import { useHistory } from "react-router-dom";

import { restoreLife } from '../Storage'

export default ({ life, onLoad, setBtnHandler }) => {
  const [numRestored, setNumRestored] = useState(0)
  const [cancelcb, setCancelCb] = useState({cb: null})

  useEffect(() => {
    (async () => {
      try {
        const restoredLife = await restoreLife(life, setNumRestored, setCancelCb)
        onLoad(restoredLife)
      } catch(e) {
        console.log(e);
      }
    })()
  }, [life, onLoad])


  const history = useHistory()

  useEffect(() => {
    setBtnHandler({
      onCancel: _ => {
        cancelcb.cb && cancelcb.cb()
        history.goBack()
        return true
      }
    })
  })


  const totalFrames = life.totalFrames
  const percent = Math.ceil((numRestored / totalFrames) * 100)

  const progressStyle = {
    background: `linear-gradient(to right, #909090 ${percent}%, white ${percent}%)`
  }

  const label = `Restored ${numRestored} frames of ${totalFrames}`

  return <>
    <div className="load-progress-dlg">
      <div className="load-progress-dlg-progressbar" style={progressStyle}></div>
      <div className="load-progress-dlg-label">{label}</div>
    </div>
  </>
}
