import React, { useState, useEffect, useRef } from 'react'
import './DropdownEditbox.css'

const maxDroplistItems = 5
const minDroplistActivationTextLength = 3

export default props => {
  const [text, setText] = useState(props.value || '')

  useEffect(() => { props.onChange && (props.value !== text) && props.onChange(text) })

  const showDroplist =
    text && text.length >= minDroplistActivationTextLength &&
    props.items && !!props.items.length

  let similarItems = []

  if (showDroplist) {
    similarItems = props.items.filter(item => {
      const itemText = item.toUpperCase()
      const normalizedText = text.toUpperCase()
      return itemText.search(normalizedText) !== -1 &&
        itemText !== normalizedText
    })
  }

  similarItems.sort((a, b) => {
    const aIndex = a.toUpperCase().search(text.toUpperCase())
    const bIndex = b.toUpperCase().search(text.toUpperCase())
    return aIndex - bIndex
  })

  if (similarItems.length > maxDroplistItems) {
    similarItems.length = maxDroplistItems
  }

  const [selected, setSelected] = useState(0)

  function chooseItem(selected) {
    setText(similarItems[selected])
    setSelected(0)
    similarItems = []
  }

  function handleKeyEvent(e) {
    switch (e.key) {
      case "ArrowDown":
        if (similarItems.length) {
          e.preventDefault()
        }
        if (selected < similarItems.length) {
          setSelected(selected + 1)
        }
        break
      case "ArrowUp":
        if (similarItems.length) {
          e.preventDefault()
        }
        if (selected > 0) {
          setSelected(selected - 1)
        }
        break
      case "Enter":
        if (selected > 0) {
          chooseItem(selected - 1)
        }
        break
      case "Escape":
        if (!selected) {
          setText('')
        }
        setSelected(0)
        break
      default:
        setSelected(0)
    }
  }

  const editBoxRef = useRef(null)
  const {setEditBoxRef} = props;
  useEffect(() => {
    setEditBoxRef && setEditBoxRef(editBoxRef.current)
  }, [setEditBoxRef, editBoxRef]);

  if (editBoxRef.current && !props.valid) {
    editBoxRef.current.focus();
  }


  return <>
    <div className="dropdown-editbox">
      <input type="text"
        onChange={e => setText(e.target.value)}
        value={text}
        onKeyDown={handleKeyEvent}
        className={props.valid ? '' : 'invalid'}
        ref={editBoxRef}
      />

      {
        !!similarItems.length && <>
          <div className="dropdown-editbox-list">
            {
              similarItems.map((value, index) => {
                const textpos = value.toUpperCase().search(text.toUpperCase())
                const left = value.slice(0, textpos)
                const highlight = value.slice(textpos, textpos + text.length);
                const right = value.slice(textpos + text.length, value.length)

                return <div
                  className={(selected === index + 1)
                    ? "dropdown-editbox-list-item dropdown-editbox-selected"
                    : "dropdown-editbox-list-item"}
                  key={value}
                  onClick={() => chooseItem(index) }
                >{left}<span>{highlight}</span>{right}</div>
              })
            }
          </div>
        </>
      }
    </div>
  </>
}
