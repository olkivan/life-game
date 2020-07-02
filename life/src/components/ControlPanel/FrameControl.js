import React, { useState } from 'react'
import './FrameControl.css'


export default props => {
  const [frameIdx, setCurrentFrame] = useState('' + props.currentFrame)

  const isFrameIdxValid = +frameIdx > 0 && +frameIdx <= props.frameCount

  if ((isFrameIdxValid && +frameIdx !== props.currentFrame) || +frameIdx > props.frameCount) {
    setCurrentFrame(props.currentFrame)
  }

  return <div>
    <span className="ctrl-title">Frame # </span>
    <input
      className={
        isFrameIdxValid
          ? "ctrl-frame-input"
          : "ctrl-frame-input ctrl-frame-input-invalid"
      }
      type="number"
      value={frameIdx}
      onChange={e => {
        const newValue = e.target.value
        props.gotoFrame(+newValue)
        setCurrentFrame(newValue)
      }}
    />
    <span className="ctrl-title">of {props.frameCount}</span>
  </div>
}
