import React from 'react'
import './MainMenu.css'
import SaveLifeDlg from './SaveLifeDlg'
import LoadLifeDlg from './LoadLifeDlg'


export default ({gameTitle, handleNewLife, currentFrame, frameContainer, showModal}) => {
  return <>
    <nav className="main-menu">
      <div className="dropdown">
        <button>New Life &#x25BE;</button>
        <ul>
          <li onMouseDown={() => handleNewLife(32, 32, 24)}>32x32</li>
          <li onMouseDown={() => handleNewLife(64, 64, 12)}>64x64</li>
          <li onMouseDown={() => handleNewLife(96, 96, 8)}>96x96</li>
          <li onMouseDown={() => handleNewLife(128, 128, 6)}>128x128</li>
          <li onMouseDown={() => handleNewLife(192, 192, 4)}>192x192</li>
        </ul>
      </div>
      <button
        onClick={
          () => showModal(
            <SaveLifeDlg
              currentFrame={currentFrame}
              frameContainer={frameContainer}
              showModal={showModal}
              gameTitle={gameTitle}
            />)
        }
      >Save Life</button>
      <button
        onClick={() => showModal(<LoadLifeDlg/>)}
      >Load Life</button>
    </nav>
  </>
}
