import React from 'react'
import './SpeedControl.css'

function SpeedButton(props) {
  return <>
    <div className="speed-button-element">
      <input type="radio" className="speed-selector" id={props.speed} name="speed-selector" value={props.speed}
        onChange={e => { props.handleSpeedSelect(e.target.value) }}
        checked={props.playbackSpeed === props.speed}
      />
      <label htmlFor={props.speed}><div className="speed-button">{props.label}</div></label>
    </div>
  </>
}

export default function SpeedControl(props) {
  return <>
    <div className="speed-control noselect">
      <fieldset>
        <legend>Speed</legend>
        <SpeedButton {...props} speed='speed-slowest' label='slowest' />
        <SpeedButton {...props} speed='speed-slow' label='slow' />
        <SpeedButton {...props} speed='speed-normal' label='normal' />
        <SpeedButton {...props} speed='speed-fast' label='fast' />
        <SpeedButton {...props} speed='speed-fastest' label='fastest' />
      </fieldset>
    </div>
  </>
}
