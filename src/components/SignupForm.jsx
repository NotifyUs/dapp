import React, { Component } from 'react'
import AntdIcon from '@ant-design/icons-react'
import { MailOutline } from '@ant-design/icons'
import { CSSTransition } from 'react-transition-group'
import { axiosInstance } from '~/../config/axiosInstance'

export const SignupForm =
  class _SignupForm extends Component {
    state = {
      email: '',
      success: false
    }

    doSignup = async () => {
      const { email } = this.state

      if (email) {
        // check if email and dappName exists in DB, if yes:
        // - name already registered, check email used to sign up
        // - also could re-send email w/ API key if dapp name matches email provided

        // if no:
        // - create a new dapp in the db and hook it up to this email address
        // - on the API server, send an email to the newly signed up user
        // console.log(process.env.REACT_APP_NOTUS_API_URI)

        await axiosInstance.post(
          `${process.env.REACT_APP_NOTUS_API_URI}/users`,
          {
            email: this.state.email
          }
        ).then(() => {
          this.setState({
            success: true,
            isSigningUp: false
          })
        }).catch(error => {
          console.error(error)
          this.setState({
            error: true,
            isSigningUp: false
          })
        })
      }
    }

    handleSignupSubmit = (e) => {
      e.preventDefault()

      this.setState({
        error: false,
        isSigningUp: true
      }, this.doSignup)
    }

    activate = (active) => {
      this.setState({ active: true })
    }

    deactivate = (active) => {
      this.setState({ active: false })
    }

    render () {
      const thankYou = (
        <div className='accordion accordion--signup-thank-you'>
          <p>
            <AntdIcon type={MailOutline} className='antd-icon icon--signup' />
            Thanks for using Notus! Your <strong>'{this.state.email}'</strong> inbox should have a magic link to access your Notus account.
            <br /><span className='is-size-7 has-text-light'>
              Can't find the email? Check your spam folder first. We can also re-send the link or reach out to us for support.
            </span>
          </p>
        </div>
      )
      
      const form = (
        <div className='accordion accordion-enter-done accordion--signup-form'>
          <form
            onSubmit={this.handleSignupSubmit}
            className={this.state.active ? 'is-active' : ''}
          >
            <div className="field has-addons">
              <div className="control">
                <input
                  placeholder='Enter your email'
                  autoFocus
                  type='email'
                  id='email'
                  className='input'
                  onFocus={this.activate}
                  onBlur={this.deactivate}
                  onMouseOver={this.activate}
                  onMouseOut={this.deactivate}
                  onChange={(e) => { this.setState({ email: e.target.value }) }}
                  value={this.state.email}
                />
              </div>
              <div className='control'>
                <button
                  type='submit'
                  className='button'
                  onFocus={this.activate}
                  onBlur={this.deactivate}
                  onMouseOver={this.activate}
                  onMouseOut={this.deactivate}
                >
                  Get Started
                  </button>
              </div>
            </div>
            {/* <div className='control checkbox'>
                                    <label htmlFor='newsletter'>
                                      <input id='newsletter' className='checkbox-input' type='checkbox' />Stay
                                      up-to-date with our newsletter
                                  </label>
                                  </div> */}

          </form>
        </div>
      )

      return (
        <div>
          <CSSTransition
            timeout={600}
            classNames='accordion'
            in={!this.state.success}
          >
            {state => form}
          </CSSTransition>

          <CSSTransition
            timeout={600}
            classNames='accordion'
            in={this.state.success}
          >
            {state => thankYou}
          </CSSTransition>
        </div>
      )
  }
}
