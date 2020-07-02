import React, { Component } from 'react';
import LifeArea from './components/LifeArea'
import applyLifeRules from './LifeLogic'
import ControlPanel from './components/ControlPanel';
import FrameContainer from './FrameContainer';
import PatternPalette from './components/PatternPalette'
import Header from './components/Header';
import Footer from './components/Footer';
import ModalDialog from './components/ModalDialog';

import RemoteStorageProvider from './Storage'
import LoadProgressDlg from './components/LoadProgressDlg';

const loopDetectionFrameMax = 1000

function AppState(rows, columns, cellSize, initialFrame) {
  return {
    rows,
    columns,
    cellSize,

    activeFrame: {
      src: initialFrame.src,
      data: initialFrame.data,
    },

    isPlaying: false,
    isProfiling: false,

    timerID: null,

    frames: (() => {
      const fc = new FrameContainer(columns, rows, loopDetectionFrameMax);
      fc.push(initialFrame.data)
      return fc
    })(),

    currentFrame: 0,

    gameid: undefined,
    gameTitle: 'Untitled Life',

    pressedKey: null,
    wrapField: true,
    cursorPattern: null,
    playbackSpeed: 'speed-normal',
    modalDlg: null
  }
}

const playbackDelayOptions = {
  'speed-slowest': 1000 / 4,
  'speed-slow': 1000 / 8,
  'speed-normal': 1000 / 16,
  'speed-fast': 1000 / 32,
  'speed-fastest': 0
}


class App extends Component {
  columns = 32
  rows = 32
  cellSize = 24
  borderSize = 1

  initialFrame = {
    src: 'initial',
    data: Array(this.rows * this.columns).fill(false),
  }

  constructor(props) {
    super(props)

    this.state = new AppState(this.rows, this.columns, this.cellSize, this.initialFrame)

    if (this.state.isProfiling) {
      for (let x = 1; x < this.columns - 1; ++x) {
        for (let y = 1; y < this.rows - 1; y += 5) {
          const idx = y * this.columns + x
          this.initialFrame.data[idx] = true
        }
      }
    }
  }

  buttonStyle = {
    fontSize: '1.5em',
    padding: '0 0.5em',
    marginTop: '.5em',
  }

  loadGame = gameid => {
    (async () => {
      const life = await RemoteStorageProvider.get(gameid)
      if (!life) {
        this.setState({ gameid: null })
        return
      }

      this.showModal(<LoadProgressDlg
        life={life}
        onLoad={restoredLife => {
          this.closeModal()
          this.resetLife(life.rows, life.columns, 0, restoredLife, gameid, life.title)
        }}
      />)
    })()
  }

  componentDidMount(prevProps) {
    if (this.state.isProfiling) {
      this.setState({ playbackSpeed: 'speed-fastest', startProfilingTime: new Date() })
      requestAnimationFrame(this.playData)
    }

    const prevGameid = (prevProps && prevProps.match)
      ? prevProps.match.params.gameid
      : undefined

    const { gameid } = this.props.match.params
    if ((prevGameid !== gameid) && (gameid !== this.state.gameid)) {
      this.loadGame(gameid)
    }
  }

  componentDidUpdate(prevProps) {
    const prevGameid = (prevProps && prevProps.match)
      ? prevProps.match.params.gameid
      : undefined

    const { gameid } = this.props.match.params
    if ((prevGameid !== gameid) && (gameid !== this.state.gameid)) {
      this.loadGame(gameid)
    }
  }

  playData = () => {
    const atLastFrame =
      this.state.currentFrame === this.state.frames.length - 1

    if (atLastFrame) {
      this.generateData()
    } else {
      this.gotoFrame(this.state.currentFrame + 1)
    }

    const perfTestCount = 330

    const doProfile = this.state.isProfiling && (this.state.frames.length < perfTestCount)

    if (this.state.isProfiling && this.state.frames.length >= perfTestCount) {
      const elapsed = (new Date() - this.state.startProfilingTime) / 1000
      console.log(`Processed ${perfTestCount} frames in ${elapsed} seconds`);
    }

    if (this.state.isPlaying || doProfile) {
      if (this.state.playbackSpeed === 'speed-fastest') {
        requestAnimationFrame(this.playData)
      } else {
        const frameDelay = playbackDelayOptions[this.state.playbackSpeed];
        this.setState({ timerID: setTimeout(this.playData, frameDelay) })
      }
    } else {
      this.setState({ timerID: null })
    }
  }

  generateData = () => {
    this.setState({
      activeFrame: {
        src: 'timer',
        data: applyLifeRules(
          this.state.activeFrame.data,
          this.state.columns,
          this.state.rows,
          this.state.wrapField
        )
      }
    })
  }

  gotoFrame = index => {
    const [meta, data] = this.state.frames.getFrame(index)

    if (!data) return

    this.handleDataUpdate({ src: 'cursor', data, index, meta })
  }

  handleDataUpdate = frame => {
    const isNewFrame = frame.src === 'timer'

    let frames = this.state.frames
    switch (frame.src) {
      case 'timer':
        if (this.debugging) {
          debugger
        }

        const loopedFrameIdx = frames.push(frame.data)
        if (loopedFrameIdx !== undefined) {
          clearTimeout(this.state.timerID)
          this.setState({ isPlaying: false, timerID: null })
          console.log('Loop detected at frame with index:', loopedFrameIdx);
        }
        break
      case 'cursor':
        if (frame.meta && (frame.meta.loopFrame !== undefined)) {
          clearTimeout(this.state.timerID)
          this.setState({ isPlaying: false, timerID: null })
          console.log('Loop detected at frame with index:', frame.meta.loopFrame);
        }
        break
      default:
        frames.dropTail()
        frames.push(frame.data)
    }


    this.setState(state => {
      const currentFrame = frame.index !== undefined
        ? frame.index
        : state.currentFrame + +isNewFrame

      return {
        frames,
        activeFrame: frame,
        currentFrame
      }
    })
  }

