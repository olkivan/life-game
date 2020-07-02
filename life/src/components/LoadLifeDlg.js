import React, { useState, useEffect } from 'react'
import './LoadLifeDlg.css'
import PureCanvas from './PureCanvas'
import RemoteStorageProvider, { keyFrameToBoolArray } from './../Storage'

import { useHistory } from "react-router-dom";


const ItemRow = ({ onClick, title, columns, rows, selected }) => {
  const textContent = `${title} [${columns}x${rows}]`
  const className = selected
    ? 'load-life-dlg-list-item selected noselect'
    : 'load-life-dlg-list-item noselect'

  return <div className={className} onClick={onClick}>{textContent}</div>
}

const LifePreview = ({ columns, rows, frames }) => {
  const cellSize = 384 / columns
  const width = 384
  const height = 384

  const data = keyFrameToBoolArray(frames[0].data, columns, rows)

  const [ctx, setContext] = useState(null)

  const drawPattern = () => {
    if (!ctx) return

    const borderSize = (cellSize > 2) ? 1 : 0
    const fillSize = cellSize - borderSize

    ctx.save()
    ctx.clearRect(0, 0, ctx.canvas.clientWidth, ctx.canvas.clientHeight)

    let checked = false

    for (let column = 0; column < columns; ++column) {
      for (let row = 0; row < rows; ++row) {
        const xoffset = column * cellSize + borderSize
        const yoffset = row * cellSize + borderSize
        const dataIdx = row * columns + column
        checked = data[dataIdx]
        ctx.fillStyle = checked ? '#ffffff' : '#808080'
        ctx.fillRect(xoffset, yoffset, fillSize, fillSize)
      }
    }

    ctx.restore()
  }

  useEffect(drawPattern, [ctx, frames]);

  return <>
    <div style={{ width: width + 1, height: height + 1, backgroundColor: 'black' }}>
      <PureCanvas
        contextRef={ctx => setContext(ctx)}
        width={width}
        height={height}
      />
    </div>
  </>
}

export default ({ setBtnHandler, setDlgTitle }) => {
  const [itemList, setItemList] = useState(null)
  const [selected, setSelected] = useState(null)
  const [selectedLife, setSelectedLife] = useState(null)

  useEffect(() => {
    async function fetchData() {
      const itemList = await RemoteStorageProvider.list()
      setItemList(itemList)
      if (itemList && itemList.length) {
        setSelected(0)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (selected === null) return
    async function fetchData() {
      const itemID = itemList[selected]._id
      const selectedLife = await RemoteStorageProvider.get(itemID)
      setSelectedLife(selectedLife)
    }
    fetchData()
  }, [selected, itemList])


  const history = useHistory();

  useEffect(() => {
    setBtnHandler({
      onOK: () => {
        history.push(`/life-game/game/${selectedLife._id}`)
        return true
      },
      onCancel: _ => true
    })
  })

  useEffect(() => {
    if (selectedLife) {
      const { title, totalFrames } = selectedLife
      const suffix = totalFrames > 1 ? 'frames' : 'frame'
      setDlgTitle(title + ` (${totalFrames} ${suffix})`)
    }
  }, [selectedLife, setDlgTitle])


  return <>
    <div className="load-life-dlg">
      <div className="load-life-dlg-preview">
        {selectedLife && <LifePreview
          columns={selectedLife.columns}
          rows={selectedLife.rows}
          frames={selectedLife.frames}
        />}
        {
          selectedLife && <>
            <div className="load-life-dlg-preview-info">
              <div className="load-life-dlg-description">{selectedLife.description}</div>
            </div>
          </>
        }
      </div>
      <div className="load-life-dlg-list" id='load-life-dlg-list-toolbar'>
        {
          itemList ? itemList.map((item, index) => {
            return <ItemRow
              key={index}
              title={item.title}
              columns={item.columns}
              rows={item.rows}
              selected={index === selected}
              onClick={() => setSelected(index)}
            />
          })
            : (itemList === null ? 'Loading...' : 'Unable to load data')
        }
      </div>
    </div>
  </>
}
