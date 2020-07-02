import React, { Component, Fragment } from 'react'
import './PatternPalette.css'

import InitialPatterns from './Patterns'
import PaletteElementStillLife from './PaletteElementStillLife'
import PaletteElementOscillator from './PaletteElementOscillator'
import PaletteElementSpaceship from './PaletteElementSpaceship'


export default class PatternPalette extends Component {

  constructor() {
    super()

    this.state = {
      patterns: InitialPatterns.map((item, index) =>
        Object.assign(item, { checked: false, index })
      )
    }
  }

  selectPattern = index => {
    this.setState(state => {
      const patterns = [...state.patterns]
      const checkedPattern = patterns.find(item => item.checked === true)
      if (checkedPattern) {
        checkedPattern.checked = false
      }
      const pattern = patterns.find(item => item.index === index)
      if (pattern) {
        pattern.checked = true
        // First pattern (index 0) must be a pointer
        this.props.handlePatternSelect(pattern.index === 0 ? null : pattern)
      }

      return { patterns }
    })
  }

  handleClick = index => {
    this.selectPattern(index)
  }

  handlePatternUpdate = (index, pattern) => {
    this.setState(state => {
      const patterns = [...state.patterns]
      patterns[index] = pattern
      return { patterns }
    })

    if (pattern.checked) {
      this.selectPattern(index)
    }
  }

  renderType = (TagName, patterns, title, id) => {
    const style = {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '240px',
    }

    return <Fragment key={id}>
      <input className='accordion-selector'
        type='radio'
        id={`element-${id}`}
        name='accordion-selector'
        defaultChecked={+id===0}
      />
      <label htmlFor={`element-${id}`}>
        <div className='accordion-element-title'>{title}</div>
        <div className='accordion-element' style={style} id='custom-toolbar'>
          {
            patterns.map(
              item => {
                return <TagName
                  key={item.index}
                  pattern={item}
                  checked={item.checked}
                  cellSize={8}
                  borderSize={1}
                  onClick={() => this.handleClick(item.index)}
                  updatePattern={pattern => this.handlePatternUpdate(item.index, pattern)}
                />
              }
            )
          }
        </div>
      </label>
    </Fragment>
  }

  componentDidMount() {
    this.selectPattern(0)
  }

  render() {
    const patterns = this.state.patterns

    const elementTypes = {
      'stilllife': PaletteElementStillLife,
      'oscillator': PaletteElementOscillator,
      'spaceship': PaletteElementSpaceship
    }

    const allPatternComponents = []

    Object.keys(elementTypes).forEach((type, index) => {
      const typePatterns = patterns.filter(item => item.type === type)

      if (typePatterns.length) {
        const tagName = elementTypes[type]
        const components = this.renderType(tagName, typePatterns, type, index)
        allPatternComponents.push(components)
      }
    })

    return <>
      <div className="accordion" style={{ height: this.props.height - 30 * 3}}>
        {allPatternComponents}
      </div>
    </>
  }
}


