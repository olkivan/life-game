import React from 'react'
import PlaybackControl from './ControlPanel/PlaybackControl'
import FrameControl from './ControlPanel/FrameControl'
import SpeedControl from './ControlPanel/SpeedControl'
import './ControlPanel.css'


export default props => {
  return <>
    <div className="control-panel">
      <PlaybackControl {...props} />
      <FrameControl {...props} />
      <SpeedControl {...props} />
    </div>
  </>
}
