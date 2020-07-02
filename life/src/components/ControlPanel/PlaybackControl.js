import React, { useState } from 'react'
import './PlaybackControl.css'


export default props => {
  const [frameIdx, setCurrentFrame] = useState('' + props.currentFrame)

  const isFrameIdxValid = +frameIdx > 0 && +frameIdx <= props.frameCount

  if ((isFrameIdxValid && +frameIdx !== props.currentFrame) || +frameIdx > props.frameCount) {
    setCurrentFrame(props.currentFrame)
  }

  return (
    <>
      <div className="ctrl-playback-title">Click [ <span className="material-icons">play_arrow</span>] to run simulation.</div>
      <div className="ctrl-playback-btn-container">
        <button className="ctrl-playback-btn material-icons noselect"
          title={props.isPlaying ? 'Pause simulation' : 'Run simulation'}
          name={props.isPlaying ? 'pause' : 'play'}
          onClick={props.handleBtn}
        >
          {props.isPlaying ? 'pause' : 'play_arrow'}
        </button>

        <button
          className="ctrl-playback-btn material-icons noselect"
          name="first"
          title="First frame"
          onClick={props.handleBtn}
        >
          fast_rewind
        </button>

        <button
          className={
            props.active === 'prev'
              ? 'ctrl-playback-btn ctrl-playback-btn-active  material-icons noselect'
              : 'ctrl-playback-btn  material-icons noselect'
          }
          name="prev"
          title="Previous frame"
          onMouseDown={props.handleBtnDown}
        >
          skip_previous
        </button>

        <button
          className={
            props.active === 'next'
              ? "ctrl-playback-btn ctrl-playback-btn-active  material-icons noselect"
              : "ctrl-playback-btn  material-icons noselect"
          }
          name="next"
          title="Next frame"
          onMouseDown={props.handleBtnDown}
        >
          skip_next
        </button>

        <button
          className="ctrl-playback-btn material-icons noselect"
          name="last"
          title="Last frame"
          onClick={props.handleBtn}
        >
          fast_forward
        </button>
      </div>
    </>
  )
}
