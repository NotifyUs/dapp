import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Helmet from 'react-helmet'
import gql from 'graphql-tag'
import { graphql } from 'react-apollo'
import { Link } from 'react-router-dom'
import { FooterContainer } from '~/components/layout/Footer'
import { ScrollToTop } from '~/components/ScrollToTop'
import { currentUserQuery } from '~/queries/currentUserQuery'
import * as routes from '~/../config/routes'

const queryString = require('query-string')

const signInPageMutation = gql`
  mutation signIn($email: String!, $password: String!) {
    signIn(email: $email, password: $password) @client
  }
`

export const SignInPage = graphql(currentUserQuery, { name: 'currentUserData' })(
  graphql(signInPageMutation, { name: 'signIn' })(
    class _SignInPage extends PureComponent {

      static propTypes = {
        match: PropTypes.object.isRequired
      }

      static contextTypes = {
        router: PropTypes.object.isRequired
      }

      constructor (props) {
        super(props)
        this.state = {
          signingIn: false,
          password: '',
          email: ''
        }
      }

      getOneTimeKey(props) {
        const { email } = queryString.parse(props.location.search)
        return email
      }

      handleConfirmSubmit = async (e) => {
        e.preventDefault()

        let error

        if (!this.state.email) {
          error = "Please enter your email address"
        }

        if (this.state.password.length < 8) {
          error = "Your password must be at least 8 characters in length"
        }

        if (!this.state.password) {
          error = "Please enter your password"
        }

        if (error) {
          this.setState({
            error,
            message: ''
          })
          return
        } else {
          this.setState({
            signingIn: true,
            error: null,
            message: ''
          })
        }

        try {
          await this.props.signIn({
            variables: {
              email: this.state.email,
              password: this.state.password
            }
          })

          this.props.history.push(routes.MY_EVENTS)
        } catch (error) {
          this.setState({
            signingIn: false,
            error: this.translateErrorMessage(error.message),
            message: ''
          })
        }
      }

      translateErrorMessage = (message) => {
        if (message.match(/401/)) {
          return 'Invalid username and password combination.'
        }

        return message
      }

      render () {
        const { currentUser } = this.props.currentUserData

        let message, signInForm

        if (this.state.signingIn) {
          message = "Signing in ..."
        }

        if (!this.state.signedIn && !currentUser) {
          signInForm =
            <div className='row'>
              <div className='column col-xtra-wide-touch col-xs-12 col-lg-8 col-start-lg-3'>
                <h1 className='is-size-1 has-text-centered is-uppercase has-text-weight-extrabold mt75'>
                  Welcome Back
                </h1>

                <section className='card has-bg has-shadow has-shadow-big mt30'>
                  <div className='card-content'>
                    <form onSubmit={this.handleConfirmSubmit}>
                      <h6 className='is-size-6 has-text-centered has-text-weight-bold'>
                        {this.state.error}
                      </h6>
                      <div className='field mt15'>
                        <input
                          placeholder='Your email'
                          autoFocus
                          type='email'
                          className='input'
                          onChange={(e) => {
                            this.setState({ 
                              email: e.target.value,
                              error: ''
                            }) }
                          }
                          value={this.state.email}
                        />
                      </div>
                      <div className='field'>
                        <input
                          placeholder='Password'
                          type='password'
                          className='input'
                          onChange={(e) => {
                            this.setState({
                              password: e.target.value,
                              error: ''
                            }) 
                          }}
                          value={this.state.password}
                        />
                      </div>
                      <div className='control form-submit has-text-centered'>
                        <button
                          type='submit'
                          className='button is-small'
                        >
                          Sign In
                      </button>
                      </div>
                    </form>
                  </div>
                </section>

                <br />

                <div className='card-footer has-text-centered'>
                  <p className='has-text-weight-bold'>
                    {message}
                  </p>

                  Already have an account you lost the password to?
                  <br />
                  <Link to={routes.PASSWORD_RESET}>
                    Reset your Password
                  </Link>
                  {/* <br />Check your email for the API key originally sent to you. */}
                </div>

              </div>
            </div>
        }

        return (
          <div className='is-positioned-absolutely'>
            <Helmet
              title='Sign In to Notus'
            />

            <ScrollToTop />

            <section className='section section--main-content has-no-top-padding'>
              <div className='container'>
                {signInForm}
              </div>
            </section>

            <FooterContainer />
          </div>
        )
      }
    }
  )
)
