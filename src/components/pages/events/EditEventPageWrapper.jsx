import React, { Component } from 'react'
import ReactTimeout from 'react-timeout'
import { graphql } from 'react-apollo'

import { EditEventPage } from '~/components/pages/events/EditEventPage'
import { IsAuthed } from '~/components/IsAuthed'
import { createEventMutation } from '~/mutations/createEventMutation'
import { updateEventMutation } from '~/mutations/updateEventMutation'
import { deleteEventMutation } from '~/mutations/deleteEventMutation'
import { createMatcherMutation } from '~/mutations/createMatcherMutation'
import { updateMatcherMutation } from '~/mutations/updateMatcherMutation'
import { destroyMatcherMutation } from '~/mutations/destroyMatcherMutation'
import { eventQuery } from '~/queries/eventQuery'

export const EditEventPageWrapper = 
  IsAuthed(
    graphql(eventQuery, {
      name: 'eventData',
      skip: (props) => !props.match.params.eventId,
      options: (props) => ({
        variables: { id: parseInt(props.match.params.eventId, 10) }
      })
    })(
      graphql(createEventMutation, { name: 'createEventMutation' })(
        graphql(updateEventMutation, { name: 'updateEventMutation' })(
          graphql(deleteEventMutation, { name: 'deleteEventMutation' })(
            graphql(createMatcherMutation, { name: 'createMatcherMutation' })(
              graphql(updateMatcherMutation, { name: 'updateMatcherMutation' })(
                graphql(destroyMatcherMutation, { name: 'destroyMatcherMutation' })(
                  ReactTimeout(class _EditEventPageWrapper extends Component {
                    render () {
                      return <EditEventPage {...this.props} />
                    }
                  }
                )
              )
            )
          )
        )
      )
    )
  )
)