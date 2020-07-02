import React, { Component } from 'react';

import PureCanvas from './PureCanvas'
import './PaletteElement.css'
import applyLifeRules from '../LifeLogic'

const deepcopy = obj => JSON.parse(JSON.stringify(obj))

export default class PaletteElementOscillator extends Component {
  ctx = null
  updateInterval = 100

  state = {
    pattern: null,
    timeoutID: null,
    isPlaying: false,
  }

  drawPattern = _ => {
    if (!this.ctx) return

    const pattern = this.state.pattern
    const ctx = this.ctx

    const cellSize = this.props.cellSize
    const borderSize = this.props.borderSize
    const fillSize = cellSize - borderSize

    ctx.save()

    for (let column = 0; column < pattern.columns; ++column) {
      for (let row = 0; row < pattern.rows; ++row) {
        const xoffset = column * cellSize + borderSize
        const yoffset = row * cellSize + borderSize
        const dataIdx = row * pattern.columns + column
        const checked = pattern.data[dataIdx]
        ctx.fillStyle = checked ? '#000000' : '#c0c0c0'//'#cfcfff'
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
    }
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

    this.props.updatePattern(newPattern)
  }


  update = () => {
    if (!this.state.isPlaying) {
      return
    }

    const pattern = { ...this.state.pattern }
    pattern.data = applyLifeRules(pattern.data, pattern.columns, pattern.rows, true)

    this.setState({
      pattern,
      timeoutID: setTimeout(this.update, this.updateInterval)
    })
  }

  handleMouseOver = () => {
    clearTimeout(this.state.timeoutID)
    this.setState({
      isPlaying: true,
      timeoutID: setTimeout(this.update, 0)
    })
  }

  handleMouseLeave = () => {
    clearTimeout(this.state.timeoutID)
    this.setState({
      isPlaying: false,
      timeoutID: null,
      pattern: deepcopy(this.props.pattern)
    })
  }

  render() {
    const pattern = this.state.pattern
    if (!pattern) return <></>

    console.assert(pattern.data.length === pattern.columns * pattern.rows)
    const width = pattern.columns * this.props.cellSize
    const height = pattern.rows * this.props.cellSize

    const style = {
      width: width + this.props.borderSize,
      height: height + this.props.borderSize,
    }

    this.drawPattern()

    return <>
      <div
        className={
          this.props.checked
            ? 'palette-element palette-element-checked'
            : 'palette-element'
        }
        onClick={this.props.onClick}
      >
        <div className='palette-element-title'>{pattern.name}</div>
        {pattern.rotable &&
          <div className="palette-element-rotate-btn rotate-ccw"
            onClick={e => { e.stopPropagation(); this.handleRotate("ccw") }}
          >&#8630;</div>
        }
        <div style={style} className='palette-element-grid'
          onMouseOver={this.handleMouseOver}
          onMouseLeave={this.handleMouseLeave}
        >
          <PureCanvas
            contextRef={ctx => this.ctx = ctx}
            width={width}
            height={height}
          />
        </div>
        {pattern.rotable &&
          <div className="palette-element-rotate-btn rotate-cw"
            onClick={e => { e.stopPropagation(); this.handleRotate("cw") }}
          >&#8631;</div>
        }
      </div>
    </>
  }
}
