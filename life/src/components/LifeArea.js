import React, { Component } from 'react';
import PureCanvas from './PureCanvas';

const borderColor = [0x40, 0x40, 0x40]
const aliveColor  = [0xff, 0xff, 0xff]
const deadColor   = [0x60, 0x60, 0x60]
const cursorColor = [0xff, 0xff, 0xff]


function areArraysEqual(arr1, arr2) {
  if (arr1.length === arr2.length) {
    for (let i = 0; i < arr1.length; ++i) {
      if (arr1[i] !== arr2[i]) {
        return false
      }
    }
    return true
  }
  return false
}

export default class LifeArea extends Component {
  state = {
    cursor: null,
    activeFrame: this.props.activeFrame,
    lbuttonDown: false,
    drawState: true,
    bgPixels: null,
  }

  areaRef = React.createRef()

  setupBackgroundImage = () => {
    const { columns, rows, cellSize } = this.props
    const width = columns * cellSize
    const height = rows * cellSize

    const bgPixels = new Uint8ClampedArray(width * height * 4)

    const bs = this.props.borderSize
    const rectSize = cellSize - bs
    const pixels = bgPixels
    for (let x = 0; x < width; x += cellSize) {
      for (let y = 0; y < height; y += cellSize) {
        for (let rx = 0; rx < rectSize; ++rx) {
          for (let ry = 0; ry < rectSize; ++ry) {
            const offset = ((y + ry + bs) * width + x + rx + bs) * 4
            pixels[offset + 0] = deadColor[0]
            pixels[offset + 1] = deadColor[1]
            pixels[offset + 2] = deadColor[2]
            pixels[offset + 3] = 0xff
          }
        }
      }
    }

    this.setState({ bgPixels })
  }

  componentDidMount() {
    this.setupBackgroundImage()

    document.addEventListener('mouseup', this.handleMouseUp)
    document.addEventListener('mousemove', this.handleMouseMove)
  }

  componentWillUnmount() {
    document.removeEventListener('mousemove', this.handleMouseMove)
    document.removeEventListener('mouseup', this.handleMouseUp)
  }

  syncView = (prevData, data) => {
    if (!this.ctx) return

    const ctx = this.ctx

    ctx.save()

    const { columns, rows, cellSize } = this.props
    const width = columns * cellSize
    const height = rows * cellSize

    const pixels = this.state.bgPixels.slice(0)

    const totalColumns = this.props.columns
    const bs = this.props.borderSize
    const rectSize = cellSize - bs

    let hasAnythingChanged = false

    for (let x = 0, column = 0; x < width; x += cellSize, ++column) {
      for (let y = 0, row = 0; y < height; y += cellSize, ++row) {
        const cellIdx = totalColumns * row + column

        hasAnythingChanged = hasAnythingChanged || prevData[cellIdx] !== data[cellIdx]

        const checked = data[cellIdx]
        if (!checked)
          continue

        for (let rx = 0; rx < rectSize; ++rx) {
          for (let ry = 0; ry < rectSize; ++ry) {
            const offset = ((y + ry + bs) * width + x + rx + bs) * 4
            pixels[offset + 0] = aliveColor[0]
            pixels[offset + 1] = aliveColor[1]
            pixels[offset + 2] = aliveColor[2]
            pixels[offset + 3] = 0xff
          }
        }
      }
    }

    const img = new ImageData(pixels, width, height)
    ctx.putImageData(img, 0, 0)

    return hasAnythingChanged
  }

  drawCursor = (prevCursorPos, currentCursorPos) => {
    return this.props.cursorPattern
      ? this.drawCursorPattern(prevCursorPos, currentCursorPos)
      : this.drawCursorPointer(prevCursorPos, currentCursorPos)
  }

