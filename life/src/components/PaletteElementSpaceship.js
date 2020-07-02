import React, { Component } from 'react';

import PureCanvas from './PureCanvas'
import './PaletteElement.css'
import applyLifeRules from '../LifeLogic'

const deepcopy = obj => JSON.parse(JSON.stringify(obj))

export default class PaletteElementSpaceship extends Component {
  ctx = null
  imageData = null
  updateInterval = 30

  state = {
    pattern: {},
    isPlaying: false,
    timerID: null,
    frame: 0,
    step: 0,
    angle: 0,
  }

  initContext = ctx => {
    this.ctx = ctx
    const pattern = this.props.pattern
    console.assert(pattern.data.length === pattern.columns * pattern.rows)
    const width = pattern.columns * this.props.cellSize
    const height = pattern.rows * this.props.cellSize

    const pixels = new Uint8ClampedArray(width * height * 4)
    this.imageData = new ImageData(pixels, width, height)
  }

  renderPattern = (pattern, shiftx, shifty) => {
    const ctx = this.ctx

    const cellSize = this.props.cellSize
    const borderSize = this.props.borderSize
    const fillSize = cellSize - borderSize

    ctx.save()

    ctx.putImageData(this.imageData, 0, 0)

    const totalColumns = pattern.columns + pattern.shiftxPerCycle * 2
    const totalRows = pattern.rows + pattern.shiftyPerCycle * 2
    const areaOffset = Math.max(
      Math.ceil(Math.abs(pattern.shiftxPerCycle)),
      Math.ceil(Math.abs(pattern.shiftyPerCycle))
    )

    for (let column = -areaOffset; column < totalColumns + areaOffset; ++column) {
      for (let row = -areaOffset; row < totalRows + areaOffset; ++row) {
        const xoffset = column * cellSize + borderSize + shiftx * cellSize
        const yoffset = row * cellSize + borderSize + shifty * cellSize
        const dataIdx = row * pattern.columns + column
        const checked = pattern.data[dataIdx]
        ctx.fillStyle = checked ? '#000000' : '#c0c0c0'//'#cfffcf'
        ctx.fillRect(xoffset, yoffset, fillSize, fillSize)
      }
    }

    ctx.restore()
  }

  componentDidMount() {
    this.setState({ pattern: deepcopy(this.props.pattern) })
  }

  componentDidUpdate(prevProps) {
    if (prevProps.pattern !== this.props.pattern) {
      this.setState({ pattern: deepcopy(this.props.pattern) })
      return
    }

    const fpc = this.state.pattern.framesPerCycle
    const frame = this.state.frame

    const x = this.state.pattern.shiftxPerCycle
    const y = -this.state.pattern.shiftyPerCycle
    const len = Math.sqrt(this.state.pattern.shiftxPerCycle ** 2 + this.state.pattern.shiftyPerCycle ** 2)

    const angle = Math.atan2(x, y) - Math.PI / 2 + this.state.angle

    const xs = Math.cos(angle) * len
    const ys = Math.sin(angle) * len

    const shiftx = (frame % fpc) / fpc * -xs
    const shifty = (frame % fpc) / fpc * -ys

    this.renderPattern(this.state.pattern, shiftx, shifty)
  }

  update = () => {
    if (!this.state.isPlaying) {
      return
    }

    const pattern = { ...this.state.pattern }
    let frame = this.state.frame + 1
    if (frame >= pattern.framesPerCycle) {
      frame = 0
    }

    const step = Math.floor(frame / (pattern.framesPerCycle / pattern.cyclePeriod))

    if (this.state.step !== step) {
      const initialState = deepcopy(this.props.pattern.data)
      pattern.data = frame === 0
        ? initialState
        : applyLifeRules(pattern.data, pattern.columns, pattern.rows, true)
    }

    const timerID = setTimeout(this.update, this.updateInterval)

    this.setState({
      step,
      frame,
      pattern,
      timerID
    })

  }

  handleMouseOver = () => {
    clearTimeout(this.state.timerID)
    this.setState({ isPlaying: true, timerID: setTimeout(this.update, 0) })
  }

  handleMouseLeave = () => {
    clearTimeout(this.state.timerID)
    this.setState({
      isPlaying: false,
      timerID: null,
      pattern: deepcopy(this.props.pattern),
      frame: 0,
      step: 0
    })
  }

  handleRotate = direction => {
    const newPattern = deepcopy(this.props.pattern)
    const { rows, columns, data } = newPattern

    const newColumns = rows
    const newRows = columns

    const olddata = this.props.pattern.data

    const cw = direction === "cw"

    for (let r = 0; r < rows; ++r) {
      for (let c = 0; c < columns; ++c) {
        const newr = cw ? c : columns - c - 1
        const newc = cw ? rows - r - 1 : r
        data[newr * newColumns + newc] = olddata[r * columns + c];
      }
    }

    newPattern.rows = newRows
    newPattern.columns = newColumns

    let angle = this.state.angle + (cw ? Math.PI / 2 : -Math.PI / 2)

    angle %= Math.PI * 2

    this.setState({ angle })

    this.props.updatePattern(newPattern)
  }


  render() {
    const pattern = this.props.pattern
    console.assert(pattern.data.length === pattern.columns * pattern.rows)
    const width = pattern.columns * this.props.cellSize
    const height = pattern.rows * this.props.cellSize

    const style = {
      width: width + this.props.borderSize,
      height: height + this.props.borderSize,
    }

    return <>
      <div
        className={
          this.props.checked
            ? 'palette-element palette-element-checked'
            : 'palette-element'
        }

        onMouseOver={this.handleMouseOver}
        onMouseLeave={this.handleMouseLeave}
        onClick={this.props.onClick}
      >
        <div className='palette-element-title'>{pattern.name}</div>
        {pattern.rotable &&
          <div className="palette-element-rotate-btn rotate-ccw noselect"
            onClick={e => { e.stopPropagation(); this.handleRotate("ccw") }}
          >&#8630;</div>
        }
        <div style={style} className='palette-element-grid'>
          <PureCanvas
            contextRef={ctx => this.initContext(ctx)}
            width={width}
            height={height}
          />
        </div>
        {pattern.rotable &&
          <div className="palette-element-rotate-btn rotate-cw noselect"
            onClick={e => { e.stopPropagation(); this.handleRotate("cw") }}
          >&#8631;</div>
        }
      </div>
    </>
  }
}
