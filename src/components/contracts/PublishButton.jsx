import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ReactTooltip from 'react-tooltip'
import Switch from 'react-bulma-switch'

import { withCurrentUser } from '~/components/withCurrentUser'

export const PublishButton = withCurrentUser(
  class _PublishButton extends Component {
    static propTypes = {
      contract: PropTypes.object.isRequired,
      handleTogglePublish: PropTypes.func.isRequired
    }

    componentDidUpdate = () => {
      ReactTooltip.rebuild()
    }

    hintText = () => {
      const { currentUser } = this.props

      if (!this.isAuthor()) {
        return `You are not the owner of this contract.`
      }

      if (!this.userConfirmed()) {
        return `You will need to confirm your ${currentUser.email} email address prior to sharing contracts.`
      }

      const text = this.props.contract.isPublic
        ? `Currently available for other Notus customers to create events based off this contract.`
        : `This contract is only available to you.`

      return text
    }

    isAuthor = () => {
      const { currentUser, contract } = this.props
      
      return currentUser && 
        (parseInt(currentUser.id, 10) === parseInt(contract.ownerId, 10))
    }

    userConfirmed = () => {
      const { currentUser } = this.props
      return currentUser
        && currentUser.confirmedAt
    }

    handleTogglePublish = (e) => {
      this.props.handleTogglePublish(this.props.contract)
    }

    render() {
      return <>
        <Switch
          data-tip
          data-for='publish-button-hint'
          value={this.props.contract.isPublic}
          onChange={this.handleTogglePublish}
          disabled={!this.userConfirmed() || !this.isAuthor()}
          color='light'
        >
          shared with the Notus community
        </Switch>
        <ReactTooltip
          id='publish-button-hint'
          place='top'
          effect='solid'
          getContent={[this.hintText, 1000]}
        />
      </>
    }
  }
)