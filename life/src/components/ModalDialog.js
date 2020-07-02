import React, { useState, useEffect, useRef } from 'react';

import './ModalDialog.css'

export default props => {

  const [btnHandler, setBtnHandler] = useState({})
  const [dlgTitle, setDlgTitle] = useState('')

  const [childElement, setChildElement] = useState(
    React.cloneElement(
      props.children,
      { setBtnHandler, setDlgTitle  }
    )
  )

  useEffect(() => {
    setBtnHandler({})

    setChildElement(
      React.cloneElement(
        props.children,
        { setBtnHandler, setDlgTitle }
      )
    )
  }, [props.children])

  const handleBtnOK = async e => {
    // Child has OK btn handler?
    if (btnHandler.onOK) {
      // Call it first and if success propagate to parent
      const okHandled = await btnHandler.onOK(e)
      okHandled && props.handleDlgOK(e)
    } else { // Otherwise let parent handle the event
      props.handleDlgOK(e)
    }
  }

  const handleBtnCancel = async e => {
    if (btnHandler.onCancel) {
      const cancelHandled = await btnHandler.onCancel(e)
      cancelHandled && props.handleDlgCancel(e)
    } else {
      props.handleDlgCancel(e)
    }
  }

  const handleModalDialogKey = async e => {
    switch (e.key) {
      case 'Enter':
        await handleBtnOK(e)
        break
      case 'Escape':
        await handleBtnCancel(e)
        break
      default:
    }
  }

  const dlgRef = useRef(null)

  useEffect(() => {
    dlgRef.current && dlgRef.current.focus()
  },[dlgRef])

  return <>
    <div className="modal-dialog-shade"></div>
    <div className="modal-dialog" ref={dlgRef} tabIndex="0" onKeyDown={handleModalDialogKey}>
      <div className="modal-dialog-title">{dlgTitle}</div>
      {
        btnHandler.onCancel &&
        <div className="modal-dialog-close-button noselect" onClick={handleBtnCancel}>+</div>
      }
      <div className="modal-dialog-content">
        {childElement}
      </div>
      <div className="modal-dialog-button-area">
        {
          // render button only if child provides an appropriate handler
          btnHandler.onOK &&
          <div className="modal-dialog-button noselect" onClick={handleBtnOK}>OK</div>
        }
        {
          btnHandler.onCancel &&
          <div className="modal-dialog-button noselect" onClick={handleBtnCancel}>cancel</div>
        }
      </div>
    </div>
  </>
}
