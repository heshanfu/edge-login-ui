import React, { Component } from 'react'
import { connect } from 'react-redux'
import MediaQuery from 'react-responsive'
import Modal from '../BaseModal.js'
import desktopStyles from './Success.webStyle.scss'
import MobileStyles from './Success.mobileStyles'
import desktopIcon from '../../../img/modals/success-W.png'
import mobileIcon from '../../../img/modals/success-MW.png'

class Success extends Component {
  render () {
    return (
      <section>
        <MediaQuery minWidth={720}>
          <Modal
            active={this.props.view}
            close={this.props.close}
            icon={desktopIcon}
          >
            <p className={desktopStyles.header}>{this.props.header}</p>
            <button className={desktopStyles.primary} onClick={this.props.close} autoFocus >Close</button>
          </Modal>
        </MediaQuery>
        <MediaQuery maxWidth={719}>
          <Modal
            active={this.props.view}
            close={this.props.close}
            icon={mobileIcon}
          >
            <p className={MobileStyles.header}>{this.props.header}</p>
            <button className={MobileStyles.close} onClick={this.props.close} autoFocus >Close</button>
          </Modal>
        </MediaQuery>
      </section>

    )
  }
}

export default connect(state => ({
  view: state.modal.success
}))(Success)
