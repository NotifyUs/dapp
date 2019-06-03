import React, { Component } from 'react'
import Helmet from 'react-helmet'
import { graphql } from 'react-apollo'
import { formatRoute } from 'react-router-named-routes'

import { IsAuthed } from '~/components/IsAuthed'
import { ScrollToTop } from '~/components/ScrollToTop'
import { ContractForm } from '~/components/forms/ContractForm'
import { EventsPageLoader } from '~/components/loading/EventsPageLoader'
import { contractQuery } from '~/queries/contractQuery'
import { currentUserQuery } from '~/queries/currentUserQuery'
import { KEYS } from '~/constants'
import * as routes from '~/../config/routes'

export const EditContractPage =
  IsAuthed(
    graphql(currentUserQuery, { name: 'currentUserQuery' })(
      graphql(contractQuery, {
        name: 'contractData',
        skip: (props) => !props.match.params.contractId,
        options: (props) => ({
          fetchPolicy: 'cache-and-network',
          variables: { id: parseInt(props.match.params.contractId, 10) }
        })
      })(
        class _EditContractPage extends Component {
          redirectToContractPage = (contractId) => {
            const newAdminContractRoute = formatRoute(
              routes.CONTRACT, {
                contractId
              }
            )
            this.props.history.push(newAdminContractRoute)
          }

          render () {
            let content

            const { contractData } = this.props
            const { loading, error, contract } = contractData || {}

            if (loading) {
              content = <EventsPageLoader />
            }

            if (error) {
              console.error(error)
              content = <h5 className='is-size-5 has-text-danger'>
                There was an error fetching this contract
              </h5>
            }

            const title = contract ? 
              `Editing Contract ${contract.name}` :
              `Creating a new Contract`

            return (
              <div className='is-positioned-absolutely'>
                <Helmet
                  title={title}
                />

                <ScrollToTop />
                
                <section className='section section--main-content'>
                  <div
                    className={`container-fluid pb20 color-block is-dark-colored`}
                  >
                    <div className='container'>
                      <div className='row'>
                        <div className='col-xs-12 pt20 pb20'>
                          
                          <div className='row'>
                            <div className='col-xs-12'>
                              <h6 className='is-size-6 has-text-weight-semibold has-text-lighter'>
                                {contract ?
                                  `Editing existing contract ${contract.name}` :
                                  `Creating a new Contract`
                                }
                              </h6>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`event-box color-block is-top-layer is-dark-colored`}
                    >
                      <div className='is-brightness-60 is-full-width-background' />

                      <div className='container'>
                        <div className='row'>
                          <div className='col-xs-12 pt20'>
                            <ContractForm
                              redirectToContractPage={this.redirectToContractPage}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </section>
              </div>
            )
          }
        }
      )
    )
  )