  showModal = (content, handlers) => {
    this.doPause()
    this.setState({ modalDlg: { content, handlers } })
  }

  closeModal = () => {
    this.setState({ modalDlg: null })
  }


  // Set of do* UI command handlers
  doPlay = () => {
    this.setState({
      isPlaying: true,
      timerID: setTimeout(this.playData, 0)
    })
  }

  doPause = () => {
    clearTimeout(this.state.timerID)
    this.setState({ isPlaying: false, timerID: null })
  }

  doGotoFirstFrame = () => {
    this.gotoFrame(0)
  }

  doGotoLastFrame = () => {
    this.gotoFrame(this.state.frames.length - 1)
  }

  doGotoPrevFrame = () => {
    const atFirstFrame =
      this.state.currentFrame === 0

    if (!atFirstFrame) {
      this.gotoFrame(this.state.currentFrame - 1)
    }
  }

  doGotoNextFrame = () => {
    const atLastFrame =
      this.state.currentFrame === this.state.frames.length - 1

    if (!atLastFrame) {
      this.gotoFrame(this.state.currentFrame + 1)
    }
  }


  dispatchControlBtn = (e) => {
    const handlers = {
      'play': this.doPlay,
      'pause': this.doPause,
      'first': this.doGotoFirstFrame,
      'last': this.doGotoLastFrame,
      'prev': this.doGotoPrevFrame,
      'next': this.doGotoNextFrame
    }

    const { name } = e.target ? e.target : e
    if (name in handlers) {
      handlers[name]()
    }
  }

  btnHandler = {
    repeatInterval: 50,

    timerid: null,
    dispatcher: this.dispatchControlBtn,
    setState: this.setState.bind(this),
    btnUpHandler: null,

    onBtnDown: function (e) {
      const { name } = e.target ? e.target : e

      const initialKeyDelay = 250
      const isInitialKeypress = !this.timerid
      const interval = isInitialKeypress ? initialKeyDelay : this.repeatInterval


      this.timerid =
        setTimeout(() => { this.onBtnDown({ name }) }, interval)

      this.setState({ pressedKey: name })
      this.dispatcher({ name })

      if (!this.btnUpHandler) {
        this.btnUpHandler = this.onBtnUp.bind(this)
        document.addEventListener('mouseup', this.btnUpHandler)
      }
    },

    onBtnUp: function (e) {
      clearTimeout(this.timerid)
      this.timerid = null

      document.removeEventListener('mouseup', this.btnUpHandler)
      this.btnUpHandler = null

      this.setState({ pressedKey: null })
    }
  }


  resetLife = (rows, columns, cellSize, frameContainer, gameid, gameTitle) => {
    function heuristicCellSize(maxDimension) {
      if (maxDimension <= 32) return 24
      if (maxDimension <= 64) return 12
      if (maxDimension <= 96) return 8
      if (maxDimension <= 128) return 6
      if (maxDimension <= 192) return 4
      return 2
    }

    cellSize = cellSize || heuristicCellSize(Math.max(columns, rows))

    this.initialFrame = {
      src: 'initial',
      data: frameContainer
        ? frameContainer.getFrame(0)[1]
        : Array(rows * columns).fill(false),
    }

    const newState = new AppState(rows, columns, cellSize, this.initialFrame)
    newState.cursorPattern = this.state.cursorPattern
    newState.frames = frameContainer || newState.frames
    newState.gameid = gameid
    newState.gameTitle = gameTitle || newState.gameTitle

    this.setState(newState)
  }


  render() {
    const mainAreaStyle = {
      display: 'flex',
      justifyContent: 'flex-start',
      background: '#c0c0c0',
      paddingLeft: '30px',
    }

    return this.state.gameid === null ? 'Not Found' : <>
      {
        (this.state.modalDlg && this.state.modalDlg.content) && <>
          <ModalDialog
            handleDlgCancel={this.closeModal}
            handleDlgOK={this.closeModal}
          >{this.state.modalDlg.content}</ModalDialog>
        </>
      }
      <Header
        gameTitle={this.state.gameTitle}
        handleNewLife={
          (rows, columns, cellSize) => {
            this.props.history.push('/life-game')
            this.resetLife(rows, columns, cellSize)
          }
        }
        showModal={this.showModal}
        frameContainer={this.state.frames}
        currentFrame={this.state.currentFrame + 1}
      />
      <div style={mainAreaStyle}>
        <LifeArea
          rows={this.state.rows}
          columns={this.state.columns}
          cellSize={this.state.cellSize}
          borderSize={this.borderSize}
          activeFrame={this.state.activeFrame}
          cursorPattern={this.state.cursorPattern}
          handleDataUpdate={this.handleDataUpdate}
        />
        <ControlPanel
          isPlaying={this.state.isPlaying}
          currentFrame={this.state.currentFrame + 1}
          frameCount={this.state.frames.length}
          handleBtn={this.dispatchControlBtn}
          handleBtnDown={this.btnHandler.onBtnDown.bind(this.btnHandler)}
          gotoFrame={frameidx => { this.gotoFrame(frameidx - 1) }}
          active={this.state.pressedKey}
          playbackSpeed={this.state.playbackSpeed}
          handleSpeedSelect={speed => this.setState({ playbackSpeed: speed })}
        />

        <PatternPalette
          handlePatternSelect={cursorPattern => { this.setState({ cursorPattern }) }}
          height={this.state.cellSize * this.state.rows}
        />
      </div>
      <Footer />
    </>
  }
}

export default App;
