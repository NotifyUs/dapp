import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Helmet from 'react-helmet'
import arrayMove from 'array-move'
import ReactTimeout from 'react-timeout'
import { TransitionGroup, CSSTransition } from 'react-transition-group'
import { formatRoute } from 'react-router-named-routes'
import { orderBy } from 'lodash'
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import { PlusCircle } from 'react-feather'
import { toast } from 'react-toastify'
import { graphql } from 'react-apollo'

import { EditEventDrawer } from '~/components/EditEventDrawer'
import { EditMatcherDrawer } from '~/components/EditMatcherDrawer'
import { isValidScopeSource } from '~/utils/isValidScopeSource'
import { EventAction } from '~/components/events/EventAction'
import { EventTitle } from '~/components/events/EventTitle'
import { FrequencyTitle } from '~/components/events/FrequencyTitle'
import { EventMatcher } from '~/components/events/EventMatcher'
import { FooterContainer } from '~/components/layout/Footer'
import { ScrollToTop } from '~/components/ScrollToTop'
import { createEventMutation } from '~/mutations/createEventMutation'
import { updateEventMutation } from '~/mutations/updateEventMutation'
import { updateMatcherMutation } from '~/mutations/updateMatcherMutation'
import { eventQuery } from '~/queries/eventQuery'
import { altBrandColor, brandColor } from '~/utils/brandColors'
import { deepCloneMatcher } from '~/utils/deepCloneMatcher'
import { IsAuthed } from '~/components/IsAuthed'
import * as routes from '~/../config/routes'