  drawCursorPointer = (prevCursorPos, currentCursorPos) => {
    const ctx = this.ctx

    ctx.save()

    const { cellSize } = this.props
    const { row: prevRow, column: prevColumn } = prevCursorPos || {}
    const { row, column } = currentCursorPos || {}

    if (row !== undefined && column !== undefined) {
      const x = column * this.props.cellSize
      const y = row * this.props.cellSize

      ctx.fillStyle = `rgb(${cursorColor})`
      const borderSize = this.props.borderSize
      ctx.fillRect(x + borderSize, y + borderSize, cellSize - borderSize, cellSize - borderSize)
    }


    if (prevRow !== undefined && prevColumn !== undefined &&
      (prevRow >= 0 && prevRow < this.props.rows) &&
      (prevColumn >= 0 && prevColumn < this.props.columns) &&
      (prevRow !== row || prevColumn !== column)) {

      const x = prevColumn * cellSize
      const y = prevRow * cellSize

      const cellIdx = prevRow * this.props.columns + prevColumn

      const data = this.state.activeFrame.data
      const checked = data && data[cellIdx]
      ctx.fillStyle = checked ? `rgb(${aliveColor})` : `rgb(${deadColor})`
      const borderSize = this.props.borderSize
      ctx.fillRect(x + borderSize, y + borderSize, cellSize - borderSize, cellSize - borderSize)
    }

    ctx.restore()
  }

  restoreAreaUnderCursor = cursorPos => {
    if (!cursorPos) return
    if (!this.ctx) return

    const ctx = this.ctx
    ctx.save()

    const { cellSize, borderSize } = this.props
    const { row, column } = cursorPos

    const pattern = this.props.cursorPattern

    const data = this.state.activeFrame.data
    for (let c = 0; c < + pattern.columns; ++c) {
      for (let r = 0; r < pattern.rows; ++r) {
        const areaRow = r + row - ~~(pattern.rows / 2)
        const areaColumn = c + column - ~~(pattern.columns / 2)

        if (areaRow >= this.props.rows || areaColumn >= this.props.columns)
          continue

        const x = areaColumn * cellSize + borderSize
        const y = areaRow * cellSize + borderSize
        const w = cellSize - borderSize
        const h = w

        const cellIdx = areaRow * this.props.columns + areaColumn
        const checked = data && data[cellIdx]

        ctx.fillStyle = checked ? `rgb(${aliveColor})` : `rgb(${deadColor})`

        ctx.fillRect(x, y, w, h)
      }
    }

    ctx.restore()
  }

  drawCursorOnArea = cursorPos => {
    if (!cursorPos) return
    if (!this.ctx) return

    const { cellSize, borderSize, rows, columns } = this.props
    const { row, column } = cursorPos

    if (row < 0 || row >= rows || column < 0 || column >= columns)
      return;

    const ctx = this.ctx
    const pattern = this.props.cursorPattern

    ctx.save()
    ctx.fillStyle = `rgb(${cursorColor})`

    for (let c = 0; c < + pattern.columns; ++c) {
      for (let r = 0; r < pattern.rows; ++r) {
        let cellColumn = c + column - ~~(pattern.columns / 2)
        let cellRow = r + row - ~~(pattern.rows / 2)
        const x = cellColumn * cellSize + borderSize
        const y = cellRow * cellSize + borderSize
        const w = cellSize - borderSize
        const h = w

        const dataIdx = r * pattern.columns + c
        if (pattern.data[dataIdx]) {
          ctx.fillRect(x, y, w, h)
        }
      }
    }

    ctx.restore()
  }

  drawCursorPattern = (prevCursorPos, currentCursorPos) => {
    this.restoreAreaUnderCursor(prevCursorPos)
    this.drawCursorOnArea(currentCursorPos)
  }

  putPattern = (row, column, pattern, data) => {
    const totalColumns = this.props.columns
    const totalRows = this.props.rows

    for (let r = 0; r < pattern.rows; ++r) {
      for (let c = 0; c < pattern.columns; ++c) {
        const cellRow = row + r - ~~(pattern.rows / 2)
        const cellColumn = column + c - ~~(pattern.columns / 2)

        if (cellRow < 0 || cellRow >= totalRows ||
            cellColumn < 0 || cellColumn >= totalColumns)
          continue

        const checked = pattern.data[r * pattern.columns + c]
        if (checked) {
          data[cellRow * totalRows + cellColumn] = !!checked
        }
      }
    }
  }

