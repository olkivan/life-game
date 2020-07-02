import React from 'react';
import './Header.css'

import MainMenu from './MainMenu'

export default ({
  gameTitle,
  handleNewLife,
  showModal,
  frameContainer,
  currentFrame
}) =>
  <>
    <div className="header">
      <div className="header-title">{gameTitle}</div>
      <MainMenu
        gameTitle={gameTitle}
        handleNewLife={handleNewLife}
        showModal={showModal}
        frameContainer={frameContainer}
        currentFrame={currentFrame}
      />
    </div>
  </>