export const EditEventPage = 
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
          graphql(updateMatcherMutation, { name: 'updateMatcherMutation' })(
            ReactTimeout(class _EditEventPage extends Component {
              state = {
                event: {
                  scope: 0,
                  abiEventId: undefined,
                  isPublic: false,
                  title: '',
                  // frequency: '-1',
                  matchers: [
                    {
                      operand: "",
                      operator: 2,
                      order: 1,
                      source: "transaction.value"
                    }
                  ]
                },
                editMatcherIndex: null,
                showEventForm: false,
              }

              static propTypes = {
                match: PropTypes.object.isRequired
              }

              static contextTypes = {
                router: PropTypes.object.isRequired
              }

              componentDidMount() {
                this.setState({ freshlyMounted: true })
              }

              isCreating = () => {
                return /events\/new/.test(this.props.location.pathname)
              }

              componentDidUpdate(prevProps) {
                if (
                  this.props.eventData && this.props.eventData.event
                  && this.state.freshlyMounted
                ) {
                  const event = this.props.eventData.event
                  let { id, parentId, isPublic, scope, abiEventId } = event

                  const matchers = event.matchers.map(
                    matcher => deepCloneMatcher(matcher, this.isCreating())
                  )

                  // only set these if it is a event based off someone's public event
                  if (this.isCreating()) {
                    parentId = parseInt(event.id, 10)
                    isPublic = false
                    id = undefined
                  }

                  const newEventObject = {
                    ...this.state.event,
                    id,
                    parentId,
                    isPublic,
                    scope,
                    abiEventId,
                    matchers: orderBy(matchers, 'order')
                  }

                  this.setState({
                    event: newEventObject,
                    freshlyMounted: false
                  })
                }
              }

              onDragEnd = (result) => {
                // dropped outside the list
                if (!result.destination) {
                  return
                }

                const matchers = arrayMove(
                  this.state.event.matchers,
                  result.source.index,
                  result.destination.index
                )

                this.setState({
                  event: {
                    ...this.state.event,
                    matchers
                  }
                })
              }

              handleSaveEvent = (e) => {
                e.preventDefault()

                this.props.createEventMutation({
                  variables: {
                    event: this.state.event
                  },
                  refetchQueries: [
                    'eventsQuery',
                    'publicEventsQuery',
                  ],
                }).then((mutationResult) => {
                  toast.success('Successfully saved event!')
                  const eventId = mutationResult.data.createEvent.id
                  const newEventLink = formatRoute(routes.EVENT, { eventId })

                  this.props.history.push(newEventLink)
                }).catch(error => {
                  console.error(error)
                })
              }

              handleSetEditMatcher = (editMatcherIndex) => {
                this.setState({
                  editMatcherIndex
                })
              }

              handleCloseMatcherEdit = (e) => {
                e.preventDefault()

                if (!this.isCreating()) {
                  this.props.updateMatcherMutation({
                    variables: {
                      matcher: this.state.event.matchers[this.state.editMatcherIndex]
                    },
                    refetchQueries: [
                      'eventsQuery',
                      'publicEventsQuery',
                    ],
                  }).then((mutationResult) => {
                    toast.success('Updated event matcher!')
                  }).catch(error => {
                    console.error(error)
                  })
                }

                this.handleSetEditMatcher(null)
              }

              handleOnCreateAbi = (abi) => {
                let event = {...this.state.event}
                if (abi.abiEvents.length) {
                  event.abiEventId = abi.abiEvents[0].id
                }
                
                this.setState({
                  event
                })
              }

              showEventForm = () => {
                this.setState({ showEventForm: true })
              }

              handleHideEventForm = (e) => {
                e.preventDefault()

                if (!this.isCreating()) {
                  this.props.updateEventMutation({
                    variables: {
                      event: this.state.event
                    },
                    refetchQueries: [
                      'eventsQuery',
                      'publicEventsQuery',
                    ],
                  }).then((mutationResult) => {
                    toast.success('Updated event scope!')
                  }).catch(error => {
                    console.error(error)
                  })
                }

                this.setState({ showEventForm: false })
              }

              onChangeScope = (option) => {
                const matchers = this.state.event.matchers.map(matcher => {
                  let clone = {...matcher}

                  if (!isValidScopeSource(option.value, matcher.source)) {
                    clone.source = 'block.number'
                  }

                  return clone
                })

                this.setState({
                  event: {
                    ...this.state.event,
                    scope: option.value,
                    matchers
                  }
                })
              }

              isEditingMatcher = () => {
                return this.state.editMatcherIndex !== null
              }

              recipeSentence = (title) => {
                if (!title) { return '' }
                const firstLetter = title.charAt(0)
                const startsWithVowel = /[aeiou]/i.test(firstLetter)

                return startsWithVowel ? `an ${title}` : `a ${title}`
              }

              onChangeMatcher = (matcher) => {
                const matchers = this.state.event.matchers.slice()
                matchers[this.state.editMatcherIndex] = matcher

                this.setState({
                  event: {
                    ...this.state.event,
                    matchers
                  }
                })
              }

              onChangeAbiEvent = (option) => {
                this.setState({
                  event: {
                    ...this.state.event,
                    abiEventId: parseInt(option.value, 10)
                  }
                })
              }

              handleAddMatcher = () => {
                const newMatcher = {
                  operand: "",
                  operator: 2,
                  order: 1,
                  source: "transaction.value"
                }

                this.setState({
                  event: {
                    ...this.state.event,
                    matchers: this.state.event.matchers.concat(newMatcher)
                  }
                })
              }

              handleRemoveMatcher = (matcherIndex) => {
                const matchers = this.state.event.matchers

                if (matchers.length > 1) {
                  matchers.splice(matcherIndex, 1)

                  this.setState({
                    event: {
                      ...this.state.event,
                      matchers
                    }
                  })
                } else {
                  toast.error('Each event needs at least one matcher.')
                }
              }
              
              render () {
                let colorClass = 'is-dark'
                let altColorClass = 'is-blue'

                const { eventData } = this.props

                const editMatcher = this.isEditingMatcher()
                  ? this.state.event.matchers[this.state.editMatcherIndex]
                  : null

                let recipe = {
                  title: 'new event'
                }

                if (eventData) {
                  if (eventData.loading) {
                    return null
                  } else {
                    if (eventData.error) {
                      console.warn(eventData.error)
                      return null
                    } else {
                      recipe = eventData.event

                      if (recipe) {
                        colorClass = brandColor(recipe.id)
                        altColorClass = altBrandColor(recipe.id + 1)
                      }
                    }
                  }
                }

                const matcherSentences = (
                  <>
                    <div className='event-box__variable-wrapper' onClick={this.showEventForm}>
                      <div className='event-box__variable'>
                        <span className="event-box__text">
                          <FrequencyTitle frequency={this.state.event.frequency} /> <EventTitle event={this.state.event} /> occurs
                        </span>
                      </div>
                    </div>


                    <DragDropContext onDragEnd={this.onDragEnd}>
                      <Droppable droppableId="droppable">
                        {(provided, snapshot) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                          >
                            {this.state.event.matchers.map((eventMatcher, index) => (
                              <Draggable
                                key={`event-matcher-${index}`}
                                draggableId={index+1}
                                index={index}
                                
                              >
                                {(provided, snapshot) => (
                                  <TransitionGroup>
                                    <CSSTransition
                                      key={`event-matcher-css-transition-${index}`}
                                      timeout={{ enter: 150, exit: 1000 }}
                                      classNames='fade'
                                      appear
                                    >
                                      <div className='fade-enter'>
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          {...provided.dragHandleProps}
                                        >
                                          <EventMatcher
                                            key={`event-matcher-${index}`}
                                            matcher={eventMatcher}
                                            index={index}
                                            handleSetEditMatcher={this.handleSetEditMatcher}
                                            handleRemoveMatcher={this.handleRemoveMatcher}
                                            isFirst={index === 0}
                                            isActive={!!editMatcher && eventMatcher === editMatcher}
                                          />
                                        </div>
                                      </div>
                                    </CSSTransition>
                                  </TransitionGroup>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  </>
                )

                return (
                  <div className='is-positioned-absolutely'>
                    <Helmet
                      title='Create New Event'
                    />

                    <ScrollToTop />

                    <EditEventDrawer
                      event={this.state.event}
                      onChangeScope={this.onChangeScope}
                      onChangeAbiEvent={this.onChangeAbiEvent}
                      onCreateAbi={this.handleOnCreateAbi}
                      isOpen={this.state.showEventForm}
                      onClose={this.handleHideEventForm}
                    />

                    <EditMatcherDrawer
                      isOpen={this.isEditingMatcher()}
                      matcher={editMatcher}
                      onClose={this.handleCloseMatcherEdit}
                      abiEventId={this.state.event.abiEventId}
                      scope={this.state.event.scope}
                      onChangeMatcher={(updatedMatcher) => this.onChangeMatcher(updatedMatcher)}
                    />

                    <section className='section section--main-content'>
                      <div className={`container-fluid pb20 is-dark`}>
                        <div className='container'>
                          <div className='row'>
                            <div className='col-xs-12 has-text-centered is-size-4'>
                              <h6 className='is-size-6 has-text-grey-lighter has-text-centered is-uppercase has-text-weight-bold mt20 pt20 pb20'>
                                {recipe.title}
                              </h6>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className={`event-box event-box__header color-block ${colorClass}`}>
                        <div className={`container-fluid pt20 pb20`}>
                          <div className='container'>
                            <div className='row'>
                              <div className='col-xs-12 col-xl-12 col-start-xl-2 is-size-4'>
                                {matcherSentences}

                                <button
                                  className='button has-icon has-icon__transparent has-stroke-light is-lowercase has-text-light ml45 mt10'
                                  onClick={this.handleAddMatcher}
                                >
                                  <PlusCircle
                                    className='icon__button has-stroke-light'
                                  /> &nbsp; add matcher
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className={`event-box event-box__footer color-block ${altColorClass}`}>
                        <div className={`container-fluid`}>
                          <div className='container'>
                            <div className='row'>
                              <div className='col-xs-12 has-text-centered is-size-4'>
                                <EventAction />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {this.isCreating() && (
                        <div className={`is-white-ter pt30 pb30`}>
                          <div className={`container-fluid`}>
                            <div className='container'>
                              <div className='row'>
                                <div className='col-xs-12 has-text-centered is-size-4'>
                                  <button
                                    onClick={this.handleSaveEvent}
                                    className='button is-success'
                                    disabled={this.state.isCreating}
                                  >
                                    Create Event
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </section>

                    <FooterContainer />
                  </div>
                )
              }
            })
          )
        )
      )
    )
  )