  componentDidUpdate(prevProps, prevState) {

    if (this.props.columns !== prevProps.columns
        || this.props.rows !== prevProps.rows
        || this.props.cellSize !== prevProps.cellSize) {
      this.setupBackgroundImage()
    }
    // Got new data from props, just update state and return
    if (!areArraysEqual(prevProps.activeFrame.data, this.props.activeFrame.data)) {

      this.setState({
        activeFrame: {
          src: this.props.activeFrame.src,
          data: [...this.props.activeFrame.data]
        }
      })
      return;
    }

    let dirty = false

    if (prevState.activeFrame.data !== this.state.activeFrame.data
          || prevState.bgPixels !== this.state.bgPixels )
    {
      dirty = this.syncView(prevState.activeFrame.data,
        this.state.activeFrame.data)
    }

    this.drawCursor(prevState.cursor, this.state.cursor)

    if (dirty && this.props.handleDataUpdate && this.state.activeFrame.src !== 'initial') {
      this.props.handleDataUpdate({
        src: this.state.activeFrame.src,
        data: [...this.state.activeFrame.data],
        index: this.state.activeFrame.index
      })
    }
  }

  handleMouseDown = e => {
    if (e.button !== 0) return; // handle only main (left) button

    const { clientX: x, clientY: y } = e
    const bbox = this.areaRef.current.getBoundingClientRect();

    const offset = this.props.borderSize * 2
    const column = Math.floor((x - bbox.x - offset) / this.props.cellSize)
    const row = Math.floor((y - bbox.y - offset) / this.props.cellSize)

    const hitArea = row >= 0 && row < this.props.rows &&
      column >= 0 && column < this.props.columns

    if (!hitArea) return

    const cellIdx = this.props.columns * row + column

    const pattern = this.props.cursorPattern
      ? { ...this.props.cursorPattern }
      : null

    const data = [...this.state.activeFrame.data]

    const activeFrame = { src: 'mouse', data }

    let newState = { }

    if (pattern) {
      this.putPattern(row, column, pattern, data)
      newState = { activeFrame }
    } else {
      data[cellIdx] = !data[cellIdx]
      newState = { activeFrame, lbuttonDown: true, drawState: data[cellIdx] }
    }

    this.setState(newState)
  }

  handleMouseUp = e => {
    if (e.button !== 0) return; // handle only main (left) button

    this.setState({ lbuttonDown: false })
  }

  drawLine = (oldPos, newPos) => {
    let { row: y0, column: x0 } = oldPos
    let { row: y1, column: x1 } = newPos

    let dx = Math.abs(x1 - x0);
    let dy = Math.abs(y1 - y0);
    let sx = (x0 < x1) ? 1 : -1;
    let sy = (y0 < y1) ? 1 : -1;
    var err = dx - dy;

    let newPoints = []
    while (true) {
      newPoints.push({ column: x0, row: y0 })

      if ((x0 === x1) && (y0 === y1)) break;
      var e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x0 += sx; }
      if (e2 < dx) { err += dx; y0 += sy; }
    }

    return newPoints
  }

  handleMouseMove = e => {
    const { clientX: x, clientY: y } = e
    const bbox = this.areaRef.current.getBoundingClientRect();

    const offset = this.props.borderSize * 2
    const column = Math.floor((x - bbox.x - offset) / this.props.cellSize)
    const row = Math.floor((y - bbox.y - offset) / this.props.cellSize)

    const otherCellUnderCursor =
      this.state.cursor &&
      (this.state.cursor.row !== row || this.state.cursor.column !== column)

    if (this.state.lbuttonDown && otherCellUnderCursor) {
      const pointList = this.drawLine(this.state.cursor, { row, column })
        .filter(({ column, row }) =>
          column >= 0 &&
          row >= 0 &&
          column < this.props.columns &&
          row < this.props.rows)

      this.setState(state => {
        const data = [...state.activeFrame.data]
        const drawState = state.drawState

        for (const point of pointList) {
          const { row, column } = point
          const cellIdx = this.props.columns * row + column

          data[cellIdx] = drawState
        }

        return { activeFrame: { src: 'mouse', data } }
      })
    }

    this.setState({ cursor: { row, column } })
  }

  render() {
    const width = this.props.columns * this.props.cellSize
    const height = this.props.rows * this.props.cellSize

    const style = {
      backgroundColor: `rgb(${borderColor})`,
      width: `${width}px`,
      height: `${height}px`,
      margin: 0,
      padding: 0,
      cursor: 'none',
      textAlign: 'center'
    }

    return (
      <div
        className="noselect"
        onMouseDown={this.handleMouseDown}
        onMouseUp={this.handleMouseUp}
        style={style}
        ref={this.areaRef}
      >
        <PureCanvas
          contextRef={ctx => this.ctx = ctx}
          width={width}
          height={height}
        />
      </div>
    )
  }
}
