import React, { Component } from 'react';

export default class PureCanvas extends Component {
  shouldComponentUpdate(nextProps) {
    return this.props.width !== nextProps.width ||
            this.props.height !== nextProps.height
  }

  render() {
    return (
      <canvas
        ref={
          node => node
            ? this.props.contextRef(node.getContext('2d'))
            : null
        }
        width={this.props.width}
        height={this.props.height}
      />
    );
  }
}
