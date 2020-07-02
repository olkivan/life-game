import React, { useState, useEffect } from 'react';
import './SaveLifeDlg.css'
import DropdownEditbox from './DropdownEditbox';
import SaveProgressDlg from './SaveProgressDlg';
import RemoteStorageProvider from './../Storage'


export default ({ gameTitle, frameContainer, currentFrame, setBtnHandler, showModal }) => {
  const [fromFrame, setFrom] = useState(1)
  const [toFrame, setTo] = useState(frameContainer.length)

  function handleFrom(e) {
    e.stopPropagation()
    const newFrom = +e.target.value
    if (newFrom > 0 && newFrom <= toFrame) {
      setFrom(newFrom)
    }
  }

  function handleTo(e) {
    e.stopPropagation()
    const newTo = +e.target.value
    if (newTo > 0 && newTo <= frameContainer.length) {
      setTo(newTo)
    }
  }

  const [title, setTitle] = useState(gameTitle || '')
  const [range, setRange] = useState('option-frame-current')
  const [description, setDescription] = useState('')
  const [invalidField, setInvalidField] = useState({ field: '', message: '' })
  const [itemList, setItemList] = useState([])

  const titleList = itemList.map(item => item.title)

  useEffect(() => {
    (async function() {
      const itemList = await RemoteStorageProvider.list()
      itemList && setItemList(itemList)
    })()
  }, [])

  useEffect(() => {
    setBtnHandler({
      onOK: async () => {
        return new Promise(resolve => {
          if (!title) {
            setInvalidField({ field: 'title', message: `Title shouldn't be empty` })
            resolve(false);
          }

          let itemId = null
          const normalizedTitle = title.toLowerCase().trim()
          const normalizedTitleList = titleList.map(item => item.toLowerCase())

          if (normalizedTitleList.includes(normalizedTitle)) {
            const result = window.confirm('A life with such title already exists, overwrite?')
            if (!result) {
              setInvalidField({ field: 'title', message: `Please provide another title` })
              resolve(false)
            }

            const existItem = itemList.find(item => item.title.toLowerCase().trim() === normalizedTitle)

            itemId = existItem && existItem._id
          }

          const from = range === 'option-frame-current' ? currentFrame : +fromFrame
          const to = range === 'option-frame-current' ? currentFrame : +toFrame

           showModal(<SaveProgressDlg
            lifeData={{
              frameContainer,
              from,
              to,
              title,
              description,
              itemId
            }}
            onSave={() => { resolve(true) }}
          />)
        })
      },
      onCancel: () => true
    })
  })

  const [editBoxRef, setEditBoxRef] = useState(null)
  useEffect(() => {
    editBoxRef && editBoxRef.focus()
  }, [editBoxRef])


  return <>
    <div className="safe-life-dlg">
      <div className="title-row">
        <label className="life-name-label">Name:</label>
        <div style={{ flex: '1', position: 'relative', backgroundColor: '#c0c0f0' }}>
          {
            invalidField && invalidField.field === 'title' &&
            <div className="dropdown-invalid-tooltip">{invalidField.message}</div>
          }
          <DropdownEditbox
            items={titleList}
            valid={!(invalidField && invalidField.field === 'title')}
            value={title}
            setEditBoxRef={setEditBoxRef}
            onChange={title => {
              setTitle(title)
              setInvalidField(null)
            }}
          />
        </div>
      </div>
      <div className="frame-range">
        <div className="frame-current-frame-option">
          <input type="radio"
            id="option-frame-current"
            name="frame-range-selector"
            defaultChecked={range === 'option-frame-current'}
            onChange={e => setRange(e.target.id)} />
          <label htmlFor="option-frame-current">Current frame #{currentFrame}</label>
        </div>
        <div className="frame-range-row">
          <div className="frame-range-row-option">
            <input type="radio"
              id="option-frame-range"
              name="frame-range-selector"
              defaultChecked={range === 'option-frame-range'}
              onChange={e => setRange(e.target.id)} />
            <label htmlFor="option-frame-range">Frame range</label>
          </div>
          <div className="frame-range-row-range">
            <label>from:</label>
            <input type="number" value={fromFrame} onChange={handleFrom}
              disabled={range !== 'option-frame-range'}
            ></input>
            <label>to:</label>
            <input type="number" value={toFrame} onChange={handleTo}
              disabled={range !== 'option-frame-range'}
            ></input>
          </div>
        </div>
      </div>
      <div className="commentary-block">
        <fieldset>
          <legend>Description (optional)</legend>
          <div className="commentary-block-textarea">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
          </div>
        </fieldset>
      </div>
    </div>
  </>
}
