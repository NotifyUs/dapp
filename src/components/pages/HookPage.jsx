import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Helmet from 'react-helmet'
import { Query } from 'react-apollo'
import { HeroBetaCallout } from '~/components/HeroBetaCallout'
import { FooterContainer } from '~/components/layout/Footer'
import { PageDetailsLoader } from '~/components/PageDetailsLoader'
import { ErrorMessage } from '~/components/ErrorMessage'
import { ScrollToTop } from '~/components/ScrollToTop'
import { PackageDetails } from '~/components/hooks/PackageDetails'
import { velcroQueries } from '~/queries/velcroQueries'

export class HookPage extends PureComponent {
  static propTypes = {
    match: PropTypes.object.isRequired
  }

  static contextTypes = {
    router: PropTypes.object.isRequired
  }

  render () {
    return (
      <div className='is-positioned-absolutely'>
        <Helmet
          title='Hook'
        />

        <ScrollToTop />

        <section className='section section--main-content'>
          <div className='container'>
            <div className='row'>
              <div className='col-xs-12'>
                <p className='content'>
                  <button
                    onClick={this.context.router.history.goBack}
                    className='button is-monospaced is-text has-text-weight-bold back-button has-underline-border'
                  >
                    {'<'} Back
                  </button>
                </p>

                <Query query={velcroQueries.eventsQuery}>
                  {({ loading, error, data }) => {
                    if (loading) return <PageDetailsLoader />
                    if (error) return <ErrorMessage errorMessage={error} />

                    const events = data.Vouching ? data.Vouching.Registered : []
                    const id = this.props.match.params.id
                    const event = events.find((event) => event.parsedLog.values.id.eq(id))

                    if (!event) {
                      console.warn('event not found')
                      return null
                    }

                    const packageItem = event.parsedLog.values

                    return (
                      <Query
                        query={velcroQueries.packageQuery}
                        variables={{ uri: packageItem.metadataURI, id: packageItem.id.toString() }}
                      >
                        {
                          ({ loading, error, data }) => {
                            if (loading) return <PageDetailsLoader />

                            if (error) return <ErrorMessage errorMessage={error} />

                            const { metadata, Velcro } = data

                            return (
                              <>
                                <Helmet
                                  title={`${metadata.name}`}
                                />
                                <PackageDetails
                                  metadata={metadata}
                                  velcro={Velcro}
                                  registeredEvent={event}
                                />
                              </>
                            )
                          }
                        }
                      </Query>
                    )
                  }}
                </Query>
              </div>
            </div>
          </div>
        </section>

        <HeroBetaCallout />

        <FooterContainer />
      </div>
    )
  }
}
